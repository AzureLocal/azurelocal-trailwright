import type { Draft } from '../infra/types';

// Who usually has the answer. The readiness view groups what's missing by owner, so the person running the design
// knows whom to ask.
export type Owner = 'architect' | 'datacenter' | 'network' | 'identity' | 'azure' | 'security' | 'operations';

export const ownerLabels: Record<Owner, string> = {
  architect: 'Solution architect',
  datacenter: 'Datacenter and hardware',
  network: 'Network team',
  identity: 'Active Directory and identity',
  azure: 'Azure administrator',
  security: 'Security',
  operations: 'Operations',
};

export type StepId =
  | 'scenario'
  | 'site'
  | 'azure'
  | 'machines'
  | 'storage'
  | 'network'
  | 'outbound'
  | 'identity'
  | 'cluster'
  | 'security'
  | 'provisioning'
  | 'disconnected'
  | 'operations'
  | 'landing-zone'
  | 'devops'
  | 'devices';

export type Kind =
  | 'choice' // one of options, shown as cards
  | 'select' // one of options, shown as a list
  | 'text'
  | 'number'
  | 'boolean'
  | 'ipv4'
  | 'cidr'
  | 'mac'
  | 'guid'
  | 'kvref' // keyvault://<vault>/<secret>
  | 'list' // list of strings, one per line
  | 'ipv4-list'
  | 'table' // list of objects, one row each, with typed columns
  | 'count' // the number of entries in the list at path (adding or removing entries)
  | 'map'; // name=value pairs, one per line, stored as an object

export type Column = {
  key: string;
  label: string;
  kind: Exclude<Kind, 'table' | 'choice'>;
  options?: Option[];
  required?: boolean;
  placeholder?: string;
};

export type OptionValue = string | number | boolean;

export type Option = {
  value: OptionValue;
  label: string;
  description?: string;
  // true when the option can be picked; otherwise the reason it can't, shown next to the option.
  available?: (d: Draft) => true | string;
};

// A recommendation is a value and the reason for it.
export type Recommendation = { value: OptionValue; reason: string };

export type Question = {
  // Stable ID. For a question about each node, path has a [] segment: 'nodes[].serial_number'.
  id: string;
  // Where the answer goes in infrastructure.yml.
  path: string;
  step: StepId;
  // Questions that belong together on a screen.
  group?: string;
  label: string;
  // Why it's asked and what it changes.
  help?: string;
  learnUrl?: string;
  owner: Owner;
  kind: Kind;
  options?: Option[];
  // A purpose-built editor instead of the generic one: ports (cards and ports), intents.
  widget?: 'ports' | 'intents';
  // For kind 'table': the columns of each row, and the row a new entry starts from.
  columns?: Column[];
  newRow?: (d: Draft, index: number) => Record<string, unknown>;
  placeholder?: string;
  // When the question applies at all. Default: always. A question that doesn't apply isn't shown and its answer isn't exported.
  appliesWhen?: (d: Draft) => boolean;
  // When an applicable question must be answered. Default: always.
  requiredWhen?: (d: Draft) => boolean;
  // When the earlier answers leave one valid answer: the value and the reason. The question is shown as decided.
  fixedWhen?: (d: Draft) => Recommendation | undefined;
  recommended?: (d: Draft) => Recommendation | undefined;
  // A value Trailwright can fill in from other answers, offered with one click.
  suggest?: (d: Draft, index?: number) => unknown;
  // Extra check on a given value: a message when it's wrong.
  check?: (value: unknown, d: Draft, index?: number) => string | undefined;
};

// A question asked once per node is expanded into one entry per node.
export type AskedQuestion = {
  question: Question;
  // The concrete path, for example nodes.1.serial_number.
  path: string;
  index?: number;
  value: unknown;
  applies: boolean;
  required: boolean;
  answered: boolean;
  fixed?: Recommendation;
  problem?: string;
};
