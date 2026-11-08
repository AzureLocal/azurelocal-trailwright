import type { FC } from 'react';

// Hardware discovery (the toolkit's Invoke-HardwareDiscovery.ps1) reads a Dell iDRAC over Redfish, read only, and can
// supply many of the values Trailwright asks for. The note is the same everywhere so the wording never drifts.
export const DISCOVERY_SCRIPT = 'Invoke-HardwareDiscovery.ps1';
export const DISCOVERY_NOTE = `can be collected by hardware discovery (${DISCOVERY_SCRIPT})`;

// What hardware discovery reads today, by the infrastructure.yml key it fills or informs. Dell iDRAC only in this phase;
// other BMCs (HPE iLO, Lenovo XCC) are planned.
export const DISCOVERED_ITEMS: readonly { item: string; key: string }[] = [
  { item: 'Serial number (Dell service tag)', key: 'nodes[].serial_number' },
  { item: 'MAC address of every network port, with the slot and a suggested name', key: 'nodes[].network_adapters[].mac_address' },
  { item: 'Which port is the management port (a suggestion you confirm)', key: 'nodes[].network_adapters[].roles' },
  { item: 'Network adapter model, link state and speed', key: 'nodes[].network_adapters[].model, speed_gbps' },
  { item: 'Server model, BIOS version, firmware versions', key: 'hardware.model' },
  { item: 'Processors and memory', key: 'hardware.cpu_cores, hardware.memory_gib' },
  { item: 'Drives, controllers and the BOSS card (and whether its virtual disk exists)', key: 'hardware.drives' },
  { item: 'BIOS and iDRAC settings (as they are now)', key: 'hardware.bios' },
] as const;

type Props = { what: string; className?: string };

// A visible, one-line note for a field or a group: "<what> can be collected by hardware discovery (Invoke-HardwareDiscovery.ps1)".
export const DiscoveryNote: FC<Props> = ({ what, className }) => (
  <p className={className ?? 'text-xs text-blue-800'} data-testid="discovery-note">
    {what} {DISCOVERY_NOTE}. Dell iDRAC only in this phase.
  </p>
);

// A banner for a screen: the whole list of what discovery can collect.
export const DiscoveryBanner: FC = () => (
  <aside className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900" data-testid="discovery-banner">
    <p className="font-medium">Some of these values {DISCOVERY_NOTE}.</p>
    <p className="mt-1">
      It reads each machine&apos;s Dell iDRAC over Redfish (read only) and can write the serial numbers and port MACs into infrastructure.yml (with -UpdateInfrastructure, after a backup and a confirmation). Other BMCs are planned. It can collect:
    </p>
    <ul className="mt-1 list-disc pl-5">
      {DISCOVERED_ITEMS.map((i) => (
        <li key={i.key}>
          {i.item} <span className="text-blue-700">({i.key})</span>
        </li>
      ))}
    </ul>
    <p className="mt-1">Roles, IP addresses and VLANs cannot be read from hardware: they come from your design.</p>
  </aside>
);
