// The machines and the hardware they share. Simplified provisioning adds the serial number, BMC and management MAC
// of every machine; rack aware adds the zone; Storage Spaces Direct adds the drives.
import type { Question } from '../types';
import { isRackAware, isSimplified, learn, nodeCount, storageAutoIpOff, usesS2d } from '../when';

const step = 'machines' as const;
const ipv4 = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const mac = /^[0-9A-Fa-f]{2}([:-][0-9A-Fa-f]{2}){5}$/;
const checkIp = (v: unknown) => (typeof v === 'string' && !ipv4.test(v) ? 'An IPv4 address, for example 192.0.2.11.' : undefined);

export const machineQuestions: Question[] = [
  {
    id: 'nodes.name',
    path: 'nodes[].name',
    step,
    group: 'Machines',
    label: 'Name',
    help: 'Host name, up to 15 characters. Also the Arc machine name.',
    owner: 'datacenter',
    kind: 'text',
    check: (v, d, i) => {
      if (typeof v !== 'string') return undefined;
      if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,14}$/.test(v)) return 'Up to 15 letters, digits and hyphens.';
      const names = (d.nodes ?? []).map((n) => n?.name);
      return names.filter((n) => n === v).length > 1 ? `${v} is used by more than one machine.` : i === undefined ? undefined : undefined;
    },
  },
  {
    id: 'nodes.management.ip_address',
    path: 'nodes[].management.ip_address',
    step,
    group: 'Machines',
    label: 'Management address',
    help: 'Static, in the management subnet, outside the infrastructure pool.',
    learnUrl: learn.decision8,
    owner: 'network',
    kind: 'ipv4',
    check: checkIp,
  },
  {
    id: 'nodes.management.mac_address',
    path: 'nodes[].management.mac_address',
    step,
    group: 'Machines',
    label: 'Management adapter MAC',
    help: 'Picks the management adapter on the machine. Simplified provisioning needs it; reserve the management address for this MAC in DHCP.',
    owner: 'datacenter',
    kind: 'mac',
    requiredWhen: isSimplified,
    check: (v) => (typeof v === 'string' && !mac.test(v) ? 'AA:BB:CC:DD:EE:FF or AA-BB-CC-DD-EE-FF.' : undefined),
  },
  { id: 'nodes.serial_number', path: 'nodes[].serial_number', step, group: 'Machines', label: 'Serial number', help: 'The serial number (Dell service tag). Simplified provisioning matches each ownership voucher to its machine by it.', learnUrl: learn.simplified, owner: 'datacenter', kind: 'text', requiredWhen: isSimplified },
  { id: 'nodes.bmc.ip_address', path: 'nodes[].bmc.ip_address', step, group: 'Machines', label: 'BMC address', help: 'iDRAC, iLO or XCC. Simplified provisioning mounts the provisioning image through it.', owner: 'datacenter', kind: 'ipv4', requiredWhen: isSimplified, check: checkIp },
  {
    id: 'nodes.zone',
    path: 'nodes[].zone',
    step,
    group: 'Machines',
    label: 'Zone',
    help: 'The room or rack (local availability zone). Two zones, the same number of machines in each. Put machines of the same zone in the same rack: the deployment doesn’t check it.',
    learnUrl: learn.rackAware,
    owner: 'datacenter',
    kind: 'text',
    appliesWhen: isRackAware,
    suggest: (d, i) => (i === undefined ? undefined : i < nodeCount(d) / 2 ? 'Zone1' : 'Zone2'),
  },
  { id: 'nodes.rack', path: 'nodes[].rack', step, group: 'Machines', label: 'Rack', owner: 'datacenter', kind: 'text', requiredWhen: () => false },
  { id: 'nodes.rack_position', path: 'nodes[].rack_position', step, group: 'Machines', label: 'Rack position', owner: 'datacenter', kind: 'text', requiredWhen: () => false },
  { id: 'nodes.storage_ips', path: 'nodes[].storage_ips', step, group: 'Machines', label: 'Storage addresses', help: 'One per storage network, in order, because automatic storage addresses are off.', learnUrl: learn.customIp, owner: 'network', kind: 'ipv4-list', appliesWhen: storageAutoIpOff },

  // The hardware every machine shares.
  { id: 'hardware.vendor', path: 'hardware.vendor', step, group: 'Hardware', label: 'Vendor', help: 'For example Dell, HPE, Lenovo or DataON. Picks the OEM extension (SBE) and, with simplified provisioning, the BMC handling.', owner: 'datacenter', kind: 'text' },
  { id: 'hardware.model', path: 'hardware.model', step, group: 'Hardware', label: 'Model', help: 'For example AX-760. Must be in the Azure Local catalog; simplified provisioning supports a shorter list of validated hardware.', learnUrl: learn.simplified, owner: 'datacenter', kind: 'text' },
  { id: 'hardware.cpu_cores', path: 'hardware.cpu_cores', step, group: 'Hardware', label: 'Physical cores per machine', owner: 'datacenter', kind: 'number', requiredWhen: () => false },
  { id: 'hardware.memory_gib', path: 'hardware.memory_gib', step, group: 'Hardware', label: 'Memory per machine (GiB)', owner: 'datacenter', kind: 'number', requiredWhen: () => false },
  ...(['capacity', 'cache'] as const).flatMap((tier): Question[] => {
    const applies = tier === 'capacity' ? usesS2d : (d: Parameters<typeof usesS2d>[0]) => usesS2d(d) && nodeCount(d) > 1;
    const what = tier === 'capacity' ? 'Capacity' : 'Cache';
    const help = tier === 'capacity' ? 'Every machine has the same drives; Storage Spaces Direct pools them.' : 'Optional: a faster tier in front of the capacity drives. Leave empty for all-flash with one drive type.';
    return [
      { id: `hardware.drives.${tier}.media`, path: `hardware.drives.${tier}.media`, step, group: 'Drives', label: `${what} drive media`, help, owner: 'datacenter', kind: 'select', appliesWhen: applies, requiredWhen: () => false, options: [{ value: 'nvme', label: 'NVMe' }, { value: 'ssd', label: 'SSD' }, ...(tier === 'capacity' ? [{ value: 'hdd', label: 'HDD' }] : [])] },
      { id: `hardware.drives.${tier}.count`, path: `hardware.drives.${tier}.count`, step, group: 'Drives', label: `${what} drives per machine`, owner: 'datacenter', kind: 'number', appliesWhen: applies, requiredWhen: () => false },
      { id: `hardware.drives.${tier}.size_tb`, path: `hardware.drives.${tier}.size_tb`, step, group: 'Drives', label: `${what} drive size (TB)`, owner: 'datacenter', kind: 'number', appliesWhen: applies, requiredWhen: () => false },
    ];
  }),
  {
    id: 'hardware.network_cards',
    path: 'hardware.network_cards',
    step,
    group: 'Network adapters',
    label: 'Network adapter ports',
    help: 'Every port in every machine, by its name in the OS, and what it carries. The intents use these names.',
    learnUrl: learn.decision6,
    owner: 'datacenter',
    kind: 'table',
    widget: 'ports',
    requiredWhen: () => false,
  },
  { id: 'hardware.gpu.enabled', path: 'hardware.gpu.enabled', step, group: 'Hardware', label: 'GPUs in the machines', owner: 'datacenter', kind: 'boolean', requiredWhen: () => false },
  { id: 'hardware.gpu.model', path: 'hardware.gpu.model', step, group: 'Hardware', label: 'GPU model', owner: 'datacenter', kind: 'text', appliesWhen: (d) => d.hardware?.gpu?.enabled === true, requiredWhen: () => false },

  // What simplified provisioning needs from the hardware.
  { id: 'hardware.bmc.username', path: 'hardware.bmc.username', step, group: 'BMC login', label: 'BMC user name', help: 'The user name, or a keyvault:// reference to the secret holding it. Used for every machine.', owner: 'datacenter', kind: 'text', appliesWhen: isSimplified },
  { id: 'hardware.bmc.password', path: 'hardware.bmc.password', step, group: 'BMC login', label: 'BMC password secret', help: 'keyvault://<vault>/<secret>. Never the password itself.', owner: 'datacenter', kind: 'kvref', appliesWhen: isSimplified },
  { id: 'hardware.sbe.bundle_path', path: 'hardware.sbe.bundle_path', step, group: 'OEM extension (SBE)', label: 'SBE folder', help: 'Folder on the management host with the OEM’s SBE files as downloaded. The machines are prepared with it before Validate.', owner: 'datacenter', kind: 'text', appliesWhen: isSimplified },
  { id: 'hardware.sbe.version', path: 'hardware.sbe.version', step, group: 'OEM extension (SBE)', label: 'SBE version', help: 'The OEM’s SBE version validated with the OS version you pin.', owner: 'datacenter', kind: 'text', requiredWhen: () => false },
];
