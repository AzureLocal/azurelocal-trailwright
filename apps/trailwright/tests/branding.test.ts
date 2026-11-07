import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COPYRIGHT, ICON_URL } from '../src/branding';

const root = resolve(__dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');

// Every file index.html and the manifest point at must be shipped from public/ (Vite copies it to the site root).
const hrefs = [...html.matchAll(/<link[^>]+href="\/([^"]+)"/g)].map((m) => m[1]);

describe('Azure Local branding', () => {
  it('index.html links the icon set, the touch icon and the manifest', () => {
    expect(hrefs).toEqual(expect.arrayContaining(['azurelocal-trailwright-icon.svg', 'favicon-32.png', 'favicon.ico', 'apple-touch-icon.png', 'site.webmanifest']));
  });

  it.each(hrefs)('ships %s from public/', (file) => {
    expect(existsSync(resolve(root, 'public', file))).toBe(true);
  });

  it('the manifest icons exist', () => {
    const manifest = JSON.parse(readFileSync(resolve(root, 'public', 'site.webmanifest'), 'utf8')) as { icons: { src: string }[] };
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons) expect(existsSync(resolve(root, 'public', icon.src))).toBe(true);
  });

  it('the header and landing logo is the same SVG as the favicon', () => {
    expect(ICON_URL.endsWith('azurelocal-trailwright-icon.svg')).toBe(true);
    expect(readFileSync(resolve(root, 'public', 'azurelocal-trailwright-icon.svg'), 'utf8')).toContain('TRAILWRIGHT');
  });

  it('uses the Azure Local family copyright and the azurelocal.cloud address, not the old owner', () => {
    expect(COPYRIGHT).toBe('Copyright © Hybrid Cloud Solutions & AzureLocal');
    expect(html).toContain('https://azurelocal.cloud/azurelocal-trailwright/');
    expect(html).not.toMatch(/hybridsolutions|labs\./i);
  });
});
