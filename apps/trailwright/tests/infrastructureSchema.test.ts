import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { buildInfrastructureYml } from '../src/exports';
import { SCHEMA_VERSION } from '../src/infra/types';
import type { Project } from '../src/model/schema';
import { exportProjects } from './exportProjects';

// The contract of the infrastructure.yml export is the Azure Local Toolkit's schema 5 for that file
// (azurelocal-toolkit config/variables/schema/infrastructure.schema.json). Its copy in this repository is
// src/infra/infrastructure.schema.json, at the version SCHEMA_VERSION names, and public/schema publishes the same file with
// the site. The build runs this test, so the exporter and the schema cannot drift apart. The schema is the toolkit's as it is
// (it is not written for ajv's strict mode, so strict is off, as in tests/infra/catalog.test.ts); every rule in it applies.
const schemaFile = resolve(__dirname, '..', 'src', 'infra', 'infrastructure.schema.json');
const schema = JSON.parse(readFileSync(schemaFile, 'utf8')) as Record<string, any>;
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);

type Doc = Record<string, any>;
const exported = (p: Project): Doc => parse(buildInfrastructureYml(p)) as Doc;
// What the schema reports, without the 'if' lines that only repeat the failing rule under them.
const problems = (doc: Doc): string[] => (validate(doc) ? [] : (validate.errors ?? []).filter((e) => e.keyword !== 'if').map((e) => `${e.instancePath || '/'} ${e.message}`));
const sample = (label: string): Project => exportProjects.find(([l]) => l.startsWith(label))![1]();
const ad = (): Project => sample('Active Directory');

describe(`infrastructure.yml follows the toolkit's schema ${SCHEMA_VERSION}`, () => {
  for (const [label, make] of exportProjects.filter(([l]) => l !== 'empty design')) {
    it(`validates the export of: ${label}`, () => {
      expect(problems(exported(make()))).toEqual([]);
    });
  }

  it('writes the version of the vendored schema, for the whole instance', () => {
    const doc = exported(ad());
    expect(SCHEMA_VERSION).toBe('5.6.26');
    expect(doc._metadata).toEqual({ schema_version: SCHEMA_VERSION, scope: 'full', file_version: '1.0.0', generated_by: 'azurelocal-trailwright' });
    expect(SCHEMA_VERSION).toMatch(new RegExp(schema.properties._metadata.properties.schema_version.pattern as string));
  });

  it('publishes the same schema as the one it is tested against', () => {
    expect(readFileSync(resolve(__dirname, '..', 'public', 'schema', 'infrastructure.schema.json'), 'utf8')).toBe(readFileSync(schemaFile, 'utf8'));
  });

  it('writes only sections the schema has, and none of the schema 4 layout', () => {
    for (const [, make] of exportProjects) {
      const keys = Object.keys(exported(make()));
      expect(keys.filter((k) => !(k in schema.properties))).toEqual([]);
      for (const old of ['azure_platform', 'compute', 'infrastructure_network', 'connectivity', 'arm_parameters']) expect(keys).not.toContain(old);
    }
  });

  it('rejects an unknown key and a missing section, so drift in either direction is caught', () => {
    const doc = exported(ad());
    expect(problems({ ...doc, surprise: true })).not.toEqual([]);
    expect(problems({ ...doc, networking: { ...doc.networking, management: { ...doc.networking.management, subnet_mask: '255.255.255.0' } } })).not.toEqual([]);
    const { cluster: _cluster, ...without } = doc;
    expect(problems(without)).not.toEqual([]);
  });

  it('leaves out what a design does not know, and the schema then says what is missing', () => {
    expect(problems(exported(sample('empty design')))).toEqual(["/ must have required property 'nodes'"]);
    const p = ad();
    p.project = { ...p.project, siteCode: '', siteName: '', environmentType: '' };
    p.hardware = { ...p.hardware, vendor: '', model: '' };
    const doc = exported(p);
    expect(doc.site).toEqual({ customer: 'Example Company', owner: 'Design owner' });
    expect(problems(doc).sort()).toEqual(["/environment must have required property 'type'", "/hardware must have required property 'model'", "/hardware must have required property 'vendor'", "/site must have required property 'code'", "/site must have required property 'name'"]);
  });
});

