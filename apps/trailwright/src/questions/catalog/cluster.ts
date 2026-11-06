// The instance itself, how it reaches Azure, how the OS gets onto it, and its security settings.
import type { Draft } from '../../infra/types';
import type { Question } from '../types';
import { isDisconnected, isRackAware, isSimplified, learn, nodeCount, usesArcGateway, usesPrivatePath, usesProxy, witnessType } from '../when';

const kvRef = (v: unknown) => (typeof v === 'string' && !/^keyvault:\/\/[A-Za-z][A-Za-z0-9-]{1,22}[A-Za-z0-9]\/[A-Za-z0-9-]{1,127}$/.test(v) ? 'keyvault://<vault>/<secret>' : undefined);

// The witness the design needs, when there is only one valid answer.
function fixedWitness(d: Draft) {
  if (isDisconnected(d) && isRackAware(d)) return { value: 'file_share', reason: 'A rack aware cluster with disconnected operations needs a file share witness.' };
  if (!isDisconnected(d) && (nodeCount(d) === 2 || isRackAware(d))) return { value: 'cloud', reason: `${isRackAware(d) ? 'A rack aware cluster' : 'Two machines'} need a witness; connected instances use a cloud witness.` };
  return undefined;
}

export const clusterQuestions: Question[] = [
  {
    id: 'cluster.name',
    path: 'cluster.name',
    step: 'cluster',
    group: 'Instance',
    label: 'Instance name',
    help: 'Also the cluster name: up to 15 letters, digits and hyphens.',
    owner: 'architect',
    kind: 'text',
    check: (v) => (typeof v === 'string' && !/^[A-Za-z0-9][A-Za-z0-9-]{0,14}$/.test(v) ? 'Up to 15 letters, digits and hyphens.' : undefined),
  },
  { id: 'cluster.naming_prefix', path: 'cluster.naming_prefix', step: 'cluster', group: 'Instance', label: 'Prefix for the Azure resources it creates', owner: 'azure', kind: 'text', requiredWhen: () => false },
  {
    id: 'cluster.witness.type',
    path: 'cluster.witness.type',
    step: 'cluster',
    group: 'Witness',
    label: 'Cluster witness',
    learnUrl: learn.quorum,
    owner: 'architect',
    kind: 'choice',
    options: [
      { value: 'cloud', label: 'Cloud witness', description: 'An Azure Storage account.', available: (d: Draft) => (isDisconnected(d) ? 'Disconnected operations use a file share witness.' : true) },
      { value: 'file_share', label: 'File share witness', available: (d: Draft) => (isDisconnected(d) ? true : 'Connected instances use a cloud witness.') },
      { value: 'none', label: 'No witness', available: (d: Draft) => (nodeCount(d) === 2 || isRackAware(d) ? 'Two machines and rack aware clusters need a witness.' : true) },
    ],
    fixedWhen: fixedWitness,
    recommended: (d) => (nodeCount(d) >= 5 ? { value: 'none', reason: 'With five or more machines a witness adds no resiliency.' } : nodeCount(d) >= 3 && !isDisconnected(d) ? { value: 'cloud', reason: 'A witness is strongly recommended with three or four machines.' } : undefined),
  },
  { id: 'cluster.witness.storage_account', path: 'cluster.witness.storage_account', step: 'cluster', group: 'Witness', label: 'Witness storage account', help: '3 to 24 lowercase letters and digits.', owner: 'azure', kind: 'text', appliesWhen: (d) => (fixedWitness(d)?.value ?? witnessType(d)) === 'cloud', check: (v) => (typeof v === 'string' && !/^[a-z0-9]{3,24}$/.test(v) ? '3 to 24 lowercase letters and digits.' : undefined) },
  { id: 'cluster.witness.path', path: 'cluster.witness.path', step: 'cluster', group: 'Witness', label: 'Witness file share', help: 'A UNC path on a Windows server in the same AD forest.', owner: 'identity', kind: 'text', appliesWhen: (d) => (fixedWitness(d)?.value ?? witnessType(d)) === 'file_share', placeholder: '\\\\fs01.corp.example.com\\witness' },
  { id: 'cluster.key_vault.name', path: 'cluster.key_vault.name', step: 'cluster', group: 'Key Vault', label: 'Key Vault for the instance', help: 'One per instance. The deployment keeps the instance’s secrets in it; with local identity it holds everything AD would.', learnUrl: learn.arm, owner: 'azure', kind: 'text' },
  { id: 'cluster.key_vault.create_new', path: 'cluster.key_vault.create_new', step: 'cluster', group: 'Key Vault', label: 'Does the deployment create it?', owner: 'azure', kind: 'boolean', requiredWhen: () => false },
  { id: 'cluster.diagnostics.storage_account', path: 'cluster.diagnostics.storage_account', step: 'cluster', group: 'Key Vault', label: 'Storage account for Key Vault audit logs', owner: 'azure', kind: 'text', requiredWhen: () => false },
  {
    id: 'cluster.deployment_mode',
    path: 'cluster.deployment_mode',
    step: 'cluster',
    group: 'Instance',
    label: 'Write the ARM parameters for',
    owner: 'architect',
    kind: 'select',
    requiredWhen: () => false,
    appliesWhen: (d) => d.scenario?.deploy_method === 'arm',
    options: [
      { value: 'validate', label: 'Validate (run first)' },
      { value: 'deploy', label: 'Deploy' },
    ],
  },

  // Outbound
  { id: 'networking.outbound.proxy.url', path: 'networking.outbound.proxy.url', step: 'outbound', group: 'Proxy', label: 'Proxy URL', placeholder: 'http://proxy.example.com:8080', learnUrl: learn.decision10, owner: 'network', kind: 'text', appliesWhen: usesProxy, check: (v) => (typeof v === 'string' && !/^https?:\/\//.test(v) ? 'http:// or https:// and the port.' : undefined) },
  { id: 'networking.outbound.proxy.bypass', path: 'networking.outbound.proxy.bypass', step: 'outbound', group: 'Proxy', label: 'Proxy bypass list', help: 'Include localhost, the machines, the cluster and the infrastructure pool. Not used with Arc gateway.', owner: 'network', kind: 'list', appliesWhen: (d) => usesProxy(d) && !usesArcGateway(d), requiredWhen: () => false },
  { id: 'networking.outbound.arc_gateway.name', path: 'networking.outbound.arc_gateway.name', step: 'outbound', group: 'Arc gateway', label: 'Arc gateway resource', help: 'In the same subscription as the machines. Up to five per subscription.', learnUrl: learn.arcGateway, owner: 'azure', kind: 'text', appliesWhen: usesArcGateway },
  {
    id: 'networking.outbound.private_path.transport',
    path: 'networking.outbound.private_path.transport',
    step: 'outbound',
    group: 'Private path',
    label: 'Private connection to Azure',
    learnUrl: learn.privatePath,
    owner: 'network',
    kind: 'choice',
    appliesWhen: usesPrivatePath,
    options: [
      { value: 'expressroute', label: 'ExpressRoute' },
      { value: 'site_to_site_vpn', label: 'Site-to-site VPN' },
    ],
  },
  { id: 'networking.outbound.private_path.virtual_network', path: 'networking.outbound.private_path.virtual_network', step: 'outbound', group: 'Private path', label: 'Azure virtual network', owner: 'azure', kind: 'text', appliesWhen: usesPrivatePath },
  { id: 'networking.outbound.private_path.firewall_private_ip', path: 'networking.outbound.private_path.firewall_private_ip', step: 'outbound', group: 'Private path', label: 'Azure Firewall private address', owner: 'network', kind: 'ipv4', appliesWhen: usesPrivatePath },
  { id: 'networking.outbound.private_path.firewall_port', path: 'networking.outbound.private_path.firewall_port', step: 'outbound', group: 'Private path', label: 'Explicit proxy port on the firewall', owner: 'network', kind: 'number', appliesWhen: usesPrivatePath },

  // Provisioning: the OS version for both routes, then ZTP's settings.
  {
    id: 'provisioning.os_version',
    path: 'provisioning.os_version',
    step: 'provisioning',
    group: 'Operating system',
    label: 'Solution version',
    help: 'Pin a version, for example 12.2610.1004.50, so every machine gets the same build and the OEM extension can be checked against it. latest takes whatever is newest on the day.',
    owner: 'architect',
    kind: 'text',
    placeholder: '12.YYMM.x.y',
    check: (v) => (typeof v !== 'string' ? undefined : /^(latest|latest-preview)$/.test(v) ? undefined : /^12\.\d{4}\.\d+\.\d+$/.test(v) ? undefined : 'latest, latest-preview, or a version like 12.YYMM.x.y.'),
  },
  { id: 'provisioning.iso.image_source', path: 'provisioning.iso.image_source', step: 'provisioning', group: 'ISO install', label: 'Which image?', owner: 'datacenter', kind: 'select', appliesWhen: (d) => d.scenario?.os_install === 'iso', requiredWhen: () => false, options: [{ value: 'microsoft', label: 'Microsoft’s image from the Azure portal' }, { value: 'oem', label: 'The OEM’s image' }] },
  { id: 'provisioning.simplified.site_name', path: 'provisioning.simplified.site_name', step: 'provisioning', group: 'Simplified provisioning (ZTP)', label: 'Provisioning site resource name', learnUrl: learn.simplified, owner: 'azure', kind: 'text', appliesWhen: isSimplified },
  { id: 'provisioning.simplified.maintenance_iso', path: 'provisioning.simplified.maintenance_iso', step: 'provisioning', group: 'Simplified provisioning (ZTP)', label: 'Provisioning image', help: 'latest, a train such as 2610, a build such as 10.2610.0.3063, or a Microsoft download URL.', owner: 'architect', kind: 'text', appliesWhen: isSimplified, recommended: () => ({ value: 'latest', reason: 'The newest generally available provisioning image.' }) },
  { id: 'provisioning.simplified.admin.username', path: 'provisioning.simplified.admin.username', step: 'provisioning', group: 'Simplified provisioning (ZTP)', label: 'Local administrator of the provisioned OS', owner: 'identity', kind: 'text', appliesWhen: isSimplified },
  { id: 'provisioning.simplified.admin.password', path: 'provisioning.simplified.admin.password', step: 'provisioning', group: 'Simplified provisioning (ZTP)', label: 'Its password secret', help: 'At least 12 characters with lowercase, uppercase, a digit and a special character. Create the secret before the run.', owner: 'identity', kind: 'kvref', appliesWhen: isSimplified, check: kvRef },
  { id: 'provisioning.simplified.media_share.name', path: 'provisioning.simplified.media_share.name', step: 'provisioning', group: 'Simplified provisioning (ZTP)', label: 'SMB share for the provisioning images', help: 'On the management host. The BMCs mount the images from it.', owner: 'datacenter', kind: 'text', appliesWhen: isSimplified, recommended: () => ({ value: 'ztp-virtual-usb', reason: 'The name azurelocal-ztp uses.' }) },
  { id: 'provisioning.simplified.media_share.host', path: 'provisioning.simplified.media_share.host', step: 'provisioning', group: 'Simplified provisioning (ZTP)', label: 'Management host address, as the BMCs reach it', help: 'Or name the adapter below when the address changes, as on a VPN.', owner: 'network', kind: 'ipv4', appliesWhen: isSimplified, requiredWhen: (d) => !d.provisioning?.simplified?.media_share?.host_adapter },
  { id: 'provisioning.simplified.media_share.host_adapter', path: 'provisioning.simplified.media_share.host_adapter', step: 'provisioning', group: 'Simplified provisioning (ZTP)', label: 'Or: the adapter whose address the BMCs reach', owner: 'network', kind: 'text', appliesWhen: isSimplified, requiredWhen: () => false },
  { id: 'hardware.sbe.allow_unvalidated', path: 'hardware.sbe.allow_unvalidated', step: 'provisioning', group: 'Simplified provisioning (ZTP)', label: 'Allow an SBE the OEM hasn’t validated with this version (test only)', owner: 'architect', kind: 'boolean', appliesWhen: isSimplified, requiredWhen: () => false },

  // Security
  {
    id: 'security.level',
    path: 'security.level',
    step: 'security',
    group: 'Security',
    label: 'Security settings',
    learnUrl: learn.security,
    owner: 'security',
    kind: 'choice',
    requiredWhen: () => false,
    options: [
      { value: 'recommended', label: 'Recommended', description: 'Microsoft’s secure baseline: every setting on.' },
      { value: 'customized', label: 'Customized', description: 'Turn individual settings off.' },
    ],
    recommended: () => ({ value: 'recommended', reason: 'The secure baseline Microsoft recommends.' }),
  },
  ...(['drift_control', 'credential_guard', 'smb_signing', 'smb_cluster_encryption', 'bitlocker_boot_volume', 'bitlocker_data_volumes', 'wdac'] as const).map(
    (k): Question => ({
      id: `security.${k}`,
      path: `security.${k}`,
      step: 'security',
      group: 'Security',
      label: { drift_control: 'Drift control', credential_guard: 'Credential Guard', smb_signing: 'SMB signing', smb_cluster_encryption: 'SMB encryption in the cluster', bitlocker_boot_volume: 'BitLocker on the boot volume', bitlocker_data_volumes: 'BitLocker on data volumes', wdac: 'Application Control (WDAC)' }[k],
      learnUrl: learn.security,
      owner: 'security',
      kind: 'boolean',
      appliesWhen: (d) => d.security?.level === 'customized',
      requiredWhen: () => false,
    }),
  ),

  // Disconnected operations
  {
    id: 'disconnected.role',
    path: 'disconnected.role',
    step: 'disconnected',
    group: 'Disconnected operations',
    label: 'Which cluster is this?',
    learnUrl: learn.disconnected,
    owner: 'architect',
    kind: 'choice',
    appliesWhen: isDisconnected,
    options: [
      { value: 'management', label: 'Management cluster', description: 'Hosts the control plane appliance. Three to 16 machines, Active Directory.' },
      { value: 'workload', label: 'Workload cluster', description: 'Managed by an existing control plane.' },
    ],
    check: (v, d) => {
      if (v !== 'management') return undefined;
      if (nodeCount(d) < 3) return 'A management cluster needs at least three machines.';
      if (d.scenario?.identity === 'local_identity') return 'A management cluster doesn’t support local identity: use Active Directory.';
      return undefined;
    },
  },
  { id: 'disconnected.domain_suffix', path: 'disconnected.domain_suffix', step: 'disconnected', group: 'Disconnected operations', label: 'Domain suffix of the control plane endpoints', owner: 'network', kind: 'text', appliesWhen: isDisconnected },
  { id: 'disconnected.ingress.ip_address', path: 'disconnected.ingress.ip_address', step: 'disconnected', group: 'Disconnected operations', label: 'Ingress address', owner: 'network', kind: 'ipv4', appliesWhen: isDisconnected },
  { id: 'disconnected.management.ip_address', path: 'disconnected.management.ip_address', step: 'disconnected', group: 'Disconnected operations', label: 'Appliance management address', owner: 'network', kind: 'ipv4', appliesWhen: isDisconnected },
  { id: 'disconnected.dns_server', path: 'disconnected.dns_server', step: 'disconnected', group: 'Disconnected operations', label: 'DNS server for the appliance', owner: 'network', kind: 'ipv4', appliesWhen: isDisconnected },
  { id: 'disconnected.identity.authority', path: 'disconnected.identity.authority', step: 'disconnected', group: 'Disconnected identity', label: 'Identity provider authority', help: 'For example the AD FS URL.', owner: 'identity', kind: 'text', appliesWhen: isDisconnected },
  { id: 'disconnected.identity.ldap_server', path: 'disconnected.identity.ldap_server', step: 'disconnected', group: 'Disconnected identity', label: 'LDAP server', owner: 'identity', kind: 'text', appliesWhen: isDisconnected },
  { id: 'disconnected.internal_ca', path: 'disconnected.internal_ca', step: 'disconnected', group: 'Disconnected identity', label: 'Certificates from an internal CA', owner: 'security', kind: 'boolean', appliesWhen: isDisconnected, requiredWhen: () => false },
];

