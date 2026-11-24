// @vitest-environment jsdom
// The schema 5 questions the screens do not ask: shown under the screens, recorded in the project, written to infrastructure.yml,
// and only when they apply to the design.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CatalogQuestions } from '../src/components/CatalogQuestions';
import { createExampleProject } from '../src/examples/exampleLab';
import { buildInfrastructure, buildInfrastructureYml } from '../src/exports/infrastructureYml';
import { getAt } from '../src/infra/path';
import type { Project } from '../src/model/schema';
import { projectSchema } from '../src/model/schema';
import { useProjectStore } from '../src/model/store';
import { EXTRA_QUESTION_IDS, SCREEN_OF_STEP, extraQuestions, withAnswers } from '../src/questions/answers';
import { catalog } from '../src/questions/catalog';
import { ReviewScreen } from '../src/screens/ReviewScreen';
import { steps } from '../src/steps/steps';
import { exportProjects } from './exportProjects';
import { project } from './helpers';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const schema = JSON.parse(readFileSync(resolve(__dirname, '..', 'src', 'infra', 'infrastructure.schema.json'), 'utf8')) as Record<string, unknown>;
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
const problems = (doc: unknown): string[] => (validate(doc) ? [] : (validate.errors ?? []).filter((e) => e.keyword !== 'if').map((e) => `${e.instancePath || '/'} ${e.message}`));
const withA = (p: Project, answers: Record<string, unknown>): Project => ({ ...p, answers });
const concrete = (path: string, d: unknown): string[] => {
  if (!path.includes('[]')) return [path];
  const [list, rest] = path.split('[]');
  const items = getAt(d, list);
  return Array.isArray(items) ? items.map((_, i) => `${list}.${i}${rest}`) : [];
};

describe('the questions the screens do not ask', () => {
  it('are catalog questions, each with a screen', () => {
    expect(new Set(EXTRA_QUESTION_IDS).size).toBe(EXTRA_QUESTION_IDS.length);
    const screens = new Set(steps.map((s) => s.path));
    for (const q of extraQuestions) {
      expect(catalog).toContain(q);
      expect(screens.has(SCREEN_OF_STEP[q.step]), q.id).toBe(true);
    }
  });

  it.each(exportProjects)('are never written by the screens (%s), so nothing is asked twice', (_label, make) => {
    // Without the answers: a design may carry them (the Azure foundation sample), and those are the questions' own values.
    const doc = buildInfrastructure({ ...make(), answers: {} });
    for (const q of extraQuestions) for (const path of concrete(q.path, doc)) expect(getAt(doc, path), `${q.id} at ${path}`).toBeUndefined();
  });
});

describe('answers reach infrastructure.yml', () => {
  const answers = {
    environment: { owner: 'platform@example.com', description: 'Example site' },
    site: { location: 'Example city' },
    tags: { costcenter: '1234' },
    networking: { ntp_servers: ['time.example.com'], oob: { subnet: '198.51.100.0/24', gateway: '198.51.100.1' } },
    nodes: [{ rack: 'R01', rack_position: 'U10' }, { rack: 'R01', rack_position: 'U12' }],
    operations: { licensing: { azure_hybrid_benefit: true } },
  };

  it('writes each answer at its key, and the file stays valid', () => {
    // The site section needs its code and name (Project screen) once it has any key.
    const base = project({ project: { siteCode: 'iic01', siteName: 'Example site 01' } });
    const doc = buildInfrastructure(withA(base, answers));
    expect(doc.environment?.owner).toBe('platform@example.com');
    expect(doc.site?.location).toBe('Example city');
    expect(doc.tags).toEqual({ costcenter: '1234' });
    expect(doc.networking?.ntp_servers).toEqual(['time.example.com']);
    expect(doc.networking?.oob).toEqual({ subnet: '198.51.100.0/24', gateway: '198.51.100.1' });
    expect(doc.nodes?.map((n) => n?.rack_position)).toEqual(['U10', 'U12']);
    expect(doc.nodes?.[0]?.name).toBe(buildInfrastructure(base).nodes?.[0]?.name);
    expect(doc.operations?.licensing?.azure_hybrid_benefit).toBe(true);
    const before = new Set(problems(buildInfrastructure(base)));
    expect(problems(doc).filter((p) => !before.has(p))).toEqual([]);
  });

  it('what the screens answered wins over a stored answer', () => {
    const base = project();
    const doc = buildInfrastructure(withA(base, { site: { customer: 'other' }, environment: { name: 'other-name' } }));
    expect(doc.environment?.name).toBe(buildInfrastructure(base).environment?.name);
  });

  it('an answer for a machine the design no longer has is dropped', () => {
    const doc = buildInfrastructure(withA(project(), { nodes: [{ rack: 'R1' }, { rack: 'R1' }, { rack: 'R9' }] }));
    expect(doc.nodes).toHaveLength(2);
  });

  it('a saved project keeps its answers, and an older one without them opens', () => {
    const p = withA(project(), answers);
    expect(projectSchema.parse(JSON.parse(JSON.stringify(p))).answers).toEqual(answers);
    const old = JSON.parse(JSON.stringify(project())) as Record<string, unknown>;
    delete old.answers;
    expect(projectSchema.parse(old).answers).toEqual({});
  });
});

