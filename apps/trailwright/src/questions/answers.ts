// The schema 5 questions the design screens do not ask, and how their answers reach infrastructure.yml.
//
// The screens ask most of the design through the project model, and src/exports/infrastructureYml.ts maps that model onto
// the schema 5 document. The question catalog (src/questions/catalog) asks every key Trailwright knows of. The questions listed
// here have no field on the screens: each screen shows them under its own fields (components/CatalogQuestions), the answers are
// kept in the project (project.answers, a schema 5 document) and are merged into the export.
//
// The catalog decides what applies, from the whole design: a question that does not apply is not shown, its answer is not
// exported and is not counted as missing (a SAN design gets no Storage Spaces Direct questions, a local identity design no
// Active Directory ones). What the screens already answered always wins over a stored answer.
import type { Draft } from '../infra/types';
import { getAt, isAnswered, setAt, unsetAt } from '../infra/path';
import { catalog } from './catalog';
import { ask } from './engine';
import type { AskedQuestion, Question, StepId } from './types';

// The catalog questions the screens do not ask, by question ID. A test checks that the screens' export never writes them.
export const EXTRA_QUESTION_IDS: readonly string[] = [
  // Site and environment
  'environment.owner',
  'environment.description',
  'site.location',
  'tags',
  // Azure
  'azure.automation_identity.type',
  'azure.automation_identity.name',
  // Machines and hardware
  'nodes.arc_machine_name',
  'nodes.rack',
  'nodes.rack_position',
  'hardware.gpu.enabled',
  'hardware.gpu.model',
  'hardware.bmc.username',
  'hardware.bmc.password',
  'hardware.sbe.package_sha256',
  'hardware.sbe.package_size_bytes',
  'hardware.sbe.node_pull_url',
  'hardware.sbe.bundle_path',
  'hardware.sbe.version',
  'hardware.sbe.family',
  'hardware.sbe.publisher',
  'hardware.sbe.manifest_source',
  'hardware.sbe.manifest_creation_date',
  'hardware.bmc.verify_certificate',
  // Network
  'networking.management.ip_assignment',
  'networking.management.provisioning_network',
  'networking.management.provisioning_dhcp_range.start',
  'networking.management.provisioning_dhcp_range.end',
  'networking.ntp_servers',
  'networking.oob.subnet',
  'networking.oob.gateway',
  'networking.outbound.proxy.bypass',
  // Identity
  'identity.active_directory.netbios_name',
  'identity.active_directory.domain_controllers',
  'identity.active_directory.security_groups',
  'identity.entra.groups',
  // Instance
  'cluster.deployment_mode',
  'deployment.events_directory',
  // Operating system
  'provisioning.iso.image_source',
  'provisioning.simplified.media_share.host_adapter',
  // Operations
  'operations.notifications.emails',
  'operations.disaster_recovery.recovery_vault',
  'operations.disaster_recovery.target_rpo_minutes',
  'operations.disaster_recovery.target_rto_minutes',
  'operations.licensing.azure_hybrid_benefit',
  // Network devices
  'network_devices',
  // Azure foundation
  'landing_zone.resource_groups',
  'landing_zone.networks',
  'landing_zone.virtual_machines',
  'landing_zone.log_analytics.name',
  // CI/CD
  'devops.platform',
  'devops.organization',
  'devops.runner.name',
  'devops.runner.type',
];

export const extraQuestions: Question[] = EXTRA_QUESTION_IDS.map((id) => {
  const q = catalog.find((x) => x.id === id);
  if (!q) throw new Error(`EXTRA_QUESTION_IDS names ${id}, which the catalog does not have`);
  return q;
});

