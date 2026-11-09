import type { Rule } from './types';

const RELEASES = ['2607', '2608', '2609', '2610'];

const QUORUM_URL = 'https://learn.microsoft.com/windows-server/storage/storage-spaces/quorum#cluster-quorum-overview';
const ARM_URL = 'https://learn.microsoft.com/azure/azure-local/deploy/deployment-azure-resource-manager-template?view=azloc-2610#arm-template-parameters-reference';
const RACK_URL = 'https://learn.microsoft.com/azure/azure-local/concepts/rack-aware-cluster-requirements?view=azloc-2610#supported-node-configurations';
const SYSREQ_URL = 'https://learn.microsoft.com/azure/azure-local/concepts/system-requirements-23h2?view=azloc-2610';
const SBE_URL = 'https://learn.microsoft.com/azure/azure-local/update/solution-builder-extension?view=azloc-2610';

const DISCONNECTED_URL = 'https://learn.microsoft.com/azure/azure-local/manage/disconnected-operations-deploy?view=azloc-2610#deploy-workload-clusters';
const RACK_DEPLOY_URL = 'https://learn.microsoft.com/azure/azure-local/deploy/rack-aware-cluster-deployment-via-template?view=azloc-2610#step-2-deploy-using-arm-template';

export const hardwareRules: Rule[] = [
  {
    id: 'HW-007',
    release: RELEASES,
    learnUrl: RACK_DEPLOY_URL,
    check: (p) =>
      p.hardware.topology === 'rack-aware' && p.deployment.mode !== 'disconnected' && p.hardware.witness !== 'cloud'
        ? [{ id: 'HW-007', severity: 'error', field: 'hardware.witness', message: 'A rack-aware cluster requires a cloud witness.', learnUrl: RACK_DEPLOY_URL }]
        : [],
  },
  {
    id: 'HW-008',
    release: RELEASES,
    learnUrl: DISCONNECTED_URL,
    check: (p) =>
      p.hardware.topology === 'rack-aware' && p.deployment.mode === 'disconnected' && p.hardware.witness !== 'file-share'
        ? [{ id: 'HW-008', severity: 'error', field: 'hardware.witness', message: 'A rack-aware cluster in Azure Local disconnected operations requires a file share witness.', learnUrl: DISCONNECTED_URL }]
        : [],
  },
  {
    id: 'HW-001',
    release: RELEASES,
    learnUrl: QUORUM_URL,
    check: (p) =>
      p.hardware.nodes.length === 2 && p.hardware.witness === 'none'
        ? [{ id: 'HW-001', severity: 'error', field: 'hardware.witness', message: 'A two-node cluster requires a witness to maintain quorum.', learnUrl: QUORUM_URL }]
        : [],
  },
  {
    id: 'HW-002',
    release: RELEASES,
    learnUrl: ARM_URL,
    check: (p) =>
      p.hardware.witness === 'file-share' && p.deployment.mode !== 'disconnected'
        ? [{ id: 'HW-002', severity: 'error', field: 'hardware.witness', message: 'Connected Azure Local deployments use a cloud witness: the deployment offers only the Cloud witness type. A file share witness appears in the documentation only for disconnected operations.', learnUrl: ARM_URL }]
        : [],
  },
  {
    id: 'HW-003',
    release: RELEASES,
    learnUrl: QUORUM_URL,
    check: (p) =>
      p.hardware.nodes.length >= 3 && p.hardware.nodes.length <= 4 && p.hardware.witness === 'none'
        ? [{ id: 'HW-003', severity: 'warning', field: 'hardware.witness', message: 'A witness is strongly recommended for clusters with 3 or 4 nodes.', learnUrl: QUORUM_URL }]
        : [],
  },
  {
    id: 'HW-004',
    release: RELEASES,
    learnUrl: QUORUM_URL,
    check: (p) =>
      p.hardware.nodes.length >= 5 && p.hardware.witness !== 'none'
        ? [{ id: 'HW-004', severity: 'info', field: 'hardware.witness', message: 'A witness is not needed with 5 or more nodes and provides no additional resiliency.', learnUrl: QUORUM_URL }]
        : [],
  },
  {
    id: 'HW-005',
    release: RELEASES,
    learnUrl: RACK_URL,
    check: (p) =>
      p.hardware.topology === 'rack-aware' && p.hardware.nodes.length > 0 && ![2, 4, 6, 8].includes(p.hardware.nodes.length)
        ? [{ id: 'HW-005', severity: 'error', field: 'hardware.nodes', message: 'Rack-aware topology supports only 2, 4, 6 or 8 nodes arranged in two equal zones.', learnUrl: RACK_URL }]
        : [],
  },
  {
    id: 'HW-006',
    release: RELEASES,
    learnUrl: SYSREQ_URL,
    check: (p) =>
      p.hardware.nodes.length === 0
        ? [{ id: 'HW-006', severity: 'error', field: 'hardware.nodes', message: 'At least one node is required for an Azure Local cluster.', learnUrl: SYSREQ_URL }]
        : [],
  },
  // The hardware vendor's Solution Builder Extension (SBE) package is a requirement: it is needed to update the cluster, and the
  // automation reads it from a share and checks it before the cluster is created. Installing it during the build is optional (off).
  {
    id: 'SBE-001',
    release: RELEASES,
    learnUrl: SBE_URL,
    check: (p) =>
      p.hardware.sbe.requirement === 'required' && !p.hardware.sbe.sourcePath.trim()
        ? [{ id: 'SBE-001', severity: 'warning', field: 'hardware.sbe.sourcePath', message: "Download your hardware vendor's Solution Builder Extension package for your model and the Azure Local version you deploy, and say where it is (a share or folder). It is a requirement: you need it to update the cluster, and the automation reads it from there and checks it before the cluster is created. If your hardware has no Solution Builder Extension, set the requirement to not applicable and give the reason.", learnUrl: SBE_URL }]
        : [],
  },
  {
    id: 'SBE-002',
    release: RELEASES,
    learnUrl: SBE_URL,
    check: (p) =>
      p.hardware.sbe.requirement === 'not_applicable' && !p.hardware.sbe.notApplicableReason.trim()
        ? [{ id: 'SBE-002', severity: 'error', field: 'hardware.sbe.notApplicableReason', message: 'Say why no Solution Builder Extension package is needed, for example that the hardware has no Solution Builder Extension, or that the cluster downloads it with the vendor credential.', learnUrl: SBE_URL }]
        : [],
  },
  {
    id: 'SBE-003',
    release: RELEASES,
    learnUrl: SBE_URL,
    check: (p) =>
      p.hardware.sbe.requirement === 'required' && /\?|:\/\/[^/]*@|(password|pwd|token|sig)=/i.test(p.hardware.sbe.sourcePath)
        ? [{ id: 'SBE-003', severity: 'error', field: 'hardware.sbe.sourcePath', message: 'The package location carries no credential, token or query string. Give the share or folder only; the account that reads it goes in the user name, and its password in Key Vault.', learnUrl: SBE_URL }]
        : [],
  },
  {
    id: 'SBE-004',
    release: RELEASES,
    learnUrl: SBE_URL,
    check: (p) => {
      const s = p.hardware.sbe;
      if (s.requirement !== 'required' || !s.sourceUsername.trim()) return [];
      const secret = s.sourcePasswordSecret.trim();
      if (!secret) return [{ id: 'SBE-004', severity: 'warning', field: 'hardware.sbe.sourcePasswordSecret', message: 'The account that reads the package share needs a password: give the name of the Key Vault secret that holds it, never the password itself.', learnUrl: SBE_URL }];
      if (!/^[A-Za-z0-9-]{1,127}$/.test(secret)) return [{ id: 'SBE-004', severity: 'error', field: 'hardware.sbe.sourcePasswordSecret', message: 'This is a Key Vault secret name (letters, numbers and hyphens), not a password. Store the password in Key Vault and give its name.', learnUrl: SBE_URL }];
      if (!(p.landingZone.keyVaultName || p.identity.keyVaultName)) return [{ id: 'SBE-004', severity: 'warning', field: 'hardware.sbe.sourcePasswordSecret', message: 'The password reference needs a Key Vault name: set it under Azure resources or identity.', learnUrl: SBE_URL }];
      return [];
    },
  },
];
