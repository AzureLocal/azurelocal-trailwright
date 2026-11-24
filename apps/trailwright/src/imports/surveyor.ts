import { projectSchema } from '../model/schema';
import type { Project } from '../model/schema';

// Import of a Surveyor plan manifest (schemaVersion 1.x): hardware and volumes become nodes and volumes of the design.

export type ImportPatch = {
  nodes: Project['hardware']['nodes'];
  volumes: Project['storage']['volumes'];
  notes?: string;
  name?: string;
  driveLayout?: Project['storage']['driveLayout'];
  // Set only when the Surveyor file says so (newer Surveyor versions plan a rack-aware cluster); undefined leaves the design's topology alone.
  topology?: Project['hardware']['topology'];
};

export type Conflict = { field: string; current: string; incoming: string };

type Resiliency = Project['storage']['volumes'][number]['resiliency'];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

function mapResiliency(input: string): Resiliency | undefined {
  switch (input) {
    case 'two-way-mirror':
      return 'two-way';
    case 'three-way-mirror':
      return 'three-way';
    case 'four-way-mirror':
      return 'four-way';
    case 'nested-two-way':
    case 'nested-two-way-mirror':
      return 'nested-two-way';
    case 'dual-parity':
      return 'parity';
    default:
      return undefined;
  }
}

// The infrastructure.yml (schema 5) resiliency spellings the sizing handoff uses, as the design model spells them.
const HANDOFF_RESILIENCY: Record<string, Resiliency> = { two_way: 'two-way', three_way: 'three-way', four_way: 'four-way', parity: 'parity', nested_two_way: 'nested-two-way' };
const HANDOFF_MEDIA = ['nvme', 'ssd', 'hdd'] as const;

