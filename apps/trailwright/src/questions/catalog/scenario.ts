// The design decisions. Each one narrows what the rest of the design asks: a SAN design gets no drive or volume
// questions, local identity gets no Active Directory questions, an ISO install gets no BMC or voucher questions.
// Order matters: an option can depend only on decisions above it.
import type { Draft } from '../../infra/types';
import type { Question } from '../types';
import { isDisconnected, isSimplified, learn, nodeCount, sc, usesS2d } from '../when';

const s2dMax = 16;
const sanMax = 64;
const step = 'scenario' as const;

// Arc gateway (and the private path, which uses it): not with simplified provisioning, and only in the public cloud.
function arcGatewayAvailable(d: Draft): true | string {
  if (isSimplified(d)) return 'Arc gateway is not supported with simplified machine provisioning.';
  if (sc(d).cloud === 'government') return 'Arc gateway is available only in the Azure public cloud.';
  return true;
}

// Designs the portal can't deploy, with the reason.
function portalBlocked(d: Draft): string | undefined {
  if (sc(d).storage_connectivity === 'switchless' && nodeCount(d) >= 3) return 'The portal deploys switchless storage for one or two machines only; three or four use the ARM template.';
  if (sc(d).storage_architecture !== 's2d' && sc(d).topology === 'rack_aware') return 'The portal offers rack aware only with Storage Spaces Direct; a SAN rack aware cluster uses the ARM template.';
  return undefined;
}

