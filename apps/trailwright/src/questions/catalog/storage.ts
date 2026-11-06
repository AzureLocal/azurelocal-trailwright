// Volumes for Storage Spaces Direct, LUNs for a SAN. A SAN design never sees the S2D questions and the reverse.
import type { Draft } from '../../infra/types';
import type { Question } from '../types';
import { isRackAware, learn, nodeCount, usesS2d, usesSan } from '../when';

const step = 'storage' as const;

// The resiliency a volume can use, from the machine count and topology (Storage Spaces Direct).
export function allowedResiliency(d: Draft): string[] {
  const n = nodeCount(d);
  if (isRackAware(d)) return n === 2 ? ['two_way'] : ['two_way', 'four_way'];
  if (n <= 1) return ['two_way'];
  if (n === 2) return ['two_way', 'nested_two_way'];
  if (n === 3) return ['two_way', 'three_way'];
  return ['two_way', 'three_way', 'parity'];
}

const resiliencyLabels: Record<string, string> = { two_way: 'Two-way mirror', three_way: 'Three-way mirror', four_way: 'Four-way mirror', parity: 'Dual parity', nested_two_way: 'Nested two-way mirror' };

export const storageQuestions: Question[] = [
  {
    id: 'storage.configuration_mode',
    path: 'storage.configuration_mode',
    step,
    group: 'Volumes the deployment creates',
    label: 'Which volumes does the deployment create?',
    help: 'Express creates the infrastructure volume and a workload volume per machine. Infrastructure only leaves the workload volumes for later.',
    learnUrl: learn.arm,
    owner: 'architect',
    kind: 'select',
    appliesWhen: usesS2d,
    requiredWhen: () => false,
    options: [
      { value: 'express', label: 'Infrastructure and workload volumes (recommended)' },
      { value: 'infra_only', label: 'Infrastructure volume only' },
      { value: 'keep_storage', label: 'Keep the existing data drives', available: (d: Draft) => (nodeCount(d) === 1 ? true : 'Only for a single machine that already has a storage pool.') },
    ],
    recommended: () => ({ value: 'express', reason: 'The deployment creates volumes sized to the pool.' }),
  },
  {
    id: 'storage.volumes',
    path: 'storage.volumes',
    step,
    group: 'Storage Spaces Direct volumes',
    label: 'Workload volumes',
    help: 'Volumes to create after deployment, beyond what the deployment creates.',
    learnUrl: learn.planVolumes,
    owner: 'architect',
    kind: 'table',
    appliesWhen: usesS2d,
    requiredWhen: () => false,
    columns: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      { key: 'size_gib', label: 'Size (GiB)', kind: 'number', required: true },
      { key: 'resiliency', label: 'Resiliency', kind: 'select', options: Object.entries(resiliencyLabels).map(([value, label]) => ({ value, label })) },
    ],
    newRow: (d, i) => ({ name: `volume${i + 1}`, size_gib: 1024, resiliency: allowedResiliency(d).includes('three_way') ? 'three_way' : 'two_way' }),
    check: (value, d) => {
      const allowed = allowedResiliency(d);
      const bad = (Array.isArray(value) ? value : []).filter((v) => v && typeof v === 'object' && 'resiliency' in v && v.resiliency && !allowed.includes(String(v.resiliency)));
      return bad.length ? `With this design, volumes can be ${allowed.map((a) => resiliencyLabels[a].toLowerCase()).join(' or ')}.` : undefined;
    },
  },
  {
    id: 'storage.san.type',
    path: 'storage.san.type',
    step,
    group: 'SAN',
    label: 'How do the machines reach the SAN?',
    learnUrl: learn.disaggregated,
    owner: 'architect',
    kind: 'choice',
    appliesWhen: usesSan,
    options: [
      { value: 'fibre_channel', label: 'Fibre Channel', description: 'Dual-port HBAs to fabrics A and B.' },
      { value: 'iscsi', label: 'iSCSI', description: 'Over Ethernet ports dedicated to iSCSI.' },
    ],
  },
  { id: 'storage.san.infra_volume_lun_id', path: 'storage.san.infra_volume_lun_id', step, group: 'SAN', label: 'Infrastructure volume LUN ID', help: 'The LUN the deployment uses for the infrastructure volume, at least 250 GB. From the storage team.', owner: 'architect', kind: 'text', appliesWhen: usesSan },
  { id: 'storage.san.performance_history_lun_id', path: 'storage.san.performance_history_lun_id', step, group: 'SAN', label: 'Performance history LUN ID', help: 'At least 20 GB.', owner: 'architect', kind: 'text', appliesWhen: usesSan },
  {
    id: 'storage.san.luns',
    path: 'storage.san.luns',
    step,
    group: 'SAN',
    label: 'Workload LUNs',
    owner: 'architect',
    kind: 'table',
    appliesWhen: usesSan,
    requiredWhen: () => false,
    columns: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      { key: 'size_gib', label: 'Size (GiB)', kind: 'number', required: true },
      { key: 'lun_id', label: 'LUN ID', kind: 'text' },
    ],
    newRow: (_d, i) => ({ name: `lun${i + 1}`, size_gib: 1024 }),
  },
];
