import type { Project } from './schema';
import { createEmptyProject } from './defaults';

const LAST_STEP_KEY = 'trailwright.lastStep.v1';

// Everything but the creation time, so two untouched projects compare equal.
const comparable = (p: Project): string => JSON.stringify({ ...p, meta: { ...p.meta, createdAt: '' } });

// True when the design in the browser differs from a fresh, untitled one: the landing page then offers to continue it.
export function isProjectStarted(p: Project): boolean {
  return comparable(p) !== comparable(createEmptyProject('Untitled project'));
}

// The step the person last had open, so the landing page can take them back to it.
export function rememberStep(path: string): void {
  try {
    localStorage.setItem(LAST_STEP_KEY, path);
  } catch {
    // Storage may be disabled or full; the app must keep working.
  }
}

export function lastStep(): string | null {
  try {
    return localStorage.getItem(LAST_STEP_KEY);
  } catch {
    return null;
  }
}