export const scenarioQuestions: Question[] = [
  {
    id: 'scenario.connectivity',
    path: 'scenario.connectivity',
    step,
    label: 'How does the instance connect to Azure?',
    help: 'Connected instances are managed from Azure. Disconnected operations run a local control plane for sites that cannot depend on Azure, such as sovereign or air-gapped sites.',
    learnUrl: learn.decision1,
    owner: 'architect',
    kind: 'choice',
    options: [
      { value: 'connected', label: 'Connected', description: 'Managed from the Azure portal and Azure Resource Manager. The usual choice.' },
      { value: 'disconnected', label: 'Disconnected operations', description: 'A local control plane appliance on a management cluster. Needs its own identity, certificates and network endpoints.' },
    ],
    recommended: () => ({ value: 'connected', reason: 'Choose disconnected only when the site cannot reach Azure by policy or design.' }),
  },
  {
    id: 'scenario.cloud',
    path: 'scenario.cloud',
    step,
    label: 'Which Azure cloud?',
    owner: 'architect',
    kind: 'choice',
    options: [
      { value: 'public', label: 'Azure public cloud' },
      { value: 'government', label: 'Azure Government', description: 'US Government regions; Microsoft publishes a separate deployment template.' },
    ],
    recommended: () => ({ value: 'public', reason: 'Azure Government is for US government workloads only.' }),
  },
  {
    id: 'scenario.storage_architecture',
    path: 'scenario.storage_architecture',
    step,
    label: 'Where does the storage live?',
    help: 'This decides most of the hardware, network and storage questions. Storage Spaces Direct pools the drives in the machines. A disaggregated design keeps data on an external SAN and scales compute and storage separately.',
    learnUrl: learn.decision2,
    owner: 'architect',
    kind: 'choice',
    options: [
      { value: 's2d', label: 'Storage Spaces Direct', description: 'Hyperconverged: local drives in every machine, 1 to 16 machines.' },
      { value: 'san', label: 'External SAN', description: 'Disaggregated: Fibre Channel or iSCSI storage, up to 64 machines. No local data drives, no storage network.' },
      { value: 'hybrid', label: 'Both', description: 'Storage Spaces Direct and SAN LUNs in the same instance.' },
    ],
  },
  {
    id: 'nodes.count',
    path: 'nodes',
    step,
    label: 'How many machines?',
    help: 'You name each machine later. The count decides which storage and topology options are possible.',
    learnUrl: learn.decision4,
    owner: 'architect',
    kind: 'count',
    check: (_value, d) => {
      const n = nodeCount(d);
      const max = usesS2d(d) ? s2dMax : sanMax;
      if (n < 1) return 'At least one machine.';
      if (n > max) return `Up to ${max} machines ${usesS2d(d) ? 'with Storage Spaces Direct' : 'in a disaggregated cluster'}.`;
      return undefined;
    },
  },
  {
    id: 'scenario.topology',
    path: 'scenario.topology',
    step,
    label: 'Standard or rack aware?',
    help: 'A rack aware cluster splits the machines between two rooms or racks (local availability zones) so the instance survives the loss of one.',
    learnUrl: learn.decision3,
    owner: 'architect',
    kind: 'choice',
    options: [
      { value: 'standard', label: 'Standard' },
      {
        value: 'rack_aware',
        label: 'Rack aware',
        description: 'Two zones with the same number of machines; needs a witness and a dedicated storage network between the racks.',
        available: (d: Draft) => {
          const n = nodeCount(d);
          const perZone = usesS2d(d) ? 4 : 8;
          if (n % 2 !== 0 || n < 2) return 'Needs an even number of machines, split equally between two zones.';
          if (n / 2 > perZone) return `Up to ${perZone} machines per zone.`;
          return true;
        },
      },
    ],
    fixedWhen: (d) => (nodeCount(d) === 1 ? { value: 'standard', reason: 'A single machine has no zones.' } : undefined),
  },
  {
    id: 'scenario.storage_connectivity',
    path: 'scenario.storage_connectivity',
    step,
    label: 'Do the machines connect to each other for storage through switches?',
    help: 'Switchless storage cables the machines directly to each other and saves storage switches, but the instance cannot grow later without recabling to switches.',
    learnUrl: learn.decision5,
    owner: 'network',
    kind: 'choice',
    options: [
      { value: 'switched', label: 'Through switches', description: 'Storage traffic goes through the top-of-rack switches. Up to 16 machines; machines can be added later.' },
      {
        value: 'switchless',
        label: 'Switchless',
        description: 'Direct cables between every pair of machines, 2 to 4 machines.',
        available: (d: Draft) => (nodeCount(d) > 4 ? 'Switchless storage supports up to four machines.' : sc(d).topology === 'rack_aware' ? 'A rack aware cluster needs a storage network between the racks.' : true),
      },
    ],
    fixedWhen: (d) => {
      if (sc(d).storage_architecture === 'san') return { value: 'switched', reason: 'A SAN design has no storage network between the machines.' };
      if (nodeCount(d) === 1) return { value: 'switched', reason: 'A single machine has no storage network.' };
      return undefined;
    },
  },
  {
    id: 'scenario.identity',
    path: 'scenario.identity',
    step,
    label: 'How do the machines authenticate?',
    help: 'Active Directory joins the machines to your domain. Local identity needs no domain: the instance keeps its secrets in Azure Key Vault.',
    learnUrl: learn.localIdentityOverview,
    owner: 'identity',
    kind: 'choice',
    options: [
      { value: 'active_directory', label: 'Active Directory', description: 'Needs a domain the machines can reach, a dedicated OU and an LCM deployment user.' },
      { value: 'local_identity', label: 'Local identity with Key Vault', description: 'No domain. Windows Admin Center is not supported; manage with PowerShell, Azure Monitor and the portal.' },
    ],
  },
  {
    id: 'scenario.os_install',
    path: 'scenario.os_install',
    step,
    label: 'How does the operating system get onto the machines?',
    help: 'From an ISO, installed on each machine (there is no unattended install), or by simplified machine provisioning from Azure, which azurelocal-ztp automates end to end through the BMC.',
    learnUrl: learn.simplified,
    owner: 'architect',
    kind: 'choice',
    options: [
      { value: 'iso', label: 'Install from an ISO', description: 'Install the OS on each machine, then register it with Azure Arc.' },
      {
        value: 'simplified',
        label: 'Simplified machine provisioning (ZTP)',
        description: 'Azure provisions the OS through the BMC. Needs each machine’s serial number, BMC address and management MAC. Preview, East US only.',
        available: (d: Draft) => (isDisconnected(d) ? 'The machines call home to Azure to be provisioned, so it needs a connected instance.' : true),
      },
    ],
    fixedWhen: (d) => (isDisconnected(d) ? { value: 'iso', reason: 'Simplified provisioning needs the machines to reach Azure; disconnected operations install from an ISO.' } : undefined),
  },
  {
    id: 'scenario.outbound_path',
    path: 'scenario.outbound_path',
    step,
    label: 'How do the machines reach Azure?',
    help: 'The path every machine and the Arc resource bridge use for outbound traffic.',
    learnUrl: learn.decision10,
    owner: 'network',
    kind: 'choice',
    options: [
      { value: 'direct', label: 'Direct', description: 'Outbound through the firewall to the required endpoints.' },
      { value: 'proxy', label: 'Through a proxy' },
      { value: 'arc_gateway', label: 'Arc gateway', description: 'Fewer endpoints to allow: traffic goes through an Arc gateway resource.', available: (d: Draft) => arcGatewayAvailable(d) },
      { value: 'proxy_arc_gateway', label: 'Proxy and Arc gateway', available: (d: Draft) => arcGatewayAvailable(d) },
      { value: 'private_path', label: 'Private path', description: 'Over ExpressRoute or site-to-site VPN, through an Azure firewall, with Arc gateway.', available: (d: Draft) => arcGatewayAvailable(d) },
    ],
    fixedWhen: (d) => (isDisconnected(d) ? { value: 'direct', reason: 'Disconnected operations have no outbound path to Azure.' } : undefined),
  },
  {
    id: 'scenario.deploy_method',
    path: 'scenario.deploy_method',
    step,
    label: 'How is the cluster deployed?',
    learnUrl: learn.deployIntro,
    owner: 'architect',
    kind: 'choice',
    options: [
      {
        value: 'portal',
        label: 'Azure portal',
        description: 'With disconnected operations, the local portal of the control plane.',
        available: (d: Draft) => portalBlocked(d) ?? true,
      },
      { value: 'arm', label: 'ARM template', description: 'Repeatable, and what the automation uses. Trailwright writes the parameter file.' },
    ],
    fixedWhen: (d) => {
      const why = portalBlocked(d);
      return why ? { value: 'arm', reason: why } : undefined;
    },
    recommended: () => ({ value: 'arm', reason: 'An ARM deployment is repeatable and uses the same file as the automation.' }),
  },
];
