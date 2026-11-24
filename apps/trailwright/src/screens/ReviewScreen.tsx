import { useState, type FC } from 'react';
import { useProjectStore } from '../model/store';
import { runRules } from '../rules';
import type { Finding } from '../rules/types';
import { exportKinds } from '../exports';
import { downloadFile } from '../imports/download';
import { ImportPanel } from '../components/ImportPanel';
import { DISCOVERY_NOTE } from '../components/DiscoveryNote';
import { buildInfrastructure } from '../exports/infrastructureYml';
import { missingByOwner } from '../questions/engine';
import { ownerLabels, type Owner } from '../questions/types';

const groups: { severity: Finding['severity']; title: string }[] = [
  { severity: 'error', title: 'Errors' },
  { severity: 'warning', title: 'Warnings' },
  { severity: 'info', title: 'Information' },
];

// What infrastructure.yml still needs, from the question catalog over the whole design, grouped by who usually knows it. Questions
// that do not apply to this design are not counted.
const Readiness: FC = () => {
  const { project } = useProjectStore();
  const missing = missingByOwner(buildInfrastructure(project));
  const owners = (Object.keys(missing) as Owner[]).filter((o) => missing[o].length > 0);
  const total = owners.reduce((n, o) => n + missing[o].length, 0);
  const discoverable = owners.reduce((n, o) => n + missing[o].filter((a) => a.question.discovery).length, 0);
  return (
    <div className="space-y-2" data-testid="readiness">
      <h2 className="text-lg font-medium text-gray-800">Still needed for infrastructure.yml</h2>
      {total === 0 ? (
        <p className="text-sm text-gray-700">Nothing: every question that applies to this design is answered.</p>
      ) : (
        <>
          <p className="text-sm text-gray-700">
            {total} answers, by who usually knows them.{discoverable > 0 && ` ${discoverable} of them ${DISCOVERY_NOTE}.`}
          </p>
          <ul className="space-y-1 text-sm text-gray-800">
            {owners.map((o) => (
              <li key={o}>
                <strong>{ownerLabels[o]}</strong> ({missing[o].length}): {missing[o].map((a) => `${a.question.label}${a.index !== undefined ? ` (machine ${a.index + 1})` : ''}`).join(', ')}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export const ReviewScreen: FC = () => {
  const { project } = useProjectStore();
  const [exportError, setExportError] = useState<string | null>(null);
  const findings = runRules(project);
  const count = (severity: Finding['severity']) => findings.filter((f) => f.severity === severity).length;

  const runExport = (kind: (typeof exportKinds)[number]) => {
    setExportError(null);
    try {
      void Promise.resolve(kind.build(project)).then(
        (data) => downloadFile(kind.filename(project), kind.mime, data),
        (e: unknown) => setExportError(`${kind.label}: ${e instanceof Error ? e.message : String(e)}`),
      );
    } catch (e) {
      setExportError(`${kind.label}: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const button = 'action-secondary';

  return (
    <section className="panel space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Review and export</h1>
      <p role="status" className="text-sm text-gray-700">
        {count('error')} errors, {count('warning')} warnings, {count('info')} information
      </p>

      <div className="space-y-4">
        {groups.map(({ severity, title }) => {
          const list = findings.filter((f) => f.severity === severity);
          if (list.length === 0) return null;
          return (
            <div key={severity}>
              <h2 className="mb-2 text-lg font-medium text-gray-800">{title}</h2>
              <ul className="space-y-2">
                {list.map((f) => (
                  <li key={`${f.id}-${f.field}`} className="text-sm text-gray-800">
                    <code className="text-xs">{f.field}</code> {f.message}{' '}
                    <a href={f.learnUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                      Microsoft Learn
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <Readiness />

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-gray-800">Export</h2>
        <div className="flex flex-wrap gap-2">
          {exportKinds.filter((kind) => kind.available?.(project) ?? true).map((kind) => (
            <button key={kind.id} type="button" className={button} onClick={() => runExport(kind)}>
              {kind.label}
            </button>
          ))}
        </div>
        {exportError && <p role="alert" className="text-sm text-red-700">{exportError}</p>}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-gray-800">Import</h2>
        <ImportPanel />
      </div>
    </section>
  );
};