// The keys the toolkit removed from schema 5 (azurelocal-toolkit config/variables/docs/MIGRATION.md): 5.6.12, 5.6.15 and 5.6.16
// removed one each, and 5.6.20 removed the keys that no tool read. landing_zone.management_groups[].parent was kept.
const REMOVED_KEYS = [
  'operations.notifications.teams_webhook',
  'operations.monitoring.health_alerts',
  'sdn.default_access_policy',
  'security.backup_key_vault',
  'landing_zone.resource_providers',
  'identity.entra.break_glass_accounts',
  'identity.break_glass_account_ids',
  'identity.managed_identities',
  'landing_zone.log_analytics.resource_group',
  'landing_zone.log_analytics.retention_days',
  'identity.active_directory.service_accounts',
  'identity.accounts',
  'provisioning.iso.image_version',
  'identity.active_directory.join_options.rename_after_join',
];

// Every key path of a document, with [] for the items of a list: nodes[].management.ip_address.
function keyPaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((v) => keyPaths(v, `${prefix}[]`));
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return [path, ...keyPaths(v, path)];
  });
}

// Walks the schema along a key path, through $ref and the items of a list. Undefined when the schema has no such key.
function schemaAt(path: string): unknown {
  const deref = (n: any) => (n && n.$ref ? schema.$defs[n.$ref.split('/').pop()] : n);
  let node: any = schema;
  for (const raw of path.split('.')) {
    node = deref(node)?.properties?.[raw.replace(/\[\]$/, '')];
    if (raw.endsWith('[]')) node = deref(node)?.items;
    if (!node) return undefined;
  }
  return deref(node);
}

describe(`infrastructure.yml writes no key that schema ${SCHEMA_VERSION} removed`, () => {
  it('the vendored schema has none of the removed keys', () => {
    expect(REMOVED_KEYS.filter((k) => schemaAt(k) !== undefined)).toEqual([]);
    // Kept by 5.6.20, so it is not in the list.
    expect(schemaAt('landing_zone.management_groups[].parent')).toBeDefined();
  });

  it.each(exportProjects.map(([label, make]) => [label, make] as const))('the export of %s writes only keys the schema has, and none it removed', (_label, make) => {
    const paths = keyPaths(exported(make()));
    expect(paths.filter((k) => REMOVED_KEYS.some((r) => k === r || k.startsWith(`${r}.`) || k.startsWith(`${r}[]`)))).toEqual([]);
    expect(paths.filter((k) => schemaAt(k) === undefined)).toEqual([]);
  });
});

