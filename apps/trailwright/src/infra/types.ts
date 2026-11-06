// The infrastructure.yml document, schema 5. The types come from the vendored schema (infrastructure.schema.json,
// azurelocal-toolkit config/infrastructure) through npm run schema:types; nothing here restates the schema.
// Trailwright edits a Draft (every key optional) and exports an Infrastructure; tests validate every exported
// document against the full schema, including the rules that make a section required.
import type { AzureLocalInfrastructureYml, Intent as GenIntent, Node as GenNode, NetworkDevice as GenNetworkDevice } from './schema.gen';

export type Infrastructure = AzureLocalInfrastructureYml;
export type Scenario = Infrastructure['scenario'];
export type Node = GenNode;
export type Intent = GenIntent;
export type NetworkDevice = GenNetworkDevice;
export type Networking = Infrastructure['networking'];
export type Identity = Infrastructure['identity'];
export type Storage = NonNullable<Infrastructure['storage']>;
export type Provisioning = NonNullable<Infrastructure['provisioning']>;

type DeepPartial<T> = T extends (infer U)[] ? DeepPartial<U>[] : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

// What the app edits: any key can still be missing.
export type Draft = DeepPartial<Infrastructure>;

export const SCHEMA_MAJOR = 5;
export const SCHEMA_VERSION = '5.0.0';
