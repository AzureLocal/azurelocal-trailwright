import { stringify } from 'yaml';
import type { Project } from '../model/schema';
import { SCHEMA_VERSION, type Draft } from '../infra/types';
import { usesS2d, usesSan } from '../rules/types';
import { cidrOf } from './clusterFacts';
import { sanNetworkList, storageNetworkList, witnessTypeFor, zoneNameOf } from './createCluster';
import { slug } from './types';

// infrastructure.yml in the layout of the Azure Local Toolkit's schema 5 (azurelocal-toolkit config/variables, vendored at
// src/infra/infrastructure.schema.json; SCHEMA_VERSION is the version of that copy). The key names and the nesting are the
// schema's: the document is typed with the types generated from it, so a key the schema does not have does not compile.
//
// Only what the design knows is written. A value the design does not hold is left out, never guessed, so a design that is
// not finished gives a file that the schema reports as incomplete. Credentials are Key Vault references
// (keyvault://<vault>/<secret>), never values. docs/INFRASTRUCTURE-YML.md lists the mapping and what has no key.

// The secret names of the references. They are the names the toolkit's master template uses.
const SECRET = { localAdmin: 'local-admin-password', lcm: 'lcm-password', provisioningAdmin: 'provisioning-admin-password' } as const;

type P = Project;
const text = (v: string | undefined): string => (v ?? '').trim();
const ref = (vault: string, secret: string): string | undefined => (vault && secret ? `keyvault://${vault}/${secret}` : undefined);
const list = (v: string): string[] => v.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
const int = (v: string | number | undefined): number | undefined => {
  const n = typeof v === 'number' ? v : /^\d+$/.test(text(v)) ? Number(text(v)) : NaN;
  return Number.isInteger(n) ? n : undefined;
};

// The model's spellings and the schema's.
const IDENTITY = { 'active-directory': 'active_directory', 'local-identity-key-vault': 'local_identity' } as const satisfies Record<P['identity']['mode'], string>;
const TOPOLOGY = { standard: 'standard', 'rack-aware': 'rack_aware' } as const satisfies Record<P['hardware']['topology'], string>;
const OUTBOUND = { direct: 'direct', proxy: 'proxy', 'arc-gateway': 'arc_gateway', 'proxy-arc-gateway': 'proxy_arc_gateway', 'private-path': 'private_path' } as const satisfies Record<P['connectivity']['path'], string>;
const TRANSPORT = { expressroute: 'expressroute', 'site-to-site-vpn': 'site_to_site_vpn' } as const;
const SAN_TYPE = { 'fibre-channel': 'fibre_channel', iscsi: 'iscsi' } as const satisfies Record<P['deployment']['sanType'], string>;
const RDMA = { none: 'none', iWARP: 'iwarp', RoCE: 'roce', RoCEv2: 'roce_v2' } as const;
const RESILIENCY = { 'two-way': 'two_way', 'three-way': 'three_way', 'four-way': 'four_way', parity: 'parity', 'nested-two-way': 'nested_two_way' } as const satisfies Record<P['storage']['volumes'][number]['resiliency'], string>;
const CONFIGURATION_MODE = { Express: 'express', InfraOnly: 'infra_only', KeepStorage: 'keep_storage' } as const satisfies Record<P['storage']['configurationMode'], string>;
const DNS_SERVER_CONFIG = { UseDnsServer: 'use_dns_server', UseForwarder: 'use_forwarder' } as const satisfies Record<P['identity']['dnsServerConfig'], string>;
const SECURITY_LEVEL = { Recommended: 'recommended', Customized: 'customized' } as const satisfies Record<P['security']['level'], string>;
// The schema has portal and powershell: the limited-connectivity PowerShell method is written as powershell.
const UPDATE_METHOD = { portal: 'portal', powershell: 'powershell', 'powershell-limited': 'powershell' } as const satisfies Record<P['operations']['updateMethod'], string>;
const DR_METHOD = { none: 'none', asr: 'asr', 'hyperv-replica': 'hyper_v_replica' } as const satisfies Record<P['operations']['drMethod'], string>;
const LOAD_BALANCING = { Dynamic: 'dynamic', HyperVPort: 'hyper_v_port' } as const;

