import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { exportKinds } from '../src/exports';
import { createExampleProject } from '../src/examples/exampleLab';
import { createEmptyProject } from '../src/model/defaults';
import { isProjectStarted, lastStep, rememberStep } from '../src/model/progress';
import { CURRENT_RELEASE } from '../src/model/release';
import { useProjectStore } from '../src/model/store';
import { docLinks, REPO_URL } from '../src/screens/LandingScreen';

// React's act() needs to know it runs in a test environment.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const Where = () => <output data-testid="where">{useLocation().pathname}</output>;
const where = () => container.querySelector('[data-testid="where"]')?.textContent;

function render(path: string) {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <App />
        <Where />
      </MemoryRouter>,
    );
  });
}

const h1 = () => container.querySelector('h1')?.textContent ?? '';
const button = (name: string) => [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === name);
const link = (name: string | RegExp) => [...container.querySelectorAll('a')].find((a) => (typeof name === 'string' ? a.textContent?.trim() === name : name.test(a.textContent ?? '')));
const click = (el: HTMLElement | undefined) => {
  expect(el).toBeDefined();
  act(() => el!.click());
};

beforeEach(() => {
  localStorage.clear();
  useProjectStore.getState().replaceProject(createEmptyProject('Untitled project'));
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('progress', () => {
  it('treats an untouched project as not started, whatever its creation time', () => {
    const p = createEmptyProject('Untitled project');
    expect(isProjectStarted({ ...p, meta: { ...p.meta, createdAt: '2020-01-01T00:00:00.000Z' } })).toBe(false);
  });

  it('treats a renamed project or the example as started', () => {
    expect(isProjectStarted(createEmptyProject('Site A'))).toBe(true);
    expect(isProjectStarted(createExampleProject())).toBe(true);
  });

  it('remembers the last step', () => {
    expect(lastStep()).toBeNull();
    rememberStep('storage');
    expect(lastStep()).toBe('storage');
  });
});

describe('landing page', () => {
  it('opens at the root and explains Trailwright instead of showing the project', () => {
    render('/');
    expect(where()).toBe('/');
    expect(h1()).toMatch(/Design an Azure Local deployment/);
    expect(container.querySelector('nav[aria-label="Steps"]')).toBeNull();
    const headings = [...container.querySelectorAll('h2')].map((h) => h.textContent?.trim());
    expect(headings).toEqual(expect.arrayContaining(['Get started', 'How it works', 'What you take away', 'Where it fits', 'Documentation']));
  });

  it('shows the release from CURRENT_RELEASE', () => {
    render('/');
    expect(container.textContent).toContain(`Plans against Azure Local 12.${CURRENT_RELEASE}`);
  });

  it('lists every export the Review step offers', () => {
    render('/');
    const items = container.querySelectorAll('ul[aria-label="Exports"] li');
    expect(items).toHaveLength(exportKinds.length);
  });

  it('links the docs in the repository, opening in a new tab', () => {
    render('/');
    for (const d of docLinks) {
      const a = container.querySelector(`a[href="${d.href}"]`);
      expect(a, d.title).not.toBeNull();
      expect(a?.getAttribute('target')).toBe('_blank');
      expect(a?.getAttribute('rel')).toContain('noopener');
      expect(d.href.startsWith(`${REPO_URL}/blob/main/docs/`)).toBe(true);
    }
    expect(container.querySelector('a[href="schema/infrastructure.schema.json"]')).not.toBeNull();
  });

  it('starts a new design and moves to the Project step', () => {
    render('/');
    expect(link(/^Continue/)).toBeUndefined();
    click(button('Start a new design'));
    expect(where()).toBe('/project');
    expect(container.querySelector('nav[aria-label="Steps"]')).not.toBeNull();
  });

  it('opens the example straight away when nothing is in progress', () => {
    render('/');
    click(button('Explore the example'));
    expect(where()).toBe('/project');
    expect(useProjectStore.getState().project.meta.name).toBe('Example lab');
  });

  it('offers a way back to a design in progress, at the last step', () => {
    useProjectStore.getState().replaceProject(createExampleProject());
    rememberStep('storage');
    render('/');
    const resume = link(/^Continue Example lab/);
    expect(resume?.getAttribute('href')).toBe('/storage');
    click(resume);
    expect(where()).toBe('/storage');
  });

  it('asks before a new design replaces the one in progress', () => {
    useProjectStore.getState().replaceProject(createExampleProject());
    render('/');
    click(button('Start a new design'));
    expect(where()).toBe('/');
    expect(container.querySelector('[role="alertdialog"]')?.textContent).toContain('Replace Example lab?');
    click(button('Cancel'));
    expect(useProjectStore.getState().project.meta.name).toBe('Example lab');
    click(button('Start a new design'));
    click(button('Replace with a new design'));
    expect(where()).toBe('/project');
    expect(useProjectStore.getState().project.meta.name).toBe('Untitled project');
  });

  it('shows the import panel on request', () => {
    render('/');
    const open = button('Open a saved project or Surveyor plan');
    expect(open?.getAttribute('aria-expanded')).toBe('false');
    click(open);
    expect(open?.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('input#import-file[type="file"]')).not.toBeNull();
  });
});

describe('routing', () => {
  it('keeps each step at its own path, with a link back to the landing page', () => {
    render('/storage');
    expect(where()).toBe('/storage');
    click(container.querySelector<HTMLAnchorElement>('a[aria-label="Trailwright home"]') ?? undefined);
    expect(where()).toBe('/');
    expect(h1()).toMatch(/Design an Azure Local deployment/);
  });

  it('records the open step for the landing page', () => {
    render('/identity');
    expect(lastStep()).toBe('identity');
  });

  it('sends an unknown path to the landing page', () => {
    render('/no-such-step');
    expect(where()).toBe('/');
  });
});