// The Surveyor sizing handoff (kind azurelocal-sizing-handoff, schemaVersion 1.x; Surveyor docs/reference/sizing-handoff.md): the sized
// cluster in the infrastructure.yml vocabulary. Machines, topology, cores, memory and drives per machine and the volumes come in;
// the sizing results go into the notes.
export function parseSizingHandoff(parsed: Record<string, unknown>): { ok: true; patch: ImportPatch } | { ok: false; error: string } {
  const version = parsed.schemaVersion;
  if (typeof version !== 'string' || version.split('.')[0] !== '1') return { ok: false, error: `Sizing handoff schemaVersion ${JSON.stringify(version)} is not 1.x; this Trailwright reads version 1.` };
  const cluster = isRecord(parsed.cluster) ? parsed.cluster : {};
  const hardware = isRecord(parsed.hardware) ? parsed.hardware : undefined;
  if (!hardware) return { ok: false, error: 'Sizing handoff without hardware' };
  const nodeCount = Number(cluster.node_count);
  if (!Number.isInteger(nodeCount) || nodeCount < 1 || nodeCount > 64) return { ok: false, error: `cluster.node_count must be an integer from 1 to 64 (got ${String(cluster.node_count)})` };
  const drives = isRecord(hardware.drives) ? hardware.drives : {};
  const tier = (v: unknown): { media: (typeof HANDOFF_MEDIA)[number]; count: number; sizeTB: number } | undefined => {
    if (!isRecord(v)) return undefined;
    const media = HANDOFF_MEDIA.find((m) => m === v.media);
    const count = Number(v.count);
    const sizeTB = Number(v.size_tb);
    return media && Number.isInteger(count) && count >= 0 && Number.isFinite(sizeTB) && sizeTB >= 0 ? { media, count, sizeTB } : undefined;
  };
  const capacity = tier(drives.capacity);
  const cache = tier(drives.cache);
  const cores = Number(hardware.cpu_cores);
  const memory = Number(hardware.memory_gib);
  const nodes: ImportPatch['nodes'] = Array.from({ length: nodeCount }, (_, i) => ({
    name: `node${i + 1}`,
    ip: '',
    cores: Number.isFinite(cores) ? cores : 0,
    memoryGiB: Number.isFinite(memory) ? memory : 0,
    drives: (capacity?.count ?? 0) + (cache?.count ?? 0),
  }));
  const volumes: ImportPatch['volumes'] = [];
  const storage = isRecord(parsed.storage) ? parsed.storage : {};
  if (Array.isArray(storage.volumes)) {
    for (const v of storage.volumes) {
      if (!isRecord(v)) continue;
      const resiliency = typeof v.resiliency === 'string' ? HANDOFF_RESILIENCY[v.resiliency] : undefined;
      const sizeGiB = Number(v.size_gib);
      if (resiliency && Number.isFinite(sizeGiB)) volumes.push({ name: String(v.name ?? ''), sizeGiB: Math.round(sizeGiB), resiliency });
    }
  }
  const plan = isRecord(parsed.plan) ? parsed.plan : {};
  const planName = typeof plan.name === 'string' && plan.name.trim() ? plan.name.trim() : undefined;
  const sizing = isRecord(parsed.sizing) ? parsed.sizing : {};
  const health = isRecord(sizing.health) ? sizing.health : {};
  const facts: string[] = [];
  if (Number.isFinite(Number(sizing.effective_usable_tb))) facts.push(`effective usable capacity ${String(sizing.effective_usable_tb)} TB`);
  if (Number.isFinite(Number(sizing.utilization_pct))) facts.push(`volumes use ${String(sizing.utilization_pct)}% of it`);
  if (Number(sizing.workload_vcpus) > 0) facts.push(`workloads ${String(sizing.workload_vcpus)} vCPUs and ${String(sizing.workload_memory_gb)} GB memory`);
  if (typeof health.passed === 'boolean') facts.push(health.passed ? 'the sizing health check passed' : `the sizing health check found ${String(health.errors ?? '?')} errors and ${String(health.warnings ?? '?')} warnings`);
  if (cluster.topology === 'rack_aware') facts.push('rack-aware cluster');
  const release = typeof parsed.targetRelease === 'string' ? parsed.targetRelease : undefined;
  const surveyor = typeof parsed.surveyorVersion === 'string' ? parsed.surveyorVersion : undefined;
  const origin = [surveyor ? `Surveyor ${surveyor}` : '', release ? `sized against ${release}` : ''].filter(Boolean).join(', ');
  const notes = `Imported from the Surveyor sizing handoff${planName ? ` "${planName}"` : ''}${origin ? ` (${origin})` : ''}${facts.length ? `: ${facts.join('; ')}.` : '.'}`;
  return {
    ok: true,
    patch: {
      nodes,
      volumes,
      notes,
      ...(planName ? { name: planName } : {}),
      ...(capacity ? { driveLayout: { capacity, cache: cache ?? { media: 'nvme' as const, count: 0, sizeTB: 0 } } } : {}),
      ...(cluster.topology === 'rack_aware' ? { topology: 'rack-aware' as const } : cluster.topology === 'standard' ? { topology: 'standard' as const } : {}),
    },
  };
}