// The validated models of simplified machine provisioning, as vendor and model, for a design that names no other.
const SKU: Partial<Record<P['provisioning']['hardwareSku'], { vendor: string; model: string }>> = {
  'lenovo-mx650-v3': { vendor: 'Lenovo', model: 'ThinkAgile MX650 V3' },
  'lenovo-mx650-v4': { vendor: 'Lenovo', model: 'ThinkAgile MX650 V4' },
  'hpe-dl360-gen11': { vendor: 'HPE', model: 'ProLiant DL360 Gen11' },
  'dell-ax-750': { vendor: 'Dell', model: 'AX-750' },
  'dell-ax-650': { vendor: 'Dell', model: 'AX-650' },
};

// Leaves out what is not known: undefined, empty text, and the lists and objects that end up empty.
function known<T>(value: T): T {
  if (Array.isArray(value)) {
    const items = value.map((v) => known(v as unknown)).filter((v) => v !== undefined);
    return (items.length ? items : undefined) as T;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, known(v)] as const).filter(([, v]) => v !== undefined);
    return (entries.length ? Object.fromEntries(entries) : undefined) as T;
  }
  if (value === null || (typeof value === 'string' && value.trim() === '')) return undefined as T;
  return value;
}

// The Key Vault of the instance, which holds the deployment's secrets.
const vaultOf = (p: P): string => text(p.landingZone.keyVaultName) || text(p.identity.keyVaultName);
// The instance name, as the ARM parameters take it.
const clusterNameOf = (p: P): string => text(p.landingZone.instanceName) || slug(p.meta.name);
// environment.name is the project name as lowercase letters, digits and hyphens, at most 41 characters. A project without a name has none.
const environmentNameOf = (p: P): string | undefined => (text(p.meta.name) ? slug(p.meta.name).slice(0, 41).replace(/-+$/, '') : undefined);

// hardware.sbe: the vendor's Solution Builder Extension package is a requirement. The automation reads it from source_path and
// checks it before the cluster is created. The password of source_username is only ever a Key Vault reference. delivery (the
// build-time side-load) is written as skip unless the design asks for it.
export function buildSbe(p: Project, vault: string): Record<string, unknown> {
  const s = p.hardware.sbe;
  if (s.requirement === 'not_applicable') return { requirement: 'not_applicable', not_applicable_reason: s.notApplicableReason.trim(), delivery: 'skip' };
  const sbe: Record<string, unknown> = { requirement: 'required' };
  if (s.sourcePath.trim()) sbe.source_path = s.sourcePath.trim();
  if (s.sourceUsername.trim()) {
    sbe.source_username = s.sourceUsername.trim();
    if (s.sourcePasswordSecret.trim() && vault) sbe.source_password = `keyvault://${vault}/${s.sourcePasswordSecret.trim()}`;
  }
  sbe.delivery = s.delivery;
  return sbe;
}

function scenario(p: P): Draft['scenario'] {
  const san = p.storage.architecture === 'san';
  return {
    identity: IDENTITY[p.identity.mode],
    storage_architecture: p.storage.architecture,
    // A SAN design has no storage network between the machines, and neither has a single machine: both are switched.
    storage_connectivity: san || p.hardware.nodes.length === 1 ? 'switched' : p.networking.storage,
    topology: TOPOLOGY[p.hardware.topology],
    connectivity: p.deployment.mode,
    cloud: p.deployment.cloud,
    outbound_path: OUTBOUND[p.connectivity.path],
    os_install: p.provisioning.osInstall,
    deploy_method: p.provisioning.deployMethod,
  };
}

