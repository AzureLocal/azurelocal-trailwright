import { useState, type FC } from 'react';
import { useProjectStore } from '../model/store';
import { Field, SelectInput, TextInput } from '../components/Field';
import type { Project } from '../model/schema';
import { CURRENT_RELEASE } from '../model/release';
import { createExampleProject } from '../examples/exampleLab';
import { createEmptyProject } from '../model/defaults';
import { ImportPanel } from '../components/ImportPanel';

// environment.type of infrastructure.yml.
const environmentTypes = [
  { value: '', label: 'Choose the environment type' },
  { value: 'lab', label: 'Lab' },
  { value: 'demo', label: 'Demo' },
  { value: 'poc', label: 'Proof of concept' },
  { value: 'dev', label: 'Development' },
  { value: 'test', label: 'Test' },
  { value: 'stg', label: 'Staging' },
  { value: 'prd', label: 'Production' },
];

export const ProjectScreen: FC = () => {
  const { project, setSection, replaceProject } = useProjectStore();
  const [confirmingExample, setConfirmingExample] = useState(false);

  return (
    <section className="panel space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Project</h1>
      <p className="text-sm text-gray-600">Checks follow the current Azure Local release, 12.{CURRENT_RELEASE} (latest).</p>
      <div className="grid gap-6 md:grid-cols-2">
        <TextInput id="project-name" label="Project name" value={project.meta.name} onChange={(name) => setSection('meta', { ...project.meta, name })} />
        <TextInput id="customer" label="Customer" value={project.project.customer} onChange={(customer) => setSection('project', { ...project.project, customer })} />
        <TextInput id="owner" label="Owner" value={project.project.owner} onChange={(owner) => setSection('project', { ...project.project, owner })} />
        <TextInput id="project-site-name" label="Site name" value={project.project.siteName} hint="The display name of the site the machines are in. infrastructure.yml needs it." onChange={(siteName) => setSection('project', { ...project.project, siteName })} />
        <TextInput id="project-site-code" label="Site code" value={project.project.siteCode} placeholder="RAL" hint="2 to 8 uppercase letters or digits. infrastructure.yml needs it." onChange={(siteCode) => setSection('project', { ...project.project, siteCode: siteCode.toUpperCase() })} />
        <SelectInput id="environment-type" label="Environment type" value={project.project.environmentType} options={environmentTypes} hint="infrastructure.yml needs it." onChange={(v) => setSection('project', { ...project.project, environmentType: v as Project['project']['environmentType'] })} />
        <TextInput id="release-build" label="Release build (optional)" value={project.release.build} placeholder={`12.${CURRENT_RELEASE}.x.y`} hint={`The full build of the release you will deploy, if you know it. Exports carry it as written; Trailwright never guesses it.`} onChange={(build) => setSection('release', { ...project.release, build })} />
        <div className="md:col-span-2">
          <Field label="Notes" htmlFor="notes" hint="Notes are written to the project JSON and the handoff document. Do not type passwords, keys or other secrets here.">
            <textarea
              id="notes"
              value={project.project.notes}
              onChange={(e) => setSection('project', { ...project.project, notes: e.target.value })}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </Field>
        </div>
      </div>
      <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-lg font-medium text-gray-800">Where do you want to start?</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">Start clean</p>
            <p className="text-xs text-gray-600">An empty design with generic defaults.</p>
            <button type="button" className="action-secondary" onClick={() => replaceProject(createEmptyProject('Untitled project'))}>
              Start a clean design
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">Import from Surveyor or a saved project</p>
            <ImportPanel />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">Use the bundled example</p>
            <p className="text-xs text-gray-600">Two nodes, Local Identity with Key Vault, three intents, a cloud witness and direct egress.</p>
            {confirmingExample ? (
              <div className="flex gap-2">
                <button type="button" className="action-secondary" onClick={() => { replaceProject(createExampleProject()); setConfirmingExample(false); }}>
                  Replace my design with the example
                </button>
                <button type="button" className="action-secondary" onClick={() => setConfirmingExample(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" className="action-secondary" onClick={() => setConfirmingExample(true)}>
                Load the example project
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};