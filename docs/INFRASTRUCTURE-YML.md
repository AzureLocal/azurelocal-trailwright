# infrastructure.yml field reference

`infrastructure.yml` is the file the Azure Local Toolkit, azurelocal-ztp and the other Azure Local tools read. Trailwright writes it in the layout of the toolkit's schema 5, with `_metadata.schema_version: 5.6.10`. The key names and the nesting are the schema's; Trailwright adds none of its own.

The contract is the toolkit's JSON Schema (2020-12) for the file, `config/variables/schema/infrastructure.schema.json` in azurelocal-toolkit. This repository holds a copy at [`apps/trailwright/src/infra/infrastructure.schema.json`](../apps/trailwright/src/infra/infrastructure.schema.json) (`SCHEMA_VERSION` in `src/infra/types.ts` names its version) and publishes the same file with the site at `/schema/infrastructure.schema.json` (from `public/schema`). The toolkit's `templates/infrastructure.master.yml` shows every key with a comment and an example value.

A unit test (`tests/infrastructureSchema.test.ts`) builds the export for every design in `tests/exportProjects.ts` and for every choice a design can make, and validates each against the schema. `npm run build` runs that test first, so the build fails when the exporter and the schema drift apart. The exporter is typed with the types generated from the schema (`npm run schema:types`), so a key the schema does not have does not compile.

## Rules of the export

- **Only what the design knows is written.** A value the design does not hold is left out, never guessed. A design that is not finished therefore gives a file the schema reports as incomplete, and the report names the missing keys.
- **Secrets are never values.** Credentials are `keyvault://<vault>/<secret>` references. The vault is the Key Vault of the instance; the secret names are the ones the toolkit's master template uses (`local-admin-password`, `lcm-password`, `provisioning-admin-password`). Without a vault name the reference is left out.
- **Sections follow the scenario.** A SAN design has no Storage Spaces Direct keys, a local identity design has no `identity.active_directory`, and `disconnected` is written only for disconnected operations.

To deploy with the NIC deployment automation, use the **Environment file (deploy automation)** or **Terraform variables** export instead; see [ENVIRONMENT-FILE.md](ENVIRONMENT-FILE.md). The ARM parameters are their own exports and are no longer repeated in this file.

## Where each value goes

