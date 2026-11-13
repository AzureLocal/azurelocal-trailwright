import { createExampleProject } from '../src/examples/exampleLab';
import type { Project } from '../src/model/schema';

// The designs every export is tested against: each one exercises a different branch of the exporters.
const ad = (): Project => {
  const p = createExampleProject();
  p.identity = { ...p.identity, mode: 'active-directory', domain: 'lab.example.com', ouPath: 'OU=azl01,DC=lab,DC=example,DC=com', lcmUsername: 'lcmuser01', localAdminUsername: 'azladmin' };
  return p;
};

const san = (base: Project): Project => {
  base.deployment = { ...base.deployment, architecture: 'disaggregated', sanType: 'iscsi' };
  base.storage = { ...base.storage, architecture: 'san', infraVolLunId: 'LUN-INFRA-0001', infraPerfLunId: 'LUN-PERF-0002' };
  // The ports of a disaggregated machine: two for management and compute, and the two standalone cluster ports.
  const port = (osName: string, role: string) => ({ osName, speedGbps: 25, rdma: 'none' as const, role });
  base.networking = {
    ...base.networking,
    clusterSubnets: ['198.51.100.0/25', '198.51.100.128/25'],
    intents: base.networking.intents.filter((i) => !i.traffic.includes('storage')),
    cards: [
      { label: 'NIC 1', make: '', model: '', ports: [port('pNIC01', 'intent:Management_Compute'), port('pNIC03', 'cluster:1')] },
      { label: 'NIC 2', make: '', model: '', ports: [port('pNIC02', 'intent:Management_Compute'), port('pNIC04', 'cluster:2')] },
    ],
  };
  return base;
};

const racks = (p: Project): Project => {
  p.hardware = { ...p.hardware, topology: 'rack-aware', witness: 'cloud', nodes: ['n1', 'n2', 'n3', 'n4'].map((name, i) => ({ name, ip: `192.0.2.${11 + i}`, cores: 16, memoryGiB: 256, drives: 4 })) };
  return p;
};

export const exportProjects: Array<[string, () => Project]> = [
  ['example (local identity)', () => createExampleProject()],
  ['Active Directory', ad],
  ['disaggregated SAN', () => san(ad())],
  ['rack-aware', () => racks(ad())],
  ['US Government', () => {
    const p = ad();
    p.deployment = { ...p.deployment, cloud: 'government' };
    p.landingZone = { ...p.landingZone, region: 'usgovvirginia' };
    return p;
  }],
  ['private path with SDN, simplified provisioning, no monitoring', () => {
    const p = createExampleProject();
    p.connectivity = { ...p.connectivity, path: 'private-path', privatePath: { ...p.connectivity.privatePath, transport: 'expressroute', virtualNetwork: 'vnet-example', workloadSubnet: 'snet-workload', firewallSubnet: 'AzureFirewallSubnet', firewallPrivateIp: '192.0.2.4', firewallPort: '8443', proxyBypass: 'localhost' } };
    p.sdn = { ...p.sdn, enabled: true, prefix: 'sdn01', dnsRecords: 'dynamic', defaultAccessPolicy: false, logicalNetworks: [{ name: 'lnet-compute', vlan: 110, addressPrefix: '192.0.2.128/25', gateway: '192.0.2.129', dnsServers: ['192.0.2.10'], poolStart: '192.0.2.140', poolEnd: '192.0.2.200' }] };
    p.provisioning = { ...p.provisioning, osInstall: 'simplified', hardwareSku: 'dell-ax-750', timeZone: 'UTC', timeServer: 'time.example.com', siteName: 'iic-site-01', siteResourceGroup: 'rg-iic-azl-01', adminKeyVaultName: 'kv-iic-mgmt-01', osVersion: '12.2610.1004.50', maintenanceIso: 'latest', mediaShareName: 'ztp-virtual-usb', mediaShareHost: '198.51.100.5' };
    p.hardware = { ...p.hardware, vendor: '', model: '', nodes: p.hardware.nodes.map((n, i) => ({ ...n, bmcIp: `198.51.100.${11 + i}`, managementMac: `00:00:5E:00:53:${11 + i}` })) };
    p.operations = { ...p.operations, monitoring: false };
    return p;
  }],
  ['nested two-way volume, switchless', () => {
    const p = createExampleProject();
    p.networking = { ...p.networking, storage: 'switchless' };
    p.storage = { ...p.storage, volumes: [{ name: 'nested', sizeGiB: 1024, resiliency: 'nested-two-way' }] };
    return p;
  }],
  ['SBE not applicable', () => {
    const p = createExampleProject();
    p.hardware = { ...p.hardware, sbe: { ...p.hardware.sbe, requirement: 'not_applicable', notApplicableReason: 'No Solution Builder Extension exists for this hardware model.', sourcePath: '' } };
    return p;
  }],
  ['SBE on a share with a reader account and a build-time side-load', () => {
    const p = ad();
    p.landingZone = { ...p.landingZone, keyVaultName: 'kv-example' };
    p.hardware = { ...p.hardware, sbe: { requirement: 'required', notApplicableReason: '', sourcePath: '\\\\files.example.invalid\\sbe\\vendor', sourceUsername: 'EXAMPLE\\svc-sbe-read', sourcePasswordSecret: 'sbe-share-reader', delivery: 'winrm_copy' } };
    return p;
  }],
  ['empty design', () => {
    const p = createExampleProject();
    p.hardware = { ...p.hardware, nodes: [] };
    return p;
  }],
];
