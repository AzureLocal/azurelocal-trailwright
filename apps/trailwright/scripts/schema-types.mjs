// Generates src/infra/schema.gen.ts from src/infra/infrastructure.schema.json (schema 5, vendored from
// azurelocal-toolkit config/variables). Run after updating the vendored schema: npm run schema:types
//
// The types describe the shape only. Before generating, this drops what says "required when" rather than "what the
// shape is": the conditional allOf/if/then rules, anyOf alternatives that only list required keys, and the `true`
// placeholders that declare those keys for ajv's strictRequired. Those rules are still enforced: tests validate every
// document Trailwright writes against the full schema.
import { compile } from 'json-schema-to-typescript';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import process from 'node:process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(readFileSync(join(root, 'src', 'infra', 'infrastructure.schema.json'), 'utf8'));

function shapeOnly(node) {
  if (Array.isArray(node)) return node.map(shapeOnly);
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === 'allOf' || key === 'if' || key === 'then' || key === 'else') continue;
    // An anyOf whose alternatives only require keys (with the type and `true` placeholders ajv's strict mode wants).
    const requiresOnly = (v) =>
      Object.keys(v).every((k) => k === 'required' || k === 'type' || k === 'properties') && Object.values(v.properties ?? {}).every((p) => p === true);
    if (key === 'anyOf' && Array.isArray(value) && value.every(requiresOnly)) continue;
    if (key === 'properties') {
      out.properties = Object.fromEntries(Object.entries(value).filter(([, v]) => v !== true).map(([k, v]) => [k, shapeOnly(v)]));
      continue;
    }
    out[key] = shapeOnly(value);
  }
  // An object with no properties of its own (extensions) takes any key.
  if (out.type === 'object' && !out.properties && out.additionalProperties === undefined) out.additionalProperties = true;
  return out;
}

const ts = await compile(shapeOnly(schema), 'Infrastructure', {
  bannerComment: '/* Generated from infrastructure.schema.json (schema 5, azurelocal-toolkit). Do not edit: run npm run schema:types. */',
  additionalProperties: false,
  unreachableDefinitions: false,
  style: { singleQuote: true, printWidth: 160 },
});
writeFileSync(join(root, 'src', 'infra', 'schema.gen.ts'), ts);
process.stdout.write('wrote src/infra/schema.gen.ts\n');
