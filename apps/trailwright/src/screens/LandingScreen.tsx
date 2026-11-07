import { useState, type FC, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, ExternalLink } from 'lucide-react';
import { version } from '../../package.json';
import { exportKinds } from '../exports';
import { downloadFile } from '../imports/download';
import { ImportPanel } from '../components/ImportPanel';
import { createExampleProject } from '../examples/exampleLab';
import { createEmptyProject } from '../model/defaults';
import { isProjectStarted, lastStep } from '../model/progress';
import { CURRENT_RELEASE } from '../model/release';
import { useProjectStore } from '../model/store';
import type { Project } from '../model/schema';
import { visibleSteps } from '../steps/steps';

// The documentation lives in the repository; the Pages site publishes only the app.
export const REPO_URL = 'https://github.com/Hybrid-Solutions-Cloud/azurelocal-trailwright';
const DOCS_URL = `${REPO_URL}/blob/main/docs`;
const SURVEYOR_APP_URL = 'https://azurelocal.cloud/azurelocal-surveyor/';
const SURVEYOR_REPO_URL = 'https://github.com/AzureLocal/azurelocal-surveyor';

export const docLinks: { href: string; title: string; text: string }[] = [
  { href: `${DOCS_URL}/USER-GUIDE.md`, title: 'User guide', text: 'Getting started, saving and reopening, imports and troubleshooting.' },
  { href: `${DOCS_URL}/USER-GUIDE.md#the-steps`, title: 'The steps and what each decides', text: 'Every step of the guided flow and the questions it asks.' },
  { href: `${DOCS_URL}/RULES.md`, title: 'Validation rules', text: 'Every rule, its severity and its Microsoft Learn source. Generated from the code.' },
  { href: `${DOCS_URL}/USER-GUIDE.md#exporting`, title: 'Exports', text: 'What each export contains and who uses it.' },
  { href: `${DOCS_URL}/INFRASTRUCTURE-YML.md`, title: 'infrastructure.yml field reference', text: 'Every section and field, and where in the design it comes from.' },
  { href: `${DOCS_URL}/ENVIRONMENT-FILE.md`, title: 'Environment file and Terraform variables', text: 'How the design maps to the deploy automation files.' },
  { href: `${DOCS_URL}/AS-BUILT.md`, title: 'As-built compare', text: 'The snapshot format and how drift is reported.' },
];

const linkClass = 'font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500';