function nodes(p: P): Draft['nodes'] {
  const simplified = p.provisioning.osInstall === 'simplified';
  const ownStorageIps = usesS2d(p) && !p.networking.storageAutoIp;
  return p.hardware.nodes.map((n, i) => {
    const storageIps = (n.storageIps ?? []).map(text);
    return {
      name: n.name,
      management: { ip_address: n.ip, ...(simplified ? { mac_address: n.managementMac } : {}) },
      serial_number: n.serial,
      ...(simplified ? { bmc: { ip_address: n.bmcIp } } : {}),
      ...(p.hardware.topology === 'rack-aware' ? { zone: zoneNameOf(p, i) } : {}),
      // Every storage network needs its address, in order, so a list with a gap is left out.
      ...(ownStorageIps && storageIps.length && storageIps.every(Boolean) ? { storage_ips: storageIps } : {}),
    };
  });
}

function hardware(p: P, vault: string): Draft['hardware'] {
  const sku = p.provisioning.osInstall === 'simplified' ? SKU[p.provisioning.hardwareSku] : undefined;
  // cpu_cores and memory_gib are per machine and the same for every machine: a design with unequal machines has no key for them.
  const same = (pick: (n: P['hardware']['nodes'][number]) => number): number | undefined => {
    const values = [...new Set(p.hardware.nodes.map(pick))];
    return values.length === 1 && Number.isInteger(values[0]) && values[0] >= 1 ? values[0] : undefined;
  };
  const d = p.storage.driveLayout;
  return {
    vendor: text(p.hardware.vendor) || sku?.vendor,
    model: text(p.hardware.model) || sku?.model,
    cpu_cores: same((n) => n.cores),
    memory_gib: same((n) => n.memoryGiB),
    sbe: buildSbe(p, vault),
    network_cards: p.networking.cards.map((c) => ({
      label: c.label,
      make: c.make,
      model: c.model,
      ports: c.ports
        .filter((port) => text(port.osName))
        .map((port) => ({ name: text(port.osName), speed_gbps: port.speedGbps, rdma: RDMA[port.rdma], role: port.role.replace(/^cluster:1$/, 'cluster:a').replace(/^cluster:2$/, 'cluster:b') || 'unused' })),
    })),
    ...(usesS2d(p) && d.capacity.count > 0
      ? { drives: { capacity: { media: d.capacity.media, count: d.capacity.count, size_tb: d.capacity.sizeTB }, ...(d.cache.count > 0 ? { cache: { media: d.cache.media, count: d.cache.count, size_tb: d.cache.sizeTB } } : {}) } }
      : {}),
  };
}

function intents(p: P): NonNullable<Draft['networking']>['intents'] {
  return p.networking.intents.map((i) => {
    const technology = i.networkDirectTechnology === 'Auto' ? undefined : RDMA[i.networkDirectTechnology];
    return {
      name: i.name,
      traffic: [...new Set(i.traffic)],
      adapters: [...new Set(i.adapters.map(text).filter(Boolean))],
      // Network ATC keeps its own values unless the design overrides them.
      overrides: {
        ...(i.overrideQos ? { qos: { cluster_priority: int(i.qosClusterPriority), smb_priority: int(i.qosSmbPriority), smb_bandwidth_percent: int(i.qosSmbBandwidth) } } : {}),
        ...(i.overrideAdapter ? { adapter: { jumbo_packet: int(i.jumboPacket) as 1514 | 4088 | 9014 | undefined, network_direct: i.networkDirect === 'Enabled', ...(i.networkDirect === 'Enabled' ? { network_direct_technology: technology } : {}) } } : {}),
        ...(i.overrideVSwitch ? { virtual_switch: { enable_iov: i.enableIov === 'true', load_balancing_algorithm: LOAD_BALANCING[i.loadBalancingAlgorithm] } } : {}),
      },
    };
  });
}

