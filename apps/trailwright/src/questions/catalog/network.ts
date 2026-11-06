// The management network, intents, storage networks and VLANs. Switchless and switched, S2D and SAN each see only
// their own questions.
import type { Draft } from '../../infra/types';
import { firstHost, freeRun, inSubnet, isCidr, isIpv4, range, toNumber } from '../../infra/ip';
import type { Question } from '../types';
import { hasStorageNetwork, isSwitchless, learn, storageAutoIpOff, usesDhcp, usesSan } from '../when';

const step = 'network' as const;
const mgmt = (d: Draft) => d.networking?.management ?? {};
const nodeIps = (d: Draft): string[] => (d.nodes ?? []).map((n) => n?.management?.ip_address).filter(isIpv4);
const reserved = ['10.244.0.0/16', '10.96.0.0/24'];
const publicDns = ['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1', '9.9.9.9', '149.112.112.112', '208.67.222.222', '208.67.220.220'];

function checkReserved(ip: string): string | undefined {
  const hit = reserved.find((r) => inSubnet(ip, r));
  return hit ? `${ip} is in ${hit}, which the Arc resource bridge reserves.` : undefined;
}

export const networkQuestions: Question[] = [
  {
    id: 'networking.management.subnet',
    path: 'networking.management.subnet',
    step,
    group: 'Management network',
    label: 'Management subnet',
    help: 'CIDR, for example 192.0.2.0/24. The machines, the infrastructure pool and the gateway are all in it.',
    learnUrl: learn.decision8,
    owner: 'network',
    kind: 'cidr',
    check: (v) => (isCidr(v) ? checkReserved(v.split('/')[0]) : 'A subnet in CIDR form, for example 192.0.2.0/24.'),
  },
  {
    id: 'networking.management.gateway',
    path: 'networking.management.gateway',
    step,
    group: 'Management network',
    label: 'Default gateway',
    help: 'The one default gateway. It must allow outbound traffic to Azure and answer ICMP from the infrastructure pool.',
    learnUrl: learn.decision8,
    owner: 'network',
    kind: 'ipv4',
    suggest: (d) => (isCidr(mgmt(d).subnet) ? firstHost(mgmt(d).subnet as string) : undefined),
    check: (v, d) => {
      if (!isIpv4(v)) return 'An IPv4 address.';
      const s = mgmt(d).subnet;
      return isCidr(s) && !inSubnet(v, s) ? `${v} isn't in the management subnet ${s}.` : checkReserved(v);
    },
  },
  {
    id: 'networking.management.vlan_id',
    path: 'networking.management.vlan_id',
    step,
    group: 'Management network',
    label: 'Management VLAN',
    help: '0 for the default (untagged) VLAN, which Microsoft recommends. A tagged VLAN is set on the adapters before Arc registration. It can’t change after deployment.',
    learnUrl: learn.decision8,
    owner: 'network',
    kind: 'number',
    requiredWhen: () => false,
    recommended: () => ({ value: 0, reason: 'Microsoft recommends the default VLAN for management.' }),
  },
  {
    id: 'networking.management.dns_servers',
    path: 'networking.management.dns_servers',
    step,
    group: 'Management network',
    label: 'DNS servers',
    help: 'They must resolve your on-premises domains and the Azure endpoints, and at least one must run outside the cluster. They can’t change after deployment.',
    learnUrl: learn.decision8,
    owner: 'network',
    kind: 'ipv4-list',
    check: (v) => {
      const list = Array.isArray(v) ? v.map(String) : [];
      const pub = list.find((ip) => publicDns.includes(ip));
      return pub ? `${pub} is a public DNS server; public DNS servers aren’t supported.` : list.map((ip) => (isIpv4(ip) ? checkReserved(ip) : `${ip} isn't an IPv4 address.`)).find(Boolean);
    },
  },
  {
    id: 'networking.management.use_dhcp',
    path: 'networking.management.use_dhcp',
    step,
    group: 'Management network',
    label: 'Do the machines get their management address from DHCP?',
    help: 'Static addresses are the usual choice. With DHCP, reserve each machine’s address, and the infrastructure pool still needs static addresses outside the DHCP scope.',
    learnUrl: learn.decision8,
    owner: 'network',
    kind: 'boolean',
    requiredWhen: () => false,
  },
  {
    id: 'networking.management.infrastructure_pool.start',
    path: 'networking.management.infrastructure_pool.start',
    step,
    group: 'Infrastructure pool',
    label: 'Infrastructure pool: first address',
    help: 'At least six consecutive free addresses in the management subnet, not including any machine address. The cluster IP and the Arc resource bridge use them. It can’t change after deployment.',
    learnUrl: learn.decision8,
    owner: 'network',
    kind: 'ipv4',
    requiredWhen: (d) => !usesDhcp(d),
    suggest: (d) => (isCidr(mgmt(d).subnet) ? freeRun(mgmt(d).subnet as string, [...nodeIps(d), String(mgmt(d).gateway ?? '')], 10)?.start : undefined),
  },
  {
    id: 'networking.management.infrastructure_pool.end',
    path: 'networking.management.infrastructure_pool.end',
    step,
    group: 'Infrastructure pool',
    label: 'Infrastructure pool: last address',
    learnUrl: learn.decision8,
    owner: 'network',
    kind: 'ipv4',
    requiredWhen: (d) => !usesDhcp(d),
    suggest: (d) => (isCidr(mgmt(d).subnet) ? freeRun(mgmt(d).subnet as string, [...nodeIps(d), String(mgmt(d).gateway ?? '')], 10)?.end : undefined),
    check: (v, d) => {
      const start = mgmt(d).infrastructure_pool?.start;
      const s = mgmt(d).subnet;
      if (!isIpv4(v) || !isIpv4(start)) return undefined;
      if (toNumber(v) < toNumber(start)) return 'The pool ends before it starts.';
      if (toNumber(v) - toNumber(start) + 1 < 6) return `The pool has ${toNumber(v) - toNumber(start) + 1} addresses; it needs at least six.`;
      if (isCidr(s) && (!inSubnet(start, s) || !inSubnet(v, s))) return `The pool isn't inside the management subnet ${s}.`;
      const clash = [...nodeIps(d), String(mgmt(d).gateway ?? '')].filter(isIpv4).find((ip) => toNumber(ip) >= toNumber(start) && toNumber(ip) <= toNumber(v));
      return clash ? `The pool includes ${clash}, a machine or gateway address.` : undefined;
    },
  },
  { id: 'networking.ntp_servers', path: 'networking.ntp_servers', step, group: 'Time', label: 'Time servers', help: 'Host names or addresses. Every machine syncs to them; with Active Directory, usually the domain controllers.', owner: 'network', kind: 'list', requiredWhen: () => false },

  {
    id: 'networking.intents',
    path: 'networking.intents',
    step,
    group: 'Intents',
    label: 'Network ATC intents',
    help: 'Which adapters carry management, compute and storage traffic. Exactly one intent carries management.',
    learnUrl: learn.decision7,
    owner: 'network',
    kind: 'table',
    widget: 'intents',
    check: (v, d) => {
      const intents = Array.isArray(v) ? (v as { name?: string; traffic?: string[]; adapters?: string[] }[]) : [];
      const mgmtCount = intents.filter((i) => i.traffic?.includes('management')).length;
      if (mgmtCount !== 1) return `Exactly one intent carries management traffic; ${mgmtCount} do.`;
      const storage = intents.filter((i) => i.traffic?.includes('storage'));
      if (hasStorageNetwork(d) && storage.length === 0) return 'Storage Spaces Direct on more than one machine needs an intent with storage traffic.';
      if (isSwitchless(d) && storage.some((i) => (i.traffic?.length ?? 0) > 1)) return 'Switchless storage needs storage in its own intent.';
      if (usesSan(d) && !hasStorageNetwork(d) && storage.length > 0) return 'A SAN-only design has no storage intent: storage runs over the SAN.';
      const adapters = intents.flatMap((i) => i.adapters ?? []);
      const dup = adapters.find((a, i) => adapters.indexOf(a) !== i);
      return dup ? `Adapter ${dup} is in more than one intent.` : undefined;
    },
  },

  // Storage networks: Storage Spaces Direct on more than one machine.
  {
    id: 'networking.storage.switchless_links',
    path: 'networking.storage.switchless_links',
    step,
    group: 'Storage network',
    label: 'Links between each pair of machines',
    help: 'Dual links keep a storage path when a cable or port fails.',
    learnUrl: learn.decision5,
    owner: 'network',
    kind: 'choice',
    appliesWhen: (d) => hasStorageNetwork(d) && isSwitchless(d),
    options: [
      { value: 'dual', label: 'Two links (recommended)' },
      { value: 'single', label: 'One link' },
    ],
    recommended: () => ({ value: 'dual', reason: 'A single link means a cable, port or adapter failure interrupts that storage path.' }),
  },
  { id: 'networking.storage.tor_switches', path: 'networking.storage.tor_switches', step, group: 'Storage network', label: 'Top-of-rack switches', owner: 'network', kind: 'select', appliesWhen: (d) => hasStorageNetwork(d) && !isSwitchless(d), requiredWhen: () => false, options: [{ value: 2, label: 'Two' }, { value: 1, label: 'One' }] },
  { id: 'networking.storage.layout', path: 'networking.storage.layout', step, group: 'Storage network', label: 'Do the storage adapters carry anything else?', learnUrl: learn.decision6, owner: 'network', kind: 'select', appliesWhen: hasStorageNetwork, requiredWhen: () => false, options: [{ value: 'dedicated', label: 'No: dedicated storage ports' }, { value: 'converged', label: 'Yes: storage shares ports with compute' }] },
  {
    id: 'networking.storage.auto_ip',
    path: 'networking.storage.auto_ip',
    step,
    group: 'Storage network',
    label: 'Let Network ATC assign the storage addresses?',
    help: 'On by default. Turn it off to give every machine its own address on each storage network.',
    learnUrl: learn.customIp,
    owner: 'network',
    kind: 'boolean',
    appliesWhen: hasStorageNetwork,
    requiredWhen: () => false,
    recommended: () => ({ value: true, reason: 'Network ATC picks addresses that don’t clash.' }),
  },
  {
    id: 'networking.storage.networks',
    path: 'networking.storage.networks',
    step,
    group: 'Storage network',
    label: 'Storage networks',
    help: 'One per storage adapter. Network ATC defaults are VLANs 711 and 712.',
    owner: 'network',
    kind: 'table',
    appliesWhen: hasStorageNetwork,
    columns: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      { key: 'adapter', label: 'Adapter', kind: 'text', required: true },
      { key: 'vlan_id', label: 'VLAN', kind: 'number', required: true },
      { key: 'subnet', label: 'Subnet', kind: 'cidr' },
    ],
    newRow: (_d, i) => ({ name: `StorageNetwork${i + 1}`, adapter: '', vlan_id: 711 + i }),
    suggest: (d) => {
      const adapters = (d.networking?.intents ?? []).filter((i) => i?.traffic?.includes('storage')).flatMap((i) => i?.adapters ?? []);
      return adapters.length ? adapters.map((a, i) => ({ name: `StorageNetwork${i + 1}`, adapter: a, vlan_id: 711 + i })) : undefined;
    },
    check: (v, d) => {
      const nets = Array.isArray(v) ? (v as { name?: string; adapter?: string; subnet?: string }[]) : [];
      const storageAdapters = (d.networking?.intents ?? []).filter((i) => i?.traffic?.includes('storage')).flatMap((i) => i?.adapters ?? []);
      const stray = nets.find((n) => n.adapter && !storageAdapters.includes(n.adapter));
      if (stray) return `${stray.name}: adapter ${stray.adapter} isn’t in an intent with storage traffic.`;
      if (storageAutoIpOff(d) && nets.some((n) => !n.subnet)) return 'Each storage network needs a subnet when automatic storage addresses are off.';
      return undefined;
    },
  },

  // Disaggregated: cluster networks on standalone ports.
  {
    id: 'networking.cluster_networks',
    path: 'networking.cluster_networks',
    step,
    group: 'Cluster networks (SAN)',
    label: 'Cluster networks',
    help: 'A disaggregated cluster carries cluster traffic on two standalone ports, one per fabric.',
    learnUrl: learn.disaggregated,
    owner: 'network',
    kind: 'table',
    appliesWhen: usesSan,
    columns: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      { key: 'adapter', label: 'Adapter', kind: 'text', required: true },
      { key: 'vlan_id', label: 'VLAN', kind: 'number', required: true },
      { key: 'subnet', label: 'Subnet', kind: 'cidr', required: true },
    ],
    newRow: (_d, i) => ({ name: `clusterNetwork-${i === 0 ? 'A' : 'B'}`, adapter: '', vlan_id: 1711 + i, subnet: '' }),
  },

  { id: 'networking.oob.subnet', path: 'networking.oob.subnet', step, group: 'Out-of-band network', label: 'BMC subnet', owner: 'network', kind: 'cidr', requiredWhen: () => false },
  { id: 'networking.oob.gateway', path: 'networking.oob.gateway', step, group: 'Out-of-band network', label: 'BMC gateway', owner: 'network', kind: 'ipv4', requiredWhen: () => false, suggest: (d) => (isCidr(d.networking?.oob?.subnet) ? firstHost(d.networking?.oob?.subnet as string) : undefined) },
  {
    id: 'networking.vlans',
    path: 'networking.vlans',
    step,
    group: 'VLANs',
    label: 'VLANs',
    help: 'Every VLAN in the design, for the switch configuration.',
    owner: 'network',
    kind: 'table',
    requiredWhen: () => false,
    columns: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      { key: 'id', label: 'VLAN ID', kind: 'number', required: true },
      { key: 'subnet', label: 'Subnet', kind: 'cidr' },
      { key: 'purpose', label: 'Purpose', kind: 'text' },
    ],
  },
  {
    id: 'networking.logical_networks',
    path: 'networking.logical_networks',
    step,
    group: 'VM networks',
    label: 'Logical networks for Azure Local VMs',
    help: 'Created after deployment. Avoid 10.244.0.0/16, which the Arc resource bridge reserves.',
    learnUrl: learn.decision8,
    owner: 'network',
    kind: 'table',
    requiredWhen: () => false,
    columns: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      { key: 'vlan_id', label: 'VLAN', kind: 'number' },
      { key: 'address_prefix', label: 'Subnet', kind: 'cidr' },
      { key: 'gateway', label: 'Gateway', kind: 'ipv4' },
    ],
    check: (v) => {
      const bad = (Array.isArray(v) ? v : []).find((l) => isCidr(l?.address_prefix) && range(l.address_prefix).first >= range('10.244.0.0/16').first && range(l.address_prefix).last <= range('10.244.0.0/16').last);
      return bad ? `${bad.name}: ${bad.address_prefix} is in 10.244.0.0/16, which the Arc resource bridge reserves.` : undefined;
    },
  },
];
