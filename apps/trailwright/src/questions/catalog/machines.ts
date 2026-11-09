// The machines and the hardware they share. Simplified provisioning adds the serial number, BMC, management MAC and Arc
// machine name of every machine; rack aware adds the zone; Storage Spaces Direct adds the drives.
import type { Draft } from '../../infra/types';
import type { Question } from '../types';
import { arcMachineName, isRackAware, isSimplified, learn, nodeCount, storageAutoIpOff, usesS2d } from '../when';

const step = 'machines' as const;
const ipv4 = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const mac = /^[0-9A-Fa-f]{2}([:-][0-9A-Fa-f]{2}){5}$/;
const checkIp = (v: unknown) => (typeof v === 'string' && !ipv4.test(v) ? 'An IPv4 address, for example 192.0.2.11.' : undefined);
// The Solution Builder Extension questions: all apply unless the requirement is declared not applicable.
const sbeNotApplicable = (d: Draft) => d.hardware?.sbe?.requirement === 'not_applicable';
const sbeApplies = (d: Draft) => !sbeNotApplicable(d);

export const machineQuestions: Question[] = [
  {
    id: 'nodes.name',
    path: 'nodes[].name',
    step,
    group: 'Machines',
    label: 'Name',
    help: 'Host name, up to 15 characters. Also the Arc machine name, unless simplified provisioning gives it another.',
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
    help: 'In the management subnet, outside the infrastructure pool. How it gets onto the machine is the management IP assignment on the Network step.',
    learnUrl: learn.decision8,
    owner: 'network',
    kind: 'ipv4',
    check: checkIp,
  },
  {
    id: 'nodes.management.mac_address',
    discovery: true,
    path: 'nodes[].management.mac_address',
    step,
    group: 'Machines',
    label: 'Management port MAC',
    help: 'The management port. Provisioning targets the port by this MAC: with a static IP assignment, simplified provisioning sets the management address on it, and node preparation finds the adapter by it. With DHCP, reserve the management address for this MAC. Simplified provisioning needs it in every IP assignment mode.',
    learnUrl: learn.simplified,
    owner: 'datacenter',
    kind: 'mac',
    requiredWhen: isSimplified,
    check: (v, d, i) => {
      if (typeof v !== 'string') return undefined;
      if (!mac.test(v)) return 'AA:BB:CC:DD:EE:FF or AA-BB-CC-DD-EE-FF.';
      const norm = (m: unknown) => (typeof m === 'string' ? m.toUpperCase().replace(/-/g, ':') : undefined);
      const others = (d.nodes ?? []).filter((_, j) => j !== i).map((n) => norm(n?.management?.mac_address));
      return others.includes(norm(v)) ? `${v} is the management MAC of another machine.` : undefined;
    },
  },
  {
    id: 'nodes.arc_machine_name',
    path: 'nodes[].arc_machine_name',
    step,
    group: 'Machines',
    label: 'Arc machine name',
    help: 'The name of the machine’s Arc resource. Leave it empty to use the host name. Simplified provisioning sets it when it claims the machine; without it the service names the machine ROE1-<id>, and an Arc machine can’t be renamed. 1-54 letters, digits, -, _ and ., not ending in a dot.',
    learnUrl: learn.arcMachineName,
    owner: 'azure',
    kind: 'text',
    appliesWhen: isSimplified,
    requiredWhen: () => false,
    suggest: (d, i) => (i === undefined ? undefined : d.nodes?.[i]?.name),
    check: (v, d, i) => {
      if (typeof v !== 'string') return undefined;
      if (!/^[A-Za-z0-9_.-]{1,54}$/.test(v) || v.endsWith('.')) return '1-54 letters, digits, -, _ and ., not ending in a dot.';
      const others = (d.nodes ?? []).map((_, j) => j).filter((j) => j !== i).map((j) => arcMachineName(d, j)?.toLowerCase());
      return others.includes(v.toLowerCase()) ? `${v} is the Arc machine name of another machine.` : undefined;
    },
  },
  { id: 'nodes.serial_number', discovery: true, path: 'nodes[].serial_number', step, group: 'Machines', label: 'Serial number', help: 'The serial number (Dell service tag). Simplified provisioning matches each ownership voucher to its machine by it.', learnUrl: learn.simplified, owner: 'datacenter', kind: 'text', requiredWhen: isSimplified },
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
  { id: 'hardware.model', discovery: true, path: 'hardware.model', step, group: 'Hardware', label: 'Model', help: 'For example AX-760. Must be in the Azure Local catalog; simplified provisioning supports a shorter list of validated hardware.', learnUrl: learn.simplified, owner: 'datacenter', kind: 'text' },
  { id: 'hardware.cpu_cores', discovery: true, path: 'hardware.cpu_cores', step, group: 'Hardware', label: 'Physical cores per machine', owner: 'datacenter', kind: 'number', requiredWhen: () => false },
  { id: 'hardware.memory_gib', discovery: true, path: 'hardware.memory_gib', step, group: 'Hardware', label: 'Memory per machine (GiB)', owner: 'datacenter', kind: 'number', requiredWhen: () => false },
  ...(['capacity', 'cache'] as const).flatMap((tier): Question[] => {
    const applies = tier === 'capacity' ? usesS2d : (d: Parameters<typeof usesS2d>[0]) => usesS2d(d) && nodeCount(d) > 1;
    const what = tier === 'capacity' ? 'Capacity' : 'Cache';
    const help = tier === 'capacity' ? 'Every machine has the same drives; Storage Spaces Direct pools them.' : 'Optional: a faster tier in front of the capacity drives. Leave empty for all-flash with one drive type.';
    return [
      { id: `hardware.drives.${tier}.media`, discovery: true, path: `hardware.drives.${tier}.media`, step, group: 'Drives', label: `${what} drive media`, help, owner: 'datacenter', kind: 'select', appliesWhen: applies, requiredWhen: () => false, options: [{ value: 'nvme', label: 'NVMe' }, { value: 'ssd', label: 'SSD' }, ...(tier === 'capacity' ? [{ value: 'hdd', label: 'HDD' }] : [])] },
      { id: `hardware.drives.${tier}.count`, discovery: true, path: `hardware.drives.${tier}.count`, step, group: 'Drives', label: `${what} drives per machine`, owner: 'datacenter', kind: 'number', appliesWhen: applies, requiredWhen: () => false },
      { id: `hardware.drives.${tier}.size_tb`, discovery: true, path: `hardware.drives.${tier}.size_tb`, step, group: 'Drives', label: `${what} drive size (TB)`, owner: 'datacenter', kind: 'number', appliesWhen: applies, requiredWhen: () => false },
    ];
  }),
  {
    id: 'hardware.network_cards',
    discovery: true,
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
  // The OEM Solution Builder Extension (SBE) package is a requirement: you need it to update the cluster, and the automation reads it
  // from a share and checks it before the cluster is created. Key names are the toolkit master registry's hardware.sbe.*.
  // Installing it during the build (delivery) is optional and off. Vendor downloads differ and are not checked here; Dell AX and MC need a
  // login-gated download.
  {
    id: 'hardware.sbe.requirement',
    path: 'hardware.sbe.requirement',
    step,
    group: 'OEM extension (SBE)',
    label: 'Does the Solution Builder Extension requirement apply?',
    help: 'Download your hardware vendor’s Solution Builder Extension package for your model and the Azure Local version you deploy. It is a requirement: you need it to update the cluster, and the automation reads it from a share and checks it before the cluster is created. Installing it during the build is optional (off by default). Dell AX and MC need a login-gated download from Dell support. Not applicable is for hardware without a Solution Builder Extension, or a cluster that downloads it with the vendor credential.',
    learnUrl: learn.sbe,
    owner: 'datacenter',
    kind: 'select',
    options: [
      { value: 'required', label: 'Required: the package is on a share' },
      { value: 'not_applicable', label: 'Not applicable (give the reason)' },
    ],
    // The registry leaves the key optional (the vendor catalog decides when it is absent), so an older file without it stays complete.
    requiredWhen: () => false,
  },
  {
    id: 'hardware.sbe.not_applicable_reason',
    path: 'hardware.sbe.not_applicable_reason',
    step,
    group: 'OEM extension (SBE)',
    label: 'Why the requirement does not apply',
    help: 'One sentence, for example: no Solution Builder Extension exists for this hardware model.',
    owner: 'datacenter',
    kind: 'text',
    appliesWhen: sbeNotApplicable,
  },
  {
    id: 'hardware.sbe.source_path',
    path: 'hardware.sbe.source_path',
    step,
    group: 'OEM extension (SBE)',
    label: 'Where is the Solution Builder Extension package? (share or folder)',
    help: 'A UNC share or folder, for example \\\\files.example.invalid\\sbe\\vendor, with the three files as the vendor delivers them (SBE_Discovery_<vendor>.xml, SBE_<vendor>_<family>_<version>.xml and the .zip). The automation reads it, read only, and checks it before the cluster is created. No credential, token or query string in the path.',
    learnUrl: learn.sbe,
    owner: 'datacenter',
    kind: 'text',
    appliesWhen: sbeApplies,
    requiredWhen: (d) => d.hardware?.sbe?.requirement === 'required',
    check: (v) => (typeof v === 'string' && /\?|:\/\/[^/]*@|(password|pwd|token|sig)=/i.test(v) ? 'No credential, token or query string in the path: the share or folder only.' : undefined),
  },
  {
    id: 'hardware.sbe.source_username',
    path: 'hardware.sbe.source_username',
    step,
    group: 'OEM extension (SBE)',
    label: 'Account that reads the package share',
    help: 'Only when the account running the automation cannot read it, for example DOMAIN\\svc-sbe-read. Read access only. Needs the password secret below.',
    owner: 'datacenter',
    kind: 'text',
    appliesWhen: sbeApplies,
    requiredWhen: () => false,
  },
  {
    id: 'hardware.sbe.source_password',
    path: 'hardware.sbe.source_password',
    step,
    group: 'OEM extension (SBE)',
    label: 'Password secret of that account',
    help: 'keyvault://<vault>/<secret>. Never the password itself.',
    owner: 'datacenter',
    kind: 'kvref',
    appliesWhen: (d) => sbeApplies(d) && !!d.hardware?.sbe?.source_username,
    requiredWhen: () => true,
  },
  {
    id: 'hardware.sbe.package_sha256',
    path: 'hardware.sbe.package_sha256',
    step,
    group: 'OEM extension (SBE)',
    label: 'SHA-256 of the package .zip (optional)',
    help: 'As the vendor publishes it, 64 hexadecimal characters. Without it the check uses the hash in the package’s own manifest.',
    owner: 'datacenter',
    kind: 'text',
    appliesWhen: sbeApplies,
    requiredWhen: () => false,
    check: (v) => (typeof v === 'string' && v !== '' && !/^[A-Fa-f0-9]{64}$/.test(v) ? '64 hexadecimal characters.' : undefined),
  },
  {
    id: 'hardware.sbe.package_size_bytes',
    path: 'hardware.sbe.package_size_bytes',
    step,
    group: 'OEM extension (SBE)',
    label: 'Size of the package .zip in bytes (optional)',
    owner: 'datacenter',
    kind: 'number',
    appliesWhen: sbeApplies,
    requiredWhen: () => false,
  },
  {
    id: 'hardware.sbe.delivery',
    path: 'hardware.sbe.delivery',
    step,
    group: 'OEM extension (SBE)',
    label: 'Install it during the build (side-load)?',
    help: 'Optional, and off by default. The package is checked before the cluster is created either way, and you still need it for the first update.',
    learnUrl: learn.sbe,
    owner: 'datacenter',
    kind: 'select',
    options: [
      { value: 'skip', label: 'No (default)' },
      { value: 'winrm_copy', label: 'Yes: copy it to the machines over WinRM' },
      { value: 'node_pull', label: 'Yes: each machine pulls it from a read-only location' },
    ],
    appliesWhen: sbeApplies,
    recommended: () => ({ value: 'skip', reason: 'Installing the package during the build is optional; the cluster can take it with the first update.' }),
    requiredWhen: () => false,
  },
  {
    id: 'hardware.sbe.node_pull_url',
    path: 'hardware.sbe.node_pull_url',
    step,
    group: 'OEM extension (SBE)',
    label: 'Folder the machines pull the package from',
    help: 'An address the machines can reach: https://host/sbe/vendor or a UNC folder. Read only, and no credential in the address.',
    owner: 'datacenter',
    kind: 'text',
    appliesWhen: (d) => sbeApplies(d) && d.hardware?.sbe?.delivery === 'node_pull',
  },
  { id: 'hardware.sbe.bundle_path', path: 'hardware.sbe.bundle_path', step, group: 'OEM extension (SBE)', label: 'SBE folder', help: 'Optional. Folder on the management host with the OEM’s Solution Builder Extension files as downloaded, used to prepare the machines before Validate. It means the same as the package location above, which is the one read when both are set. Without an SBE the machines keep the OEM drivers the OS already has.', owner: 'datacenter', kind: 'text', appliesWhen: isSimplified },
  { id: 'hardware.sbe.version', path: 'hardware.sbe.version', step, group: 'OEM extension (SBE)', label: 'SBE version', help: 'The OEM’s SBE version validated with the OS version you pin.', owner: 'datacenter', kind: 'text', requiredWhen: () => false },
];
