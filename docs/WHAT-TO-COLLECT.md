# What an Azure Local deployment needs, what Trailwright collects, and what hardware discovery can fill in

Trailwright is where the design questions are asked. The tools after it (azurelocal-ztp, the toolkit's OS configuration, ARM Validate and Deploy, Sonar) all read one file, `infrastructure.yml`, whose schema is generated from the toolkit's master variable registry (`config/variables/schema/master-registry.yaml` in azurelocal-toolkit; registry first). This page lists every item that file needs, says whether Trailwright asks for it, and marks the items that the toolkit's Redfish hardware discovery (`Invoke-HardwareDiscovery.ps1`) can read from the machines instead of you typing them.

**Hardware discovery.** `Invoke-HardwareDiscovery.ps1` (azurelocal-toolkit, Phase 04 Phase 01 Task 02) reads each machine's BMC over Redfish, read only, from the management host (PowerShell 7, the `powershell-yaml` module, TCP 443 to each BMC, a BMC login from Key Vault). **Dell iDRAC only in this phase; HPE iLO and Lenovo XCC are planned.** It writes one JSON file per machine and `infrastructure.discovered.yml`, and can write the serial numbers and port MACs into `infrastructure.yml`. It cannot read roles, IP addresses or VLANs: those are design decisions. It cannot read or download the Solution Builder Extension package either: that is a vendor download you place on a share.

Trailwright shows the note **"can be collected by hardware discovery (Invoke-HardwareDiscovery.ps1)"** on the Hardware screen (a banner and one note per node serial number) and above the port planner. In the question catalog (`src/questions/catalog`) the questions it applies to carry `discovery: true`.

## Coverage

State of the list below on the day this page was written. "Asked" means a Trailwright question or screen collects it. "Exported" means Trailwright writes it into a file the tools read.

| Item the file needs | Key (schema 5.x) | Asked | Discovery can collect it | Gap |
| --- | --- | --- | --- | --- |
| Sites: name, code, location, time zone | `site.*` | Yes | No | |
| Machines: name, count | `nodes[].name` | Yes | No | |
| Serial number (Dell service tag) | `nodes[].serial_number` | Yes | **Yes** (Redfish `SKU`) | |
| BMC address | `nodes[].bmc.ip_address` | Yes | No (it is the input of discovery) | |
| BMC kind (iDRAC, iLO, XCC) and login | `nodes[].bmc.type`, `hardware.bmc.*` | Login only | No | The BMC kind is not asked |
| BMC MAC | not in the schema | No | **Yes** | |
| Model, vendor | `hardware.vendor`, `hardware.model` | Yes | **Yes** (model) | |
| Cores and memory | `hardware.cpu_cores`, `hardware.memory_gib` | Yes | **Yes** (processors, memory) | |
| Drives: capacity and cache media, count, size; BOSS card | `hardware.drives.*` | Yes (BOSS not asked) | **Yes** (drives, controllers, BOSS and its virtual disk) | BOSS state has no key |
| Firmware and BIOS versions | none (discovery JSON only) | No | **Yes** | No key in the schema; goes to the OEM support matrix check |
| BIOS settings | `hardware.bios`, `hardware.bios_during_provisioning`, `nodes[].bios*` | No | **Yes** (current values) | Not asked: the ZTP BIOS actions come from the file |
| MAC of every port | `nodes[].network_adapters[].mac_address` | Management port only | **Yes** | The port planner has no MAC column |
| NIC model, slot, link state, speed | `nodes[].network_adapters[].model`, `slot`, `speed_gbps` | Speed and RDMA per port, by OS name | **Yes** | |
| Ports, roles, IP assignment, IP, VLAN per port | `nodes[].network_adapters[].roles`, `ip_assignment`, `ip_address`, `vlan_*` | Roles and intents per port (without a MAC); management IP | No (design) | Per-port IP assignment, gateway, DNS, VLAN not asked |
| Which port is the management port | the port with role `management` | Yes (MAC) | **Yes** (a suggestion you confirm) | |
| Maintenance address, provisioning network, DHCP range | `nodes[].maintenance_address`, `networking.management.provisioning_*` | No | No | Not asked (ZTP scans when empty) |
| Management network: subnet, gateway, VLAN, DNS, NTP | `networking.management.*`, `networking.ntp_servers` | Yes | No | `static_method`, `site_ip_range` not asked |
| Infrastructure IP pool | `networking.management.infrastructure_pool.*` | Yes | No | |
| Intents, storage networks, VLANs, QoS and adapter overrides | `networking.intents[]`, `networking.storage.*`, `networking.vlans[]` | Yes (overrides: a switch, not the values) | No | |
| Active Directory: domain, OU, domain controllers, LCM user, groups | `identity.active_directory.*` | Yes | No | Domain join account and local admin members not asked |
| Identity model (Active Directory or local) | `scenario.identity`, `identity.local_identity.*` | Yes | No | |
| Local administrator | `identity.local_admin.*` | Yes (secrets as Key Vault references) | No | |
| Azure ids: tenant, subscription, resource group, region, custom location | `azure.*` | Yes | No | |
| Key Vaults and secret references | `key_vaults[]`, `cluster.key_vault.*` | Yes | No | |
| Storage architecture, S2D volumes and resiliency | `scenario.storage_architecture`, `storage.volumes[]` | Yes | No | |
| SAN: type `fibre_channel` or `iscsi`, LUNs, infrastructure LUN IDs | `storage.san.*` | Yes | No | |
| SAN host side: HBAs, WWPNs, fabric, initiator IQN | `nodes[].san.hbas[]`, `nodes[].san.initiator_iqn` | No | Not yet (HBA ports are PCIe devices discovery lists) | Not asked |
| Outbound path: direct, proxy, Arc gateway, private path | `scenario.outbound_path`, `networking.outbound.*` | Yes | No | |
| Simplified provisioning: OS version, ISO, admin, media share, site | `provisioning.*` | Yes | No | |
| OEM Solution Builder Extension (SBE) package: is it required, where is it (share), the read account (Key Vault reference), build-time side-load | `hardware.sbe.requirement`, `not_applicable_reason`, `source_path`, `source_username`, `source_password`, `package_sha256`, `package_size_bytes`, `delivery` | Yes | No (the package is a vendor download, not on the BMC) | A requirement; installing it during the build is optional and off. See below |
| Security, SDN, operations, disconnected operations | `security.*`, `sdn.*`, `operations.*`, `disconnected.*` | Yes | No | |
| ARM run settings (timeouts, approval, resume) | `deployment.*` | No | No | Not asked |
| Environment class (remote management security profile) | `scenario.environment_class` | No | No | Not asked |

## The Solution Builder Extension package is a requirement

Download your hardware vendor's Solution Builder Extension package for your model and the Azure Local version you deploy. It is a requirement: you need it to update the cluster, and the automation reads it from a share and checks it before the cluster is created. Installing it during the build is optional (off by default).

Trailwright asks: where the package is (`hardware.sbe.source_path`, a share or folder), whether the requirement applies (`hardware.sbe.requirement`: `required`, or `not_applicable` with `not_applicable_reason`, for example hardware without an SBE) and whether to side-load it at build time (`hardware.sbe.delivery`: `skip` by default, `winrm_copy` or `node_pull`). A read account is `source_username` with `source_password` as a Key Vault reference (`keyvault://<vault>/<secret>`), never a typed value. `package_sha256` and `package_size_bytes` are optional. The key names are the toolkit master registry's.

Vendor differences are not verified here: the question is vendor-neutral. Dell AX and MC need a login-gated download from Dell support. See [Solution Builder Extension updates for your Azure Local](https://learn.microsoft.com/azure/azure-local/update/solution-builder-extension). The design offers `vendor` (the schema default since 5.6.28, and the default of a new design), `required` and `not_applicable`. With `vendor` the automation's vendor catalog decides from `hardware.vendor`: required for Dell, HPE and DataON (a manual download), not required by default for Lenovo (the cluster downloads it). The hardware screen shows what that comes to; SBE-001 warns while a required package has no location, and SBE-005 asks the design to state the answer when the catalog cannot.

## Gaps to close

These are documented here rather than patched, because each needs the schema copy and the exports updated together.

1. **The schema copy.** `apps/trailwright/src/infra/infrastructure.schema.json` is the toolkit's generated schema, synced at 5.6.31 (`config/variables/schema/infrastructure.schema.json`) with `npm run schema:sync` (from `apps/trailwright`, `AZL_TOOLKIT_ROOT` set; it also regenerates the types); sync it again when the toolkit moves, and `node scripts/sync-schema.mjs --toolkit <checkout> --check` shows whether a copy has drifted. `public/schema/infrastructure.schema.json` is the same file, published with the site.
2. **Two sources for one file.** The screens' project model writes most of `infrastructure.yml`; the catalog questions the screens do not ask are shown under each screen and their answers are merged in, only where they apply (see [INFRASTRUCTURE-YML.md](INFRASTRUCTURE-YML.md)). Moving the screens themselves onto the catalog, so one engine asks everything, is still open.
3. **Per-port data.** The export writes `nodes[].network_adapters[]` from the network cards of the design (name, slot, port index, make, model, speed, RDMA, roles, and for the management port the address and MAC). The MACs of the other ports are not known to a design: the file's scope is `trailwright`, a planning scope that does not require them, and hardware discovery fills them. Still open: VLAN mode and ID per port, and a "from discovery" import of `<ServiceTag>.json` or `infrastructure.discovered.yml` so MACs and models do not have to be typed.
4. **Questions missing for schema 5.3 to 5.6.** BMC kind, `static_method`, `site_ip_range`, `maintenance_address`, BIOS settings, the SAN host side (HBA slot, type, WWPNs, fabric, IQN), `deployment.*`, `scenario.environment_class`, the domain join account.
5. **Questions missing for schema 5.6.17 to 5.6.28.** None of these keys is in the toolkit's Trailwright template, so none is required of Trailwright: the SBE partner properties and credentials (`hardware.sbe.partner_properties[]`, `partner_credentials[]`), the update after the deployment (`operations.updates.*`), the security baseline settings (`security.baseline_settings[]`), pre-created computer objects (`identity.active_directory.precreate_computer_objects`), the ISO address for the BMC (`provisioning.iso.image_uri`), and the landing zone keys (`management_groups[].role`, `subscriptions[].billing_scope` and `workload`, `network_security_groups[]`, the peering options of `networks[]`, `connectivity.bastion.network`, `nat_gateway`, `vpn_gateway.point_to_site.*`, `azure.automation_identity.object_id`), the pipeline runner label and approval environments (`devops.pipelines.runner_label`, `environments.*`, 5.6.25), the Azure DevOps service connection and variable group names (`devops.pipelines.service_connection`, `variable_group`, 5.6.27), and the 5.6.28 keys: the Active Directory functional levels and DNS forwarders (`identity.active_directory.*`), the Key Vault retention and allowed address ranges (`key_vaults[]`), the Defender for Cloud alert keys (`security.defender_for_cloud.*`), the switch MTU, ports and HA pair (`network_devices[]`), the automation identity's resource group roles (`azure.automation_identity.resource_group_roles[]`), the landing zone policy assignments, public IP names and VM disk and domain controller keys (`landing_zone.*`), and the pipeline paths, tool versions, Terraform state, runner, runner network and runner access keys (`devops.*`). The `vendor` value of `hardware.sbe.requirement` (5.6.28) is offered and is the default.
6. **Import from discovery.** An import button for the discovery output (like the Surveyor import) would turn every "can be collected" note into one click.

## Prerequisites

Node.js 22.13 or later and npm (the app runs in the browser; nothing is sent to a server and Trailwright never stores a secret). Tests: `npm test` (Vitest), `npm run test:browser` (Playwright, installs a browser). No Azure access, no PowerShell, no credentials. To run hardware discovery you need the toolkit's prerequisites (PowerShell 7, `powershell-yaml`, TCP 443 to each BMC), see azurelocal-toolkit `scripts/common/idrac-management/README.md`.
