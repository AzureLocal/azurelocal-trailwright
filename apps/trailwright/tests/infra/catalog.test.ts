// The question catalog against schema 5: every question writes to a key the schema has, each scenario asks only its
// own questions, and the toolkit's example files come through Trailwright without losing anything they need.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import type { Draft } from '../../src/infra/types';
import { catalog } from '../../src/questions/catalog';
import { applyFixed, ask, askAll, missingByOwner, prune } from '../../src/questions/engine';

const schema = JSON.parse(readFileSync(resolve(__dirname, '..', '..', 'src', 'infra', 'infrastructure.schema.json'), 'utf8')) as Record<string, any>;
const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
const fixtures = resolve(__dirname, '..', 'fixtures', 'infra');
const examples = readdirSync(fixtures).filter((f) => f.endsWith('.yml'));
const load = (name: string): Draft => parse(readFileSync(resolve(fixtures, name), 'utf8')) as Draft;

// Walks the schema along a question path: 'nodes[].bmc.ip_address' goes through nodes' items.
function schemaAt(path: string): unknown {
  let node: any = schema;
  const deref = (n: any) => (n && n.$ref ? schema.$defs[n.$ref.split('/').pop()] : n);
  for (const raw of path.split('.')) {
    const key = raw.replace('[]', '');
    node = deref(node);
    node = node?.properties?.[key];
    if (raw.endsWith('[]')) node = deref(node)?.items;
    if (!node) return undefined;
  }
  return deref(node);
}

const applies = (d: Draft, id: string) => ask(catalog.find((q) => q.id === id)!, d).some((a) => a.applies);
const appliesAny = (d: Draft, id: string) => {
  const q = catalog.find((x) => x.id === id)!;
  return q.appliesWhen ? q.appliesWhen(d) : true;
};
const withScenario = (base: Draft, change: Partial<NonNullable<Draft['scenario']>>): Draft => ({ ...base, scenario: { ...base.scenario, ...change } });
const fixed = (d: Draft, id: string) => ask(catalog.find((q) => q.id === id)!, d)[0]?.fixed;

