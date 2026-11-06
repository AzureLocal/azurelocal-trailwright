// Operations, network devices, and the two optional parts: the Azure foundation and CI/CD.
import type { Question } from '../types';
import { backupOn, drOn, learn, monitoringOn, wantsDevops, wantsLandingZone } from '../when';

export const operationsQuestions: Question[] = [
  { id: 'sdn.enabled', path: 'sdn.enabled', step: 'operations', group: 'Software defined networking', label: 'Enable SDN enabled by Azure Arc?', help: 'Logical networks and network security groups for Azure Local VMs, managed from Azure.', learnUrl: learn.decision11, owner: 'network', kind: 'boolean', requiredWhen: () => false },
  { id: 'operations.update_method', path: 'operations.update_method', step: 'operations', group: 'Updates', label: 'How are updates applied?', owner: 'operations', kind: 'select', requiredWhen: () => false, options: [{ value: 'portal', label: 'Azure Update Manager in the portal' }, { value: 'powershell', label: 'PowerShell' }] },
  { id: 'operations.monitoring.enabled', path: 'operations.monitoring.enabled', step: 'operations', group: 'Monitoring', label: 'Turn on Insights (Azure Monitor)?', learnUrl: learn.insights, owner: 'operations', kind: 'boolean', requiredWhen: () => false },
  { id: 'operations.monitoring.log_analytics_workspace', path: 'operations.monitoring.log_analytics_workspace', step: 'operations', group: 'Monitoring', label: 'Log Analytics workspace', owner: 'operations', kind: 'text', appliesWhen: monitoringOn },
  { id: 'operations.monitoring.workspace_resource_group', path: 'operations.monitoring.workspace_resource_group', step: 'operations', group: 'Monitoring', label: 'Workspace resource group', owner: 'operations', kind: 'text', appliesWhen: monitoringOn },
  { id: 'operations.notifications.emails', path: 'operations.notifications.emails', step: 'operations', group: 'Monitoring', label: 'Who gets the alerts', owner: 'operations', kind: 'list', appliesWhen: monitoringOn, requiredWhen: () => false },
  { id: 'operations.backup.enabled', path: 'operations.backup.enabled', step: 'operations', group: 'Backup', label: 'Back up the VMs?', owner: 'operations', kind: 'boolean', requiredWhen: () => false },
  { id: 'operations.backup.approach', path: 'operations.backup.approach', step: 'operations', group: 'Backup', label: 'Backup approach', owner: 'operations', kind: 'select', appliesWhen: backupOn, options: [{ value: 'host', label: 'Host level' }, { value: 'guest', label: 'Inside the guest' }, { value: 'both', label: 'Both' }] },
  { id: 'operations.backup.solution', path: 'operations.backup.solution', step: 'operations', group: 'Backup', label: 'Backup product', owner: 'operations', kind: 'text', appliesWhen: backupOn },
  { id: 'operations.disaster_recovery.method', path: 'operations.disaster_recovery.method', step: 'operations', group: 'Disaster recovery', label: 'How are VMs protected from a site failure?', learnUrl: learn.asr, owner: 'operations', kind: 'select', requiredWhen: () => false, options: [{ value: 'none', label: 'Not protected' }, { value: 'asr', label: 'Azure Site Recovery' }, { value: 'hyper_v_replica', label: 'Hyper-V Replica' }] },
  { id: 'operations.disaster_recovery.recovery_vault', path: 'operations.disaster_recovery.recovery_vault', step: 'operations', group: 'Disaster recovery', label: 'Recovery Services vault', owner: 'operations', kind: 'text', appliesWhen: (d) => d.operations?.disaster_recovery?.method === 'asr' },
  { id: 'operations.disaster_recovery.target_rpo_minutes', path: 'operations.disaster_recovery.target_rpo_minutes', step: 'operations', group: 'Disaster recovery', label: 'Recovery point objective (minutes)', owner: 'operations', kind: 'number', appliesWhen: drOn, requiredWhen: () => false },
  { id: 'operations.disaster_recovery.target_rto_minutes', path: 'operations.disaster_recovery.target_rto_minutes', step: 'operations', group: 'Disaster recovery', label: 'Recovery time objective (minutes)', owner: 'operations', kind: 'number', appliesWhen: drOn, requiredWhen: () => false },
  { id: 'operations.licensing.azure_hybrid_benefit', path: 'operations.licensing.azure_hybrid_benefit', step: 'operations', group: 'Licensing', label: 'Use Azure Hybrid Benefit?', owner: 'architect', kind: 'boolean', requiredWhen: () => false },

  {
    id: 'network_devices',
    path: 'network_devices',
    step: 'devices',
    group: 'Network devices',
    label: 'Switches, firewalls and console servers',
    help: 'For the switch configuration and the readiness checks. Credentials are Key Vault references.',
    owner: 'network',
    kind: 'table',
    requiredWhen: () => false,
    columns: [
      { key: 'hostname', label: 'Host name', kind: 'text', required: true },
      { key: 'type', label: 'Type', kind: 'select', required: true, options: ['switch', 'firewall', 'router', 'console_server', 'load_balancer'].map((v) => ({ value: v, label: v.replace('_', ' ') })) },
      { key: 'role', label: 'Role', kind: 'select', options: ['primary', 'secondary', 'standalone'].map((v) => ({ value: v, label: v })) },
      { key: 'vendor', label: 'Vendor', kind: 'text' },
      { key: 'model', label: 'Model', kind: 'text' },
    ],
  },

  // Optional: the Azure foundation (Part 2 of the implementation steps).
  { id: 'landing_zone.subscriptions', path: 'landing_zone.subscriptions', step: 'landing-zone', group: 'Subscriptions', label: 'Subscriptions by role', owner: 'azure', kind: 'table', appliesWhen: wantsLandingZone, requiredWhen: () => false, columns: [{ key: 'name', label: 'Name', kind: 'text', required: true }, { key: 'id', label: 'Subscription ID', kind: 'guid' }, { key: 'role', label: 'Role', kind: 'select', required: true, options: ['connectivity', 'identity', 'management', 'security', 'devops', 'workload', 'azure_local'].map((v) => ({ value: v, label: v.replace('_', ' ') })) }] },
  { id: 'landing_zone.resource_groups', path: 'landing_zone.resource_groups', step: 'landing-zone', group: 'Resource groups', label: 'Resource groups', owner: 'azure', kind: 'table', appliesWhen: wantsLandingZone, requiredWhen: () => false, columns: [{ key: 'name', label: 'Name', kind: 'text', required: true }, { key: 'subscription', label: 'Subscription', kind: 'text' }, { key: 'location', label: 'Region', kind: 'text' }, { key: 'purpose', label: 'Purpose', kind: 'text' }] },
  { id: 'landing_zone.networks', path: 'landing_zone.networks', step: 'landing-zone', group: 'Networks', label: 'Azure virtual networks', owner: 'network', kind: 'table', appliesWhen: wantsLandingZone, requiredWhen: () => false, columns: [{ key: 'name', label: 'Name', kind: 'text', required: true }, { key: 'role', label: 'Role', kind: 'select', options: [{ value: 'hub', label: 'Hub' }, { value: 'spoke', label: 'Spoke' }] }, { key: 'resource_group', label: 'Resource group', kind: 'text' }] },
  { id: 'landing_zone.virtual_machines', path: 'landing_zone.virtual_machines', step: 'landing-zone', group: 'Management VMs', label: 'Domain controllers, jump box, WAC, syslog', owner: 'azure', kind: 'table', appliesWhen: wantsLandingZone, requiredWhen: () => false, columns: [{ key: 'name', label: 'Name', kind: 'text', required: true }, { key: 'role', label: 'Role', kind: 'select', required: true, options: ['domain_controller', 'jumpbox', 'windows_admin_center', 'syslog', 'management', 'other'].map((v) => ({ value: v, label: v.replace(/_/g, ' ') })) }, { key: 'private_ip', label: 'Address', kind: 'ipv4' }, { key: 'size', label: 'Size', kind: 'text' }] },
  { id: 'landing_zone.log_analytics.name', path: 'landing_zone.log_analytics.name', step: 'landing-zone', group: 'Log Analytics', label: 'Log Analytics workspace', owner: 'operations', kind: 'text', appliesWhen: wantsLandingZone, requiredWhen: () => false },

  // Optional: CI/CD (Part 1).
  { id: 'devops.platform', path: 'devops.platform', step: 'devops', group: 'Pipelines', label: 'Pipeline platform', owner: 'operations', kind: 'choice', appliesWhen: wantsDevops, options: [{ value: 'github', label: 'GitHub Actions' }, { value: 'gitlab', label: 'GitLab CI' }, { value: 'azure_devops', label: 'Azure DevOps' }] },
  { id: 'devops.organization', path: 'devops.organization', step: 'devops', group: 'Pipelines', label: 'Organization or group', owner: 'operations', kind: 'text', appliesWhen: wantsDevops, requiredWhen: () => false },
  { id: 'devops.runner.name', path: 'devops.runner.name', step: 'devops', group: 'Runner', label: 'Runner name', owner: 'operations', kind: 'text', appliesWhen: wantsDevops, requiredWhen: () => false },
  { id: 'devops.runner.type', path: 'devops.runner.type', step: 'devops', group: 'Runner', label: 'Runner type', owner: 'operations', kind: 'select', appliesWhen: (d) => wantsDevops(d) && !!d.devops?.runner?.name, options: [{ value: 'vm', label: 'Virtual machine' }, { value: 'container_app', label: 'Container app' }, { value: 'existing', label: 'An existing runner' }] },
];
