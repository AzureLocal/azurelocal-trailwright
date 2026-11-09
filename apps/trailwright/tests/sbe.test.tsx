// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { SBE_PREREQUISITE } from '../src/components/SbeSection';
import { createExampleProject } from '../src/examples/exampleLab';
import { buildHandoffMarkdown, buildInfrastructureYml, buildProjectJson } from '../src/exports';
import type { Draft } from '../src/infra/types';
import { createEmptyProject } from '../src/model/defaults';
import { projectSchema } from '../src/model/schema';
import { useProjectStore } from '../src/model/store';
import { catalog } from '../src/questions/catalog';
import { ask } from '../src/questions/engine';
import { runRules } from '../src/rules';
import { HardwareScreen } from '../src/screens/HardwareScreen';
import { project } from './helpers';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const sbeOf = (yml: string) => (parse(yml) as { hardware: { sbe: Record<string, unknown> } }).hardware.sbe;
const q = (id: string) => catalog.find((x) => x.id === id)!;
const askedFor = (id: string, d: Draft) => ask(q(id), d)[0];

// The key names are the toolkit master registry's (config/variables/schema/master-registry.yaml, hardware.sbe.*).
const REGISTRY_KEYS = ['requirement', 'not_applicable_reason', 'source_path', 'source_username', 'source_password', 'package_sha256', 'package_size_bytes', 'delivery'];

describe('Solution Builder Extension (SBE): the exports write the registry keys', () => {
  it('a required package on a share: requirement, source_path and delivery skip (off by default)', () => {
    const sbe = sbeOf(buildInfrastructureYml(project()));
    expect(sbe).toEqual({ requirement: 'required', source_path: 'D:/sbe/vendor', delivery: 'skip' });
    for (const key of Object.keys(sbe)) expect(REGISTRY_KEYS).toContain(key);
  });

  it('not applicable writes the reason and no path', () => {
    const p = project({ hardware: { sbe: { requirement: 'not_applicable', notApplicableReason: 'No SBE for this model.', sourcePath: 'D:/ignored' } } });
    expect(sbeOf(buildInfrastructureYml(p))).toEqual({ requirement: 'not_applicable', not_applicable_reason: 'No SBE for this model.', delivery: 'skip' });
  });

  it('the share credential is a Key Vault reference, never a value', () => {
    const p = project({ landingZone: { keyVaultName: 'kv-example' }, hardware: { sbe: { sourceUsername: 'svc-sbe-read', sourcePasswordSecret: 'sbe-share-reader', delivery: 'node_pull' } } });
    const sbe = sbeOf(buildInfrastructureYml(p));
    expect(sbe.source_username).toBe('svc-sbe-read');
    expect(sbe.source_password).toBe('keyvault://kv-example/sbe-share-reader');
    expect(sbe.delivery).toBe('node_pull');
  });

  it('writes no password reference without a vault', () => {
    const p = project({ hardware: { sbe: { sourceUsername: 'svc-sbe-read', sourcePasswordSecret: 'sbe-share-reader' } } });
    expect(sbeOf(buildInfrastructureYml(p)).source_password).toBeUndefined();
  });

  it('the handoff and the project JSON carry the answer', () => {
    const p = project();
    expect(buildHandoffMarkdown(p)).toContain('Solution Builder Extension package: required, available at D:/sbe/vendor');
    expect(buildHandoffMarkdown(p)).toContain('Install it during the build: no (default)');
    expect(JSON.parse(buildProjectJson(p)).hardware.sbe.sourcePath).toBe('D:/sbe/vendor');
  });

  it('an older project file without the block comes in as required, no side-load', () => {
    const old = JSON.parse(buildProjectJson(createEmptyProject('old'))) as { hardware: Record<string, unknown> };
    delete old.hardware.sbe;
    expect(projectSchema.parse(old).hardware.sbe).toMatchObject({ requirement: 'required', delivery: 'skip', sourcePath: '' });
  });
});

describe('Solution Builder Extension (SBE): findings', () => {
  const ids = (change: Parameters<typeof project>[0]) => runRules(project(change)).map((f) => f.id);

  it('a required package with no location is a warning; a location clears it', () => {
    expect(ids({ hardware: { sbe: { sourcePath: '' } } })).toContain('SBE-001');
    expect(ids({})).not.toContain('SBE-001');
  });
  it('not applicable needs a reason, and then asks for no location', () => {
    expect(ids({ hardware: { sbe: { requirement: 'not_applicable', notApplicableReason: '' } } })).toContain('SBE-002');
    expect(ids({ hardware: { sbe: { requirement: 'not_applicable', notApplicableReason: 'No SBE for this model.', sourcePath: '' } } })).toEqual([]);
  });
  it('a credential in the path is an error', () => {
    expect(ids({ hardware: { sbe: { sourcePath: 'https://u:p@files.example.invalid/sbe' } } })).toContain('SBE-003');
  });
  it('a typed password is refused as a secret name', () => {
    const found = runRules(project({ landingZone: { keyVaultName: 'kv-example' }, hardware: { sbe: { sourceUsername: 'svc', sourcePasswordSecret: 'P@ssw0rd!Typed' } } })).filter((f) => f.id === 'SBE-004');
    expect(found[0]?.severity).toBe('error');
  });
});

