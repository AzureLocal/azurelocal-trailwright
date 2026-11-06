// Decides, from the answers so far, which questions apply, which are required, which are decided for the user, and
// what is still missing. The screens, the readiness view and the exports all use this, so they never disagree.
import type { Draft } from '../infra/types';
import { getAt, isAnswered, setAt, unsetAt } from '../infra/path';
import { catalog } from './catalog';
import type { AskedQuestion, Owner, Question, StepId } from './types';

function expand(q: Question, d: Draft): { path: string; index?: number }[] {
  if (!q.path.includes('[]')) return [{ path: q.path }];
  const [list, rest] = q.path.split('[]');
  const items = getAt(d, list);
  const count = Array.isArray(items) ? items.length : 0;
  return Array.from({ length: count }, (_, i) => ({ path: `${list}.${i}${rest}`, index: i }));
}

export function ask(q: Question, d: Draft): AskedQuestion[] {
  const applies = q.appliesWhen ? q.appliesWhen(d) : true;
  const fixed = applies && q.fixedWhen ? q.fixedWhen(d) : undefined;
  return expand(q, d).map(({ path, index }) => {
    const value = getAt(d, path);
    const answered = isAnswered(value);
    const required = applies && !fixed && (q.requiredWhen ? q.requiredWhen(d) : true);
    let problem: string | undefined;
    if (applies && answered && q.check) problem = q.check(value, d, index);
    if (applies && answered && q.options && q.kind !== 'list') {
      const option = q.options.find((o) => o.value === value);
      if (!option) problem = `"${String(value)}" isn't one of the choices.`;
      else if (option.available) {
        const why = option.available(d);
        if (why !== true) problem = `${option.label}: ${why}`;
      }
    }
    return { question: q, path, index, value, applies, required, answered, fixed, problem };
  });
}

export function askAll(d: Draft, questions: Question[] = catalog): AskedQuestion[] {
  return questions.flatMap((q) => ask(q, d));
}

export type StepStatus = { step: StepId; applies: boolean; required: number; answered: number; missing: AskedQuestion[]; problems: AskedQuestion[] };

export function stepStatus(d: Draft, step: StepId): StepStatus {
  const asked = askAll(d, catalog.filter((q) => q.step === step));
  const live = asked.filter((a) => a.applies);
  const required = live.filter((a) => a.required);
  return {
    step,
    applies: live.length > 0,
    required: required.length,
    answered: required.filter((a) => a.answered).length,
    missing: required.filter((a) => !a.answered),
    problems: live.filter((a) => a.problem),
  };
}

// What's still needed, grouped by who usually knows it.
export function missingByOwner(d: Draft): Record<Owner, AskedQuestion[]> {
  const out = { architect: [], datacenter: [], network: [], identity: [], azure: [], security: [], operations: [] } as Record<Owner, AskedQuestion[]>;
  for (const a of askAll(d)) if (a.applies && a.required && !a.answered) out[a.question.owner].push(a);
  return out;
}

// Applies every decided value, so the document always holds what the scenario leaves no choice about.
export function applyFixed(d: Draft): Draft {
  let next = d;
  for (const q of catalog) {
    if (q.path.includes('[]')) continue;
    const applies = q.appliesWhen ? q.appliesWhen(next) : true;
    const fixed = applies && q.fixedWhen ? q.fixedWhen(next) : undefined;
    if (fixed && getAt(next, q.path) !== fixed.value) next = setAt(next, q.path, fixed.value);
  }
  return next;
}

// The document to export: answers to questions that don't apply are left out, so a SAN design has no S2D volumes
// and a local identity design has no Active Directory section. Keys no question owns are kept as they are.
export function prune(d: Draft): Draft {
  let next = applyFixed(d);
  for (const q of catalog) {
    if (q.appliesWhen && !q.appliesWhen(next)) {
      for (const { path } of expand(q, next).reverse()) if (getAt(next, path) !== undefined) next = unsetAt(next, path);
    }
  }
  return next;
}