function networking(p: P): Draft['networking'] {
  const inf = p.infrastructure;
  const path = p.connectivity.path;
  const pp = p.connectivity.privatePath;
  const planOf = (name: string): string | undefined => p.networking.ipPlan.find((r) => text(r.name).toLowerCase() === text(name).toLowerCase())?.cidr;
  const storageNetworks = storageNetworkList(p) as { name: string; networkAdapterName: string; vlanId: string }[];
  const clusterNetworks = (sanNetworkList(p).clusterNetworkConfig as { adapterIPConfig: { name: string; networkAdapterName: string; vlanId: number; addressPrefix: string }[] }).adapterIPConfig;
  return {
    management: {
      // The subnet is the one the gateway (or, without one, the pool or the first machine) is in, for the subnet mask.
      subnet: cidrOf(text(inf.gateway) || text(inf.startIp) || text(p.hardware.nodes[0]?.ip), text(inf.subnetMask)),
      gateway: inf.gateway,
      vlan_id: inf.managementVlan,
      dns_servers: inf.dnsServers,
      use_dhcp: inf.useDhcp,
      ...(text(inf.startIp) && text(inf.endIp) ? { infrastructure_pool: { start: text(inf.startIp), end: text(inf.endIp) } } : {}),
    },
    intents: intents(p),
    // Storage networks exist between the machines of a Storage Spaces Direct design.
    ...(usesS2d(p) && p.hardware.nodes.length > 1
      ? {
          storage: {
            auto_ip: p.networking.storageAutoIp,
            ...(p.networking.storage === 'switchless' ? { switchless_links: p.networking.switchlessLinks } : {}),
            tor_switches: p.networking.torSwitches,
            layout: p.networking.storageLayout,
            networks: storageNetworks.filter((n) => text(n.networkAdapterName)).map((n, k) => ({ name: n.name, adapter: n.networkAdapterName, vlan_id: int(n.vlanId), subnet: p.networking.storageSubnets[k] })),
          },
        }
      : {}),
    // The cluster networks of a SAN design, on standalone ports: the same names, ports, VLANs and subnets as the ARM parameters.
    ...(usesSan(p) ? { cluster_networks: clusterNetworks.filter((n) => text(n.networkAdapterName) || text(n.addressPrefix)).map((n) => ({ name: n.name, adapter: n.networkAdapterName, vlan_id: n.vlanId, subnet: n.addressPrefix })) } : {}),
    // A VLAN's subnet is the row of the IP plan with the same name.
    vlans: p.networking.vlans.map((v) => ({ name: v.name, id: v.id, subnet: planOf(v.name) })),
    ...(p.sdn.enabled
      ? {
          logical_networks: p.sdn.logicalNetworks
            .filter((l) => text(l.name))
            .map((l) => ({ name: text(l.name), vlan_id: l.vlan, address_prefix: l.addressPrefix, gateway: l.gateway, dns_servers: l.dnsServers, ...(text(l.poolStart) && text(l.poolEnd) ? { ip_pool: { start: text(l.poolStart), end: text(l.poolEnd) } } : {}) })),
        }
      : {}),
    outbound: {
      ...(path === 'proxy' || path === 'proxy-arc-gateway' ? { proxy: { url: p.connectivity.proxyUrl } } : {}),
      ...(path !== 'direct' && path !== 'proxy' ? { arc_gateway: { name: p.connectivity.arcGatewayName } } : {}),
      ...(path === 'private-path'
        ? {
            private_path: {
              transport: pp.transport === '' ? undefined : TRANSPORT[pp.transport],
              virtual_network: pp.virtualNetwork,
              workload_subnet: pp.workloadSubnet,
              firewall_subnet: pp.firewallSubnet,
              firewall_private_ip: pp.firewallPrivateIp,
              firewall_port: int(pp.firewallPort),
              arc_private_link_scope: pp.arcPrivateLinkScopeOnNetwork,
              proxy_bypass: list(pp.proxyBypass),
            },
          }
        : {}),
    },
  };
}