describe('every choice of the design has a value the schema takes', () => {
  const variants: Array<[string, (p: Project) => void]> = [
    ...(['two-way', 'three-way', 'four-way', 'parity', 'nested-two-way'] as const).map((resiliency): [string, (p: Project) => void] => [`volume resiliency ${resiliency}`, (p) => { p.storage = { ...p.storage, volumes: [{ name: 'vol-workloads-01', sizeGiB: 1024, resiliency }] }; }]),
    ...(['Express', 'InfraOnly', 'KeepStorage'] as const).map((configurationMode): [string, (p: Project) => void] => [`configuration mode ${configurationMode}`, (p) => { p.storage = { ...p.storage, configurationMode }; }]),
    ...(['portal', 'powershell', 'powershell-limited'] as const).map((updateMethod): [string, (p: Project) => void] => [`update method ${updateMethod}`, (p) => { p.operations = { ...p.operations, updateMethod }; }]),
    ...(['none', 'asr', 'hyperv-replica'] as const).map((drMethod): [string, (p: Project) => void] => [`disaster recovery ${drMethod}`, (p) => { p.operations = { ...p.operations, drMethod }; }]),
    ['outbound path proxy', (p) => { p.connectivity = { ...p.connectivity, path: 'proxy', proxyUrl: 'http://proxy.improbability.cloud:3128' }; }],
    ['outbound path Arc gateway', (p) => { p.connectivity = { ...p.connectivity, path: 'arc-gateway', arcGatewayName: 'arcgw-iic-01' }; }],
    ['outbound path proxy and Arc gateway', (p) => { p.connectivity = { ...p.connectivity, path: 'proxy-arc-gateway', proxyUrl: 'http://proxy.improbability.cloud:3128', arcGatewayName: 'arcgw-iic-01' }; }],
    ['private path over a site-to-site VPN', (p) => { p.connectivity = { ...p.connectivity, path: 'private-path', arcGatewayName: 'arcgw-iic-01', privatePath: { ...p.connectivity.privatePath, transport: 'site-to-site-vpn', firewallPrivateIp: '192.0.2.4', firewallPort: '8443', proxyBypass: 'localhost, 127.0.0.1;192.0.2.0/24' } }; }],
    ['customized security', (p) => { p.security = { ...p.security, level: 'Customized', wdac: false }; }],
    ['local identity with a DNS forwarder', (p) => { p.identity = { ...p.identity, mode: 'local-identity-key-vault', dnsServerConfig: 'UseForwarder', dnsForwarders: ['192.0.2.4'] }; }],
    ['SAN over Fibre Channel with LUNs', (p) => { Object.assign(p, sample('disaggregated SAN')); p.deployment = { ...p.deployment, sanType: 'fibre-channel' }; p.storage = { ...p.storage, sanLuns: [{ name: 'lun-workloads-01', sizeGiB: 2048 }] }; }],
    ['file share witness', (p) => { p.hardware = { ...p.hardware, witness: 'file-share', witnessPath: '\\\\files.example.invalid\\witness' }; }],
    ['no witness, three machines', (p) => { p.hardware = { ...p.hardware, witness: 'none', nodes: [...p.hardware.nodes, { ...p.hardware.nodes[0], name: 'node3', ip: '192.0.2.13', serial: 'EXAMPLE-0003' }] }; }],
    ['one machine', (p) => { p.hardware = { ...p.hardware, witness: 'none', nodes: p.hardware.nodes.slice(0, 1) }; }],
    ['machines that differ', (p) => { p.hardware = { ...p.hardware, nodes: p.hardware.nodes.map((n, i) => ({ ...n, cores: 32 + i, memoryGiB: 512 + i })) }; }],
    ['storage addresses given per machine', (p) => { p.networking = { ...p.networking, storageAutoIp: false, storageSubnets: ['198.51.100.0/24', '203.0.113.0/24'] }; p.hardware = { ...p.hardware, nodes: p.hardware.nodes.map((n, i) => ({ ...n, storageIps: [`198.51.100.${11 + i}`, `203.0.113.${11 + i}`] })) }; }],
    ['every Network ATC override', (p) => { p.networking = { ...p.networking, intents: p.networking.intents.map((i) => ({ ...i, overrideQos: true, overrideAdapter: true, jumboPacket: '4088', networkDirectTechnology: 'iWARP', overrideVSwitch: true, enableIov: 'false', loadBalancingAlgorithm: 'HyperVPort' })) }; }],
    ['RDMA left to the adapter, and RDMA off', (p) => { p.networking = { ...p.networking, intents: p.networking.intents.map((i, k) => ({ ...i, overrideAdapter: true, networkDirect: k ? 'Disabled' : 'Enabled', networkDirectTechnology: 'Auto' })) }; }],
    ['network cards with every RDMA kind and role', (p) => { p.networking = { ...p.networking, cards: [{ label: 'Slot 3', make: 'Example NIC Vendor', model: 'Example 25GbE NIC', ports: [{ osName: 'pNIC01', speedGbps: 25, rdma: 'none', role: 'intent:Management_Compute' }, { osName: 'pNIC02', speedGbps: 25, rdma: 'iWARP', role: 'cluster:1' }, { osName: 'pNIC03', speedGbps: 25, rdma: 'RoCE', role: 'cluster:2' }, { osName: 'pNIC04', speedGbps: 25, rdma: 'RoCEv2', role: 'iscsi:a' }, { osName: 'pNIC05', speedGbps: 10, rdma: 'none', role: 'unused' }, { osName: '', speedGbps: 10, rdma: 'none', role: 'unused' }] }] }; }],
    ['monitoring with an existing rule and an endpoint', (p) => { p.operations = { ...p.operations, monitoring: true, useExistingDcr: true, dcrName: 'dcr-iic-azl-01', agentPrivateLinks: true, dceName: 'dce-iic-azl-01' }; }],
    ['the full build of the release', (p) => { p.release = { ...p.release, build: '12.2610.1004.50' }; }],
    ['disconnected operations', (p) => { p.deployment = { ...p.deployment, mode: 'disconnected' }; p.hardware = { ...p.hardware, witness: 'file-share', witnessPath: '\\\\files.example.invalid\\witness' }; p.disconnected = { ...p.disconnected, domainSuffix: 'improbability.cloud', ingressIp: '192.0.2.40', ingressGateway: '192.0.2.1', managementIp: '192.0.2.41', dnsServer: '192.0.2.4', timeServers: '192.0.2.4, 192.0.2.5' }; }],
  ];

  it.each(variants)('%s', (_label, change) => {
    const p = ad();
    change(p);
    expect(problems(exported(p))).toEqual([]);
  });
});