| Section | Keys Trailwright writes | Source in the design |
|---|---|---|
| `_metadata` | `schema_version` (`5.6.10`), `scope` (`full`), `file_version` (`1.0.0`), `generated_by` (`azurelocal-trailwright`) | Fixed |
| `scenario` | `identity`, `storage_architecture`, `storage_connectivity`, `topology`, `connectivity`, `cloud`, `outbound_path`, `os_install`, `deploy_method` | Identity, architecture, network design, hardware, connectivity mode, outbound connectivity, provisioning. A SAN design and a single machine are `switched` |
| `site` | `customer`, `owner`, `name`, `code`; `time_zone` with simplified provisioning | Project: customer, owner, site name, site code; the site time zone of simplified provisioning |
| `environment` | `name`, `type` | The project name as lowercase letters, digits and hyphens (at most 41 characters); Project: environment type |
| `azure` | `tenant_id`, `location`, `subscription_id`, `resource_group`, `hci_resource_provider_object_id`, `custom_location` | Azure resources |
| `key_vaults[]` | `name`, `subscription_id`, `resource_group`, `purpose` (`deployment`) | The Key Vault of the instance, in the subscription and resource group of the instance (the deployment creates it there) |
| `cluster` | `name`, `naming_prefix`, `witness.{type, storage_account, path}`, `key_vault.{name, create_new, soft_delete_retention_days}`, `diagnostics.{storage_account, logs_retention_days, storage_account_type}` | Azure resources: instance name (else the project name, as the ARM parameters), prefix, Key Vault, witness and diagnostic storage accounts. Witness type as in the ARM parameters: two machines get `cloud`; a file share witness is `file_share` with its path |
| `deployment` | `solution_version` | Project: the release build, when it is a full four-part build |
| `nodes[]` | `name`, `management.ip_address`, `serial_number`; `zone` for rack-aware (an empty zone is Zone1 for the first half, Zone2 for the second, as in the ARM parameters); `storage_ips` when storage Auto IP is off and every address is given; `management.mac_address` and `bmc.ip_address` with simplified provisioning | Hardware, management network, provisioning |
| `hardware` | `vendor`, `model`, `cpu_cores`, `memory_gib`, `sbe.*`, `network_cards[]` (`label`, `make`, `model`, `ports[]` with `name`, `speed_gbps`, `rdma`, `role`), `drives.{capacity, cache}` | Hardware: vendor and model (with simplified provisioning and neither given, the validated model chosen there); cores and memory when every machine has the same; the Solution Builder Extension; the network cards of the network design (cluster ports 1 and 2 are `cluster:a` and `cluster:b`); the drive layout for Storage Spaces Direct |
| `networking.management` | `subnet`, `gateway`, `vlan_id`, `dns_servers`, `use_dhcp`, `infrastructure_pool.{start, end}` | Management network. `subnet` is the CIDR of the gateway (else the pool start, else the first machine) with the subnet mask |
| `networking.intents[]` | `name`, `traffic`, `adapters`; `overrides.{qos, adapter, virtual_switch}` only for what the design overrides | Intents. Overrides are numbers and booleans; RDMA `Auto` writes no `network_direct_technology` |
| `networking.storage` | `auto_ip`, `switchless_links` (switchless), `tor_switches`, `layout`, `networks[]` (`name`, `adapter`, `vlan_id`, `subnet`) | Network design, storage VLANs and subnets. Storage Spaces Direct with more than one machine only |
| `networking.cluster_networks[]` | `name`, `adapter`, `vlan_id`, `subnet` | A SAN design: the standalone cluster ports and the cluster subnets, with the names and VLANs (1711, 1712) of the ARM parameters |
| `networking.vlans[]` | `name`, `id`, `subnet` | VLANs; `subnet` is the row of the IP plan with the same name |
| `networking.logical_networks[]` | `name`, `vlan_id`, `address_prefix`, `gateway`, `dns_servers`, `ip_pool.{start, end}` | Software defined networking: the logical networks, when SDN is on |
| `networking.outbound` | `proxy.url`; `arc_gateway.name`; `private_path.*` (`transport`, `virtual_network`, `workload_subnet`, `firewall_subnet`, `firewall_private_ip`, `firewall_port`, `arc_private_link_scope`, `proxy_bypass`) | Outbound connectivity, for the path chosen. The bypass text becomes a list |
| `identity` | `local_admin.{username, password}`; `active_directory.{domain_fqdn, ou_path, lcm_user.{username, password}}` or `local_identity.{dns_server_config, dns_zone, dns_forwarders}` | Identity. Passwords are Key Vault references |
| `storage` | `configuration_mode`, `volumes[]` (`name`, `size_gib`, `resiliency`) for Storage Spaces Direct; `san.{type, infra_volume_lun_id, performance_history_lun_id, luns[]}` for a SAN | Storage |
| `security` | `level`, `drift_control`, `credential_guard`, `smb_signing`, `smb_cluster_encryption`, `bitlocker_boot_volume`, `bitlocker_data_volumes`, `wdac`, `backup_key_vault`, `telemetry.{streaming_data, episodic_data_upload, eu_location}` | Security |
| `sdn` | `enabled`; when enabled `prefix`, `dns_records`, `default_access_policy` | Software defined networking |
| `operations` | `update_method`, `backup.{enabled, approach, solution}`, `disaster_recovery.method`, `monitoring.{enabled, log_analytics_workspace, workspace_resource_group, data_collection_rule, data_collection_endpoint, health_alerts, alert_email}` | Operations. The limited-connectivity PowerShell update method is `powershell`. `data_collection_rule` only for an existing rule, `data_collection_endpoint` only with private links |
| `provisioning` | `os_version`; with simplified provisioning `simplified.{site_name, resource_group, maintenance_iso, admin.{username, password}, media_share.{name, host}, ntp.{configuration, server}}` | Provisioning: the software version (else the release build), the site, the provisioning image and the SMB share. `admin.username` is the local administrator of the Identity step, as in the provisioning manifest; its password is a reference into the Key Vault for administrator credentials. A time server gives `ntp.configuration: Manual` |
| `disconnected` | `role`, `base_path`, `domain_suffix`, `ingress.*`, `management.*`, `dns_server`, `time_servers`, `identity.*`, `operator_subscription_name`, `resource_group`, `internal_ca` | Disconnected operations |
| `landing_zone.subscriptions[]` | `name`, `id`, `role` (`azure_local`) | Azure resources: the subscription name |

## What the design holds that has no key

These values stay in the project file and the handoff document; schema 5 has no key for them, so the export leaves them out.

- The release train (for example `2610`) without a full build, and the name of Microsoft's deployment template. The ARM parameters themselves are in the ARM and Bicep exports.
- Rack-aware uplink option, number of racks, ports per node, intent grouping, guest backup network, number of Fibre Channel HBA ports.
- Cores and memory when the machines differ, and the drive count of each node (the drive layout is written).
- Rows of the IP plan that have no VLAN of the same name.
- The proxy server of the simplified provisioning site, and the validated-hardware choice itself (it only stands in for vendor and model).
- Operations: the Update Manager switch, ReFS deduplication monitoring, and the note that Insights creates the data collection rule.
- Free-text notes. They are in the project JSON and the handoff document; never type a secret into a note.

## Required keys Trailwright cannot fill

The schema needs these and the design does not hold them. Add them to the file by hand.

- **A hybrid design:** `networking.cluster_networks` (the network design has cluster ports for a disaggregated design only).
- **Nodes and the cluster IP on DHCP:** `networking.management.gateway`, `networking.management.dns_servers` and each `nodes[].management.ip_address`. The management network step does not ask for them when DHCP is on.
- **Simplified provisioning:** the schema's ZTP scope (`_metadata.scope: ztp`) also needs `hardware.bmc` (the BMC login). Trailwright writes the `full` scope, where it is optional.

Not required, and not asked: every other key of the schema, for example `site.location`, `networking.oob`, `networking.ntp_servers`, `nodes[].network_adapters`, `nodes[].san`, `storage.san.array`, `deployment.*` run settings, `os_configuration`, `network_devices`, `devops` and the rest of `landing_zone`. See [WHAT-TO-COLLECT.md](WHAT-TO-COLLECT.md).
