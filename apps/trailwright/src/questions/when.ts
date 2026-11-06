// The conditions the catalog uses, in one place, so every question reads the scenario the same way.
import type { Draft } from '../infra/types';

export const nodeCount = (d: Draft): number => (Array.isArray(d.nodes) ? d.nodes.length : 0);
export const sc = (d: Draft) => d.scenario ?? {};

export const isAd = (d: Draft) => sc(d).identity === 'active_directory';
export const isLocalIdentity = (d: Draft) => sc(d).identity === 'local_identity';
export const usesS2d = (d: Draft) => sc(d).storage_architecture === 's2d' || sc(d).storage_architecture === 'hybrid';
export const usesSan = (d: Draft) => sc(d).storage_architecture === 'san' || sc(d).storage_architecture === 'hybrid';
export const isSingle = (d: Draft) => nodeCount(d) === 1;
export const isSwitchless = (d: Draft) => sc(d).storage_connectivity === 'switchless';
export const isRackAware = (d: Draft) => sc(d).topology === 'rack_aware';
export const isDisconnected = (d: Draft) => sc(d).connectivity === 'disconnected';
export const isGovernment = (d: Draft) => sc(d).cloud === 'government';
export const usesProxy = (d: Draft) => sc(d).outbound_path === 'proxy' || sc(d).outbound_path === 'proxy_arc_gateway';
export const usesArcGateway = (d: Draft) => sc(d).outbound_path === 'arc_gateway' || sc(d).outbound_path === 'proxy_arc_gateway';
export const usesPrivatePath = (d: Draft) => sc(d).outbound_path === 'private_path';
export const isSimplified = (d: Draft) => sc(d).os_install === 'simplified';
export const isIso = (d: Draft) => sc(d).os_install === 'iso';
export const isArm = (d: Draft) => sc(d).deploy_method === 'arm';
// A storage network exists when Storage Spaces Direct runs on more than one machine.
export const hasStorageNetwork = (d: Draft) => usesS2d(d) && nodeCount(d) > 1;
export const storageAutoIpOff = (d: Draft) => hasStorageNetwork(d) && d.networking?.storage?.auto_ip === false;
export const usesDhcp = (d: Draft) => d.networking?.management?.use_dhcp === true;
export const witnessType = (d: Draft) => d.cluster?.witness?.type;
export const monitoringOn = (d: Draft) => d.operations?.monitoring?.enabled === true;
export const backupOn = (d: Draft) => d.operations?.backup?.enabled === true;
export const drOn = (d: Draft) => !!d.operations?.disaster_recovery?.method && d.operations?.disaster_recovery?.method !== 'none';
// Optional parts the user turns on: the Azure foundation and CI/CD.
export const wantsLandingZone = (d: Draft) => d.landing_zone !== undefined;
export const wantsDevops = (d: Draft) => d.devops !== undefined;

// Microsoft Learn pages the catalog cites. No view parameter: the links follow the current release.
const L = 'https://learn.microsoft.com/azure/azure-local';
export const learn = {
  deployIntro: `${L}/deploy/deployment-introduction#validated-network-topologies`,
  networkConsiderations: `${L}/plan/cloud-deployment-network-considerations`,
  decision1: `${L}/plan/cloud-deployment-network-considerations#decision-1-determine-connectivity-mode`,
  decision2: `${L}/plan/cloud-deployment-network-considerations#decision-2-determine-architecture`,
  decision3: `${L}/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology`,
  decision4: `${L}/plan/cloud-deployment-network-considerations#decision-4-determine-cluster-size`,
  decision6: `${L}/plan/cloud-deployment-network-considerations#decision-6-determine-network-adapter-ports-and-configuration`,
  decision11: `${L}/plan/cloud-deployment-network-considerations#decision-11-determine-software-defined-networking-sdn`,
  decision5: `${L}/plan/cloud-deployment-network-considerations#decision-5-determine-storage-connectivity`,
  decision7: `${L}/plan/cloud-deployment-network-considerations#decision-7-determine-network-traffic-intents`,
  decision8: `${L}/plan/cloud-deployment-network-considerations#decision-8-determine-management-ips-and-infrastructure-network`,
  decision10: `${L}/plan/cloud-deployment-network-considerations#decision-10-determine-outbound-connectivity`,
  customIp: `${L}/plan/cloud-deployment-network-considerations#custom-ips-for-storage`,
  localIdentity: `${L}/deploy/deployment-local-identity-with-key-vault`,
  localIdentityOverview: `${L}/deploy/deployment-local-identity-with-key-vault-overview`,
  adPrep: `${L}/deploy/deployment-prep-active-directory`,
  prerequisites: `${L}/deploy/deployment-prerequisites`,
  rackAware: `${L}/concepts/rack-aware-cluster-requirements`,
  disaggregated: `${L}/plan/fiber-channel-no-backup-disaggregated-pattern`,
  disconnected: `${L}/manage/disconnected-operations-overview`,
  simplified: `${L}/deploy/simplified-machine-provisioning`,
  installOs: `${L}/deploy/deployment-install-os`,
  arcGateway: `${L}/deploy/deployment-azure-arc-gateway-overview#supported-and-unsupported-scenarios`,
  privatePath: `${L}/deploy/deployment-with-azure-arc-gateway-private-path`,
  arm: `${L}/deploy/deployment-azure-resource-manager-template#arm-template-parameters-reference`,
  portal: `${L}/deploy/deploy-via-portal`,
  security: `${L}/manage/manage-secure-baseline#configure-security-settings-during-deployment`,
  systemRequirements: `${L}/concepts/system-requirements-23h2`,
  networkAtc: `${L}/concepts/network-atc-overview`,
  hostNetwork: `${L}/concepts/host-network-requirements`,
  sdn: `${L}/concepts/sdn-overview`,
  insights: `${L}/manage/monitor-single-23h2#enable-insights`,
  asr: `${L}/manage/azure-site-recovery`,
  quorum: 'https://learn.microsoft.com/windows-server/storage/storage-spaces/quorum#cluster-quorum-overview',
  planVolumes: 'https://learn.microsoft.com/windows-server/storage/storage-spaces/plan-volumes#choosing-the-resiliency-type',
};
