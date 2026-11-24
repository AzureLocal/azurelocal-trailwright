import { useState, type FC } from 'react';
import { ExternalLink } from 'lucide-react';
import { buildInfrastructure } from '../exports/infrastructureYml';
import { getAt, setAt, unsetAt } from '../infra/path';
import type { Draft } from '../infra/types';
import { useProjectStore } from '../model/store';
import { KV_REF, askExtra, extraQuestionsForScreen, withAnswers } from '../questions/answers';
import { ownerLabels, type AskedQuestion, type Column, type OptionValue } from '../questions/types';
import { DISCOVERY_NOTE } from './DiscoveryNote';

// The schema 5 questions a screen's own fields do not ask (src/questions/answers.ts), under those fields. Only the ones that apply
// to the design are shown; the answers go to infrastructure.yml as typed.

const lines = (v: unknown): string => (Array.isArray(v) ? v.join('\n') : typeof v === 'string' ? v : '');
const splitLines = (s: string): string[] => s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const mapText = (v: unknown): string => (v && typeof v === 'object' && !Array.isArray(v) ? Object.entries(v as Record<string, unknown>).map(([k, x]) => `${k}=${String(x)}`).join('\n') : '');
const parseMap = (s: string): Record<string, string> | undefined => {
  const entries = splitLines(s)
    .map((l) => l.split('='))
    .filter((p) => p[0].trim())
    .map(([k, ...rest]) => [k.trim(), rest.join('=').trim()] as const);
  return entries.length ? Object.fromEntries(entries) : undefined;
};
const idOf = (path: string): string => `q-${path.replace(/[^A-Za-z0-9]+/g, '-')}`;
const show = (v: OptionValue | unknown): string => (typeof v === 'boolean' ? (v ? 'yes' : 'no') : String(v));

// One value of a kind that is not a table: text, number, choice, list, map, yes or no.
function toValue(kind: Column['kind'] | AskedQuestion['question']['kind'], raw: string, options?: { value: OptionValue }[]): unknown {
  if (options) return options.find((o) => String(o.value) === raw)?.value ?? (raw === '' ? undefined : raw);
  if (kind === 'number') return raw.trim() === '' || Number.isNaN(Number(raw)) ? undefined : Number(raw);
  if (kind === 'list' || kind === 'ipv4-list') return splitLines(raw.replace(/,/g, '\n'));
  if (kind === 'map') return parseMap(raw);
  return raw;
}