export function parseSurveyorPlan(text: string): { ok: true; patch: ImportPatch } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }
  if (!isRecord(parsed)) return { ok: false, error: 'Invalid JSON: expected an object' };
  if (parsed.kind === 'azurelocal-sizing-handoff') return parseSizingHandoff(parsed);

  // Two files come out of Surveyor: a saved project (kind azurelocal-surveyor-project, numeric schemaVersion 1)
  // and a plan manifest (string schemaVersion 1.x). Both carry the same inputs.
  const schemaVersion = parsed.schemaVersion;
  const isProject = parsed.kind === 'azurelocal-surveyor-project' && schemaVersion === 1;
  const isManifest = typeof schemaVersion === 'string' && schemaVersion.startsWith('1.');
  if (!isProject && !isManifest) {
    return {
      ok: false,
      error: `Not a Surveyor file: expected a sizing handoff (kind azurelocal-sizing-handoff), a saved project (kind azurelocal-surveyor-project, schemaVersion 1) or a plan manifest (schemaVersion 1.x); got schemaVersion ${JSON.stringify(schemaVersion)}.`,
    };
  }
  if (!isRecord(parsed.inputs)) return { ok: false, error: 'Missing inputs' };
  const hardware = parsed.inputs.hardware;
  if (!isRecord(hardware)) return { ok: false, error: 'Missing inputs.hardware' };

  const nodeCount = Number(hardware.nodeCount);
  if (!Number.isInteger(nodeCount) || nodeCount < 1 || nodeCount > 64) {
    return { ok: false, error: `nodeCount must be an integer from 1 to 64 (got ${String(hardware.nodeCount)})` };
  }
  const drives = (Number(hardware.capacityDrivesPerNode) || 0) + (Number(hardware.cacheDrivesPerNode) || 0);
  const nodes: ImportPatch['nodes'] = Array.from({ length: nodeCount }, (_, i) => ({
    name: `node${i + 1}`,
    ip: '',
    cores: Number(hardware.coresPerNode) || 0,
    memoryGiB: Number(hardware.memoryPerNodeGB) || 0,
    drives,
  }));

  // A volume with a resiliency this tool does not know is skipped; the rest are still imported.
  const volumes: ImportPatch['volumes'] = [];
  if (Array.isArray(parsed.inputs.volumes)) {
    for (const v of parsed.inputs.volumes) {
      if (!isRecord(v) || typeof v.resiliency !== 'string') continue;
      const resiliency = mapResiliency(v.resiliency);
      if (resiliency) volumes.push({ name: String(v.name ?? ''), sizeGiB: Math.round(Number(v.plannedSizeTB) * 1024), resiliency });
    }
  }

  // What Surveyor planned that this design has no field for goes into the notes, so nothing is lost.
  const planName = typeof parsed.name === 'string' ? parsed.name : typeof parsed.inputs.planName === 'string' ? parsed.inputs.planName : undefined;
  const facts: string[] = [];
  const capSize = Number(hardware.capacityDriveSizeTB);
  if (Number(hardware.capacityDrivesPerNode) > 0 && capSize > 0) {
    const media = typeof hardware.capacityMediaType === 'string' ? ` (${hardware.capacityMediaType})` : '';
    facts.push(`${String(hardware.capacityDrivesPerNode)} capacity drives per node of ${capSize} TB${media}`);
  }
  if (Number(hardware.cacheDrivesPerNode) > 0) facts.push(`${String(hardware.cacheDrivesPerNode)} cache drives per node of ${String(hardware.cacheDriveSizeTB)} TB`);
  if (isRecord(parsed.inputs.advanced) && Number(parsed.inputs.advanced.infraVolumeSizeTB) > 0) facts.push(`infrastructure volume ${String(parsed.inputs.advanced.infraVolumeSizeTB)} TB`);
  // Newer Surveyor files may describe a rack-aware cluster or a single machine. The field names are read defensively (old files have none of them),
  // and the design's own topology is only changed when the file clearly says rack-aware.
  const advanced = isRecord(parsed.inputs.advanced) ? parsed.inputs.advanced : {};
  const says = (v: unknown, word: RegExp): boolean => v === true || (typeof v === 'string' && word.test(v));
  const rackAware = [hardware.rackAware, hardware.rackAwareEnabled, hardware.topology, hardware.clusterType, hardware.deploymentType, hardware.clusterTopology, advanced.rackAware, parsed.inputs.rackAware].some((v) => says(v, /rack[-_ ]?aware/i));
  const singleNode = nodeCount === 1 || [hardware.singleNode, hardware.deploymentType, hardware.clusterType].some((v) => says(v, /single[-_ ]?(node|machine|server)/i));
  if (rackAware) facts.push('rack-aware cluster');
  if (singleNode) facts.push('single machine');
  const provenance = isRecord(parsed.provenance) && typeof parsed.provenance.notes === 'string' ? parsed.provenance.notes : undefined;
  const appVersion = typeof parsed.appVersion === 'string' ? parsed.appVersion : typeof parsed.surveyorVersion === 'string' ? parsed.surveyorVersion : undefined;
  const summary = `Imported from Surveyor${planName ? ` plan "${planName}"` : ''}${appVersion ? ` (Surveyor ${appVersion})` : ''}${facts.length ? `: ${facts.join('; ')}.` : '.'}`;
  const notes = provenance ? `${provenance}\n${summary}` : summary;
  // Surveyor plans the drives per node: carry them into the drive layout.
  const media = (v: unknown): 'nvme' | 'ssd' | 'hdd' | undefined => (v === 'nvme' || v === 'ssd' || v === 'hdd' ? v : undefined);
  const capMedia = media(hardware.capacityMediaType);
  const driveLayout: ImportPatch['driveLayout'] = capMedia
    ? {
        capacity: { media: capMedia, count: Number(hardware.capacityDrivesPerNode) || 0, sizeTB: Number(hardware.capacityDriveSizeTB) || 0 },
        cache: { media: media(hardware.cacheMediaType) ?? 'nvme', count: Number(hardware.cacheDrivesPerNode) || 0, sizeTB: Number(hardware.cacheDriveSizeTB) || 0 },
      }
    : undefined;
  return { ok: true, patch: { nodes, volumes, notes, ...(planName ? { name: planName } : {}), ...(driveLayout ? { driveLayout } : {}), ...(rackAware ? { topology: 'rack-aware' as const } : {}) } };
}
// Differences that matter, listed only where the design already holds data, so an empty design previews no conflicts.
export function previewConflicts(current: Project, patch: ImportPatch): Conflict[] {
  const conflicts: Conflict[] = [];
  const nodes = current.hardware.nodes;
  if (nodes.length > 0) {
    if (nodes.length !== patch.nodes.length) conflicts.push({ field: 'nodes.count', current: String(nodes.length), incoming: String(patch.nodes.length) });
    const [a, b] = [nodes[0], patch.nodes[0]];
    if (a && b && a.cores !== b.cores) conflicts.push({ field: 'nodes[0].cores', current: String(a.cores), incoming: String(b.cores) });
    if (a && b && a.memoryGiB !== b.memoryGiB) conflicts.push({ field: 'nodes[0].memoryGiB', current: String(a.memoryGiB), incoming: String(b.memoryGiB) });
  }
  if (nodes.length > 0 && patch.topology && patch.topology !== current.hardware.topology) conflicts.push({ field: 'hardware.topology', current: current.hardware.topology, incoming: patch.topology });
  const volumes = current.storage.volumes;
  if (volumes.length > 0 && volumes.length !== patch.volumes.length) {
    conflicts.push({ field: 'volumes.count', current: String(volumes.length), incoming: String(patch.volumes.length) });
  }
  const notes = current.project.notes.trim();
  if (notes && patch.notes !== undefined && notes !== patch.notes.trim()) conflicts.push({ field: 'notes', current: notes, incoming: patch.notes.trim() });
  return conflicts;
}

export function applyPatch(current: Project, patch: ImportPatch): Project {
  const existing = current.project.notes.trim();
  const incoming = patch.notes?.trim();
  const notes = incoming ? (existing ? `${existing}\n${incoming}` : incoming) : current.project.notes;
  return projectSchema.parse({
    ...current,
    hardware: { ...current.hardware, nodes: patch.nodes, ...(patch.topology ? { topology: patch.topology } : {}) },
    storage: { ...current.storage, volumes: patch.volumes, ...(patch.driveLayout ? { driveLayout: patch.driveLayout } : {}) },
    project: { ...current.project, notes },
    // A design still carrying the default name takes the Surveyor plan's name.
    meta: { ...current.meta, name: patch.name && (!current.meta.name || current.meta.name === 'Untitled project') ? patch.name : current.meta.name },
  });
}