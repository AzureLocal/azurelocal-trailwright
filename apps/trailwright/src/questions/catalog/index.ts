// Every question Trailwright asks, in the order it asks them.
import type { Question, StepId } from '../types';
import { scenarioQuestions } from './scenario';
import { siteQuestions } from './site';
import { machineQuestions } from './machines';
import { storageQuestions } from './storage';
import { networkQuestions } from './network';
import { identityQuestions } from './identity';
import { clusterQuestions } from './cluster';
import { operationsQuestions } from './operations';

export const catalog: Question[] = [
  ...scenarioQuestions,
  ...siteQuestions,
  ...machineQuestions,
  ...storageQuestions,
  ...networkQuestions,
  ...identityQuestions,
  ...clusterQuestions,
  ...operationsQuestions,
];

// The steps of the guided flow, in order, with their titles. A step shows only when one of its questions applies.
export const stepOrder: { id: StepId; title: string; optional?: boolean }[] = [
  { id: 'scenario', title: 'Design decisions' },
  { id: 'site', title: 'Site and environment' },
  { id: 'azure', title: 'Azure' },
  { id: 'machines', title: 'Machines and hardware' },
  { id: 'storage', title: 'Storage' },
  { id: 'network', title: 'Network' },
  { id: 'outbound', title: 'Outbound connectivity' },
  { id: 'identity', title: 'Identity' },
  { id: 'cluster', title: 'Instance' },
  { id: 'provisioning', title: 'Operating system' },
  { id: 'security', title: 'Security' },
  { id: 'disconnected', title: 'Disconnected operations' },
  { id: 'operations', title: 'Operations' },
  { id: 'devices', title: 'Network devices' },
  { id: 'landing-zone', title: 'Azure foundation', optional: true },
  { id: 'devops', title: 'CI/CD', optional: true },
];

export const questionById = (id: string): Question | undefined => catalog.find((q) => q.id === id);
