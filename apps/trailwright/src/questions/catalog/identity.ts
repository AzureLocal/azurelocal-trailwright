// Accounts and the identity provider. Active Directory and local identity each see only their own questions.
import type { Question } from '../types';
import { isAd, isLocalIdentity, learn } from '../when';

const kvRef = (v: unknown) => (typeof v === 'string' && !/^keyvault:\/\/[A-Za-z][A-Za-z0-9-]{1,22}[A-Za-z0-9]\/[A-Za-z0-9-]{1,127}$/.test(v) ? 'A Key Vault reference: keyvault://<vault>/<secret>. Never the password itself.' : undefined);

export const identityQuestions: Question[] = [
  {
    id: 'identity.local_admin.username',
    path: 'identity.local_admin.username',
    step: 'identity',
    group: 'Local administrator',
    label: 'Deployment local administrator',
    help: 'A local administrator on every machine, the same name everywhere. Not the built-in Administrator: the deployment renames it.',
    learnUrl: learn.installOs,
    owner: 'identity',
    kind: 'text',
    check: (v) => (typeof v === 'string' && /^(administrator|guest)$/i.test(v) ? 'Use an account other than the built-in Administrator or Guest.' : undefined),
  },
  { id: 'identity.local_admin.password', path: 'identity.local_admin.password', step: 'identity', group: 'Local administrator', label: 'Its password secret', help: 'At least 14 characters with lowercase, uppercase, a digit and a special character, stored in Key Vault.', owner: 'identity', kind: 'kvref', check: kvRef },

  // Active Directory
  { id: 'identity.active_directory.domain_fqdn', path: 'identity.active_directory.domain_fqdn', step: 'identity', group: 'Active Directory', label: 'Domain', help: 'The domain the machines join, for example corp.example.com.', learnUrl: learn.adPrep, owner: 'identity', kind: 'text', appliesWhen: isAd },
  { id: 'identity.active_directory.netbios_name', path: 'identity.active_directory.netbios_name', step: 'identity', group: 'Active Directory', label: 'NetBIOS domain name', owner: 'identity', kind: 'text', appliesWhen: isAd, requiredWhen: () => false },
  {
    id: 'identity.active_directory.ou_path',
    path: 'identity.active_directory.ou_path',
    step: 'identity',
    group: 'Active Directory',
    label: 'Dedicated OU',
    help: 'The distinguished name of an OU just for this instance, with inheritance blocked. The AD preparation module creates it and the LCM user.',
    learnUrl: learn.adPrep,
    owner: 'identity',
    kind: 'text',
    appliesWhen: isAd,
    placeholder: 'OU=azl-01,OU=AzureLocal,DC=corp,DC=example,DC=com',
    check: (v) => (typeof v === 'string' && !/^ou=.+,dc=.+$/i.test(v) ? 'A distinguished name: OU=...,DC=...' : undefined),
  },
  {
    id: 'identity.active_directory.lcm_user.username',
    path: 'identity.active_directory.lcm_user.username',
    step: 'identity',
    group: 'Active Directory',
    label: 'LCM deployment user',
    help: 'The user the deployment runs as. Name only, no domain, up to 20 characters.',
    learnUrl: learn.adPrep,
    owner: 'identity',
    kind: 'text',
    appliesWhen: isAd,
    check: (v) => (typeof v === 'string' && (v.length > 20 || /[@\\]/.test(v)) ? 'Name only, no domain, up to 20 characters.' : undefined),
  },
  { id: 'identity.active_directory.lcm_user.password', path: 'identity.active_directory.lcm_user.password', step: 'identity', group: 'Active Directory', label: 'LCM user password secret', help: 'At least 14 characters with lowercase, uppercase, a digit and a special character.', owner: 'identity', kind: 'kvref', appliesWhen: isAd, check: kvRef },
  { id: 'identity.active_directory.domain_controllers', path: 'identity.active_directory.domain_controllers', step: 'identity', group: 'Active Directory', label: 'Domain controller addresses', help: 'For the pre-checks.', owner: 'identity', kind: 'ipv4-list', appliesWhen: isAd, requiredWhen: () => false },
  {
    id: 'identity.active_directory.security_groups',
    path: 'identity.active_directory.security_groups',
    step: 'identity',
    group: 'Active Directory',
    label: 'Security groups',
    owner: 'identity',
    kind: 'table',
    appliesWhen: isAd,
    requiredWhen: () => false,
    columns: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      { key: 'purpose', label: 'Purpose', kind: 'text' },
    ],
  },

  // Local identity
  {
    id: 'identity.local_identity.dns_server_config',
    path: 'identity.local_identity.dns_server_config',
    step: 'identity',
    group: 'Local identity',
    label: 'How is DNS provided?',
    learnUrl: learn.localIdentity,
    owner: 'network',
    kind: 'choice',
    appliesWhen: isLocalIdentity,
    options: [
      { value: 'use_dns_server', label: 'Your DNS server', description: 'An existing DNS server holds the zone.' },
      { value: 'use_forwarder', label: 'A forwarder', description: 'The instance forwards to the DNS servers you list.' },
    ],
  },
  { id: 'identity.local_identity.dns_zone', path: 'identity.local_identity.dns_zone', step: 'identity', group: 'Local identity', label: 'DNS zone', owner: 'network', kind: 'text', appliesWhen: isLocalIdentity },
  { id: 'identity.local_identity.dns_forwarders', path: 'identity.local_identity.dns_forwarders', step: 'identity', group: 'Local identity', label: 'DNS forwarders', owner: 'network', kind: 'ipv4-list', appliesWhen: (d) => isLocalIdentity(d) && d.identity?.local_identity?.dns_server_config === 'use_forwarder' },

  // Entra ID
  {
    id: 'identity.entra.groups',
    path: 'identity.entra.groups',
    step: 'identity',
    group: 'Entra ID',
    label: 'Entra ID groups and roles',
    help: 'Groups that get Azure roles on the instance, for example operators.',
    owner: 'azure',
    kind: 'table',
    requiredWhen: () => false,
    columns: [
      { key: 'name', label: 'Group', kind: 'text', required: true },
      { key: 'purpose', label: 'Purpose', kind: 'text' },
      { key: 'scope', label: 'Scope', kind: 'text' },
    ],
  },
];