// The screen (src/steps/steps.ts path) each catalog step is asked on.
export const SCREEN_OF_STEP: Record<StepId, string> = {
  scenario: 'deployment',
  site: 'project',
  azure: 'landing-zone',
  machines: 'hardware',
  storage: 'storage',
  network: 'infrastructure',
  outbound: 'connectivity',
  identity: 'identity',
  cluster: 'deployment',
  security: 'security',
  provisioning: 'provisioning',
  disconnected: 'disconnected',
  operations: 'operations',
  'landing-zone': 'landing-zone',
  devops: 'landing-zone',
  devices: 'network-design',
};

export const extraQuestionsForScreen = (screen: string): Question[] => extraQuestions.filter((q) => SCREEN_OF_STEP[q.step] === screen);

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => !!v && typeof v === 'object' && !Array.isArray(v);

// The screens' document with the stored answers filled in where the screens give no value. A list the screens write (nodes)
// keeps its length: an answer for a node that no longer exists is dropped.
export function fillFrom(base: unknown, answers: unknown): unknown {
  if (base === undefined || base === null || (typeof base === 'string' && base.trim() === '')) return answers === undefined ? base : answers;
  if (Array.isArray(base)) {
    if (!Array.isArray(answers)) return base;
    return base.map((item, i) => fillFrom(item, answers[i]));
  }
  if (isObject(base)) {
    if (!isObject(answers)) return base;
    const out: Json = { ...base };
    for (const [k, v] of Object.entries(answers)) out[k] = fillFrom(base[k], v);
    return out;
  }
  return base;
}

// Every place a question's answer can be, one per node for a nodes[] question.
function pathsOf(q: Question, d: Draft): string[] {
  return ask(q, d).map((a) => a.path);
}

// A Key Vault reference, the only form a credential answer may take.
export const KV_REF = /^keyvault:\/\/[A-Za-z0-9-]{3,24}\/[A-Za-z0-9-]{1,127}$/;

// Only the answers to the extra questions, each at its own key: a key a project file carries that no question owns is not exported,
// and a credential that is not a Key Vault reference is dropped. The opt-in markers of the Azure foundation and CI/CD are kept.
function ownedAnswers(base: Draft, answers: Draft): Draft {
  let owned: Draft = {};
  for (const marker of ['landing_zone', 'devops'] as const) if (isObject(answers[marker])) owned = setAt(owned, marker, {});
  const shape = fillFrom(base, answers) as Draft;
  for (const q of extraQuestions) {
    for (const path of pathsOf(q, shape)) {
      const value = getAt(answers, path);
      if (value === undefined || value === null) continue;
      if (q.kind === 'kvref' && !(typeof value === 'string' && KV_REF.test(value.trim()))) continue;
      owned = setAt(owned, path, value);
    }
  }
  return owned;
}

// The stored answers without the ones that do not apply to the design as it is now, plus the values the earlier answers decide.
export function liveAnswers(base: Draft, answers: Draft): Draft {
  let kept = ownedAnswers(base, answers);
  for (const q of extraQuestions) {
    const merged = fillFrom(base, kept) as Draft;
    const applies = q.appliesWhen ? q.appliesWhen(merged) : true;
    if (!applies) {
      for (const path of pathsOf(q, merged).reverse()) if (getAt(kept, path) !== undefined) kept = unsetAt(kept, path);
      continue;
    }
    if (!q.path.includes('[]') && q.fixedWhen) {
      const fixed = q.fixedWhen(merged);
      if (fixed && !isAnswered(getAt(base, q.path))) kept = setAt(kept, q.path, fixed.value);
    }
  }
  return kept;
}

// The document the export writes: the screens' document, then the answers that apply.
export function withAnswers(base: Draft, answers: Draft | undefined): Draft {
  if (!answers || Object.keys(answers).length === 0) return base;
  return fillFrom(base, liveAnswers(base, answers)) as Draft;
}

// The extra questions of a screen as they stand for this design: only the ones that apply.
export function askExtra(screen: string, d: Draft): AskedQuestion[] {
  return extraQuestionsForScreen(screen).flatMap((q) => ask(q, d)).filter((a) => a.applies);
}
