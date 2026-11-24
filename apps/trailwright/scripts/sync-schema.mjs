// Copies the toolkit's generated infrastructure schema into this app and regenerates the types.
//
//   AZL_TOOLKIT_ROOT=<azurelocal-toolkit checkout> npm run schema:sync
//   node scripts/sync-schema.mjs --toolkit <azurelocal-toolkit checkout> [--check]
//
// The toolkit's config/variables/schema/infrastructure.schema.json is the only source of the schema (it is generated from the
// master registry there). This script copies it to src/infra/ and public/schema/ (the site publishes it), copies the part
// Trailwright writes (schema/tools/trailwright.schema.json) next to it, sets SCHEMA_VERSION in src/infra/types.ts to the
// version the schema names as current, and runs npm run schema:types. With --check it changes nothing and exits 1 when a copy
// differs from the toolkit's: the same comparison tests/infrastructureSchema.test.ts makes.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const at = argv.indexOf('--toolkit');
const toolkit = resolve(at >= 0 ? argv[at + 1] : (process.env.AZL_TOOLKIT_ROOT ?? ''));
const check = argv.includes('--check');
if (!toolkit || !existsSync(join(toolkit, 'config', 'variables', 'schema', 'infrastructure.schema.json'))) {
  process.stderr.write('Give the azurelocal-toolkit checkout: --toolkit <path> or AZL_TOOLKIT_ROOT.\n');
  process.exit(2);
}

const schemaDir = join(toolkit, 'config', 'variables', 'schema');
const copies = [
  [join(schemaDir, 'infrastructure.schema.json'), join(root, 'src', 'infra', 'infrastructure.schema.json')],
  [join(schemaDir, 'infrastructure.schema.json'), join(root, 'public', 'schema', 'infrastructure.schema.json')],
  [join(schemaDir, 'tools', 'trailwright.schema.json'), join(root, 'src', 'infra', 'trailwright.schema.json')],
];
// Line endings are not content: a checkout may turn LF into CRLF.
const body = (file) => (existsSync(file) ? readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : undefined);
const versionOf = (file) => /The current version is (\d+\.\d+\.\d+)\./.exec(readFileSync(file, 'utf8'))?.[1];

for (const [from] of copies) {
  if (!existsSync(from)) {
    process.stderr.write(`The toolkit has no ${from}.\n`);
    process.exit(2);
  }
}
const stale = copies.filter(([from, to]) => body(from) !== body(to));
const version = versionOf(copies[0][0]);
if (!version) {
  process.stderr.write('The toolkit schema does not name its current version.\n');
  process.exit(2);
}
const typesFile = join(root, 'src', 'infra', 'types.ts');
const typesText = readFileSync(typesFile, 'utf8');
const current = /SCHEMA_VERSION = '(\d+\.\d+\.\d+)'/.exec(typesText)?.[1];

if (check) {
  for (const [, to] of stale) process.stdout.write(`differs from the toolkit: ${to}\n`);
  if (current !== version) process.stdout.write(`SCHEMA_VERSION is ${current}, the toolkit's schema is ${version}\n`);
  process.exit(stale.length || current !== version ? 1 : 0);
}

for (const [from, to] of stale) copyFileSync(from, to);
if (current !== version) writeFileSync(typesFile, typesText.replace(/SCHEMA_VERSION = '\d+\.\d+\.\d+'/, `SCHEMA_VERSION = '${version}'`));
const types = spawnSync(process.execPath, [join(root, 'scripts', 'schema-types.mjs')], { stdio: 'inherit' });
process.stdout.write(`schema ${version}: ${stale.length} file(s) copied from ${toolkit}\n`);
process.exit(types.status ?? 1);