const NewTab: FC<{ href: string; className?: string; children: ReactNode }> = ({ href, className = linkClass, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
    {children}
    <ExternalLink className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
);

const steps: { title: string; text: ReactNode }[] = [
  { title: 'Start or bring a plan in', text: 'Start a clean design, open a saved Trailwright project, import an Azure Local Surveyor plan, or load the bundled example.' },
  {
    title: 'Answer the steps in order',
    text: 'From hardware and storage through network, identity and Azure resources to operations. Each answer decides what comes next: a SAN design gets no Storage Spaces Direct questions.',
  },
  { title: 'Clear the findings', text: 'Every choice is checked against the current release. Each finding names the field, its severity and the Microsoft Learn page it comes from; the sidebar counts what is open on each step.' },
  { title: 'Review and export', text: 'Download the files your automation and your teams need, listed below. Later, compare the design with what was built.' },
];

const displayName = (p: Project) => p.meta.name.trim() || 'your design';

// What Trailwright is, where it fits, and the way into a project. The project steps live behind this page.
export const LandingScreen: FC = () => {
  const navigate = useNavigate();
  const project = useProjectStore((s) => s.project);
  const replaceProject = useProjectStore((s) => s.replaceProject);
  const started = isProjectStarted(project);
  const [confirming, setConfirming] = useState<'new' | 'example' | null>(null);
  const [importing, setImporting] = useState(false);

  const remembered = lastStep();
  const shown = visibleSteps(project);
  const resumeAt = shown.find((s) => s.path === remembered) ?? shown[0];
  const saveKind = exportKinds.find((k) => k.id === 'project-json');

  const open = (next: Project) => {
    replaceProject(next);
    setConfirming(null);
    navigate('/project');
  };
  const startNew = () => (started ? setConfirming('new') : open(createEmptyProject('Untitled project')));
  const loadExample = () => (started ? setConfirming('example') : open(createExampleProject()));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-[#0f3057] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <p className="leading-tight">
            <span className="block text-xs uppercase tracking-widest text-blue-200">Azure Local</span>
            <span className="text-xl font-bold">Trailwright</span>
          </p>
          <nav aria-label="Site" className="flex flex-wrap items-center gap-4 text-sm">
            <NewTab href={`${DOCS_URL}/USER-GUIDE.md`} className="text-blue-100 underline-offset-2 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              User guide
            </NewTab>
            <NewTab href={REPO_URL} className="text-blue-100 underline-offset-2 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              Source on GitHub
            </NewTab>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[3fr_2fr] lg:items-start">
          <section aria-labelledby="landing-title" className="space-y-4">
            <h1 id="landing-title" className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Design an Azure Local deployment, then hand it to automation
            </h1>
            <p className="text-lg text-gray-700">
              Trailwright walks the people planning an Azure Local instance through the design questions in order, and records the answers as a design you can save, reopen and export.
            </p>
            <p className="text-gray-700">
              It is for solution architects and the network, identity, Azure, security and operations people who supply the answers. Every rule is checked against the current release and cites Microsoft Learn. It runs in your browser: nothing is sent to a server, nothing is deployed, and no secret is ever stored.
            </p>
            <p className="inline-block rounded-2xl border border-brand-200 bg-brand-50 px-3 py-1 text-sm text-brand-900">
              <span className="font-semibold">Plans against Azure Local 12.{CURRENT_RELEASE}</span>, the newest generally available release
            </p>
          </section>

          <section aria-labelledby="start-title" className="panel space-y-5 shadow-sm">
            <h2 id="start-title" className="text-xl font-semibold text-gray-900">
              Get started
            </h2>

            {started && (
              <div className="space-y-3 rounded-lg border border-brand-200 bg-brand-50 p-4">
                <p className="text-sm text-gray-800">
                  You have a design in progress in this browser: <strong>{displayName(project)}</strong>.
                </p>
                <Link to={`/${resumeAt.path}`} className="action w-full gap-2 sm:w-auto">
                  Continue {displayName(project)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <p className="text-xs text-gray-600">Picks up at {resumeAt.title}.</p>
              </div>
            )}

            {confirming ? (
              <div role="alertdialog" aria-labelledby="replace-title" aria-describedby="replace-text" className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
                <h3 id="replace-title" className="text-sm font-semibold text-gray-900">
                  Replace {displayName(project)}?
                </h3>
                <p id="replace-text" className="text-sm text-gray-800">
                  The browser holds one design at a time. {confirming === 'new' ? 'A new design' : 'The example'} replaces this one. Save a copy first if you want to keep it.
                </p>
                <div className="flex flex-wrap gap-2">
                  {saveKind && (
                    <button type="button" className="action-secondary" onClick={() => downloadFile(saveKind.filename(project), saveKind.mime, saveKind.build(project) as string)}>
                      Save a copy first
                    </button>
                  )}
                  <button type="button" className="action-secondary" onClick={() => open(confirming === 'new' ? createEmptyProject('Untitled project') : createExampleProject())}>
                    {confirming === 'new' ? 'Replace with a new design' : 'Replace with the example'}
                  </button>
                  <button type="button" className="action-secondary" onClick={() => setConfirming(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button type="button" className={started ? 'action-secondary' : 'action'} onClick={startNew}>
                  Start a new design
                </button>
                <button type="button" className="action-secondary" aria-expanded={importing} aria-controls="landing-import" onClick={() => setImporting((v) => !v)}>
                  Open a saved project or Surveyor plan
                </button>
                <button type="button" className="action-secondary" onClick={loadExample}>
                  Explore the example
                </button>
              </div>
            )}

            {importing && (
              <div id="landing-import" className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <ImportPanel onApplied={() => navigate('/project')} />
              </div>
            )}
            <p className="text-xs text-gray-600">Your design autosaves in this browser. Save it as a project file to move it to another machine or share it.</p>
          </section>
        </div>

        <section aria-labelledby="how-title" className="space-y-4">
          <h2 id="how-title" className="text-2xl font-semibold text-gray-900">
            How it works
          </h2>
          <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="panel flex gap-3">
                <span aria-hidden="true" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-sm text-gray-700">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="exports-title" className="panel space-y-3">
          <h2 id="exports-title" className="text-2xl font-semibold text-gray-900">
            What you take away
          </h2>
          <p className="text-sm text-gray-700">
            The exports on the Review step. A few appear only when the design needs them, such as the disconnected operations script. Values a design cannot know are left as placeholders, and credentials are Key Vault references.
          </p>
          <ul aria-label="Exports" className="grid gap-x-6 gap-y-1 text-sm text-gray-800 sm:grid-cols-2 lg:grid-cols-3">
            {exportKinds.map((k) => (
              <li key={k.id} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                {k.label}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="fits-title" className="space-y-4">
          <h2 id="fits-title" className="text-2xl font-semibold text-gray-900">
            Where it fits
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            <li className="panel space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Before: sizing</p>
              <h3 className="font-semibold text-gray-900">Azure Local Surveyor</h3>
              <p className="text-sm text-gray-700">Does it fit? Sizes the workloads and the hardware. Import its project or plan file here to start the design from it.</p>
              <p className="flex flex-wrap gap-x-4 text-sm">
                <NewTab href={SURVEYOR_APP_URL}>Open Surveyor</NewTab>
                <NewTab href={SURVEYOR_REPO_URL}>Surveyor on GitHub</NewTab>
              </p>
            </li>
            <li aria-current="step" className="panel space-y-2 border-brand-500 ring-1 ring-brand-500">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">This tool: design</p>
              <h3 className="font-semibold text-gray-900">Trailwright</h3>
              <p className="text-sm text-gray-700">How is it built? Captures and checks the design, and writes infrastructure.yml in the Azure Local Toolkit registry shape plus the other exports.</p>
            </li>
            <li className="panel space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">After: build</p>
              <h3 className="font-semibold text-gray-900">azurelocal-toolkit and azurelocal-ztp</h3>
              <p className="text-sm text-gray-700">
                Automation for the build and machine provisioning. The exports also fit Microsoft&apos;s deployment templates and your own tools. Once it is built, compare the design with an as-built snapshot, for example from Azure Local Ranger.
              </p>
            </li>
          </ol>
          <p className="text-sm text-gray-700">Each tool also works on its own: you can start a design here without a Surveyor plan.</p>
        </section>

        <section aria-labelledby="docs-title" className="space-y-4">
          <h2 id="docs-title" className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
            <BookOpen className="h-6 w-6 text-brand-600" aria-hidden="true" />
            Documentation
          </h2>
          <ul aria-label="Documentation" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docLinks.map((d) => (
              <li key={d.href} className="panel space-y-1">
                <NewTab href={d.href}>{d.title}</NewTab>
                <p className="text-sm text-gray-700">{d.text}</p>
              </li>
            ))}
            <li className="panel space-y-1">
              <a href="schema/infrastructure.schema.json" className={linkClass}>
                infrastructure.yml JSON Schema
              </a>
              <p className="text-sm text-gray-700">The machine-readable contract for the export, published with this site.</p>
            </li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-4 text-xs text-gray-600 sm:px-6">
          <p>Design record only: Trailwright does not deploy anything.</p>
          <p>
            Trailwright v{version} · MIT licensed · <NewTab href={`${REPO_URL}/blob/main/CHANGELOG.md`}>Changelog</NewTab>
          </p>
        </div>
      </footer>
    </div>
  );
};