describe('the catalog', () => {
  it.each(catalog.map((q) => [q.id, q.path]))('%s writes to a key the schema has (%s)', (_id, path) => {
    expect(schemaAt(path)).toBeDefined();
  });

  it('has unique question IDs', () => {
    const ids = catalog.map((q) => q.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('cites a Microsoft Learn page for every scenario decision', () => {
    for (const q of catalog.filter((x) => x.step === 'scenario' && x.id !== 'scenario.cloud')) expect(q.learnUrl, q.id).toMatch(/^https:\/\/learn\.microsoft\.com\//);
  });
});

describe('each scenario asks only its own questions', () => {
  const base = load('infrastructure.example.yml');

  it('a SAN design gets no Storage Spaces Direct questions, and an S2D design no SAN questions', () => {
    const san = withScenario(base, { storage_architecture: 'san' });
    for (const id of ['storage.configuration_mode', 'storage.volumes', 'hardware.drives.capacity.media', 'networking.storage.networks', 'networking.storage.auto_ip']) expect(appliesAny(san, id), id).toBe(false);
    for (const id of ['storage.san.type', 'storage.san.infra_volume_lun_id', 'networking.cluster_networks']) expect(appliesAny(san, id), id).toBe(true);
    for (const id of ['storage.san.type', 'networking.cluster_networks']) expect(appliesAny(base, id), id).toBe(false);
  });

  it('a hybrid design gets both', () => {
    const hybrid = withScenario(base, { storage_architecture: 'hybrid' });
    for (const id of ['storage.volumes', 'storage.san.type', 'networking.storage.networks', 'networking.cluster_networks']) expect(appliesAny(hybrid, id), id).toBe(true);
  });

  it('local identity gets no Active Directory questions, and the reverse', () => {
    const local = withScenario(base, { identity: 'local_identity' });
    for (const id of ['identity.active_directory.domain_fqdn', 'identity.active_directory.ou_path', 'identity.active_directory.lcm_user.username']) expect(appliesAny(local, id), id).toBe(false);
    expect(appliesAny(local, 'identity.local_identity.dns_server_config')).toBe(true);
    expect(appliesAny(base, 'identity.local_identity.dns_server_config')).toBe(false);
  });

  it('an ISO install gets no BMC, voucher or ZTP questions; simplified provisioning requires them', () => {
    const iso = withScenario(base, { os_install: 'iso' });
    for (const id of ['provisioning.simplified.site_name', 'hardware.bmc.password', 'hardware.sbe.bundle_path']) expect(appliesAny(iso, id), id).toBe(false);
    const serial = ask(catalog.find((q) => q.id === 'nodes.serial_number')!, iso);
    expect(serial.every((a) => !a.required)).toBe(true);
    const serialZtp = ask(catalog.find((q) => q.id === 'nodes.serial_number')!, base);
    expect(serialZtp.every((a) => a.required)).toBe(true);
  });

  it('only rack aware asks for zones, and suggests Zone1 then Zone2', () => {
    expect(applies(base, 'nodes.zone')).toBe(false);
    const rack = withScenario(base, { topology: 'rack_aware' });
    const q = catalog.find((x) => x.id === 'nodes.zone')!;
    expect(ask(q, rack).map((a) => q.suggest?.(rack, a.index))).toEqual(['Zone1', 'Zone2']);
  });

  it('only switchless asks how many links, and only for more than one machine', () => {
    expect(appliesAny(base, 'networking.storage.switchless_links')).toBe(false);
    expect(appliesAny(withScenario(base, { storage_connectivity: 'switchless' }), 'networking.storage.switchless_links')).toBe(true);
  });

  it('only a proxy path asks for a proxy, and only Arc gateway paths ask for a gateway', () => {
    expect(appliesAny(base, 'networking.outbound.proxy.url')).toBe(false);
    expect(appliesAny(withScenario(base, { outbound_path: 'proxy' }), 'networking.outbound.proxy.url')).toBe(true);
    expect(appliesAny(withScenario(base, { outbound_path: 'proxy_arc_gateway' }), 'networking.outbound.arc_gateway.name')).toBe(true);
  });

  it('only disconnected operations ask for the control plane', () => {
    expect(appliesAny(base, 'disconnected.role')).toBe(false);
    expect(appliesAny(withScenario(base, { connectivity: 'disconnected' }), 'disconnected.role')).toBe(true);
  });
});

describe('decided for the user, with the reason', () => {
  const base = load('infrastructure.example.yml');

  it('a single machine is switched and standard, and has no storage network', () => {
    const one: Draft = { ...base, nodes: [base.nodes![0]] };
    expect(fixed(one, 'scenario.storage_connectivity')?.value).toBe('switched');
    expect(fixed(one, 'scenario.topology')?.value).toBe('standard');
    expect(appliesAny(one, 'networking.storage.networks')).toBe(false);
  });

  it('a SAN design is switched', () => {
    expect(fixed(withScenario(base, { storage_architecture: 'san' }), 'scenario.storage_connectivity')?.value).toBe('switched');
  });

  it('three or four switchless machines deploy with the ARM template', () => {
    const three: Draft = withScenario({ ...base, nodes: [...base.nodes!, { name: 'n3', management: { ip_address: '192.0.2.13' } }] }, { storage_connectivity: 'switchless' });
    expect(fixed(three, 'scenario.deploy_method')).toMatchObject({ value: 'arm' });
  });

  it('disconnected operations install from an ISO and have no outbound path', () => {
    const off = withScenario(base, { connectivity: 'disconnected' });
    expect(fixed(off, 'scenario.os_install')?.value).toBe('iso');
    expect(fixed(off, 'scenario.outbound_path')?.value).toBe('direct');
  });

  it('two machines get a cloud witness when connected', () => {
    expect(fixed(base, 'cluster.witness.type')?.value).toBe('cloud');
  });

  it('applyFixed writes the decided values into the document', () => {
    const one = applyFixed({ ...withScenario(base, { storage_connectivity: 'switchless' }), nodes: [base.nodes![0]] });
    expect(one.scenario?.storage_connectivity).toBe('switched');
  });
});

describe('options that the design rules out say why', () => {
  const base = load('infrastructure.example.yml');
  const option = (d: Draft, id: string, value: string) => catalog.find((q) => q.id === id)!.options!.find((o) => o.value === value)!.available?.(d) ?? true;

  it('Arc gateway is not offered with simplified provisioning or in Azure Government', () => {
    expect(option(base, 'scenario.outbound_path', 'arc_gateway')).toMatch(/simplified/);
    expect(option(withScenario(base, { os_install: 'iso', cloud: 'government' }), 'scenario.outbound_path', 'arc_gateway')).toMatch(/public cloud/);
    expect(option(withScenario(base, { os_install: 'iso' }), 'scenario.outbound_path', 'arc_gateway')).toBe(true);
  });

  it('switchless is not offered for five machines, rack aware not for an odd count', () => {
    const five: Draft = { ...base, nodes: Array.from({ length: 5 }, (_, i) => ({ name: `n${i}`, management: { ip_address: `192.0.2.1${i}` } })) };
    expect(option(five, 'scenario.storage_connectivity', 'switchless')).toMatch(/four/);
    expect(option(five, 'scenario.topology', 'rack_aware')).toMatch(/even/);
  });

  it('a picked option that is ruled out is reported', () => {
    const asked = ask(catalog.find((q) => q.id === 'scenario.outbound_path')!, withScenario(base, { outbound_path: 'arc_gateway' }));
    expect(asked[0].problem).toMatch(/not supported with simplified/);
  });
});

describe('what is still needed', () => {
  it('an empty design lists the decisions first, grouped by who knows them', () => {
    const missing = missingByOwner({});
    expect(missing.architect.map((a) => a.question.id)).toContain('scenario.storage_architecture');
    expect(missing.identity.map((a) => a.question.id)).toContain('scenario.identity');
    expect(missing.network.map((a) => a.question.id)).toContain('networking.management.subnet');
  });

  it('suggests a gateway and an infrastructure pool that avoids the machines', () => {
    const d: Draft = { networking: { management: { subnet: '192.0.2.0/24' } }, nodes: [{ name: 'a', management: { ip_address: '192.0.2.21' } }] };
    const q = (id: string) => catalog.find((x) => x.id === id)!;
    expect(q('networking.management.gateway').suggest?.(d)).toBe('192.0.2.1');
    const start = q('networking.management.infrastructure_pool.start').suggest?.(d);
    const end = q('networking.management.infrastructure_pool.end').suggest?.(d);
    expect(start).toBe('192.0.2.22');
    expect(end).toBe('192.0.2.31');
  });
});

describe('the toolkit examples come through Trailwright', () => {
  it.each(examples)('%s is valid, and still valid after pruning', (name) => {
    const doc = load(name);
    expect(validate(doc), JSON.stringify(validate.errors)).toBe(true);
    const pruned = prune(doc);
    expect(validate(pruned), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each(examples)('%s answers every question its scenario requires', (name) => {
    const missing = askAll(load(name)).filter((a) => a.applies && a.required && !a.answered).map((a) => a.path);
    expect(missing).toEqual([]);
  });

  it.each(examples)('%s has no problems', (name) => {
    const problems = askAll(load(name)).filter((a) => a.applies && a.problem).map((a) => `${a.path}: ${a.problem}`);
    expect(problems).toEqual([]);
  });

  it('pruning a SAN design drops S2D answers and keeps the SAN', () => {
    const doc = load('infrastructure.example.yml');
    const san = prune({ ...doc, scenario: { ...doc.scenario, storage_architecture: 'san' }, storage: { ...doc.storage, san: { type: 'iscsi' } } });
    expect(san.storage?.volumes).toBeUndefined();
    expect(san.storage?.configuration_mode).toBeUndefined();
    expect(san.networking?.storage).toBeUndefined();
    expect(san.storage?.san?.type).toBe('iscsi');
  });
});