describe('only what applies is exported: the questions follow the design', () => {
  it('Active Directory answers are dropped from a local identity design', () => {
    const answers = { identity: { active_directory: { netbios_name: 'EXAMPLE', domain_controllers: ['192.0.2.10'] } } };
    expect(buildInfrastructure(withA(project(), answers)).identity?.active_directory?.netbios_name).toBe('EXAMPLE');
    const local = withA(project({ identity: { mode: 'local-identity-key-vault' } }), answers);
    expect(buildInfrastructure(local).identity?.active_directory).toBeUndefined();
    expect(buildInfrastructureYml(local)).not.toContain('EXAMPLE');
  });

  it('BMC login answers go out only with simplified machine provisioning', () => {
    const answers = { hardware: { bmc: { username: 'bmc-admin', password: 'keyvault://kv-example/bmc' } } };
    expect(buildInfrastructure(withA(project(), answers)).hardware?.bmc).toBeUndefined();
    const simplified = withA(project({ provisioning: { osInstall: 'simplified', hardwareSku: 'dell-ax-750' } }), answers);
    expect(buildInfrastructure(simplified).hardware?.bmc).toEqual({ username: 'bmc-admin', password: 'keyvault://kv-example/bmc' });
  });

  it('the CI/CD answers go out only when CI/CD is part of the design', () => {
    const on = buildInfrastructure(withA(project(), { devops: { platform: 'gitlab', organization: 'example-group' } }));
    expect(on.devops).toMatchObject({ platform: 'gitlab', organization: 'example-group' });
    expect(buildInfrastructure(withA(project(), { devops: {} })).devops).toBeUndefined();
  });

  it('a key no question owns is not exported, and a credential is exported only as a Key Vault reference', () => {
    const simplified = project({ provisioning: { osInstall: 'simplified', hardwareSku: 'dell-ax-750' } });
    const doc = buildInfrastructure(withA(simplified, { unexpected_field: 'x', environment: { owner: 'ops@example.com', secret: 'x' }, hardware: { bmc: { username: 'bmc-admin', password: 'Pa55word!' } } }));
    expect(doc).not.toHaveProperty('unexpected_field');
    expect(doc.environment).not.toHaveProperty('secret');
    expect(doc.environment?.owner).toBe('ops@example.com');
    expect(doc.hardware?.bmc).toEqual({ username: 'bmc-admin' });
    expect(buildInfrastructureYml(withA(simplified, { hardware: { bmc: { password: 'Pa55word!' } } }))).not.toContain('Pa55word!');
  });

  it('withAnswers leaves the document alone when there are no answers', () => {
    const base = buildInfrastructure(project());
    expect(withAnswers(base, {})).toBe(base);
  });
});

describe('the screens show them', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => useProjectStore.getState().replaceProject(createExampleProject()));
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });
  const render = (el: React.ReactElement) => act(() => root.render(<MemoryRouter>{el}</MemoryRouter>));
  const paths = () => [...container.querySelectorAll('[data-testid="catalog-question"]')].map((e) => e.getAttribute('data-path'));
  const type = (input: HTMLInputElement | HTMLTextAreaElement, value: string) =>
    act(() => {
      const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

  it('the project screen asks the environment owner, and the answer goes to the project and the export', () => {
    render(<CatalogQuestions screen="project" />);
    expect(paths()).toContain('environment.owner');
    type(container.querySelector('#q-environment-owner') as HTMLInputElement, 'platform@example.com');
    const p = useProjectStore.getState().project;
    expect(p.answers).toMatchObject({ environment: { owner: 'platform@example.com' } });
    expect(buildInfrastructure(p).environment?.owner).toBe('platform@example.com');
    type(container.querySelector('#q-environment-owner') as HTMLInputElement, '');
    expect(useProjectStore.getState().project.answers).toEqual({});
  });

  it('the hardware screen asks rack and position once per machine', () => {
    render(<CatalogQuestions screen="hardware" />);
    const count = useProjectStore.getState().project.hardware.nodes.length;
    expect(paths().filter((p) => /^nodes\.\d+\.rack$/.test(p ?? ''))).toHaveLength(count);
  });

  it('the identity screen hides the Active Directory questions for local identity', () => {
    act(() => useProjectStore.getState().setSection('identity', { ...useProjectStore.getState().project.identity, mode: 'active-directory' }));
    render(<CatalogQuestions screen="identity" />);
    expect(paths()).toContain('identity.active_directory.netbios_name');
    act(() => useProjectStore.getState().setSection('identity', { ...useProjectStore.getState().project.identity, mode: 'local-identity-key-vault' }));
    expect(paths()).not.toContain('identity.active_directory.netbios_name');
  });

  it('the Azure resources screen turns CI/CD on, and then asks for it', () => {
    render(<CatalogQuestions screen="landing-zone" />);
    expect(paths()).not.toContain('devops.platform');
    const box = [...container.querySelectorAll('input[type="checkbox"]')].find((b) => b.parentElement?.textContent?.includes('CI/CD')) as HTMLInputElement;
    act(() => box.click());
    expect(paths()).toContain('devops.platform');
  });

  it('the review screen lists what is still needed, by who knows it', () => {
    render(<ReviewScreen />);
    expect(container.querySelector('[data-testid="readiness"]')?.textContent).toMatch(/Still needed for infrastructure\.yml/);
  });
});