describe('where a value of the design goes', () => {
  it('puts the scenario in scenario, in the spelling of the schema', () => {
    const p = sample('rack-aware');
    p.connectivity = { ...p.connectivity, path: 'proxy-arc-gateway', proxyUrl: 'http://proxy.improbability.cloud:3128', arcGatewayName: 'arcgw-iic-01' };
    const doc = exported(p);
    expect(doc.scenario).toEqual({ identity: 'active_directory', storage_architecture: 's2d', storage_connectivity: 'switched', topology: 'rack_aware', connectivity: 'connected', cloud: 'public', outbound_path: 'proxy_arc_gateway', os_install: 'iso', deploy_method: 'portal' });
    expect(doc.nodes.map((n: Doc) => n.zone)).toEqual(['Zone1', 'Zone1', 'Zone2', 'Zone2']);
    expect(doc.networking.outbound).toEqual({ proxy: { url: 'http://proxy.improbability.cloud:3128' }, arc_gateway: { name: 'arcgw-iic-01' } });
  });

  it('writes the management network as a subnet, with the pool, and each machine with its address', () => {
    const doc = exported(ad());
    expect(doc.networking.management).toEqual({ subnet: '192.0.2.0/24', gateway: '192.0.2.1', vlan_id: 0, dns_servers: ['192.0.2.10'], use_dhcp: false, infrastructure_pool: { start: '192.0.2.21', end: '192.0.2.27' } });
    expect(doc.nodes).toEqual([
      { name: 'node1', management: { ip_address: '192.0.2.11' }, serial_number: 'EXAMPLE-0001' },
      { name: 'node2', management: { ip_address: '192.0.2.12' }, serial_number: 'EXAMPLE-0002' },
    ]);
    expect(doc.hardware).toMatchObject({ vendor: 'Dell', model: 'AX-760', cpu_cores: 32, memory_gib: 512, drives: { capacity: { media: 'nvme', count: 8, size_tb: 3.84 } } });
    expect(doc.networking.vlans[1]).toEqual({ name: 'Storage 1', id: 711, subnet: '198.51.100.0/24' });
    expect(doc.networking.storage.networks).toEqual([{ name: 'StorageNetwork1', adapter: 'pNIC03', vlan_id: 711 }, { name: 'StorageNetwork2', adapter: 'pNIC04', vlan_id: 712 }]);
  });

  it('writes every credential as a Key Vault reference, and the vault with where it is', () => {
    const doc = exported(sample('SBE on a share'));
    expect(doc.identity.local_admin).toEqual({ username: 'azladmin', password: 'keyvault://kv-example/local-admin-password' });
    expect(doc.identity.active_directory.lcm_user).toEqual({ username: 'lcmuser01', password: 'keyvault://kv-example/lcm-password' });
    expect(doc.hardware.sbe.source_password).toBe('keyvault://kv-example/sbe-share-reader');
    expect(doc.key_vaults).toEqual([{ name: 'kv-example', subscription_id: '00000000-0000-0000-0000-000000000000', resource_group: 'rg-example-azl-001', purpose: 'deployment' }]);
    expect(doc.cluster.key_vault).toEqual({ name: 'kv-example', create_new: true, soft_delete_retention_days: 30 });
    const noVault = ad();
    noVault.landingZone = { ...noVault.landingZone, keyVaultName: '' };
    noVault.identity = { ...noVault.identity, keyVaultName: '' };
    expect(exported(noVault).identity.local_admin).toEqual({ username: 'azladmin' });
  });

  it('writes a SAN design with its cluster networks and without Storage Spaces Direct keys', () => {
    const doc = exported(sample('disaggregated SAN'));
    expect(doc.storage).toEqual({ san: { type: 'iscsi', infra_volume_lun_id: 'LUN-INFRA-0001', performance_history_lun_id: 'LUN-PERF-0002' } });
    expect(doc.networking.cluster_networks).toEqual([
      { name: 'clusterNetwork-A', adapter: 'pNIC03', vlan_id: 1711, subnet: '198.51.100.0/25' },
      { name: 'clusterNetwork-B', adapter: 'pNIC04', vlan_id: 1712, subnet: '198.51.100.128/25' },
    ]);
    expect(doc.networking.storage).toBeUndefined();
    expect(doc.hardware.drives).toBeUndefined();
    expect(doc.hardware.network_cards[0].ports).toEqual([{ name: 'pNIC01', speed_gbps: 25, rdma: 'none', role: 'intent:Management_Compute' }, { name: 'pNIC03', speed_gbps: 25, rdma: 'none', role: 'cluster:a' }]);
  });

  it('writes simplified machine provisioning with the site, the image, the share and each machine\'s BMC and MAC', () => {
    const doc = exported(sample('private path with SDN, simplified'));
    expect(doc.provisioning).toEqual({
      os_version: '12.2610.1004.50',
      simplified: { site_name: 'iic-site-01', resource_group: 'rg-iic-azl-01', maintenance_iso: 'latest', admin: { username: 'azladmin', password: 'keyvault://kv-iic-mgmt-01/provisioning-admin-password' }, media_share: { name: 'ztp-virtual-usb', host: '198.51.100.5' }, ntp: { configuration: 'Manual', server: 'time.example.com' } },
    });
    expect(doc.nodes[0]).toEqual({ name: 'node1', management: { ip_address: '192.0.2.11', mac_address: '00:00:5E:00:53:11' }, serial_number: 'EXAMPLE-0001', bmc: { ip_address: '198.51.100.11' } });
    expect(doc.site.time_zone).toBe('UTC');
    // The validated model of the preview stands in when the design names no vendor and model.
    expect(doc.hardware).toMatchObject({ vendor: 'Dell', model: 'AX-750' });
    expect(doc.sdn).toEqual({ enabled: true, prefix: 'sdn01', dns_records: 'dynamic' });
    expect(doc.networking.logical_networks).toEqual([{ name: 'lnet-compute', vlan_id: 110, address_prefix: '192.0.2.128/25', gateway: '192.0.2.129', dns_servers: ['192.0.2.10'], ip_pool: { start: '192.0.2.140', end: '192.0.2.200' } }]);
  });

  it('writes the Network ATC overrides only when the design overrides, as numbers and booleans', () => {
    const p = ad();
    expect(exported(p).networking.intents[0].overrides).toBeUndefined();
    p.networking = { ...p.networking, intents: p.networking.intents.map((i) => ({ ...i, overrideQos: true, overrideAdapter: true, overrideVSwitch: true })) };
    expect(exported(p).networking.intents[0].overrides).toEqual({ qos: { cluster_priority: 7, smb_priority: 3, smb_bandwidth_percent: 50 }, adapter: { jumbo_packet: 9014, network_direct: true, network_direct_technology: 'roce_v2' }, virtual_switch: { enable_iov: true, load_balancing_algorithm: 'dynamic' } });
  });

  it('a hybrid design has no cluster networks to write, which the schema reports', () => {
    const p = ad();
    p.deployment = { ...p.deployment, architecture: 'hybrid' };
    p.storage = { ...p.storage, architecture: 'hybrid' };
    expect(problems(exported(p))).toEqual(["/networking must have required property 'cluster_networks'"]);
  });
});