describe('Solution Builder Extension (SBE): the questionnaire', () => {
  const base: Draft = { hardware: { vendor: 'Contoso' } };

  it('asks every registry key under hardware.sbe', () => {
    const paths = catalog.map((x) => x.path).filter((p) => p.startsWith('hardware.sbe.'));
    for (const key of REGISTRY_KEYS) expect(paths).toContain(`hardware.sbe.${key}`);
  });
  it('asks where the package is, required once the requirement is stated', () => {
    const d: Draft = { hardware: { sbe: { requirement: 'required' } } };
    expect(askedFor('hardware.sbe.source_path', d)).toMatchObject({ applies: true, required: true, answered: false });
    expect(askedFor('hardware.sbe.source_path', { hardware: { sbe: { requirement: 'required', source_path: '\\\\files.example.invalid\\sbe' } } }).answered).toBe(true);
  });
  it('not applicable asks for the reason instead of a location', () => {
    const d: Draft = { hardware: { sbe: { requirement: 'not_applicable' } } };
    expect(askedFor('hardware.sbe.not_applicable_reason', d)).toMatchObject({ applies: true, required: true, answered: false });
    for (const id of ['hardware.sbe.source_path', 'hardware.sbe.source_username', 'hardware.sbe.delivery']) expect(askedFor(id, d).applies, id).toBe(false);
    expect(askedFor('hardware.sbe.not_applicable_reason', base).applies).toBe(false);
  });
  it('side-loading at build time defaults to no', () => {
    expect(q('hardware.sbe.delivery').recommended?.(base)?.value).toBe('skip');
    expect(askedFor('hardware.sbe.delivery', base).required).toBe(false);
    expect(askedFor('hardware.sbe.node_pull_url', base).applies).toBe(false);
    expect(askedFor('hardware.sbe.node_pull_url', { hardware: { sbe: { delivery: 'node_pull' } } }).applies).toBe(true);
  });
  it('the share credential is a Key Vault reference asked only with an account', () => {
    expect(q('hardware.sbe.source_password').kind).toBe('kvref');
    expect(askedFor('hardware.sbe.source_password', base).applies).toBe(false);
    expect(askedFor('hardware.sbe.source_password', { hardware: { sbe: { source_username: 'svc-sbe-read' } } })).toMatchObject({ applies: true, required: true });
  });
  it('refuses a credential in the location', () => {
    expect(askedFor('hardware.sbe.source_path', { hardware: { sbe: { source_path: 'https://files.example.invalid/sbe?sig=abc' } } }).problem).toBeTruthy();
  });
  it('links Microsoft Learn and notes the Dell login-gated download', () => {
    expect(q('hardware.sbe.requirement').learnUrl).toBe('https://learn.microsoft.com/azure/azure-local/update/solution-builder-extension');
    expect(q('hardware.sbe.requirement').help).toMatch(/Dell AX and MC need a login-gated download/);
  });
});

describe('Solution Builder Extension (SBE): the screen and the prerequisites', () => {
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

  it('states the requirement on the hardware screen, and typing a location goes to the project', () => {
    act(() => root.render(<MemoryRouter><HardwareScreen /></MemoryRouter>));
    expect(container.querySelector('[data-testid="sbe-prerequisite"]')?.textContent).toBe(SBE_PREREQUISITE);
    expect(container.textContent).toContain('Dell AX and MC need a login-gated download');
    const input = container.querySelector('#sbe-source-path') as HTMLInputElement;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'D:/sbe/other');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(useProjectStore.getState().project.hardware.sbe.sourcePath).toBe('D:/sbe/other');
    expect((container.querySelector('#sbe-delivery') as HTMLSelectElement).value).toBe('skip');
  });

  it('the README prerequisites carry the same statement', () => {
    const readme = readFileSync(resolve(__dirname, '..', '..', '..', 'README.md'), 'utf8').replace(/\r\n/g, '\n');
    expect(readme).toContain(SBE_PREREQUISITE);
  });
});