function identity(p: P, vault: string): Draft['identity'] {
  const id = p.identity;
  return {
    local_admin: { username: id.localAdminUsername, password: ref(vault, SECRET.localAdmin) },
    ...(id.mode === 'active-directory'
      ? { active_directory: { domain_fqdn: id.domain, ou_path: id.ouPath, lcm_user: { username: id.lcmUsername, password: ref(vault, SECRET.lcm) } } }
      : { local_identity: { dns_server_config: DNS_SERVER_CONFIG[id.dnsServerConfig], dns_zone: id.dnsZoneName, dns_forwarders: id.dnsForwarders } }),
  };
}

function storage(p: P): Draft['storage'] {
  const st = p.storage;
  return {
    ...(usesS2d(p) ? { configuration_mode: CONFIGURATION_MODE[st.configurationMode], volumes: st.volumes.filter((v) => text(v.name)).map((v) => ({ name: v.name, size_gib: v.sizeGiB, resiliency: RESILIENCY[v.resiliency] })) } : {}),
    ...(usesSan(p)
      ? { san: { type: SAN_TYPE[p.deployment.sanType], infra_volume_lun_id: st.infraVolLunId, performance_history_lun_id: st.infraPerfLunId, luns: st.sanLuns.filter((l) => text(l.name)).map((l) => ({ name: l.name, size_gib: l.sizeGiB })) } }
      : {}),
  };
}

function operations(p: P): Draft['operations'] {
  const o = p.operations;
  return {
    update_method: UPDATE_METHOD[o.updateMethod],
    backup: { enabled: o.backup, ...(o.backup ? { approach: o.backupApproach, solution: o.backupSolution } : {}) },
    disaster_recovery: { method: DR_METHOD[o.drMethod] },
    monitoring: {
      enabled: o.monitoring,
      ...(o.monitoring
        ? {
            log_analytics_workspace: o.workspaceName,
            workspace_resource_group: o.workspaceResourceGroup,
            // Insights creates the rule unless the design names an existing one; the endpoint is for agents on private links.
            data_collection_rule: o.useExistingDcr ? o.dcrName : undefined,
            data_collection_endpoint: o.agentPrivateLinks ? o.dceName : undefined,
            alert_email: o.alertEmail,
          }
        : {}),
    },
  };
}

// The OS version of both install routes, and what simplified machine provisioning needs.
function provisioning(p: P): Draft['provisioning'] {
  const v = p.provisioning;
  const osVersion = text(v.osVersion) || text(p.release.build);
  if (v.osInstall !== 'simplified') return { os_version: osVersion };
  return {
    os_version: osVersion,
    simplified: {
      site_name: v.siteName,
      resource_group: v.siteResourceGroup,
      maintenance_iso: v.maintenanceIso,
      // The local administrator the machines are provisioned with is the deployment's local administrator.
      admin: { username: p.identity.localAdminUsername, password: ref(text(v.adminKeyVaultName), SECRET.provisioningAdmin) },
      media_share: { name: v.mediaShareName, host: v.mediaShareHost },
      ...(text(v.timeServer) ? { ntp: { configuration: 'Manual' as const, server: text(v.timeServer) } } : {}),
    },
  };
}

function disconnected(p: P): Draft['disconnected'] {
  const d = p.disconnected;
  return {
    role: d.role,
    base_path: d.basePath,
    domain_suffix: d.domainSuffix,
    ingress: { ip_address: d.ingressIp, gateway: d.ingressGateway, ...(text(d.ingressIp) ? { prefix_length: d.ingressPrefixLength } : {}) },
    management: { ip_address: d.managementIp, ...(text(d.managementIp) ? { prefix_length: d.managementPrefixLength } : {}) },
    dns_server: d.dnsServer,
    time_servers: list(d.timeServers),
    identity: { authority: d.authority, client_id: d.clientId, root_operator_upn: d.rootOperatorUpn, ldap_server: d.ldapServer, ldaps: d.ldaps, sync_group_identifier: d.syncGroupIdentifier },
    operator_subscription_name: d.operatorSubscriptionName,
    resource_group: d.resourceGroup,
    internal_ca: d.internalCa,
  };
}

