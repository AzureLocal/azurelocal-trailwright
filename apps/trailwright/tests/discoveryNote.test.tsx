import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DISCOVERED_ITEMS, DISCOVERY_NOTE, DISCOVERY_SCRIPT } from '../src/components/DiscoveryNote';
import { PortPlanner } from '../src/components/PortPlanner';
import { createExampleProject } from '../src/examples/exampleLab';
import { useProjectStore } from '../src/model/store';
import { catalog } from '../src/questions/catalog';
import { HardwareScreen } from '../src/screens/HardwareScreen';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => useProjectStore.getState().replaceProject(createExampleProject()));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (ui: React.ReactElement) => act(() => root.render(<MemoryRouter>{ui}</MemoryRouter>));

describe('hardware discovery notes', () => {
  it('names the script and says what it collects, in one wording', () => {
    expect(DISCOVERY_NOTE).toBe('can be collected by hardware discovery (Invoke-HardwareDiscovery.ps1)');
    expect(DISCOVERY_SCRIPT).toBe('Invoke-HardwareDiscovery.ps1');
    const keys = DISCOVERED_ITEMS.map((i) => i.key).join(' ');
    for (const key of ['serial_number', 'mac_address', 'speed_gbps', 'hardware.drives', 'hardware.bios']) expect(keys).toContain(key);
  });

  it('shows the banner and a note on every serial number on the hardware screen', () => {
    render(<HardwareScreen />);
    expect(container.querySelector('[data-testid="discovery-banner"]')?.textContent).toContain(DISCOVERY_NOTE);
    const notes = [...container.querySelectorAll('[data-testid="discovery-note"]')];
    expect(notes.length).toBe(createExampleProject().hardware.nodes.length);
    for (const n of notes) expect(n.textContent).toContain(DISCOVERY_NOTE);
  });

  it('shows the banner above the port planner', () => {
    render(<PortPlanner />);
    expect(container.querySelector('[data-testid="discovery-banner"]')?.textContent).toContain('MAC address of every network port');
  });

  it('marks only questions whose value discovery can read', () => {
    const flagged = catalog.filter((q) => q.discovery).map((q) => q.path);
    expect(flagged).toEqual(
      expect.arrayContaining(['nodes[].serial_number', 'nodes[].management.mac_address', 'hardware.model', 'hardware.network_cards', 'hardware.drives.capacity.count']),
    );
    // Values that come from the design, never from hardware.
    for (const path of ['nodes[].management.ip_address', 'nodes[].bmc.ip_address', 'hardware.bmc.password', 'nodes[].arc_machine_name']) {
      expect(catalog.find((q) => q.path === path)?.discovery).toBeFalsy();
    }
  });
});

