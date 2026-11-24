import type { Project } from './schema';

// What the Azure Local Toolkit's vendor catalog says about each vendor's Solution Builder Extension (SBE) package:
// config/oem/<vendor>.json sbe.requiredByDefault, looked up by the lowercase hardware.vendor (Get-AzlSbeVendorProfile in
// scripts/common/sbe/AzlSbePackage.psm1). true: the package is a manual download, so it is required. false: the vendor's cluster
// downloads the package itself. A vendor that is not listed is unknown to the catalog.
export const SBE_REQUIRED_BY_VENDOR: Readonly<Record<string, boolean>> = { dell: true, hpe: true, dataon: true, lenovo: false };

// The vendor of the machines as infrastructure.yml writes it: the design's vendor, else the vendor of the validated model chosen for
// simplified machine provisioning.
export function hardwareVendorOf(p: Project): string {
  const given = p.hardware.vendor.trim();
  if (given) return given;
  if (p.provisioning.osInstall !== 'simplified') return '';
  const prefix = p.provisioning.hardwareSku.split('-')[0];
  return ({ lenovo: 'Lenovo', hpe: 'HPE', dell: 'Dell' } as Record<string, string>)[prefix] ?? '';
}

// Whether the package is required for this design, the way the toolkit decides it (Get-AzlSbeRequirement): the design's answer when it
// says required or not_applicable; with vendor (the default) the vendor catalog decides.
export type SbeDecision =
  | { state: 'required'; from: 'design' | 'vendor catalog'; vendor: string }
  | { state: 'not_applicable'; from: 'design'; vendor: string }
  | { state: 'vendor_downloads'; from: 'vendor catalog'; vendor: string }
  | { state: 'unknown'; from: 'vendor catalog'; vendor: string };

export function sbeDecision(p: Project): SbeDecision {
  const vendor = hardwareVendorOf(p);
  const requirement = p.hardware.sbe.requirement;
  if (requirement === 'required') return { state: 'required', from: 'design', vendor };
  if (requirement === 'not_applicable') return { state: 'not_applicable', from: 'design', vendor };
  // Only the catalog's own entries count: a vendor named like an object property (constructor) is unknown, as the toolkit finds no file.
  const key = vendor.toLowerCase();
  const known = Object.hasOwn(SBE_REQUIRED_BY_VENDOR, key) ? SBE_REQUIRED_BY_VENDOR[key] : undefined;
  if (known === undefined) return { state: 'unknown', from: 'vendor catalog', vendor };
  return known ? { state: 'required', from: 'vendor catalog', vendor } : { state: 'vendor_downloads', from: 'vendor catalog', vendor };
}

// One sentence for the screen and the handoff document.
export function describeSbeDecision(d: SbeDecision): string {
  switch (d.state) {
    case 'required':
      return d.from === 'design' ? 'required (the design says so)' : `required: ${d.vendor}'s package is a manual download (the automation's vendor catalog)`;
    case 'not_applicable':
      return 'not applicable (the design says so)';
    case 'vendor_downloads':
      return `not required by default: ${d.vendor}'s cluster downloads the package itself (the automation's vendor catalog); the pre-cluster check asks you to confirm it`;
    case 'unknown':
      return d.vendor ? `unknown: the automation's vendor catalog does not list ${d.vendor}` : 'unknown: no hardware vendor is given, so the vendor catalog cannot decide';
  }
}