// The document, before the keys the design does not know are left out. Section order follows the toolkit's master template.
export function buildInfrastructure(p: Project): Draft {
  const lz = p.landingZone;
  const vault = vaultOf(p);
  const fileShare = p.hardware.witness === 'file-share';
  const cloud = !fileShare && witnessTypeFor(p) === 'Cloud';
  const build = text(p.release.build);
  const doc: Draft = {
    _metadata: { schema_version: SCHEMA_VERSION, scope: 'full', file_version: '1.0.0', generated_by: 'azurelocal-trailwright' },
    scenario: scenario(p),
    site: { customer: p.project.customer, time_zone: p.provisioning.osInstall === 'simplified' ? p.provisioning.timeZone : undefined, code: p.project.siteCode, name: p.project.siteName, owner: p.project.owner },
    environment: { name: environmentNameOf(p), type: p.project.environmentType === '' ? undefined : p.project.environmentType },
    azure: { tenant_id: lz.tenantId, location: lz.region, subscription_id: lz.subscriptionId, resource_group: lz.resourceGroup, hci_resource_provider_object_id: lz.hciResourceProviderObjectId, custom_location: lz.customLocation },
    // The vault the references in this file name. The deployment creates it in the resource group of the instance.
    ...(vault && text(lz.subscriptionId) && text(lz.resourceGroup) ? { key_vaults: [{ name: vault, subscription_id: text(lz.subscriptionId), resource_group: text(lz.resourceGroup), purpose: 'deployment' }] } : {}),
    cluster: {
      name: clusterNameOf(p),
      naming_prefix: lz.namingPrefix,
      witness: fileShare ? { type: 'file_share', path: p.hardware.witnessPath } : cloud ? { type: 'cloud', storage_account: lz.witnessStorageAccount } : { type: 'none' },
      key_vault: vault ? { name: vault, create_new: true, soft_delete_retention_days: lz.keyVaultRetentionDays } : undefined,
      ...(text(lz.diagnosticStorageAccountName) ? { diagnostics: { storage_account: text(lz.diagnosticStorageAccountName), logs_retention_days: lz.logsRetentionDays, storage_account_type: 'Standard_LRS' } } : {}),
    },
    // The full build of the release, when the design gives it.
    ...(/^\d+\.\d+\.\d+\.\d+$/.test(build) ? { deployment: { solution_version: build } } : {}),
    nodes: nodes(p),
    hardware: hardware(p, vault),
    networking: networking(p),
    identity: identity(p, vault),
    storage: storage(p),
    security: {
      level: SECURITY_LEVEL[p.security.level],
      drift_control: p.security.driftControl,
      credential_guard: p.security.credentialGuard,
      smb_signing: p.security.smbSigning,
      smb_cluster_encryption: p.security.smbClusterEncryption,
      bitlocker_boot_volume: p.security.bitlockerBootVolume,
      bitlocker_data_volumes: p.security.bitlockerDataVolumes,
      wdac: p.security.wdac,
      telemetry: { streaming_data: p.security.streamingData, episodic_data_upload: p.security.episodicData, eu_location: p.security.euLocation },
    },
    sdn: { enabled: p.sdn.enabled, ...(p.sdn.enabled ? { prefix: p.sdn.prefix, dns_records: p.sdn.dnsRecords } : {}) },
    operations: operations(p),
    provisioning: provisioning(p),
    ...(p.deployment.mode === 'disconnected' ? { disconnected: disconnected(p) } : {}),
    // The subscription of the instance, by name.
    ...(text(lz.subscriptionName) ? { landing_zone: { subscriptions: [{ name: text(lz.subscriptionName), id: lz.subscriptionId, role: 'azure_local' as const }] } } : {}),
  };
  return known(doc) ?? {};
}

export function buildInfrastructureYml(p: Project): string {
  return stringify(buildInfrastructure(p), { lineWidth: 0 });
}