const Cell: FC<{ id: string; column: Column; value: unknown; onChange: (v: unknown) => void }> = ({ id, column, value, onChange }) =>
  column.options ? (
    <select id={id} aria-label={column.label} className="input" value={value === undefined ? '' : String(value)} onChange={(e) => onChange(toValue(column.kind, e.target.value, column.options))}>
      <option value="">-</option>
      {column.options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  ) : column.kind === 'boolean' ? (
    <input id={id} aria-label={column.label} type="checkbox" className="h-4 w-4" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
  ) : (
    <input
      id={id}
      aria-label={column.label}
      className="input"
      type={column.kind === 'number' ? 'number' : 'text'}
      placeholder={column.placeholder}
      value={column.kind === 'list' || column.kind === 'ipv4-list' ? lines(value).replace(/\n/g, ', ') : value === undefined || value === null ? '' : String(value)}
      onChange={(e) => onChange(toValue(column.kind, e.target.value))}
    />
  );

const Answer: FC<{ asked: AskedQuestion; draft: Draft; stored: Draft; set: (path: string, value: unknown) => void }> = ({ asked, draft, stored, set }) => {
  const { question: q, path, index } = asked;
  // What was typed, even when the export leaves it out (a credential that is not yet a Key Vault reference).
  const value = getAt(stored, path) ?? asked.value;
  const id = idOf(path);
  const suggestion = q.suggest?.(draft, index);
  const recommended = q.recommended?.(draft);
  const label = `${q.label}${index !== undefined ? ` (${String(getAt(draft, `nodes.${index}.name`) || `machine ${index + 1}`)})` : ''}`;
  let input;
  if (asked.fixed) {
    input = (
      <p id={id} className="text-sm text-gray-800" data-testid="decided">
        {show(asked.fixed.value)}: {asked.fixed.reason}
      </p>
    );
  } else if (q.kind === 'table') {
    const rows = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    const columns = q.columns ?? [];
    const setRows = (next: Record<string, unknown>[]) => set(path, next.length ? next : undefined);
    input = (
      <div className="space-y-2" id={id}>
        {rows.map((row, r) => (
          <div key={r} className="flex flex-wrap items-end gap-2 rounded-md border border-gray-200 p-2">
            {columns.map((c) => (
              <label key={c.key} className="flex min-w-32 flex-1 flex-col text-xs text-gray-600">
                {c.label}
                <Cell id={`${id}-${r}-${c.key}`} column={c} value={row[c.key]} onChange={(v) => setRows(rows.map((x, i) => (i === r ? { ...x, [c.key]: v } : x)))} />
              </label>
            ))}
            <button type="button" className="action-secondary" onClick={() => setRows(rows.filter((_, i) => i !== r))}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="action-secondary" onClick={() => setRows([...rows, q.newRow?.(draft, rows.length) ?? {}])}>
          Add {q.label.toLowerCase().replace(/s$/, '')}
        </button>
      </div>
    );
  } else if (q.options) {
    input = (
      <select id={id} className="input" value={value === undefined ? '' : String(value)} onChange={(e) => set(path, toValue(q.kind, e.target.value, q.options))}>
        <option value="">Not answered</option>
        {q.options.map((o) => {
          const why = o.available ? o.available(draft) : true;
          return (
            <option key={String(o.value)} value={String(o.value)} disabled={why !== true}>
              {o.label}
              {why !== true ? ` (${why})` : ''}
            </option>
          );
        })}
      </select>
    );
  } else if (q.kind === 'boolean') {
    input = (
      <select id={id} className="input" value={value === undefined ? '' : String(value)} onChange={(e) => set(path, e.target.value === '' ? undefined : e.target.value === 'true')}>
        <option value="">Not answered</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  } else if (q.kind === 'list' || q.kind === 'ipv4-list' || q.kind === 'map') {
    input = <textarea id={id} className="input min-h-20" placeholder={q.placeholder ?? (q.kind === 'map' ? 'name=value, one per line' : 'One per line')} value={q.kind === 'map' ? mapText(value) : lines(value)} onChange={(e) => set(path, toValue(q.kind, e.target.value))} />;
  } else {
    input = (
      <input
        id={id}
        className="input"
        type={q.kind === 'number' ? 'number' : 'text'}
        placeholder={q.placeholder ?? (q.kind === 'kvref' ? 'keyvault://<vault>/<secret>' : undefined)}
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => set(path, toValue(q.kind, e.target.value))}
      />
    );
  }
  return (
    <div className="flex flex-col gap-1" data-testid="catalog-question" data-path={path}>
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {asked.required && <span className="ml-1 text-amber-700">(needed)</span>}
        <span className="ml-2 text-xs font-normal text-gray-500">{ownerLabels[q.owner]}</span>
      </label>
      {input}
      {q.help && <p className="text-xs text-gray-500">{q.help}</p>}
      {q.discovery && <p className="text-xs text-blue-800">{q.label} {DISCOVERY_NOTE}.</p>}
      {(asked.problem || (q.kind === 'kvref' && typeof value === 'string' && value.trim() !== '' && !KV_REF.test(value.trim()))) && (
        <p role="alert" className="text-xs text-red-700">
          {asked.problem ?? 'Give a Key Vault reference, keyvault://<vault>/<secret>, never the secret itself. Anything else is not exported.'}
        </p>
      )}
      <div className="flex flex-wrap gap-3 text-xs">
        {!asked.fixed && suggestion !== undefined && !asked.answered && (
          <button type="button" className="text-blue-700 underline" onClick={() => set(path, suggestion)}>
            Use {Array.isArray(suggestion) ? 'the suggested values' : show(suggestion)}
          </button>
        )}
        {!asked.fixed && recommended && value !== recommended.value && (
          <button type="button" className="text-blue-700 underline" title={recommended.reason} onClick={() => set(path, recommended.value)}>
            Recommended: {show(recommended.value)}
          </button>
        )}
        {q.learnUrl && (
          <a href={q.learnUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
            Microsoft Learn <ExternalLink className="inline h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
};

// The optional parts a person turns on: the Azure foundation (landing_zone) and CI/CD (devops).
const OPTIONAL: Record<string, { key: 'landing_zone' | 'devops'; label: string }[]> = {
  'landing-zone': [
    { key: 'landing_zone', label: 'Also describe the Azure foundation (resource groups, networks, virtual machines)' },
    { key: 'devops', label: 'Also describe the CI/CD pipelines that run the automation' },
  ],
};

export const CatalogQuestions: FC<{ screen: string }> = ({ screen }) => {
  const project = useProjectStore((s) => s.project);
  const setSection = useProjectStore((s) => s.setSection);
  const [open, setOpen] = useState(true);
  if (extraQuestionsForScreen(screen).length === 0) return null;
  const answers = (project.answers ?? {}) as Draft;
  // The document as the export writes it, so every condition reads the whole design.
  const draft = withAnswers(buildInfrastructure({ ...project, answers: {} }), answers);
  const asked = askExtra(screen, draft);
  const optional = OPTIONAL[screen] ?? [];
  if (asked.length === 0 && optional.length === 0) return null;
  const set = (path: string, value: unknown) => {
    const empty = value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
    setSection('answers', (empty ? unsetAt(answers, path) : setAt(answers, path, value)) as Record<string, unknown>);
  };
  const toggle = (key: 'landing_zone' | 'devops', on: boolean) => setSection('answers', (on ? { ...answers, [key]: answers[key] ?? {} } : unsetAt(answers, key)) as Record<string, unknown>);
  const groups = [...new Set(asked.map((a) => a.question.group ?? 'More'))];
  const missing = asked.filter((a) => a.required && !a.answered).length;
  return (
    <section className="panel mt-6 space-y-4" data-testid="catalog-questions" aria-labelledby={`more-${screen}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`more-${screen}`} className="text-lg font-medium text-gray-800">
          More for infrastructure.yml
        </h2>
        <button type="button" className="text-sm text-blue-700 underline" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Hide' : `Show ${asked.length} questions${missing ? `, ${missing} needed` : ''}`}
        </button>
      </div>
      <p className="text-sm text-gray-600">
        The automation&apos;s file asks for these too. Only what applies to this design is shown, and only that is exported: change an earlier answer and the questions change with it.
      </p>
      {open && (
        <>
          {optional.map((o) => (
            <label key={o.key} className="flex items-center gap-2 text-sm text-gray-800">
              <input type="checkbox" className="h-4 w-4" checked={draft[o.key] !== undefined} disabled={answers[o.key] === undefined && draft[o.key] !== undefined} onChange={(e) => toggle(o.key, e.target.checked)} />
              {o.label}
            </label>
          ))}
          {groups.map((g) => (
            <fieldset key={g} className="space-y-3">
              <legend className="text-sm font-semibold text-gray-700">{g}</legend>
              <div className="grid gap-4 md:grid-cols-2">
                {asked
                  .filter((a) => (a.question.group ?? 'More') === g)
                  .map((a) => (
                    <Answer key={a.path} asked={a} draft={draft} stored={answers} set={set} />
                  ))}
              </div>
            </fieldset>
          ))}
        </>
      )}
    </section>
  );
};
