/* Generated from infrastructure.schema.json (schema 5, azurelocal-toolkit). Do not edit: run npm run schema:types. */

export type Ipv4 = string;
/**
 * A Fibre Channel World Wide Port Name: 16 hexadecimal digits, as 8 colon-separated pairs (50:00:09:72:08:12:34:56) or without colons.
 */
export type Wwpn = string;
/**
 * Up to 15 letters, digits and hyphens.
 */
export type NetbiosName = string;
/**
 * An iSCSI qualified name (iqn.yyyy-mm.reversed.domain[:identifier]), or an eui. or naa. name.
 */
export type IscsiName = string;
/**
 * An iSCSI target portal: an IPv4 address, optionally with :port (default 3260).
 */
export type IscsiPortal = string;
export type Cidr = string;
export type ResourceGroup = string;
export type Guid = string;
export type KeyVaultName = string;

/**
 * The one environment file for an Azure Local instance: the design choices, the machines, the networks, identity, Azure targets, provisioning (ISO or simplified machine provisioning with ZTP) and the cluster deployment. Every Azure Local tool reads this file: azurelocal-toolkit, azurelocal-ztp, Trailwright (writes it), Beacon, Sonar and Ranger. Keys are snake_case. Secrets are never values: they are keyvault://<vault>/<secret> references. Sections reject unknown keys; put anything else under extensions.
 */
export interface AzureLocalInfrastructureYml {
  /**
   * About this file.
   */
  _metadata: {
    /**
     * The schema version this file follows. Major 5. A minor version adds optional keys only; a major version can rename or remove keys. Each key's description says which version added it ('since'). Version history, in order: 5.2 adds nodes[].network_adapters, BIOS settings, the site IP range and the maintenance environment's network. 5.3 adds the BIOS phases (bios_during_provisioning), networking.management.static_method and provisioning_dhcp_range, nodes[].maintenance_address, provisioning.simplified.maintenance_password, and the SAN details (storage.san.array, fibre_channel and iscsi, nodes[].san); it also adds _metadata.scope: ztp for a file that holds only what azurelocal-ztp reads. 5.4 puts every azurelocal-ztp setting in this schema, so no tool keeps a key of its own: the BIOS actions ZTP derives from the hardware inventory (provisioning.simplified.isolate_san_adapters and enable_embedded_nics, nodes[].san.hbas[].type), the Azure resource choices, timeouts, retries, the USB image and the maintenance environment of simplified provisioning, and hardware.bmc.rfs_write_attribute and verify_certificate. 5.4.1 adds provisioning.simplified.timeouts.adapters_minutes. 5.4.2 adds hardware.sbe.delivery and node_pull_url (how the SBE package reaches the nodes during OS configuration). 5.4.3 adds os_configuration.clear_storage, the switch that lets the OS configuration run wipe leftover local storage. 5.4.4 adds os_configuration.network (confirm_minutes, stable_seconds: the commit-confirmed window of a guarded network change) and os_configuration.remoting with transport, bootstrap_transport and allowed_source_cidrs. 5.5 puts the CI/CD infrastructure in devops (the project, its settings, the environments, the Azure sign-in, the runners with their network and roles) and adds the domain join (identity.active_directory.domain_join_account, join_options, local_admin_members). 5.6 adds the deployment block (the timeouts, polling, approval and resume of the toolkit's Validate and Deploy run) and the remote management security profile: scenario.environment_class, the profile keys of os_configuration.remoting (allow_any_source, trusted_hosts, use_https, isolation_confirmed, certificate; bootstrap_transport also takes smb and auto) and a purpose marker on networking.logical_networks[] and networking.cluster_networks[] (the values management and oob of networking.vlans[].purpose also count). A missing scenario.environment_class means production. 5.6.1 adds identity.active_directory.security_groups[].local_groups. 5.6.2 identifies the adapters of nodes[].network_adapters[] by hardware facts (mac_address is required; port_index, pci_location, vendor, os_name_override and allowed_vlans are optional). 5.6.3 adds enabled, ip_allocation_method and nsg_name to networking.logical_networks[]. A file written for 5.6.0 stays valid: a minor version adds optional keys only, except that 5.6.2 requires the MAC of every adapter. 5.6.4 adds the SBE package as a requirement: hardware.sbe.requirement and not_applicable_reason (whether the OEM package is required, or not applicable with a reason), source_path (the share or folder where the downloaded package is available to the automation), source_username and source_password (the read credential, a Key Vault reference), and the optional package_sha256 and package_size_bytes. The build-time side-load (delivery) is unchanged and stays off by default. 5.6.5 adds landing_zone.policy (required_tags, management_group): the tag names and the management group of the Tier 1 tag policy, which the Azure Policy task assigns in audit mode. 5.6.6 adds operations.monitoring.action_group: the name of the Azure Monitor action group that the alerting task creates. 5.6.7 adds security.defender_for_cloud: the free level of Microsoft Defender for Cloud that Azure Local needs. 5.6.8 adds security.defender_for_cloud.security_contact_email. 5.6.9 adds the storage keys the volume and storage path scripts read: storage.pool, storage.csv, storage.paths and, on storage.volumes, provisioning_type, file_system, parity_percent, media_type and deduplication. 5.6.10 adds what the SAN deployment needs: networking.cluster_network_properties and, for iSCSI, storage.san.iscsi.networks, jumbo_packet and chap.mutual. 5.6.11 adds what the logical network, network security group and VM image scripts read: networking.network_security_groups (name and rules with name, priority, direction, access, protocol, source and destination address prefixes and port ranges, description), networking.logical_networks[].vm_switch_name and storage.vm_images (name, os_type, publisher, offer, sku, version, storage_path). 5.6.12 adds operations.monitoring.retention_days and removes operations.notifications.teams_webhook and operations.monitoring.health_alerts. 5.6.13 adds the secrets section (provider, file directory, command) and lets a secret reference use the env://, file:// and command:// forms besides keyvault://. 5.6.14 adds hardware.inventory (output_directory, file_name_prefix, format, timeout_seconds), which Get-HardwareInventory.ps1 reads. 5.6.15 adds what Enable-ArcSdn.ps1 reads: sdn.acknowledge_maintenance_window and sdn.acknowledge_dns_record, the rules of sdn.prefix, and sdn.dns_records (read now); it removes sdn.default_access_policy. 5.6.16 adds storage.san.luns[].unique_id (how New-SanVolume.ps1 finds the disk of a LUN) and removes security.backup_key_vault. 5.6.17 adds landing_zone.management_groups[].role and azure.automation_identity.object_id (the two keys the Terraform landing zone and identity modules need) and makes the Terraform and Ansible code readers of the file (New-IacVariableFiles.ps1). 5.6.19 adds provisioning.iso.image_uri (the address Invoke-MountGoldImageISO.ps1 gives the BMC virtual media), landing_zone.subscriptions[].billing_scope and workload, point_to_site.protocols, root_certificate_name and root_certificate, bastion.network and the nat_gateway object of landing_zone.connectivity, and a list of values for landing_zone.virtual_machines[].os. 5.6.20 adds operations.updates.install_after_deployment and operations.updates.target_version (read by Start-SolutionUpdateAfterDeployment.ps1) and removes keys that no tool read (see MIGRATION, To 5.6.20). 5.6.21 adds landing_zone.network_security_groups[] (the network security groups of the Azure landing zone networks: name and rules, created by New-LandingZoneNsg.ps1) and security.baseline_settings[] (type, name, value and acknowledge_weaker_security of the security baseline settings that Set-SecurityBaselines.ps1 changes with Set-AzsSecurity). 5.6.23 adds landing_zone.networks[].allow_forwarded_traffic, allow_gateway_transit and use_remote_gateways (the options of the virtual network peerings Deploy-VirtualNetworks.ps1 makes) and identity.active_directory.precreate_computer_objects (Set-ADConfiguration.ps1 pre-creates the computer objects of the machines and the cluster). 5.6.24 adds hardware.sbe.partner_properties[] (name and value pairs that the hardware vendor's SBE asks for; ARM partnerProperties) and hardware.sbe.partner_credentials[] (secret_name and secret: the secret that the SBE needs, which the deployment template writes into the cluster Key Vault under secret_name; secret is a reference, never the value; ARM partnerCredentiallist). 5.6.25 adds devops.pipelines.runner_label and devops.pipelines.environments.* (the runner label and the approval environment of each of the toolkit's pipelines; task 05 sets them as pipeline variables). 5.6.26 removes registry entries that only the old variables.yml layout had (environment.env_name, env_type, env_owner and env_description, site.env_name and identity.active_directory.security_groups_by_role); a file never accepted them, so a file of any 5.6 version stays valid. 5.6.27 adds devops.pipelines.service_connection and devops.pipelines.variable_group (Azure DevOps: the names of the service connection and the variable group task 05 creates and the pipelines take as run parameters); a file without them stays valid. 5.6.28 adds the keys every pipeline, Ansible role, Terraform module and config template reads instead of a value of its own (devops.pipelines.infrastructure_file, handoff_path and tool_versions, devops.state.*, devops.runners[].*, devops.runner_network.*, devops.runner_access, identity.active_directory functional levels and DNS forwarders, landing_zone connectivity, virtual machine, policy and key vault keys, security.defender_for_cloud alert keys, network_devices[] ports, MTU and HA, hardware.sbe.requirement vendor); every key is optional, so a file of any 5.6 version stays valid. 5.6.29 adds deployment.events_directory (the one folder where the toolkit runs write their event feeds and Sonar reads them); a file without it stays valid. 5.6.30 adds landing_zone.budgets[] (the Cost Management budgets that Deploy-CostBudgets.ps1 creates: name, scope, subscription, resource_group, amount, time_grain, start_date, end_date, thresholds, forecast_thresholds, contact_emails); a file without it stays valid. 5.6.31 adds operations.monitoring.action_group_enable_if_disabled (whether the alerting task enables an action group that exists but is disabled; default false, report only); a file without it stays valid. The current version is 5.6.31.
     */
    schema_version: string;
    /**
     * Schema 5.3. full (default): the whole instance, so every design section is required (scenario, environment, cluster, networking.intents, identity and the sections a scenario choice makes required). ztp: a file for azurelocal-ztp on its own, with no automation after it. It holds only what ZTP reads, so the cluster deployment's sections (cluster, intents, storage, identity) are not required. Use infrastructure.ztp.example.yml to start one. To grow it into the full file, add the rest and set scope to full (or remove the key).
     */
    scope?: 'full' | 'ztp';
    /**
     * Your own version of this file.
     */
    file_version?: string;
    /**
     * Date of the last change, YYYY-MM-DD.
     */
    last_updated?: string;
    /**
     * The tool that wrote the file, for example azurelocal-trailwright 1.1.0. Empty when written by hand.
     */
    generated_by?: string;
    /**
     * Free text about this file for the people who keep it. Not read by the tools.
     */
    notes?: string;
  };
  /**
   * The design choices. Every other section is read in the light of these: a choice makes its section required, and tools pick their path from here. All of them are required, so nothing is assumed.
   */
  scenario?: {
    /**
     * active_directory: machines join an AD domain (needs identity.active_directory). local_identity: no AD, secrets in Key Vault (needs identity.local_identity). https://learn.microsoft.com/azure/azure-local/deploy/deployment-local-identity-with-key-vault
     */
    identity?: 'active_directory' | 'local_identity';
    /**
     * s2d: Storage Spaces Direct (hyperconverged). san: external SAN only (disaggregated; needs storage.san). hybrid: both (S2D plus a SAN). san and hybrid TELL THE SOLUTION THERE IS A SAN: the OS configuration then does the host-side SAN work itself (the Mpio step: MPIO, MSDSM hardware ID, the MPIO claim of the device (mpclaim -n -i -d), load balance policy, vendor MPIO settings; for iSCSI the initiator service, auto-claim, portals and sessions, except for a san design on Azure Local 2610 or later, where the deployment configures iSCSI and Microsoft Learn says not to enable it before) and checks each LUN is seen once (SanVerify). storage.san.type says whether the SAN is fibre_channel or iscsi. On every node the OS configuration also looks, read only, for FC or iSCSI LUNs that are visible while the file declares no SAN, and reports them. https://learn.microsoft.com/azure/azure-local/deploy/enable-external-storage
     */
    storage_architecture?: 's2d' | 'san' | 'hybrid';
    /**
     * switched: storage traffic goes through top-of-rack switches. switchless: machines are cabled directly to each other for storage. A single machine uses switched.
     */
    storage_connectivity?: 'switched' | 'switchless';
    /**
     * standard, or rack_aware (machines split across two local availability zones; every node needs a zone).
     */
    topology?: 'standard' | 'rack_aware';
    /**
     * connected to Azure, or disconnected operations (needs the disconnected section).
     */
    connectivity?: 'connected' | 'disconnected';
    /**
     * Azure public cloud or Azure Government.
     */
    cloud?: 'public' | 'government';
    /**
     * How the machines reach Azure. Paths with a proxy need networking.outbound.proxy; paths with Arc gateway need networking.outbound.arc_gateway; private_path needs networking.outbound.private_path.
     */
    outbound_path?: 'direct' | 'proxy' | 'arc_gateway' | 'proxy_arc_gateway' | 'private_path';
    /**
     * iso: the OS is installed from an ISO (by hand or out-of-band). simplified: simplified machine provisioning from Azure, which azurelocal-ztp automates (needs provisioning.simplified, and on every node a serial number, a BMC address and the management MAC: management.mac_address, or from 5.2 a mac_address on every network_adapters port with role management and at least one port with role provisioning).
     */
    os_install?: 'iso' | 'simplified';
    /**
     * How the cluster is deployed: the Azure portal or an ARM template. Documentation only; not read by the tools. The toolkit deploys with the ARM template; no tool branches on this key.
     */
    deploy_method?: 'portal' | 'arm';
    /**
     * What kind of environment this is. It picks the remote management security profile of the OS configuration run (WinRM, RDP and ICMP scope on the nodes, HTTP or HTTPS, the TrustedHosts policy of the machine running the automation, the one-time Arc bootstrap): see docs/os-configuration-and-arm-deployment.md and config/remoting-profiles.json. lab and test are relaxed with the wildcard (TrustedHosts '*', sources Any, HTTP 5985 allowed) and a warning says so; dev, production and dmz are strict. It also decides purge protection of the Key Vaults that Deploy-KeyVaults.ps1 and the Terraform identity module create: off in lab, test and dev (a vault there has to be removable), on in every other class. Optional. Missing means production (fail closed); another value is rejected. (since 5.6)
     */
    environment_class?: 'lab' | 'test' | 'dev' | 'production' | 'dmz';
  };
  /**
   * Where the machines are.
   */
  site?: {
    /**
     * Name of the customer or organization the site belongs to. Read by Set-CustomerTransfer.ps1 (it names the customer in the transfer record) and by New-DeploymentDocumentation.ps1 (it puts the customer name in the deployment document).
     */
    customer?: string;
    /**
     * Windows time zone ID of the site, for example UTC or Eastern Standard Time. Simplified provisioning sets it on the site. The OS configuration's Time step sets it on every node (Set-TimeZone, only when it differs) and leaves the zone alone when the key is empty. Learn: the Configurator app sets the time zone with the time server. New-SwitchConfiguration.ps1 writes its UTC offset into the switch configuration (Dell OS10: clock timezone) and needs it for a switch.
     */
    time_zone?: string;
    /**
     * Short site code, 2 to 8 uppercase letters or digits.
     */
    code: string;
    /**
     * Physical location, for example a city.
     */
    location?: string;
    /**
     * Short code or name of the datacenter or room that holds the machines. Documentation only; not read by the tools.
     */
    datacenter?: string;
    /**
     * Display name of the site. Also the display name of the Microsoft.Edge site in simplified provisioning.
     */
    name: string;
    /**
     * Contact (a team mailbox, not a person) who owns the site. Documentation only; not read by the tools.
     */
    owner?: string;
  };
  /**
   * Which environment this file describes.
   */
  environment?: {
    /**
     * Environment identifier: lowercase letters, digits and hyphens. Documentation only; not read by the tools. It repeats site.name for the tools; Trailwright writes it.
     */
    name: string;
    /**
     * Class of the environment: lab, demo, poc, dev, test, stg or prd. Documentation only; not read by the tools: scenario.environment_class is the key that changes what the tools allow.
     */
    type: 'lab' | 'demo' | 'poc' | 'dev' | 'test' | 'stg' | 'prd';
    /**
     * Contact (a team mailbox) that owns the environment. Documentation only; not read by the tools.
     */
    owner?: string;
    /**
     * One sentence on what the environment is for. Documentation only; not read by the tools.
     */
    description?: string;
  };
  /**
   * Azure tags applied to the resources the tools create. A policy that requires tags isn't supported by simplified provisioning.
   */
  tags?: {
    /**
     * The value of the tag.
     */
    [k: string]: string;
  };
  /**
   * The Azure targets of the instance: tenant, region, and the subscription and resource group of the Arc machines, the cluster and (unless provisioning.simplified says otherwise) the site and edge machines.
   */
  azure?: {
    /**
     * Microsoft Entra tenant ID (GUID) of the subscription. Read it with (Get-AzContext).Tenant.Id or from the Microsoft Entra ID overview page in the Azure portal.
     */
    tenant_id: string;
    /**
     * Azure region, for example eastus. Simplified provisioning works only in eastus in the preview.
     */
    location: string;
    /**
     * Subscription ID (GUID) of the Arc machines and the cluster, and of the site and edge machines unless provisioning.simplified.subscription_id names another one. Read it with (Get-AzContext).Subscription.Id.
     */
    subscription_id: string;
    /**
     * Resource group of the Arc machines and the cluster: 1 to 90 characters (letters, digits, hyphen, underscore, period, parentheses). The Azure Local resource provider needs the Azure Connected Machine Resource Manager role on it; the ZTP template assigns that role.
     */
    resource_group: string;
    /**
     * Object ID of the Azure Local resource provider's service principal (application 1412d89f-b8a8-4111-b4fd-e82905cbd85d) in the tenant. Optional: tools look it up when they can read the directory.
     */
    hci_resource_provider_object_id?: string;
    /**
     * Name of the custom location the deployment creates.
     */
    custom_location?: string;
    /**
     * The identity that runs automation with no one signed in (pipelines, ZTP, the ARM deployment).
     */
    automation_identity?: {
      /**
       * The kind of identity that runs the automation: a managed identity (preferred, no secret to keep) or a service principal.
       */
      type: 'managed_identity' | 'service_principal';
      /**
       * Managed identity resource name, or the service principal's display name.
       */
      name: string;
      /**
       * Client (application) ID of the identity (GUID). Not a secret.
       */
      client_id?: string;
      /**
       * Object ID (GUID) of the identity's principal in Microsoft Entra ID. Not a secret. The Terraform identity module assigns the roles of the deployment identity to this ID. Read it from the identity in the Azure portal, or with Get-AzADServicePrincipal.
       */
      object_id?: string;
      /**
       * Subscription (GUID) that holds the identity.
       */
      subscription_id?: string;
      /**
       * Resource group that holds the identity.
       */
      resource_group?: string;
      /**
       * Schema 5.6.28. Roles of the automation identity at resource group scope, assigned by the Terraform identity module (the subscription roles are devops.authentication.roles). Each resource group is in the Azure Local subscription (azure.subscription_id).
       */
      resource_group_roles?: {
        /**
         * Name of the resource group.
         */
        resource_group: string;
        /**
         * Names of the roles, for example Contributor.
         *
         * @minItems 1
         */
        roles: [string, ...string[]];
      }[];
    };
  };
  /**
   * Every Key Vault that a keyvault:// reference in this file names, with where it is. Tools resolve references against this list, and grant roles on the vault from it.
   */
  key_vaults?: {
    /**
     * Key Vault name, as a keyvault://<name>/<secret> reference uses it: 3 to 24 characters, letters, digits and hyphens.
     */
    name: string;
    /**
     * Subscription (GUID) that holds the vault.
     */
    subscription_id: string;
    /**
     * Resource group that holds the vault.
     */
    resource_group: string;
    /**
     * What the vault holds, for example management, deployment or backup.
     */
    purpose?: string;
    /**
     * Schema 5.6.28. Days a deleted secret or the vault stays recoverable, 7 to 90 (Microsoft Learn: Azure Key Vault soft-delete overview). Default 90, the Azure default. The cluster vault takes cluster.key_vault.soft_delete_retention_days. Read by the Terraform identity module and by Deploy-KeyVaults.ps1 (task 10), which creates the vault with it.
     */
    soft_delete_retention_days?: number;
    /**
     * Schema 5.6.28. Public IP addresses or CIDR ranges that may reach the vault. Listed: the vault denies every other address (trusted Microsoft services pass); empty: the Azure default, all networks. Read for the platform vault (purpose management) by the Terraform identity module.
     */
    allowed_ip_ranges?: string[];
  }[];
  /**
   * Schema 5.6.13. Where the toolkit reads secrets from. Every secret in this file is a reference, never a value; a reference names its own provider in its scheme: keyvault://<vault>/<secret> (Azure Key Vault, the default), env://<VARIABLE_NAME>, file://<name> or command://<name>. One file can mix providers. A file or command reference holds a NAME only: the directory of the secret files and the command are set here, so a reference in a shared file cannot point a machine at an arbitrary path or run an arbitrary command. Optional; every key has a default. See docs/secret-references.md.
   */
  secrets?: {
    /**
     * Schema 5.6.13. The provider New-AzlSecretReference uses for a new reference when the caller does not name one. It does not change how an existing reference is read: that follows the reference's own scheme. Default keyvault.
     */
    provider?: 'keyvault' | 'env' | 'file' | 'command';
    /**
     * Schema 5.6.13. Settings of the file provider (file://<name>). Needed only when a reference uses it.
     */
    file?: {
      /**
       * Schema 5.6.13. The absolute path of the directory that holds the secret files. file://<name> reads the file <name> in it: one secret per file, UTF-8, the trailing line break removed. A name cannot hold a path, so no reference can leave this directory. Links are refused. A warning is written when Everyone, Users or Authenticated Users (Windows), or group or other (Linux, macOS), can read the file.
       */
      directory?: string;
    };
    /**
     * Schema 5.6.13. Settings of the command provider (command://<name>). Needed only when a reference uses it. The toolkit starts the executable directly with the argument list, with no shell, closes its standard input and reads its standard output as the secret (the trailing line break removed). A command that exits with a code other than 0 fails, and its standard error is reported without the secret.
     */
    command?: {
      /**
       * Schema 5.6.13. The program to start: a command name found on the path, or an absolute path. Not a command line: the arguments are in command.arguments.
       */
      executable?: string;
      /**
       * Schema 5.6.13. The arguments, one list item each. The text {name} in an item is replaced by the name in the reference (command://<name>). At least one item must hold {name}. Each item is passed as one argument; nothing is split or quoted by a shell.
       */
      arguments?: string[];
      /**
       * Schema 5.6.13. How long the command may run before it is stopped and the read fails. Default 30.
       */
      timeout_seconds?: number;
    };
  };
  /**
   * The Azure Local instance (the cluster deployment).
   */
  cluster?: {
    /**
     * Cluster name: a NetBIOS name of up to 15 characters. ARM parameter clusterName.
     */
    name: string;
    /**
     * Prefix of the Azure resources the deployment creates. ARM parameter namingPrefix.
     */
    naming_prefix?: string;
    /**
     * ARM deploymentMode: validate runs the checks only; deploy deploys.
     */
    deployment_mode?: 'validate' | 'deploy';
    /**
     * The quorum witness of the cluster. A two-machine cluster and a rack aware cluster need one (rule AZL-008). See cluster.witness.type.
     */
    witness: {
      /**
       * cloud (an Azure Storage account), file_share (disconnected operations), or none. Required, with no default, on purpose: the right value depends on the number of machines and the site, so no single default fits. Microsoft Learn (Understanding cluster and pool quorum, https://learn.microsoft.com/windows-server/storage/storage-spaces/quorum#cluster-quorum-recommendations): two machines need a witness; three or four machines, a witness is strongly recommended; five or more, a witness is not needed; use a cloud witness when the site has internet access. The ARM template reference (https://learn.microsoft.com/azure/azure-local/deploy/rack-aware-cluster-deployment-via-template#arm-template-parameters-reference): witnessType must be Cloud for a two-node cluster and can be empty for other sizes. Microsoft's template defaults witnessType to No Witness, which is wrong for two machines, so the toolkit does not take that default: the file always states the choice. https://learn.microsoft.com/azure/azure-local/concepts/cluster-witness
       */
      type: 'cloud' | 'file_share' | 'none';
      /**
       * Cloud witness storage account. ARM clusterWitnessStorageAccountName.
       */
      storage_account?: string;
      /**
       * File share witness UNC path.
       */
      path?: string;
    };
    /**
     * The Key Vault the deployment uses for the instance's secrets (one per instance). ARM keyVaultName.
     */
    key_vault: {
      /**
       * Name of the Key Vault the deployment creates for the cluster (ARM keyVaultName): 3 to 24 characters, letters, digits and hyphens, starting with a letter.
       */
      name: string;
      /**
       * ARM createNewKeyVault.
       */
      create_new?: boolean;
      /**
       * Days a deleted secret or vault stays recoverable, 7 to 90 (ARM softDeleteRetentionDays). The Terraform identity module gives the cluster vault the same retention.
       */
      soft_delete_retention_days?: number;
    };
    /**
     * Key Vault audit logs. ARM diagnosticStorageAccountName, logsRetentionInDays and storageAccountType.
     */
    diagnostics?: {
      /**
       * Name of the storage account that receives the cluster diagnostic logs: 3 to 24 lowercase letters and digits.
       */
      storage_account?: string;
      /**
       * Days the diagnostic logs are kept.
       */
      logs_retention_days?: number;
      /**
       * SKU of the diagnostic storage account, for example Standard_LRS.
       */
      storage_account_type?: string;
    };
  };
  /**
   * How the toolkit's ARM Validate and Deploy run (Invoke-AzureLocalArmDeployment.ps1) waits, asks for approval and recovers, and where the runs write their event feeds (events_directory). Optional; every key has a default; a -Settings value on the command line wins over this block. (since 5.6)
   */
  deployment?: {
    /**
     * How long the run waits for a Validate before it stops waiting (state ValidationTimedOut; Azure keeps working and the next run attaches to it). Microsoft: validation takes about 10 to 30 minutes. Default 90. (since 5.6)
     */
    validate_timeout_minutes?: number;
    /**
     * How long the run waits for a Deploy before it stops waiting (state DeploymentTimedOut). Microsoft: 2.5 to 3 hours; several steps take 40 to 50 minutes or more. Default 360. (since 5.6)
     */
    deploy_timeout_minutes?: number;
    /**
     * Seconds between the first reads of the validation or deployment status. The delay grows by half each read up to poll_max_seconds. Default 15. (since 5.6)
     */
    poll_seconds?: number;
    /**
     * The longest delay between two reads. Default 120. (since 5.6)
     */
    poll_max_seconds?: number;
    /**
     * Mode ValidateAndDeploy: what happens between a good Validate and the Deploy. stop (default): the run ends in state AwaitingApproval and a later run with Mode Deploy continues. none: continues at once (a lab). No script asks on the console (the value prompt is gone since registry 5.0.61). Pipelines run Validate and Deploy as two jobs with the platform's approval between them and do not use this. (since 5.6)
     */
    approval?: 'stop' | 'none';
    /**
     * Allow the run to resubmit a failed Deploy (and attach to a running one). Without it a failed Deploy is refused. Microsoft's portal has Resume deployment for a failed instance; for the ARM route this resubmits the same parameters in Deploy mode. Default false. (since 5.6)
     */
    resume?: boolean;
    /**
     * Fail the precondition OsConfigurationConverged when no OS configuration report is given, instead of skipping it with a warning. Default false. (since 5.6)
     */
    require_os_configuration_report?: boolean;
    /**
     * Preconditions to skip on purpose. They appear in the report as Skipped, never hidden. (since 5.6)
     */
    skip_preconditions?: (
      | 'AzureContext'
      | 'ResourceGroup'
      | 'ResourceProviders'
      | 'Permissions'
      | 'NamesAvailable'
      | 'KeyVaultSecrets'
      | 'ArcMachinesConnected'
      | 'ArcMachineNaming'
      | 'OsConfigurationConverged'
      | 'OsBuildConsistent'
      | 'SbeConsistent'
      | 'SbeValidatedWithSolution'
      | 'DnsAndTime'
      | 'ActiveDirectoryPrepared'
      | 'LocalIdentityPrerequisites'
      | 'NoLeftoverFailedDeployment'
      | 'ValidatedBeforeDeploy'
    )[];
    /**
     * Ids from config/known-issues/arm-deployment.json that you accept, so a precondition or a resume that a known issue would block goes ahead (for example arc-device-id-name). Leave empty normally. (since 5.6)
     */
    acknowledge_known_issues?: string[];
    /**
     * Patch the deploymentSettings api-version in Microsoft's template (for example 2026-10-01) when the template's own preview version is retired. Default: the template's. (since 5.6)
     */
    deployment_settings_api_version?: string;
    /**
     * The solution version the nodes run (four numeric parts, for example 12.2611.1004.9). The precondition SbeValidatedWithSolution compares it with the solution versions the OEM's SBE discovery catalog lists for the configured SBE. Leave empty to use the ZTP handoff's solution version, else the version derived from the nodes' OS build (reported as derived; only builds that map unambiguously). The OS configuration also passes it to the Arc registration of a machine installed from an ISO as -TargetSolutionVersion, the version the first deployment uses; without it the registration cmdlet asks which version to use, which an unattended run cannot answer.
     */
    solution_version?: string;
    /**
     * The OEM's SBE discovery catalog (SBE_Discovery_Dell.xml) the precondition SbeValidatedWithSolution reads: the file, or a folder that holds SBE_Discovery_*.xml. Default: the SBE_Discovery_*.xml in hardware.sbe.source_path, else hardware.sbe.bundle_path. Nothing is downloaded.
     */
    sbe_catalog_path?: string;
    /**
     * How long a passing result of the pre-cluster verification gate (Invoke-AzureLocalPreClusterVerification.ps1 -Mode Verify) stays valid for the ARM Validate and Deploy, in hours. After that the ARM run fails the precondition PreClusterVerification and names the command to run again. Default 4. (since 5.6)
     */
    pre_cluster_verification_max_age_hours?: number;
    /**
     * Minimum memory per node in GiB for the pre-cluster verification (Learn: system requirements, at least 32 GB). Default 32. (since 5.6)
     */
    verification_min_memory_gib?: number;
    /**
     * Minimum boot drive size in GB for the pre-cluster verification (Learn: at least 200 GB). Default 200. (since 5.6)
     */
    verification_min_boot_disk_gb?: number;
    /**
     * Minimum size in GB of the data drives of a Storage Spaces Direct node for the pre-cluster verification (Learn: at least two drives of 500 GB). Default 500. (since 5.6)
     */
    verification_min_data_disk_gb?: number;
    /**
     * Minimum link speed in Gbps of the storage adapters for the pre-cluster verification (Learn: at least 10 Gbps for RDMA or iSCSI storage traffic). Default 10. (since 5.6)
     */
    verification_min_link_gbps?: number;
    /**
     * Largest clock difference in seconds between a node and this host that the pre-cluster verification accepts (Kerberos allows 300). Default 300. (since 5.6)
     */
    verification_max_clock_skew_seconds?: number;
    /**
     * Where the pre-cluster verification gate writes report.json, summary.md and precluster-verification-events.jsonl, and where the ARM run looks for the latest result. Default: arm-report\verification\live in the environment data folder (the folder that holds provisioning.simplified.evidence_path, else media_path, else the folder of the infrastructure file). (since 5.6)
     */
    pre_cluster_verification_report_directory?: string;
    /**
     * Schema 5.6.29. The one folder where the toolkit's runs write their event feeds (os-configuration-events.jsonl of the OS configuration run, arm-deployment-events.jsonl of the ARM Validate and Deploy run) and where azurelocal-sonar reads them, so a plain run and a plain Sonar launch meet. Environment variables such as %ProgramData% are expanded; a relative path is relative to the folder of the infrastructure file. Default when not set: <ProgramData>\AzureLocalToolkit\<cluster.name>\events (on Linux and macOS <temp>/AzureLocalToolkit/<cluster.name>/events); a run given -ReportDirectory then writes its feed into that report directory instead, so set this key when a pipeline or an operator passes -ReportDirectory and Sonar should still follow the run. -EventLogPath of the OS configuration run and osConfigEventsPath/armEventsPath of Sonar's own config still win. Lines are appended, so one folder keeps every run of the cluster; Sonar shows the latest. Keep it outside any git working tree.
     */
    events_directory?: string;
    /**
     * Opt in to registering the mandatory Azure Local resource providers (Microsoft Learn: Assign required permissions for Azure Local deployment) that are not registered in the subscription, and waiting until they are Registered, when the precondition ResourceProviders runs in Mode Validate or Deploy. Default false: the run never changes Azure by itself and a mandatory provider that is not registered fails the precondition, with the Register-AzResourceProvider command for each. Needs Owner or Contributor on the subscription. Never done in Plan or with WhatIf. Set by the -RegisterResourceProviders switch. (since 5.6)
     */
    register_resource_providers?: boolean;
  };
  /**
   * The machines, one entry each. ARM physicalNodesSettings and arcNodeResourceIds. Up to 16 with Storage Spaces Direct, up to 64 disaggregated (the validator checks which applies).
   *
   * @minItems 1
   * @maxItems 64
   */
  nodes?: [Node, ...Node[]];
  /**
   * What every machine is. The layout is the same on every machine.
   */
  hardware?: {
    /**
     * OEM, for example Dell, HPE, Lenovo or DataON. azurelocal-ztp picks config/oem/<vendor>.json from it (the BMC log services and signals of its Bootstrap watch, the BIOS slot mapping and the one-time USB boot of its Boot stage): it has no built-in vendor, so its Boot and Bootstrap stages stop without it (azurelocal-ztp 091ebb3).
     */
    vendor: string;
    /**
     * Model, for example AX-760. Used to select the SBE.
     */
    model: string;
    /**
     * Physical cores per machine. Get-HardwareInventory.ps1 compares it with the cores the BMC reports (the sum over all processors).
     */
    cpu_cores?: number;
    /**
     * Memory per machine, GiB. Get-HardwareInventory.ps1 compares it with the memory the BMC reports.
     */
    memory_gib?: number;
    /**
     * GPUs fitted in every machine. Leave out when there are none. Get-HardwareInventory.ps1 compares these keys with the GPUs the BMC reports.
     */
    gpu?: {
      /**
       * true when the machines carry GPUs.
       */
      enabled?: boolean;
      /**
       * GPU model, as the machine reports it.
       */
      model?: string;
      /**
       * Number of GPUs in each machine.
       */
      count_per_node?: number;
    };
    bmc?: BmcCredentials;
    /**
     * Schema 5.6.14. Where Get-HardwareInventory.ps1 writes the hardware inventory it reads from the BMCs, in which format, and how long it waits for a BMC. The script reads every BMC over the standard Redfish API (read only), for any maker, and writes one file per run. Leave the block out to use the defaults. The file holds serial numbers and MAC addresses: keep the folder out of git.
     */
    inventory?: {
      /**
       * Schema 5.6.14. The folder the inventory file is written to. It is created when it is missing. Default: hardware-inventory, relative to the folder the script runs from.
       */
      output_directory?: string;
      /**
       * Schema 5.6.14. The start of the file name. The file is named <prefix>-<UTC time>.<json or yml>, so every run writes a new file and keeps the old ones. 1 to 64 letters, digits, dots, underscores or hyphens, starting with a letter or digit. Default: hardware-inventory.
       */
      file_name_prefix?: string;
      /**
       * Schema 5.6.14. The format of the inventory file: json or yaml. Default: json.
       */
      format?: 'json' | 'yaml';
      /**
       * Schema 5.6.14. How long the script waits for one answer of a BMC, in seconds. A BMC is a small computer and can be slow. Default: 60.
       */
      timeout_seconds?: number;
    };
    bios?: BiosSettings2;
    bios_during_provisioning?: BiosSettings3;
    /**
     * The hardware vendor's Solution Builder Extension (SBE) package, its driver and firmware update, is a REQUIREMENT (schema 5.6.4): the package is downloaded and available on a share the automation can read (source_path), for the build and for the first cluster update, which needs it anyway (a vendor whose SBE has no download connector for your cluster reports AdditionalContentRequired; Dell's download is behind a support login). Whether it is required comes from requirement; when that key is absent the vendor catalog (config/oem/<vendor>.json) decides: required for a vendor whose package is a manual download (Dell, HPE, DataON), not required by default where the cluster downloads it itself. Say not_applicable, with not_applicable_reason, for hardware that has no SBE or a cluster that downloads it with the vendor credential. What stays opt-in is only the build-time side-load: nothing is copied to a node unless you set delivery to winrm_copy or node_pull (default skip), and nothing in the toolkit adds a delivery setting or an SBE value to a file. The pre-cluster verification (SB-001 to SB-006) checks that the package on the share is complete, consistent, for the hardware model of every node and validated for the target solution version. The version is the one validated with provisioning.os_version. ARM sbeVersion, sbeFamily, sbePublisher, sbeManifestSource and sbeManifestCreationDate; without a package the ARM deployment passes none of them (nor partnerProperties and partnerCredentiallist), and the template's own empty defaults apply.
     */
    sbe?: {
      /**
       * Required when hardware.sbe is present and bundle_path is not (nor source_path or requirement; with a package it is read from it). The SBE's publisher, for example Dell.
       */
      publisher?: string;
      /**
       * Required when hardware.sbe is present and bundle_path is not (nor source_path or requirement). The SBE family of your hardware, for example 16G-45n0c-Intel. With bundle_path it may be empty: it is then read from the package's manifest.
       */
      family?: string;
      /**
       * Required when hardware.sbe is present and bundle_path is not (nor source_path or requirement). The SBE version, for example 5.0.2609.1611, validated with the solution version you install. With bundle_path it may be empty: it is then read from the package's manifest.
       */
      version?: string;
      /**
       * Where the SBE manifest comes from (a URL or a file path). Only read when an SBE is asked for; the SBE is opt-in and never delivered by default.
       */
      manifest_source?: string;
      /**
       * Creation date of the SBE manifest, as the manifest states it. Only read when an SBE is asked for.
       */
      manifest_creation_date?: string;
      /**
       * Folder on the management host with the OEM's SBE files as downloaded: one SBE_*.zip, its SBE_*.xml and SBE_Discovery_<oem>.xml. Used to prepare machines before Validate. Required when hardware.sbe is present, unless requirement is not_applicable, source_path is set, or publisher, family and version name an SBE you placed in C:\SBE yourself (and needed for any delivery). Same meaning as source_path; when source_path is set it is the one read.
       */
      bundle_path?: string;
      /**
       * Whether the OEM SBE package is required for this deployment. required: it must be downloaded and available at source_path (the pre-cluster verification fails without it). not_applicable: this hardware has no SBE, or the cluster downloads it with the vendor credential; needs not_applicable_reason. vendor (the default, also when the key is absent; value since 5.6.28): the vendor fact in the vendor catalog decides, config/oem/<hardware.vendor>.json sbe.requiredByDefault (read by Get-AzlSbeRequirement in scripts/common/sbe/AzlSbePackage.psm1): true, so required, for a vendor whose package is a manual download (Dell, HPE, DataON); false for a vendor whose cluster downloads the package itself (Lenovo Premier), which the pre-cluster verification reports as a Warning that asks you to state it; Skipped for a vendor the catalog does not know. The catalog value is a vendor fact (how the vendor delivers its package), not a deployment choice; a deployment that differs states required or not_applicable here. This key is about the package being available; whether the toolkit also copies it to the nodes during the build is delivery, a separate opt-in that stays off.
       */
      requirement?: 'required' | 'not_applicable' | 'vendor';
      /**
       * Required when requirement is not_applicable: why no package is needed, in one sentence, for example that no SBE exists for the hardware model or that the cluster downloads it with the vendor credential. The gate shows it in its report; an empty reason fails SB-001.
       */
      not_applicable_reason?: string;
      /**
       * Where the downloaded SBE package is available to the automation: a UNC share or a folder, for example \\server\share\sbe\dell or D:\sbe\dell, that holds the three files as the vendor delivers them: SBE_Discovery_<Vendor>.xml, SBE_<Vendor>_<Family>_<Version>.xml and SBE_<Vendor>_<Family>_<Version>.zip (Microsoft Learn, Import and rediscover updates). Download them before you start: you need them for the first cluster update anyway, and the build can use them too (delivery). The pre-cluster verification reads this location, read only, from the machine that runs the automation, with source_username and source_password when they are set. When it is empty, bundle_path is used. No credential, token or query string in the path (rule AZL-030).
       */
      source_path?: string;
      /**
       * The account that reads source_path when the account running the automation cannot (for example DOMAIN\svc-sbe-read). Read access only. Needs source_password.
       */
      source_username?: string;
      /**
       * The Key Vault secret that holds the password of source_username, as a keyvault://<vault>/<secret> reference. It is read into memory for the run and never written or shown.
       */
      source_password?: string;
      /**
       * Optional. The SHA-256 of the payload zip (64 hexadecimal characters), as the vendor publishes it. The gate compares the zip on the share with it and with the PackageHash of the package's discovery manifest; without it the manifest's hash is used.
       */
      package_sha256?: string;
      /**
       * Optional. The size of the payload zip in bytes, as downloaded. The gate compares the file on the share with it.
       */
      package_size_bytes?: number;
      /**
       * Opt-in (schema 5.4.2): the toolkit side-loads an SBE only when you set winrm_copy or node_pull here; no value means no delivery, and a hardware.sbe block with no delivery copies nothing and touches no C:\SBE. Nothing in the toolkit sets this key for you. How the SBE package reaches the nodes. It lands in each node's C:\SBE during OS configuration. winrm_copy: the toolkit copies the files over WinRM (a PSSession, TCP 5985) from the host it runs on, so that host must reach the nodes' management subnet (the operator host if it can, or a runner that can); needs the nodes' local administrator as -Credential. node_pull: each node downloads the files itself from node_pull_url, a read-only HTTPS or SMB location that you serve from a host the nodes can reach; the toolkit checks the SHA-256 on the node after the download. skip (default, also when the key is absent): the toolkit does not deliver the package, the Sbe step reports it as not delivered (an SBE you configured and placed yourself), and no other step is affected. There is no Azure storage account route: Azure Arc Run Command cannot carry a file.
       */
      delivery?: 'winrm_copy' | 'node_pull' | 'skip';
      /**
       * The folder the nodes pull the SBE files from (delivery node_pull). It is an address the NODES can reach, not necessarily the operator host: https://host/sbe/dell (the three files are fetched by name from it) or a UNC folder \\server\share\sbe (the node reads it as itself, so the share must allow it). Read-only, and it carries no credential: no user name, password, token or query string in the address (rule AZL-030).
       */
      node_pull_url?: string;
      /**
       * Test only. Use the SBE in bundle_path even though the OEM's manifest doesn't list it as validated with provisioning.os_version. The hash is still checked. Default false. Documentation only; not read by the tools. The deployment gate fails an SBE the OEM has not validated, whatever this key says.
       */
      allow_unvalidated?: boolean;
      /**
       * Optional (schema 5.6.24). Properties the hardware vendor's SBE asks for, as name and value pairs (ARM partnerProperties; Learn lists it as a parameter of every deployment template, each entry a name and a value). What a vendor needs is in the vendor's SBE documentation: copy the pairs as it gives them. Sent only when an SBE is configured (hardware.sbe.version); leave it out when the vendor names none. The deployment sends an empty list then.
       */
      partner_properties?: {
        /**
         * The property name, as the hardware vendor gives it.
         */
        name: string;
        /**
         * The property value, as the hardware vendor gives it. Not a secret: a secret goes in partner_credentials.
         */
        value?: string;
      }[];
      /**
       * Optional (schema 5.6.24). The secrets that the hardware vendor's SBE needs while the deployment runs, for example the login of its download connector (ARM partnerCredentiallist; Learn: a vendor may need credentials at deployment). Each entry is a secret_name and a secret. The deployment template writes the value into the cluster's own Key Vault (cluster.key_vault.name) under secret_name, and the SBE looks it up there by that name. The value passes through the template parameter partnerCredentiallist, which Microsoft's template declares as a plain array, so it is visible in the deployment's input parameters in Azure. Set it only when the hardware vendor's SBE requires it. The file holds a secret reference, never the value: the toolkit reads the value on this machine, in memory, when it submits the deployment. Sent only when an SBE is configured (hardware.sbe.version); leave it out when the vendor names none. The deployment sends an empty list then.
       */
      partner_credentials?: {
        /**
         * The name the secret gets in the cluster's Key Vault, and the name the vendor's SBE looks for.
         */
        secret_name: string;
        /**
         * A secret reference to the value: keyvault://<vault>/<secret> (the vault must be listed in key_vaults), env://<name>, file://<name> or command://<name>. Never the value itself. The deployment template writes the value into the cluster's Key Vault under secret_name. The value passes through the template parameter partnerCredentiallist, which Microsoft's template declares as a plain array, so it is visible in the deployment's input parameters in Azure. Set it only when the hardware vendor's SBE requires it. Required when the entry exists. The parameter file never holds the value (Placeholder mode writes null; KeyVaultReference mode refuses when an entry exists).
         */
        secret: string;
      }[];
    };
    /**
     * The physical network cards in every machine, and what each port is for. A summary of the hardware; from 5.2 each node's ports, with MACs and addresses, are nodes[].network_adapters.
     */
    network_cards?: {
      /**
       * Where the card sits, as the chassis labels it, for example Slot 6 or Embedded. Documentation only; not read by the tools. A planning input that Trailwright expands into nodes[].network_adapters[], which the tools read.
       */
      label?: string;
      /**
       * Manufacturer of the card. Documentation only; not read by the tools. A planning input that Trailwright expands into nodes[].network_adapters[], which the tools read.
       */
      make?: string;
      /**
       * Model of the card, as the machine reports it. Documentation only; not read by the tools. A planning input that Trailwright expands into nodes[].network_adapters[], which the tools read.
       */
      model?: string;
      /**
       * The ports of this network card, in the order the vendor numbers them.
       */
      ports?: {
        /**
         * Adapter name in the OS, as the intents use it. Documentation only; not read by the tools. A planning input that Trailwright expands into nodes[].network_adapters[], which the tools read.
         */
        name: string;
        /**
         * Port speed in Gbit/s. Documentation only; not read by the tools. A planning input that Trailwright expands into nodes[].network_adapters[], which the tools read.
         */
        speed_gbps?: number;
        /**
         * RDMA technology the port supports: none, iwarp, roce (RoCE) or roce_v2 (RoCEv2). Documentation only; not read by the tools. A planning input that Trailwright expands into nodes[].network_adapters[], which the tools read.
         */
        rdma?: 'none' | 'iwarp' | 'roce' | 'roce_v2';
        /**
         * unused, intent:<intent name>, cluster:a, cluster:b, iscsi:a or iscsi:b. Documentation only; not read by the tools. A planning input that Trailwright expands into nodes[].network_adapters[], which the tools read.
         */
        role?: string;
      }[];
    }[];
    /**
     * Drives per machine. Get-HardwareInventory.ps1 compares them with the drives the BMC reports and the role (cache or capacity) it works out from the media types.
     */
    drives?: {
      capacity?: DriveGroup;
      cache?: DriveGroup1;
    };
  };
  /**
   * The on-premises networks.
   */
  networking?: {
    /**
     * The management network and the infrastructure IP pool. DNS servers can't be changed after deployment.
     */
    management: {
      /**
       * CIDR. ARM subnetMask is derived from it.
       */
      subnet: string;
      /**
       * The one default gateway. ARM defaultGateway.
       */
      gateway: string;
      /**
       * 0 means untagged. Can't be changed after deployment. The VLAN the host tags on the management port: simplified provisioning sets it on that port (edge machine networkAdapters[].vlanId). With nodes[].network_adapters the management port's host VLAN (0 when its vlan_mode is access) must match it.
       */
      vlan_id?: number;
      /**
       * ARM dnsServers.
       *
       * @minItems 1
       */
      dns_servers: [Ipv4, ...Ipv4[]];
      /**
       * @deprecated
       * Deprecated in 5.2: set each port's ip_assignment in nodes[].network_adapters. Read when a node has no network_adapters, and must agree with them when both are given (static = static, dhcp = dhcp_reservation or dhcp, preconfigured = preconfigured). How each machine's management address (nodes[].management.ip_address) is set before deployment, on the management port (nodes[].management.mac_address). static (default): the address, the subnet mask, the gateway, the DNS servers and vlan_id are set on that port. Simplified provisioning sets them at the OS install (edge machine siteDetails.deviceConfiguration.network.networkAdapters[], ipAssignmentType Manual, keyed by the MAC); for an ISO install the operator or the toolkit sets them. dhcp: the port stays on DHCP, so reserve each ip_address in DHCP for its MAC. preconfigured: the port is already configured, and the tools don't change it. Not the same as use_dhcp, which is the deployment's ARM useDhcp.
       */
      ip_assignment?: 'static' | 'dhcp' | 'preconfigured';
      /**
       * ARM useDhcp: the deployment takes the host and cluster addresses from DHCP instead of static addresses and the infrastructure_pool. Default false. A deployment setting, not how each machine's management port gets its address before deployment: that is ip_assignment.
       */
      use_dhcp?: boolean;
      /**
       * Simplified provisioning: the address range of the site's network setting (Microsoft.Edge/configurations/networkConfigurations ipv4.addressRange) when the management addresses are static. Default: the lowest to the highest static management address. Inside the management subnet, and holding every static management address.
       */
      site_ip_range?: {
        /**
         * First address of the range the site hands out when networking.management.static_method is site (the site network setting Manual). Default: the lowest machine address.
         */
        start: string;
        /**
         * Last address of the range the site hands out when networking.management.static_method is site. Default: the highest machine address.
         */
        end: string;
      };
      /**
       * Simplified provisioning: how the maintenance environment gets the address it reaches Azure with, on the ports with role provisioning, before the machine is claimed. dhcp (default): a DHCP server answers on that port's network. When the management port is one of those ports, the management network has DHCP (Mode B for a static management port); when it isn't, it is Mode C (Static without management DHCP). static: no DHCP there. A static management port then needs another port with role provisioning and ip_assignment dhcp or dhcp_reservation, or validation stops (AZL-024): Learn documents only the Configurator app for a static maintenance address, and whether the bootable image can carry a preset address is an open research item, so tools don't set it.
       */
      provisioning_network?: 'dhcp' | 'static';
      /**
       * Schema 5.3. Simplified provisioning, and only when the management ip_assignment is static: who sets each machine's static management address. device (default): azurelocal-ztp's Device stage sets it on the management port, found by its MAC, through the maintenance environment's Configurator service before the machine is claimed. The Arc site's network setting is then Automatic and the claim carries no Manual adapter. site: the older path. The site's network setting is Manual with an address range (site_ip_range) and Microsoft's OS install assigns the address. Microsoft ignores the MAC there and uses the first ready port, which was observed live on Dell AX-760, so use it only when the first ready port is the management port.
       */
      static_method?: 'device' | 'site';
      /**
       * Schema 5.3. Simplified provisioning: the DHCP range on the provisioning network (the one the maintenance environment gets its address on). The Device stage scans it (TCP 20001) to find each machine's maintenance environment by MAC when nodes[].maintenance_address isn't set. Inside the management subnet, start at or below end.
       */
      provisioning_dhcp_range?: {
        /**
         * First address of the DHCP pool of the provisioning network. The ZTP Device stage scans the range on TCP 20001 for machines that have no maintenance_address. Default: the start of the management subnet.
         */
        start: string;
        /**
         * Last address of the DHCP pool of the provisioning network (at most 4096 addresses from the start).
         */
        end: string;
      };
      /**
       * At least six contiguous addresses in the management subnet, outside the machines' addresses. ARM startingIPAddress and endingIPAddress.
       */
      infrastructure_pool?: {
        /**
         * First address of the pool the Azure Local infrastructure services use (ARM startingIPAddress): inside the management subnet, outside every machine address and the gateway.
         */
        start: string;
        /**
         * Last address of the infrastructure pool (ARM endingIPAddress). The pool holds at least 6 contiguous addresses.
         */
        end: string;
      };
    };
    /**
     * The out-of-band network of the BMCs and of the switches' management ports. subnet is read by the remote management security profile; New-SwitchConfiguration.ps1 reads subnet (the prefix length of a switch's management address and the source the switch accepts SSH from), gateway (the management route) and vlan_id (a VLAN on the switch trunks).
     */
    oob?: {
      /**
       * Subnet of the out-of-band (BMC) network in CIDR form.
       */
      subnet?: string;
      /**
       * Default gateway of the out-of-band network. No tool sets the BMC network. New-SwitchConfiguration.ps1 writes it as the management route of a switch (Dell OS10: management route 0.0.0.0/0) and needs it for a switch.
       */
      gateway?: string;
      /**
       * VLAN ID of the out-of-band network; 0 for an untagged port. No tool sets the BMC network. New-SwitchConfiguration.ps1 defines it on a switch and carries it on the uplinks when it is not 0.
       */
      vlan_id?: number;
    };
    /**
     * Time sources, as host names or addresses.
     */
    ntp_servers?: string[];
    /**
     * Network ATC intents. ARM intentList. https://learn.microsoft.com/azure/azure-local/concepts/host-network-requirements
     *
     * @minItems 1
     */
    intents?: [Intent, ...Intent[]];
    /**
     * Storage networks (Storage Spaces Direct). ARM storageNetworkList, enableStorageAutoIp and storageConnectivitySwitchless.
     */
    storage?: {
      /**
       * Network ATC assigns the storage addresses. When false, each node lists its storage_ips. Default true.
       */
      auto_ip?: boolean;
      /**
       * Switchless only: one or two links between each pair of machines. Documentation only; not read by the tools. Derived from networking.storage.networks[] and nodes[].storage_ips (one subnet per link).
       */
      switchless_links?: 'single' | 'dual';
      /**
       * Top-of-rack switches. Documentation only; not read by the tools. Derived from the entries of network_devices[] with type switch.
       */
      tor_switches?: number;
      /**
       * dedicated: storage on its own ports. converged: storage shares ports with other traffic. Documentation only; not read by the tools. Derived from networking.intents[].traffic: a storage-only intent is dedicated, storage with other traffic is converged.
       */
      layout?: 'dedicated' | 'converged';
      /**
       * The storage networks (SMB), one per storage adapter. The adapter is named by the key nodes[].network_adapters[].name, the same on every machine.
       */
      networks?: {
        /**
         * For example StorageNetwork1.
         */
        name: string;
        /**
         * The adapter of this storage network, by the key nodes[].network_adapters[].name (the same on every machine). The name the deployment sends to Azure (storageNetworkList networkAdapterName) is what the OS calls that adapter, found by MAC, or its os_name_override.
         */
        adapter: string;
        /**
         * Network ATC defaults are 711 and 712.
         */
        vlan_id: number;
        /**
         * Needed when auto_ip is false.
         */
        subnet?: string;
      }[];
    };
    /**
     * Schema 5.6.10. Disaggregated (SAN) only: the adapter properties of the cluster networks (ARM sanNetworkList.clusterNetworkConfig.adapterProperties). The defaults are the values of Microsoft's quickstart template.
     */
    cluster_network_properties?: {
      /**
       * Share of the bandwidth reserved for SMB traffic (CSV and live migration), 1 to 97 percent. ARM bandwidthPercentageSmb.
       */
      bandwidth_percentage_smb?: number;
      /**
       * Value of the JumboPacket property of the cluster network adapters, in bytes: 1514 (standard frame), 4088 or 9014 (jumbo). ARM jumboPacket.
       */
      jumbo_packet?: number;
      /**
       * 802.1p priority of the cluster heartbeat traffic, 0 to 7. ARM priorityValue8021ActionCluster.
       */
      priority_cluster?: number;
      /**
       * 802.1p priority of the SMB traffic, 0 to 7. ARM priorityValue8021ActionSmb.
       */
      priority_smb?: number;
    };
    /**
     * Disaggregated (SAN) only: the cluster networks on standalone ports, fabric A and B. ARM sanNetworkList.
     */
    cluster_networks?: {
      /**
       * Name of the cluster network on a standalone port (fabric A or B of a SAN design), for example clusterNetwork-A. ARM sanNetworkList name.
       */
      name: string;
      /**
       * The port of this cluster network, by the key nodes[].network_adapters[].name (the same on every machine).
       */
      adapter: string;
      /**
       * VLAN of this cluster network, 0 to 4094. 0 means untagged.
       */
      vlan_id: number;
      /**
       * Subnet of this cluster network in CIDR form.
       */
      subnet: string;
      /**
       * What the network is for (since 5.6). management and oob mark a network the machines' remote management may be reached from: the remote management security profile adds its subnet to the allowed sources of dev and production (a candidate, not a trust: prefer listing the controller addresses in os_configuration.remoting.allowed_source_cidrs). automation, compute, storage and other have no effect on remote management.
       */
      purpose?: 'management' | 'oob' | 'automation' | 'compute' | 'storage' | 'other';
    }[];
    /**
     * Every VLAN in the design, by name.
     */
    vlans?: {
      /**
       * Name of the VLAN, for example storage-1. The intents and the storage networks refer to the number, not to the name.
       */
      name: string;
      /**
       * The VLAN number, 1 to 4094. The pre-cluster verification compares it with the VLANs the switch ports are meant to allow.
       */
      id: number;
      /**
       * Subnet that runs in this VLAN, in CIDR form. When the purpose is management or oob, the remote management security profile treats the subnet as a source the machines may be reached from.
       */
      subnet?: string;
      /**
       * Free text. The values management, oob, automation, compute, storage and other (any case) are the purpose marker: management and oob make the subnet a candidate source for the remote management security profile of dev and production. Any other text has no effect.
       */
      purpose?: string;
    }[];
    /**
     * Arc VM logical networks created after deployment (task phase-06 task-08, New-LogicalNetwork.ps1: az stack-hci-vm network lnet create). Also read by the remote management security profile (purpose, address_prefix) and by the pre-cluster verification (name, vlan_id, address_prefix, purpose). The older form networking.onprem.logical_networks[] (default_gateway, ip_pools) is deprecated. A Static network needs address_prefix, gateway, dns_servers, vlan_id and ip_pool (Learn: DNS server, gateway and VLAN ID must be specified for a static logical network). Microsoft Learn: once a logical network exists you cannot change its gateway, IP pool, address space, VLAN ID or virtual switch name, so the script never changes an existing one.
     */
    logical_networks?: LogicalNetwork[];
    /**
     * Schema 5.6.11. Network security groups (NSG) for Azure Local virtual machines and logical networks, with their rules. New-NetworkSecurityGroup.ps1 (phase 06, task 07: az stack-hci-vm network nsg create and nsg rule create) creates each group and the rules it does not have yet. NSGs on Azure Local need SDN enabled by Azure Arc (sdn.enabled true); the script does not turn SDN on and refuses a file that lists a group while SDN is off. Run it before New-LogicalNetwork.ps1: a logical network is tied to its group when the logical network is created (networking.logical_networks[].nsg_name). Microsoft Learn: a group must have at least one rule, because an empty group denies all inbound traffic and a machine or logical network that uses it cannot be reached; the script refuses a group without rules. No Az PowerShell cmdlet creates these groups, so the script uses the Azure CLI with the stack-hci-vm extension.
     */
    network_security_groups?: {
      /**
       * Name of the network security group, 1 to 80 characters: letters, digits, underscore, period and hyphen; it starts with a letter or digit and ends with a letter, digit or underscore (Learn: naming rules for Microsoft.Network). It cannot be changed afterwards.
       */
      name: string;
      /**
       * The security rules of the group. At least one is needed. The script creates the rules that are missing; a rule that exists (same name) is left alone and, when it differs from the file, reported.
       *
       * @minItems 1
       */
      rules: [
        {
          /**
           * Name of the rule, 1 to 80 characters, with the same characters as the group name. Unique inside the group.
           */
          name: string;
          /**
           * Priority of the rule, 100 to 4096. Unique inside the group. A lower number is evaluated first. Leave gaps between the numbers for rules you add later.
           */
          priority: number;
          /**
           * Whether the rule applies to incoming (Inbound) or outgoing (Outbound) traffic. To control both directions, write two rules.
           */
          direction: 'Inbound' | 'Outbound';
          /**
           * Allow or Deny the traffic the rule matches.
           */
          access: 'Allow' | 'Deny';
          /**
           * Protocol the rule matches: * (any, the default), Tcp, Udp or Icmp (az stack-hci-vm network nsg rule create --protocol). The script accepts any letter case.
           */
          protocol?: '*' | 'Tcp' | 'Udp' | 'Icmp';
          /**
           * Source addresses the rule matches: * (any, the default), an IPv4 address or an IPv4 range in CIDR form. A list. Service tags are not used on Azure Local.
           *
           * @minItems 1
           */
          source_address_prefixes?: [string, ...string[]];
          /**
           * Destination addresses the rule matches: * (any, the default), an IPv4 address or an IPv4 range in CIDR form. A list.
           *
           * @minItems 1
           */
          destination_address_prefixes?: [string, ...string[]];
          /**
           * Source ports the rule matches: * (any, the default), a port or a range such as 1024-2048, each from 0 to 65535. A list.
           *
           * @minItems 1
           */
          source_port_ranges?: [string, ...string[]];
          /**
           * Destination ports the rule matches: * (any), a port or a range such as 8000-8100, each from 0 to 65535. A list. Required: the Azure CLI default is port 80, which is not a default to rely on.
           *
           * @minItems 1
           */
          destination_port_ranges: [string, ...string[]];
          /**
           * Optional text for the rule, at most 140 characters. The characters & | < > ^ % and the double quote are not allowed: the Azure CLI is started through a command file on Windows, which treats them as commands.
           */
          description?: string;
        },
        ...{
          /**
           * Name of the rule, 1 to 80 characters, with the same characters as the group name. Unique inside the group.
           */
          name: string;
          /**
           * Priority of the rule, 100 to 4096. Unique inside the group. A lower number is evaluated first. Leave gaps between the numbers for rules you add later.
           */
          priority: number;
          /**
           * Whether the rule applies to incoming (Inbound) or outgoing (Outbound) traffic. To control both directions, write two rules.
           */
          direction: 'Inbound' | 'Outbound';
          /**
           * Allow or Deny the traffic the rule matches.
           */
          access: 'Allow' | 'Deny';
          /**
           * Protocol the rule matches: * (any, the default), Tcp, Udp or Icmp (az stack-hci-vm network nsg rule create --protocol). The script accepts any letter case.
           */
          protocol?: '*' | 'Tcp' | 'Udp' | 'Icmp';
          /**
           * Source addresses the rule matches: * (any, the default), an IPv4 address or an IPv4 range in CIDR form. A list. Service tags are not used on Azure Local.
           *
           * @minItems 1
           */
          source_address_prefixes?: [string, ...string[]];
          /**
           * Destination addresses the rule matches: * (any, the default), an IPv4 address or an IPv4 range in CIDR form. A list.
           *
           * @minItems 1
           */
          destination_address_prefixes?: [string, ...string[]];
          /**
           * Source ports the rule matches: * (any, the default), a port or a range such as 1024-2048, each from 0 to 65535. A list.
           *
           * @minItems 1
           */
          source_port_ranges?: [string, ...string[]];
          /**
           * Destination ports the rule matches: * (any), a port or a range such as 8000-8100, each from 0 to 65535. A list. Required: the Azure CLI default is port 80, which is not a default to rely on.
           *
           * @minItems 1
           */
          destination_port_ranges: [string, ...string[]];
          /**
           * Optional text for the rule, at most 140 characters. The characters & | < > ^ % and the double quote are not allowed: the Azure CLI is started through a command file on Windows, which treats them as commands.
           */
          description?: string;
        }[]
      ];
    }[];
    /**
     * Details of scenario.outbound_path.
     */
    outbound?: {
      /**
       * Proxy server for the machines' outbound traffic, for scenario.outbound_path proxy or proxy_arc_gateway. The OS configuration passes url and bypass to the Arc registration of a machine installed from an ISO (Invoke-AzStackHciArcInitialization -Proxy and -ProxyBypass).
       */
      proxy?: {
        /**
         * URL of the proxy server, for example http://proxy.example.test:3128. A plain proxy: no PAC file and no credentials. Passed to the Arc registration as -Proxy.
         */
        url: string;
        /**
         * Addresses and names that go direct, not through the proxy. Learn (Register Azure Local with Azure Arc): include the address and the NetBIOS name of each machine and of the cluster, and the infrastructure addresses; use localhost, not <local>; use a wildcard such as 192.168.1.* for a subnet (no CIDR) and *.example.test for a domain. Passed to the Arc registration as -ProxyBypass, joined with commas.
         */
        bypass?: string[];
      };
      /**
       * The Arc gateway resource, in the same subscription as the machines.
       */
      arc_gateway?: {
        /**
         * Name of the Azure Arc gateway resource (Azure public cloud only; not supported with simplified machine provisioning in the preview).
         */
        name: string;
        /**
         * Resource group of the Azure Arc gateway resource.
         */
        resource_group?: string;
      };
      /**
       * Outbound path over a private connection (ExpressRoute or site-to-site VPN) when scenario.outbound_path is private_path. The Azure Firewall explicit proxy is the machines' proxy server: the OS configuration passes firewall_private_ip and firewall_port, and proxy_bypass, to the Arc registration of a machine installed from an ISO. The Arc gateway of networking.outbound.arc_gateway is passed too. The network side (virtual network, subnets, Private Link Scope, transport) is a record of the design that Trailwright writes.
       */
      private_path?: {
        /**
         * The private connection: expressroute or site_to_site_vpn. Documentation only; not read by the tools: the connection is built outside the toolkit.
         */
        transport?: 'expressroute' | 'site_to_site_vpn';
        /**
         * Name of the Azure virtual network of the private path. Documentation only; not read by the tools: the network is built outside the toolkit.
         */
        virtual_network?: string;
        /**
         * Name of the workload subnet of that virtual network. Documentation only; not read by the tools.
         */
        workload_subnet?: string;
        /**
         * Name of the firewall subnet of that virtual network. Documentation only; not read by the tools.
         */
        firewall_subnet?: string;
        /**
         * Private address of the Azure Firewall on that path. The OS configuration passes it, with firewall_port, as the proxy server of the Arc registration: http://<address>:<port> (Invoke-AzStackHciArcInitialization -Proxy). Learn: the Azure Firewall internal IP and port as the proxy server.
         */
        firewall_private_ip?: string;
        /**
         * TCP port of the Azure Firewall explicit proxy on that path (it proxies HTTP and HTTPS). Passed with firewall_private_ip as the proxy server of the Arc registration.
         */
        firewall_port?: number;
        /**
         * true when the machines reach Azure Arc through an Azure Arc Private Link Scope on that path. Documentation only; not read by the tools. Learn: Azure Local does not support an Arc Private Link Scope on the virtual network where Azure Firewall runs as explicit proxy.
         */
        arc_private_link_scope?: boolean;
        /**
         * Host names and address ranges that bypass the proxy on this path. Passed to the Arc registration as -ProxyBypass, joined with commas. Same rules as networking.outbound.proxy.bypass: localhost, not <local>; a wildcard for a subnet or a domain, no CIDR; no .svc (the registration script handles it).
         */
        proxy_bypass?: string[];
      };
    };
  };
  /**
   * Accounts and the identity provider (scenario.identity).
   */
  identity?: {
    /**
     * The deployment's local administrator on every machine. Not the built-in Administrator: the deployment renames it. ARM localAdminUserName and localAdminPassword.
     */
    local_admin: {
      /**
       * User name of the deployment local administrator on every machine (ARM localAdminUserName). Not Administrator or Guest: the deployment renames the built-in account.
       */
      username: string;
      /**
       * Optional. The Key Vault secret that holds this user name, as a keyvault://<vault>/<secret> reference, for the tools that read the user name from the vault. The pre-cluster verification (IDN-016) reads it and fails when it differs from username. Default: the secret local-admin-username in the vault of the password reference; a default secret that does not exist is a warning, a secret named here that does not exist is a failure. (since 5.6)
       */
      username_secret?: string;
      /**
       * At least 14 characters with lowercase, uppercase, a digit and a special character.
       */
      password: string;
    };
    /**
     * Local identity with Key Vault. The instance's secrets go to cluster.key_vault.
     */
    local_identity?: {
      /**
       * ARM dnsServerConfig: use_dns_server (UseDnsServer) or use_forwarder (UseForwarder).
       */
      dns_server_config: 'use_dns_server' | 'use_forwarder';
      /**
       * DNS zone of the local identity instance, for example the zone the identity endpoints are published in. Used when dns_server_config is use_dns_server.
       */
      dns_zone?: string;
      /**
       * DNS servers the identity instance forwards to. Used when dns_server_config is use_forwarder (ARM UseForwarder).
       */
      dns_forwarders?: Ipv4[];
    };
    /**
     * Entra ID groups, role assignments and PIM.
     */
    entra?: {
      /**
       * Entra ID groups the instance expects. New-EntraSecurityGroups.ps1 creates them and Set-EntraGroupRoleAssignments.ps1 assigns their roles.
       */
      groups?: {
        /**
         * Display name of the Entra ID group.
         */
        name: string;
        /**
         * What the group is for, in words.
         */
        purpose?: string;
        /**
         * Azure role names assigned to the group.
         */
        roles?: string[];
        /**
         * Scope of the role assignments.
         */
        scope?: string;
      }[];
    };
    /**
     * The Active Directory the instance joins and its accounts. Applies when scenario.identity is active_directory.
     */
    active_directory?: {
      /**
       * ARM domainFqdn.
       */
      domain_fqdn: string;
      netbios_name?: NetbiosName;
      /**
       * Distinguished name of the dedicated OU. ARM adouPath. https://learn.microsoft.com/azure/azure-local/deploy/deployment-prep-active-directory
       */
      ou_path: string;
      /**
       * The LCM deployment user, created in the OU by the AD preparation module. ARM AzureStackLCMAdminUsername and AzureStackLCMAdminPassword.
       */
      lcm_user: {
        /**
         * Name only, no domain. Up to 20 characters.
         */
        username: string;
        /**
         * At least 14 characters with lowercase, uppercase, a digit and a special character.
         */
        password: string;
      };
      /**
       * Optional override. The OS configuration run joins each machine to the domain (Add-Computer) before the cluster validation and deployment with the LCM user (lcm_user), which Microsoft's Active Directory preparation gives the right to create and delete computer objects in the dedicated OU and which is the account used for domain-join actions. Set this only when your site joins machines with another account; it needs the same rights on ou_path. (since 5.5)
       */
      domain_join_account?: {
        /**
         * The join account: a name (svc-azl-join, qualified with netbios_name), NETBIOS\name or name@domain. (since 5.5)
         */
        username: string;
        /**
         * A Key Vault secret reference. The toolkit reads it on the machine that runs the OS configuration, passes it to the node as a secret and never writes it to disk, a log, the event feed or the report. (since 5.5)
         */
        password: string;
      };
      /**
       * Domain principals the OS configuration adds to the local Administrators group of every machine after the join and the restart, so a domain account can be used for remoting and log access (a domain account is not a local administrator by default; the deployment adds the LCM user itself later). Names without the domain; users and groups. Default: the security_groups entries whose purpose says they administer the instance, and the LCM user. (since 5.5)
       */
      local_admin_members?: string[];
      /**
       * How the OS configuration run joins the machines to the domain. Optional. (since 5.5)
       */
      join_options?: {
        /**
         * true: before the deployment, a machine already joined to this domain but sitting in another OU is moved into ou_path. false (default): it is reported as blocked and left where it is. Microsoft does not support moving the computer objects to another OU after the deployment, so a machine that is already part of a cluster is never moved, whatever this says. (since 5.5)
         */
        allow_ou_move?: boolean;
      };
      /**
       * Addresses of domain controllers, for pre-checks and for the domain join. They must be the DNS servers of the management port (rule AZL-052): the machines find the domain through them.
       */
      domain_controllers?: Ipv4[];
      /**
       * Whether the instance uses group managed service accounts. Default false. Learn 2611 does not require a KDS root key for Azure Local (the Active Directory preparation never mentions one); a KDS root key matters only for gMSA, so the pre-cluster verification (ID-AD-012) checks it only when this is true. (since 5.6)
       */
      use_gmsa?: boolean;
      /**
       * Whether the DNS servers of the management network support secure dynamic updates (Microsoft DNS integrated with Active Directory). true: the node, cluster (CNO) and client access point (VCO) host records are created when the machines join, so a missing record is only a warning in the pre-cluster verification. false: Learn requires the Host (A) records before the deployment, so a missing record fails it. Default when not set: true when every DNS server is one of domain_controllers, else false. (since 5.6)
       */
      dns_secure_dynamic_updates?: boolean;
      /**
       * Schema 5.6.23. Whether Set-ADConfiguration.ps1 creates the computer objects of the machines (nodes[].name) and of the cluster (cluster.name) in the OU before the deployment. Microsoft Learn allows this instead of letting the deployment create them (Custom Active Directory configuration for your Azure Local instance; Prestage cluster computer objects). The cluster object is created disabled. Default false: the domain join of the OS configuration and the deployment create the objects.
       */
      precreate_computer_objects?: boolean;
      /**
       * Schema 5.6.28. Whether Set-ADConfiguration.ps1 creates the parent OUs of ou_path that are missing, from the domain down, before it runs New-HciAdObjectsPreCreation. Microsoft's cmdlet creates only the OU itself and stops when its parent does not exist; Microsoft Learn (Prepare Active Directory for Azure Local deployment, Considerations for large scale deployments) recommends one OU per instance under a single parent OU. A parent that exists is never changed, and no group policy setting is made on a parent it creates. Default false: a missing parent stops the script with exit code 1 and nothing is created.
       */
      create_parent_ous?: boolean;
      /**
       * Schema 5.6.28. Forest functional level of a new forest that the toolkit's Ansible domain controller role creates (a landing_zone.virtual_machines[] entry with role domain_controller and dc_promotion new_forest); ignored for a replica. WinThreshold is the Windows Server 2016 level: the highest a Windows Server 2022 domain controller supports and the lowest a new forest may have. Win2025 needs every domain controller on Windows Server 2025 (Microsoft Learn: Active Directory Domain Services functional levels, https://learn.microsoft.com/windows-server/identity/ad-ds/active-directory-functional-levels).
       */
      forest_functional_level?: 'WinThreshold' | 'Win2025';
      /**
       * Schema 5.6.28. Domain functional level of that new forest's domain. It may be higher than forest_functional_level, never lower (Microsoft Learn: Active Directory Domain Services functional levels). Same values.
       */
      domain_functional_level?: 'WinThreshold' | 'Win2025';
      /**
       * Schema 5.6.28. The DNS forwarders of the domain controllers that the toolkit's Ansible domain controller role promotes: the servers they ask for names outside the domain. Empty or missing: a domain controller that runs in Azure (landing_zone.virtual_machines[].deploy_target azure) forwards to Azure DNS (168.63.129.16, reachable only from inside Azure); one that runs anywhere else keeps the root hints.
       */
      dns_forwarders?: Ipv4[];
      /**
       * Groups created in the OU for administration of the instance.
       */
      security_groups?: {
        /**
         * Name of the security group in Active Directory.
         */
        name: string;
        /**
         * What the group is for, in words. The OS configuration reads local_groups, not this text.
         */
        purpose?: string;
        /**
         * Members of the group, as account names (sAMAccountName or user principal name).
         */
        members?: string[];
        /**
         * The local groups of every machine this AD group is added to after the deployment (for example Administrators, Remote Management Users). Empty or missing: the group is not added to any local group (WAC groups are applied on the WAC server only). Read by the post-deployment task that applies the security groups and by the Ansible AD preparation role.
         */
        local_groups?: string[];
      }[];
    };
  };
  /**
   * Storage of the instance: the deployment's storage mode, the volumes, and the SAN of a disaggregated or hybrid deployment (the san block applies only when scenario.storage_architecture is san or hybrid).
   */
  storage?: {
    /**
     * ARM configurationMode: express (Express), infra_only (InfraOnly) or keep_storage (KeepStorage). Unset: express (the default of Microsoft's template), or infra_only when scenario.storage_architecture is san.
     */
    configuration_mode?: 'express' | 'infra_only' | 'keep_storage';
    /**
     * Schema 5.6.9. The Storage Spaces Direct pool of the instance. Read by New-StorageVolume.ps1 (phase 06, task 05).
     */
    pool?: {
      /**
       * Name of the storage pool the volumes are created in. Leave it out: the script then uses the one Storage Spaces Direct pool the cluster has (an Azure Local deployment names it SU1_Pool). Needed only when the cluster has more than one pool.
       */
      name?: string;
      /**
       * Share of the pool, in percent, at which Azure Local raises the thin provisioning alert (Set-StoragePool -ThinProvisioningAlertThresholds). Microsoft's default is 70 and Microsoft recommends keeping it. Leave it out and the script does not touch the setting.
       */
      thin_provisioning_alert_threshold_percent?: number;
    };
    /**
     * Schema 5.6.9. Cluster shared volume settings of the instance. Read by New-StorageVolume.ps1 (phase 06, task 05).
     */
    csv?: {
      /**
       * Memory per machine, in MiB, for the CSV in-memory read cache (the cluster property BlockCacheSize). Azure Local has it on with 1024 by default; 0 switches it off; up to 80 percent of the memory of a machine can be used. Leave it out and the script does not touch the setting. A change takes effect when the volumes next move or come online.
       */
      read_cache_size_mib?: number;
    };
    /**
     * The Storage Spaces Direct volumes to create after deployment, in addition to what the deployment itself creates (storage.configuration_mode). New-StorageVolume.ps1 (phase 06, task 05) creates each one that does not exist yet with New-Volume and never changes or removes one that exists. Not used with scenario.storage_architecture san.
     */
    volumes?: {
      /**
       * Name of the volume, for example vol-workloads-01. It becomes the folder C:\ClusterStorage\<name>. Not a name the deployment manages (UserStorage_<n>, Infrastructure_<n>).
       */
      name: string;
      /**
       * Size of the volume in GiB (binary units, as Windows counts).
       */
      size_gib: number;
      /**
       * Resiliency of the volume. two_way, three_way and parity (dual parity, 4 or more machines) are the usual ones; four_way is for a rack aware cluster; nested_two_way and nested_mirror_accelerated_parity are for a cluster of two machines; mirror_accelerated_parity needs 4 or more machines and ReFS (the two accelerated-parity values are new in 5.6.9). Leave it out and Storage Spaces Direct chooses: two-way mirror with one or two machines, three-way mirror with three or more.
       */
      resiliency?: 'two_way' | 'three_way' | 'four_way' | 'parity' | 'nested_two_way' | 'mirror_accelerated_parity' | 'nested_mirror_accelerated_parity';
      /**
       * Schema 5.6.9. thin (space is taken from the pool as data is written) or fixed (all space is taken when the volume is created). Leave it out and the default of the pool applies. For a volume made of storage tiers (nested or accelerated parity) the script sets this on the tier templates of the pool for the creation, as Microsoft Learn describes, and puts the templates back afterwards.
       */
      provisioning_type?: 'thin' | 'fixed';
      /**
       * Schema 5.6.9. refs (the default; Microsoft recommends it for all volumes, and mirror-accelerated parity and ReFS deduplication need it) or ntfs.
       */
      file_system?: 'refs' | 'ntfs';
      /**
       * Schema 5.6.9. Only for mirror_accelerated_parity and nested_mirror_accelerated_parity: the share of the volume, in percent, that is parity; the rest is mirror. The default is 80, the ratio Microsoft recommends for most workloads.
       */
      parity_percent?: number;
      /**
       * Schema 5.6.9. ssd or hdd: the capacity drives the volume goes on, when the machines have both kinds. NVMe counts as ssd. Leave it out on machines with one kind of capacity drive; for a volume made of storage tiers the script then takes it from hardware.drives.capacity.media.
       */
      media_type?: 'ssd' | 'hdd';
      /**
       * Schema 5.6.9. ReFS deduplication and compression of the volume. Off unless type says otherwise.
       */
      deduplication?: {
        /**
         * none (the default: the script does not touch deduplication), dedup, compress or dedup_and_compress (Enable-ReFSDedup -Type). Needs file_system refs. The script turns it on for a volume that has it off and never changes or turns off what is already set.
         */
        type?: 'none' | 'dedup' | 'compress' | 'dedup_and_compress';
        /**
         * When the deduplication job runs (Set-ReFSDedupSchedule). Give all three keys or leave the block out; without a schedule a job runs only when someone starts one.
         */
        schedule?: {
          /**
           * Time of day the job starts, as HH:mm in the time of the machines, for example 22:00.
           */
          start_time?: string;
          /**
           * The days the job runs: Sunday to Saturday, or EveryDay.
           */
          days?: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'EveryDay')[];
          /**
           * The longest one run may take, in hours.
           */
          duration_hours?: number;
        };
      };
    }[];
    /**
     * Schema 5.6.9. The Azure Local storage paths to create after deployment: the Azure resources that say where on a cluster shared volume the virtual machine files, images and disks go. New-StoragePath.ps1 (phase 06, task 05) creates each one that does not exist yet in azure.resource_group, on azure.custom_location, with the file-level tags. The storage paths the deployment makes in Express mode are not listed here.
     */
    paths?: {
      /**
       * Name of the storage path resource: 3 to 64 letters, digits or hyphens. It cannot be renamed later.
       */
      name: string;
      /**
       * The folder on a cluster shared volume, for example C:\ClusterStorage\vol-workloads-01\vms for a volume of storage.volumes, or the folder of the cluster shared volume of a SAN LUN. Never on the infrastructure volume. It cannot be changed later.
       */
      path: string;
    }[];
    /**
     * Schema 5.6.11. The Azure Marketplace images to download to the instance as Azure Local VM images (Learn: Create Azure Local VM image using Azure Marketplace images). New-VmImage.ps1 (phase 06, task 06) creates each image that does not exist yet in azure.resource_group, on azure.custom_location, in azure.location, with the file-level tags. An image that exists is left alone; a failed one is reported, never deleted. Needs the Microsoft.EdgeMarketplace resource provider registered in the subscription and the Azure Connected Machine Resource Manager role for the Microsoft.AzureStackHCI resource provider app on the resource group. Only Azure Marketplace images are supported: images from a local path, a storage account, an existing virtual machine or an Azure compute gallery are not (they need image preparation that this file does not describe). The list lives in storage because an image is kept on a storage path of the instance.
     */
    vm_images?: {
      /**
       * Name of the VM image resource, 1 to 80 characters: letters, digits, hyphen, period and underscore; it starts and ends with a letter or digit. It cannot be renamed. Learn: a newer Marketplace image is a new image with a new name (the portal increments the number), so pin the version in the name if you keep several.
       */
      name: string;
      /**
       * Operating system of the image, Windows or Linux (az stack-hci-vm image create --os-type). The images in Learn's Marketplace table are Windows images; for a Linux image Learn describes other procedures (Red Hat Enterprise Linux and Ubuntu: prepare the image, export the disk).
       */
      os_type: 'Windows' | 'Linux';
      /**
       * Publisher of the Marketplace image, as Learn's table gives it (lowercase).
       */
      publisher: string;
      /**
       * Offer of the Marketplace image.
       */
      offer: string;
      /**
       * SKU of the Marketplace image.
       */
      sku: string;
      /**
       * Version of the Marketplace image, for example 26100.4652.250808, or latest (the default: Azure picks the newest version when the image is created, and the script reports which). The script never writes the version it finds back to this file.
       */
      version?: string;
      /**
       * Name of the storage path the image is kept on, one of storage.paths[].name; create it first (New-StoragePath.ps1). Leave it out and Azure Local chooses a storage path itself (Learn: Choose automatically).
       */
      storage_path?: string;
    }[];
    /**
     * The external SAN of a disaggregated (san) or hybrid deployment. Its presence, and scenario.storage_architecture san or hybrid, tell the solution there is a SAN; type says fibre_channel or iscsi, and the OS configuration does the host-side MPIO and MSDSM work from that (type, array.vendor and array.model are all it needs). From 5.3 it also records the array, the Fibre Channel fabrics and target WWPNs or the iSCSI targets, which the SAN deployment and zoning work read; each machine's own HBAs or initiator are nodes[].san.
     */
    san?: {
      /**
       * Whether the SAN is fibre_channel or iscsi. This selects the OS configuration's host-side steps: fibre_channel registers the array's MSDSM hardware ID (config/san/msdsm-vendors.json), CLAIMS it for MPIO (mpclaim -n -i -d with the vendor padded to 8 and the product padded to 16 characters, which puts it in MPIOSupportedDeviceList; the MSDSM registration alone is not enough, Azure Local already ships PURE FlashArray registered and the paths stayed separate), sets the load balance policy and the vendor MPIO settings, collects the WWPNs (Get-InitiatorPort) and restarts so MPIO claims the paths, then checks each LUN is seen once and listed by mpclaim -s -d; iscsi does the same and also starts the MSiSCSI service, enables MSDSM auto-claim for iSCSI and makes the target portals and sessions from storage.san.iscsi (not for scenario.storage_architecture san on Azure Local 2610 or later: the deployment configures iSCSI there and Microsoft Learn says not to enable it by hand before it; the release is deployment.solution_version, else the ZTP handoff). Only type, and the array vendor and model (storage.san.array), are needed for the host-side work; the target WWPNs and the nodes' HBA WWPNs are needed later, for zoning and LUN masking (with fibre_channel, do not zone the HBA WWNs until after the Azure Local deployment).
       */
      type: 'fibre_channel' | 'iscsi';
      /**
       * Schema 5.3. The storage array that presents the LUNs.
       */
      array?: {
        /**
         * The array's name, for example its hostname in the array manager. Documentation only; not read by the tools.
         */
        name: string;
        /**
         * Vendor of the storage array, for example Dell or Pure Storage. The OS configuration matches it with the array's MPIO vendor and product id when it claims the array.
         */
        vendor: string;
        /**
         * Model of the storage array, for example PowerStore 1200T.
         */
        model: string;
        /**
         * The array's management address. Documentation only; not read by the tools: no tool signs in to the array.
         */
        management_address?: string;
      };
      /**
       * Schema 5.3. Used when type is fibre_channel: the fabrics and the array's target ports, for zoning. Optional for the OS configuration's host-side work (MPIO needs only type and the array vendor and model); a hybrid file may leave it out until the zoning is planned. Each machine's HBA ports are nodes[].san.hbas.
       */
      fibre_channel?: {
        /**
         * The Fibre Channel fabrics, for example A and B. Every WWPN names one by fabric.
         */
        fabrics?: {
          /**
           * For example A or B. Unique. Documentation only; not read by the tools. Only the validator reads it, to check the fabric references; zoning is done on the SAN switch, not by the toolkit.
           */
          name: string;
          /**
           * The fabric's switch, for example a network_devices[].hostname. Documentation only; not read by the tools: zoning is done on the switch.
           */
          switch?: string;
          /**
           * The active zone set on this fabric. Documentation only; not read by the tools: zoning is done on the switch.
           */
          zone_set?: string;
        }[];
        /**
         * The array's target ports (WWPNs) and the fabric each is cabled to. Zoning lets each machine's HBA ports see them.
         */
        target_wwpns?: {
          /**
           * A Fibre Channel World Wide Port Name: 16 hexadecimal digits, as 8 colon-separated pairs (50:00:09:72:08:12:34:56) or without colons.
           */
          wwpn: string;
          /**
           * A name in fabrics. Documentation only; not read by the tools. A zoning record of the array side; Azure Local takes no target WWPN.
           */
          fabric: string;
        }[];
      };
      /**
       * Schema 5.3. Used when type is iscsi: the array's targets and CHAP. For a hybrid design, or a san design before Azure Local 2610, the OS configuration makes a target portal and a session (persistent, multipath) from every iscsi:a / iscsi:b port of every machine to every portal of every target (a target with a fabric A or B is reached only from the port with the matching role); with CHAP enabled it makes none and says so. Each machine's initiator IQN is nodes[].san.initiator_iqn; the addresses of its iSCSI ports are on nodes[].network_adapters with role iscsi:a and iscsi:b.
       */
      iscsi?: {
        /**
         * The array's iSCSI targets.
         */
        targets?: {
          iqn: IscsiName;
          /**
           * The target portals: an IPv4 address, optionally with a port (default 3260), for example 198.51.100.10 or 198.51.100.10:3260.
           *
           * @minItems 1
           */
          portals: [IscsiPortal, ...IscsiPortal[]];
          /**
           * The storage network this target serves, matching the iSCSI port role: A for iscsi:a, B for iscsi:b.
           */
          fabric?: string;
        }[];
        /**
         * CHAP authentication of the sessions. The secret is a Key Vault reference.
         */
        chap?: {
          /**
           * true when the iSCSI targets require CHAP. The OS configuration then makes the target portals but not the sessions (CHAP sessions need the secret, which no tool reads yet) and says so in its plan.
           */
          enabled: boolean;
          /**
           * CHAP user name for the iSCSI targets. ARM chapUsername of the iSCSI deployment.
           */
          username?: string;
          /**
           * A secret reference, for example keyvault://<vault>/<secret> (a keyvault:// vault must be listed in key_vaults). The deployment sends it as the secure parameter chapCredential of the iSCSI template. With chap.mutual true the template uses this one secret for both directions: Microsoft's create-cluster-san-iscsi template has no second (target) secret parameter, so there is no key for one.
           */
          secret?: string;
          /**
           * Schema 5.6.10. true: the initiators also authenticate the targets (ARM chapType Mutual); false: one-way CHAP (OneWay). With enabled false the deployment gets chapType None. Microsoft's template uses the one CHAP credential for both directions.
           */
          mutual?: boolean;
        };
        /**
         * Schema 5.6.10. Value of the JumboPacket property of the iSCSI ports, in bytes: 1514 (standard frame), 4088 or 9014 (jumbo). Use the same frame size on the whole iSCSI path. ARM iScsiNetworkConfig.adapterProperties.jumboPacket.
         */
        jumbo_packet?: number;
        /**
         * Schema 5.6.10. The iSCSI networks, one per path. The iSCSI ports are dedicated physical ports outside the network intents; a port belongs to a path by its role iscsi:a or iscsi:b (nodes[].network_adapters[].roles). The iSCSI deployment reads this (ARM iScsiNetworkConfig.adapterIPConfig).
         */
        networks?: {
          /**
           * The path: A for the ports with the role iscsi:a, B for iscsi:b.
           */
          fabric: 'A' | 'B';
          /**
           * VLAN of this iSCSI network, 0 to 4094. 0 means untagged (the switch port is an access port).
           */
          vlan_id?: number;
          /**
           * Subnet of this iSCSI network in CIDR form.
           */
          subnet: string;
          /**
           * Only when the target portals of this path are in another subnet: the router address on this network. The deployment then reaches each portal of the path through it. Leave it out when the portals are in the subnet: each portal is then sent as its own next hop, as in the template of Microsoft. The iSCSI ports never get a default gateway.
           */
          next_hop?: string;
        }[];
      };
      /**
       * LUN of the infrastructure volume (250 GB minimum). ARM infraVolLunId.
       */
      infra_volume_lun_id?: string;
      /**
       * LUN of the performance history volume (20 GB minimum). ARM infraPerfLunId.
       */
      performance_history_lun_id?: string;
      /**
       * The LUNs the array presents to the cluster for workload volumes, after the deployment. New-SanVolume.ps1 (phase 06, task 05) prepares each one that is not a Cluster Shared Volume yet: it finds the disk by unique_id, brings it online, initializes it as GPT, creates one NTFS partition with 64 KB allocation units, adds it to the failover cluster as a disk named name and adds it to the CSVs. It never changes a disk that has a partition or data. Not the LUNs of the infrastructure and performance history volumes (infra_volume_lun_id, performance_history_lun_id): the deployment owns those.
       */
      luns?: {
        /**
         * Name of the LUN. It becomes the name of the cluster disk and of the Cluster Shared Volume, so it is the name you see in Failover Cluster Manager and in Get-ClusterSharedVolume. Use the name the array shows, so the two match. 1 to 63 letters, digits, dot, underscore or hyphen, unique in the list; not UserStorage_<n> or Infrastructure_<n>. New-SanVolume.ps1 reads it.
         */
        name: string;
        /**
         * Schema 5.6.16. The UniqueId of the disk this LUN shows on the machines, as Get-Disk reports it (Learn: Connect an external storage array to Azure Local, step 7: use UniqueId as the authoritative identifier; it is the same on every machine, disk numbers are not). Find it with Get-Disk | Select-Object Number, SerialNumber, UniqueId, or on the array (the LUN's NAA or WWN). New-SanVolume.ps1 finds the disk only by this value, never by size or disk number, and does nothing to a LUN that has none.
         */
        unique_id?: string;
        /**
         * Size of the LUN in GiB (binary units, as Windows counts). New-SanVolume.ps1 compares it with the size of the disk and refuses a disk that differs by more than 1 percent.
         */
        size_gib: number;
        /**
         * The logical unit number the array presents the LUN as, for example 2. New-SanVolume.ps1 compares it with the LUN number the disk shows (the Location of Get-Disk, when it shows one) and refuses a disk where they differ. It never picks a disk by it.
         */
        lun_id?: string;
      }[];
    };
  };
  /**
   * Security settings of the deployment. Omitted settings take Microsoft's recommended defaults.
   */
  security?: {
    /**
     * ARM securityLevel: recommended (Recommended) or customized (Customized).
     */
    level?: 'recommended' | 'customized';
    /**
     * true turns drift control on: Azure Local resets the security settings to the baseline after drift. Part of the cluster security settings of the deployment.
     */
    drift_control?: boolean;
    /**
     * true turns Credential Guard on in the security settings of the deployment.
     */
    credential_guard?: boolean;
    /**
     * true turns SMB signing on in the security settings of the deployment.
     */
    smb_signing?: boolean;
    /**
     * true encrypts SMB traffic between the cluster nodes (not the storage traffic).
     */
    smb_cluster_encryption?: boolean;
    /**
     * true turns BitLocker on for the boot volume.
     */
    bitlocker_boot_volume?: boolean;
    /**
     * true turns BitLocker on for the data volumes.
     */
    bitlocker_data_volumes?: boolean;
    /**
     * true turns Windows Defender Application Control on.
     */
    wdac?: boolean;
    /**
     * Schema 5.6.21. Individual security baseline settings to change after the deployment, by Set-AzsSecurity (Azure Local 2610 or later). Drift control stays on and protects the value you set instead of the baseline value. Set-SecurityBaselines.ps1 (stage 05, phase 04, task 03) applies each entry to the whole instance (-Cluster, the way Microsoft Learn recommends: the change is recorded as cluster policy intent and survives solution updates). Only Set-AzsSecurity may change these settings: Group Policy or the registry is not supported and drift control reverts it. Some settings cannot be changed at all (Learn lists them); the script refuses them. The names come from the security baseline CSV of your version (the Name column), which Learn links under View and download security settings. Empty or missing: the script does nothing.
     */
    baseline_settings?: {
      /**
       * Schema 5.6.21. The policy type that owns the setting (the -Type parameter of Set-AzsSecurity): SecuritySettings (the OS security baseline: registry, security policy, audit policy and user rights settings; most changes), SecuredCore (virtualization-based security, hypervisor-enforced code integrity, System Guard launch) or DefenderAntivirus (Microsoft Defender Antivirus configuration).
       */
      type: 'SecuritySettings' | 'SecuredCore' | 'DefenderAntivirus';
      /**
       * Schema 5.6.21. The name of the setting exactly as the Name column of the security baseline CSV writes it (-SettingName); the cmdlet does not complete or correct names. For example LanmanWorkstationEnableInsecureGuestLogons.
       */
      name: string;
      /**
       * Schema 5.6.21. The value to set: a string, an integer (sent as a string) or a list of strings. What a setting accepts is in the baseline CSV; the cmdlet rejects a value it cannot use.
       */
      value: string | number | [string, ...string[]];
      /**
       * Schema 5.6.21. true confirms that you understand a change that weakens the security posture, for the few settings where Set-AzsSecurity shows a warning and asks (the script then passes -Force, together with -Confirm:$false, as Learn describes for unattended use). false or missing: such a setting is not changed and is reported as Failed with the cmdlet's warning. Blocked settings cannot be changed with it.
       */
      acknowledge_weaker_security?: boolean;
    }[];
    /**
     * The free level of Microsoft Defender for Cloud that Azure Local needs to show its security settings in the Azure portal. Enable-DefenderForCloud.ps1 reads it. No paid plan is turned on by any key of this file.
     */
    defender_for_cloud?: {
      /**
       * true (default) registers the Microsoft.Security resource provider on the subscription of the cluster, which turns on Foundational CSPM, the free plan. false leaves Defender for Cloud alone.
       */
      enabled?: boolean;
      /**
       * true (default) assigns the Microsoft cloud security benchmark initiative to the subscription of the cluster when it is not assigned yet. Free. Without it the security settings of Azure Local do not show in the portal.
       */
      apply_cloud_security_benchmark?: boolean;
      /**
       * Address that Microsoft Defender for Cloud sends its security notifications to (a team mailbox; several addresses are separated by semicolons). Free. Empty or absent sets no contact. Enable-DefenderForCloud.ps1 sets it when the subscription has no security contact yet, and never replaces one that exists.
       */
      security_contact_email?: string;
      /**
       * Schema 5.6.28. Defender for Cloud sends security_contact_email the security alerts. Alerts come with a paid Defender plan only, which the toolkit never turns on. Default true.
       */
      alert_notifications?: boolean;
      /**
       * Schema 5.6.28. Defender for Cloud sends the security alerts to the subscription owners too. Default true.
       */
      alerts_to_admins?: boolean;
    };
    /**
     * What the cluster sends to Microsoft as diagnostic data. streaming_data, episodic_data_upload and eu_location are deployment settings (the ARM deployment reads them; Microsoft Learn documents no way to change them afterwards). diagnostic_level is the desired diagnostic level of the instance resource, which Invoke-TelemetryConfiguration-Orchestrated.ps1 (operational foundations, phase 05, task 03) sets after the deployment.
     */
    telemetry?: {
      /**
       * true sends the streaming diagnostic data.
       */
      streaming_data?: boolean;
      /**
       * true sends the episodic diagnostic data.
       */
      episodic_data_upload?: boolean;
      /**
       * true keeps the diagnostic data in the EU data boundary.
       */
      eu_location?: boolean;
      /**
       * Schema 5.6.32. The desired level of diagnostic data the Azure Local instance sends to Microsoft: Off, Basic or Enhanced (the desiredProperties.diagnosticLevel of the Microsoft.AzureStackHCI/clusters resource; Microsoft Learn, Update-AzStackHciCluster -DesiredPropertyDiagnosticLevel, and az stack-hci cluster update --desired-properties diagnostic-level). Invoke-TelemetryConfiguration-Orchestrated.ps1 (operational foundations, phase 05, task 03) sets it on the instance when it differs and then syncs the machines. Absent: the script does nothing. There is no Full level.
       */
      diagnostic_level?: 'Off' | 'Basic' | 'Enhanced';
    };
  };
  /**
   * SDN enabled by Azure Arc (Network Controller as a Failover Cluster service; Azure Local 2506 or later, OS build 26100 or later). It supports logical networks, network interfaces of Azure Local VMs and network security groups, and nothing else: no virtual networks, no software load balancer, no gateways. The older SDN managed by on-premises tools (SDN Express, Windows Admin Center, Network Controller VMs) is not built. https://learn.microsoft.com/azure/azure-local/deploy/enable-sdn-integration
   */
  sdn?: {
    /**
     * true to turn SDN enabled by Azure Arc on, which CANNOT BE UNDONE. Enable-ArcSdn.ps1 (phase 06, task 01) runs Add-EceFeature -Name NC on a machine of the instance when it is true. Microsoft Learn says that once SDN is enabled you cannot roll back or disable it, and false does not turn it off. Never set it where Network Controller was deployed with on-premises tools. Enabling interrupts the network of running workloads for a short time. New-NetworkSecurityGroup.ps1 (task 07) and New-LogicalNetwork.ps1 (task 08, for a logical network with nsg_name) also read it: network security groups need SDN enabled by Azure Arc.
     */
    enabled: boolean;
    /**
     * The SDN prefix (Add-EceFeature -SDNPrefix). It names the Network Controller REST URL, https://<prefix>-NC.<domain>/, and tells the controllers of different instances apart. Microsoft Learn: not empty, eight characters or fewer, letters, digits and hyphens only, no two hyphens in a row, no hyphen at the end. The toolkit also refuses a hyphen at the start, which is not a valid DNS name. Required when sdn.enabled is true: Enable-ArcSdn.ps1 stops with exit 2 without it.
     */
    prefix?: string;
    /**
     * How the A record <prefix>-NC of the Network Controller REST URL comes about. dynamic: Active Directory integrated dynamic DNS creates it when SDN is enabled and you do nothing. static: you create it first; it must resolve to the fifth address of networking.management.infrastructure_pool (Microsoft Learn: the fifth IP address of the range you gave at deployment) and to nothing else. Required when sdn.enabled is true. Enable-ArcSdn.ps1 resolves the name on the machine before it enables SDN and stops when the answer is wrong.
     */
    dns_records?: 'dynamic' | 'static';
    /**
     * true when you accept that enabling SDN interrupts the network of running workloads for a short time and that a maintenance window is arranged on a production instance (Add-EceFeature -AcknowledgeMaintenanceWindow). Enable-ArcSdn.ps1 asks nothing at run time, so this is the answer: it enables SDN only when this is true.
     */
    acknowledge_maintenance_window?: boolean;
    /**
     * true when the static DNS record <prefix>-NC exists and points at the fifth address of networking.management.infrastructure_pool (Add-EceFeature -AcknowledgeDNSRecordCreation). Read only when sdn.dns_records is static: with dynamic DNS Microsoft Learn asks for no acknowledgement.
     */
    acknowledge_dns_record?: boolean;
  };
  /**
   * Day-2 choices: updates, backup, disaster recovery, notifications, licensing and monitoring. Only Azure Monitor (monitoring) and the notification addresses are read by the tools so far (the monitoring scripts of phase 02, operational foundations); the rest is not read yet. Sonar reads its own settings.
   */
  operations?: {
    /**
     * How updates are applied: portal or powershell. Documentation only; not read by the tools. operations.updates.install_after_deployment carries the part a script can act on.
     */
    update_method?: 'portal' | 'powershell';
    /**
     * Schema 5.6.20. Updates after the deployment and the monthly update. Start-AzureLocalSolutionUpdate.ps1 (scripts/deploy/08-day2-operations/task-02-start-solution-update/powershell) reads both keys; with -Mode OnDemand (the monthly update) it does not read install_after_deployment. Get-AvailableSolutionUpdate.ps1 (task 01, the check for updates) reads target_version. Learn: Update Azure Local by using PowerShell.
     */
    updates?: {
      /**
       * true: after the deployment, start the solution update (Start-SolutionUpdate) and return. The script does not wait: the update takes hours and the machines restart. false (default): no update is started. The script checks that the health of the update environment is not Failure, Error or Warning, and starts nothing when an update is already running or the instance is at the target. Sonar follows the run.
       */
      install_after_deployment?: boolean;
      /**
       * The solution version to install: latest (default; the highest solution update that is ready to install), or four numbers, for example 12.2611.1004.9, which the update service must list (Get-SolutionUpdate). Standalone Solution Builder Extension updates are not chosen.
       */
      target_version?: string;
    };
    /**
     * Backup of the instance and its workloads.
     */
    backup?: {
      /**
       * true when backup is part of the design.
       */
      enabled: boolean;
      /**
       * What is backed up: host, guest or both.
       */
      approach?: 'host' | 'guest' | 'both';
      /**
       * Name of the backup solution, for example Azure Backup.
       */
      solution?: string;
      /**
       * Name of the Recovery Services vault. Not read by the tools yet: a documented placeholder.
       */
      recovery_vault?: string;
      /**
       * Resource group of the Recovery Services vault.
       */
      resource_group?: string;
      /**
       * Name of the backup policy.
       */
      policy?: string;
    };
    /**
     * Disaster recovery of the workloads. Not read by the tools yet: a documented placeholder.
     */
    disaster_recovery?: {
      /**
       * none, asr (Azure Site Recovery) or hyper_v_replica.
       */
      method?: 'none' | 'asr' | 'hyper_v_replica';
      /**
       * Name of the Recovery Services vault used for replication. Not read by the tools yet: a documented placeholder.
       */
      recovery_vault?: string;
      /**
       * Resource group of the Recovery Services vault.
       */
      resource_group?: string;
      /**
       * Name of the replication policy. Not read by the tools yet: a documented placeholder.
       */
      replication_policy?: string;
      /**
       * Name of the recovery plan. Not read by the tools yet: a documented placeholder.
       */
      recovery_plan?: string;
      /**
       * Network the VMs fail over to.
       */
      network?: string;
      /**
       * Isolated network for test failovers. Not read by the tools yet: a documented placeholder.
       */
      test_network?: string;
      /**
       * Storage account that holds replication data.
       */
      storage_account?: string;
      /**
       * Recovery time objective in minutes. Not read by the tools yet: a documented placeholder.
       */
      target_rto_minutes?: number;
      /**
       * Recovery point objective in minutes. Not read by the tools yet: a documented placeholder.
       */
      target_rpo_minutes?: number;
    };
    /**
     * Who hears about alerts. Only email addresses: the action group of Azure Local alerting is an email group.
     */
    notifications?: {
      /**
       * Addresses (team mailboxes) that receive the notifications of the operations tools. Deploy-ActionGroup.ps1 makes each one an email receiver of the action group.
       */
      emails?: string[];
    };
    /**
     * Licensing benefits the instance uses.
     */
    licensing?: {
      /**
       * true to activate Azure Hybrid Benefit for Azure Local on the instance: it waives the Azure Local host service fee for an instance whose physical cores are covered by Windows Server Datacenter licenses with active Software Assurance. Enable-AzureHybridBenefit.ps1 (stage 05, phase 05, task 01) activates it with Invoke-AzStackHciExtendClusterSoftwareAssuranceBenefit. Activation cannot be undone, and Learn supports it only for hyperconverged instances with cloud connected management and no external storage, so the script refuses scenario.storage_architecture san or hybrid and scenario.connectivity disconnected. false or missing: the script does nothing; it never turns the benefit off.
       */
      azure_hybrid_benefit?: boolean;
      /**
       * true to turn on the Windows Server subscription add-on of the Azure Local instance: every Windows Server VM on the instance is then activated through automatic VM activation (AVMA), with a generic AVMA key in the guest. Enable-WindowsServerSubscription.ps1 (stage 05, phase 05, task 02) turns it on with Update-AzStackHciCluster -DesiredPropertyWindowsServerSubscription Enabled, the Azure PowerShell form of az stack-hci cluster update --desired-properties windows-server-subscription=Enabled that Microsoft Learn documents. It is a paid add-on, at no extra cost with Azure Hybrid Benefit (operations.licensing.azure_hybrid_benefit); Learn requires every machine to be online and registered to Azure. The script refuses scenario.connectivity disconnected. false or missing: the script does nothing; it never turns the add-on off.
       */
      windows_server_subscription?: boolean;
      /**
       * true when Azure Verification for VMs is turned on, so Windows Server 2025 guests get the Azure-only benefits. Not read by the tools yet: a documented placeholder.
       */
      azure_verification_for_vms?: boolean;
    };
    /**
     * Schema 5.6.32. Collection of the Windows Security, System and Application event logs of the machines into the Log Analytics workspace of operations.monitoring, with a data collection rule of the Azure Monitor Agent. Invoke-SecurityLogging-Orchestrated.ps1 (operational foundations, phase 04, task 04) creates the rule and associates it with the Arc machine of every node. Microsoft Learn (Collect Windows events with Azure Monitor Agent): the Security log of such a rule goes to the Event table with the other logs; the SecurityEvent table is filled only by a paid connector, which the toolkit does not set up.
     */
    security_logging?: {
      /**
       * Schema 5.6.32. true to collect the event logs. false or absent: Invoke-SecurityLogging-Orchestrated.ps1 does nothing and exits 0. It also needs operations.monitoring.enabled true and the workspace of operations.monitoring.log_analytics_workspace.
       */
      enabled?: boolean;
      /**
       * Schema 5.6.32. Name of the data collection rule the script creates in operations.monitoring.workspace_resource_group, in the region of the workspace. A rule of this name that exists is checked, never changed: the script reports a rule that collects other logs.
       */
      data_collection_rule?: string;
      /**
       * Schema 5.6.32. Which Security log events the rule collects, as the portal offers them (Microsoft Learn, Collect Windows events): success_and_failure (Audit success and Audit failure) or failure (Audit failure only).
       */
      security_audit?: 'success_and_failure' | 'failure';
      /**
       * Schema 5.6.32. The levels of the System and Application logs the rule collects (Microsoft Learn, Collect Windows events: Critical, Error, Warning, Information, Verbose). Default critical, error and warning.
       *
       * @minItems 1
       */
      event_levels?: ['critical' | 'error' | 'warning' | 'information' | 'verbose', ...('critical' | 'error' | 'warning' | 'information' | 'verbose')[]];
    };
    /**
     * Azure Monitor for the instance. Only Azure Monitor (monitoring) and the notification addresses are read by the tools so far (the monitoring scripts of phase 02, operational foundations); the rest is not read yet. Sonar reads its own settings.
     */
    monitoring?: {
      /**
       * true when Azure Monitor is part of the design. When it is false, every monitoring script of phase 02 (workspace, endpoint, Azure Monitor Agent, Insights association, action group) does nothing and exits 0.
       */
      enabled: boolean;
      /**
       * Name of the Log Analytics workspace. Deploy-LogAnalyticsWorkspace.ps1 creates it; Deploy-DataCollectionEndpoint.ps1 looks it up and takes the region of the endpoint from it. The Insights data collection rule sends to it: Enable-HciInsights.ps1 stops when the rule sends to no workspace of this name in operations.monitoring.workspace_resource_group.
       */
      log_analytics_workspace?: string;
      /**
       * Resource group of the Log Analytics workspace. It is also the resource group of the data collection endpoint and of the action group that the monitoring scripts create and of the Insights data collection rule that Enable-HciInsights.ps1 looks up.
       */
      workspace_resource_group?: string;
      /**
       * How many days the workspace keeps its data (the default retention). Deploy-LogAnalyticsWorkspace.ps1 passes it when it creates the workspace; a workspace that exists is never changed. 30 is the Azure default and costs nothing extra; Microsoft Learn says retention beyond 31 days is charged. The pricing tier is not a key: a new workspace is pay-as-you-go, the commitment tiers start at 100 GB a day and the legacy tiers are closed to new customers.
       */
      retention_days?: number;
      /**
       * Name of the existing data collection rule that Insights for Azure Local uses. Enable-HciInsights.ps1 (phase 02, task 03) looks it up in operations.monitoring.workspace_resource_group, checks (read only) that it collects what Microsoft Learn lists for Insights (the five performance counters and the event log channels Microsoft-Windows-Health/Operational and Microsoft-Windows-SDDC-Management/Operational) and sends to a Log Analytics workspace (operations.monitoring.log_analytics_workspace when set), and associates it with the Arc machine of every node; it never creates or changes the rule. Microsoft Learn documents no template for the rule and says not to build your own, so create it once in the Azure portal (the instance, Capabilities, Insights, Get Started) and put its name here. Learn names the AzureStackHCI- prefix for the rule the portal creates.
       */
      data_collection_rule?: string;
      /**
       * Name of the data collection endpoint that Deploy-DataCollectionEndpoint.ps1 creates, in the region of the workspace.
       */
      data_collection_endpoint?: string;
      /**
       * Name of the Azure Monitor action group that tells the operations team about alerts. Deploy-ActionGroup.ps1 creates it, with an email receiver for each address of operations.notifications.emails and operations.monitoring.alert_email. Letters, digits, space and . _ - ( ), starting with a letter or digit.
       */
      action_group?: string;
      /**
       * Schema 5.6.31. What Deploy-ActionGroup.ps1 (and its Azure CLI twin) does with an action group that exists but is disabled (a disabled group sends nothing to any receiver). false (default): the group is reported as Disabled with a warning and left disabled, because a person may have disabled it on purpose. true: the run enables it (Update-AzActionGroup -Enabled, az monitor action-group update --enabled true) and reports Enabled. Adding a receiver never changes the enabled state.
       */
      action_group_enable_if_disabled?: boolean;
      /**
       * Address that receives the alerts (a team mailbox). Deploy-ActionGroup.ps1 makes it an email receiver of the action group, next to the addresses of operations.notifications.emails.
       */
      alert_email?: string;
    };
  };
  /**
   * How the OS gets onto the machines (scenario.os_install), and the OS version.
   */
  provisioning?: {
    /**
     * The solution version the machines run: latest, latest-preview, or a version such as 12.2611.1004.9. Pin a version. Simplified provisioning installs it, and the SBE must be validated with it.
     */
    os_version: string;
    /**
     * OS installed from an ISO. There is no unattended install: the OS is installed, then the tools take over.
     */
    iso?: {
      /**
       * microsoft (the Azure portal download) or oem (the OEM's image). Documentation only; not read by the tools. A record of where the ISO came from.
       */
      image_source?: 'microsoft' | 'oem';
      /**
       * Schema 5.6.19. Where each machine's BMC fetches the OS ISO from, as the address you give the virtual media of the BMC (Redfish VirtualMedia.InsertMedia): an http, https, nfs or cifs address of the ISO. Invoke-MountGoldImageISO.ps1 (phase 02, task 02) inserts it as the virtual CD of every machine in nodes[].
       */
      image_uri?: string;
    };
    /**
     * Simplified machine provisioning from Azure, as azurelocal-ztp runs it. https://learn.microsoft.com/azure/azure-local/deploy/simplified-machine-provisioning
     */
    simplified?: {
      /**
       * Resource name of the Microsoft.Edge site.
       */
      site_name: string;
      /**
       * Subscription of the site and edge machines, when it isn't azure.subscription_id. Set-AzlDeploymentPolicyExemption.ps1 exempts the site's resource groups there.
       */
      subscription_id?: string;
      /**
       * Resource group of the site and edge machines, when it isn't azure.resource_group.
       */
      resource_group?: string;
      /**
       * The provisioning (maintenance environment) ISO: latest, a train such as 2610, a build such as 10.2610.0.3063, or a Microsoft download URL.
       */
      maintenance_iso: string;
      /**
       * The local administrator that the provisioned OS gets (Learn: simplified machine provisioning, step 3, provision machines from Azure).
       */
      admin: {
        /**
         * Name of the local administrator the OS install creates on each machine (Learn: step 3, provision machines from Azure).
         */
        username: string;
        /**
         * At least 12 characters with lowercase, uppercase, a digit and a special character. Create the secret before the run. azurelocal-ztp needs a keyvault://<vault>/<secret> reference here: Azure reads this secret from the vault itself when it provisions the machines (the template passes the vault and the secret name, never a value).
         */
        password: string;
      };
      /**
       * Schema 5.3. The password of the maintenance environment's local user (edgeuser), which azurelocal-ztp's Device stage signs in with to reach the Configurator service before the machine is claimed. A secret reference (keyvault://, env://, file:// or command://), read through the toolkit's resolver (scripts/common/secrets/AzlSecret.psm1) only when the run makes changes. Default: the maintenance environment's out-of-box password that Microsoft Learn documents (Configurator App article). Set a secret when the images carry another one.
       */
      maintenance_password?: string;
      /**
       * The SMB share the BMCs mount the images from.
       */
      media_share: {
        /**
         * Name of the SMB share ZTP creates over the folder of the virtual USB images: letters, digits and hyphens.
         */
        name: string;
        /**
         * The management host's address as the BMCs reach it.
         */
        host?: string;
        /**
         * Instead of host: the local adapter whose IPv4 address the BMCs reach. Wins over host.
         */
        host_adapter?: string;
        /**
         * Schema 5.4. The local account azurelocal-ztp creates on the management host to give the BMCs access to the share (it generates a password for it, and removes the account with the share). Default: svc-ztp-media.
         */
        account_name?: string;
        /**
         * Schema 5.4. Keep the share, its firewall rule and the account after the vouchers are collected (azurelocal-ztp removes them by default). Default false.
         */
        keep?: boolean;
      };
      /**
       * Schema 5.2. Folder on the management host for the run's downloads and data: the maintenance ISO cache, the SBE copy and its unpacked drivers, the per-node USB images (about 4 GB each), the vouchers and the run state. Outside any git working tree: azurelocal-ztp refuses a folder inside one, and creates it when missing. Default: %ProgramData%\AzureLocalZtp\<site_name>\media.
       */
      media_path?: string;
      /**
       * Schema 5.2. Folder on the management host for the run's evidence: the event log monitors follow (ztp-events.jsonl), the BIOS and other Redfish change logs, and run logs. Outside any git working tree, created when missing. Default: %ProgramData%\AzureLocalZtp\<site_name>\evidence.
       */
      evidence_path?: string;
      /**
       * Schema 5.4. While the OS installs, turn off the PCIe slots that hold the SAN adapters listed in nodes[].san.hbas[], so the maintenance environment can't install onto a SAN LUN; put each back in the Restore stage to the value it had before the install (the vendor's enabled value if it was already disabled). azurelocal-ztp derives the BIOS attribute from the slot label and the vendor (config/oem/<vendor>.json, bios section). Default: true when any node lists san.hbas, false otherwise. An explicit hardware.bios or bios_during_provisioning key for the same attribute wins. A vendor without a slot mapping needs the raw attribute in bios_during_provisioning.
       */
      isolate_san_adapters?: boolean;
      /**
       * Schema 5.4. When a node's management or provisioning port has slot Embedded (an onboard LOM), make sure the embedded NICs are enabled in the BIOS (Dell ships them as DisabledOs, and the OS then can't see them): azurelocal-ztp sets the vendor's embedded-NIC attribute at the Boot stage and leaves it set. Default true. Does nothing when no such port is listed. An explicit hardware.bios key for the same attribute wins.
       */
      enable_embedded_nics?: boolean;
      /**
       * Schema 5.4. Create the resource group of the site and edge machines (azure.resource_group, or provisioning.simplified.resource_group) when it does not exist. Default true. Set false when a landing zone creates resource groups and azurelocal-ztp should stop if it is missing.
       */
      create_resource_group?: boolean;
      /**
       * Schema 5.4. Name of the Microsoft.Edge/configurations resource (the site configuration). Default: default.
       */
      configuration_name?: string;
      /**
       * Schema 5.4. Name for the managed resource group of the site configuration, which holds the Arc machines. Default: empty, the service chooses the name.
       */
      managed_resource_group_name?: string;
      /**
       * Schema 5.4. Create the site's network, time, connectivity and security settings (Microsoft.Edge/configurations child resources). Default true. Set false when the site configuration already carries them.
       */
      apply_site_settings?: boolean;
      /**
       * Schema 5.4. Reference the Key Vault in the site's security settings, which the provisioning administrator secret needs. Default true.
       */
      use_key_vault_configuration?: boolean;
      /**
       * Schema 5.4. Give each edge machine its constrained role delegations on the resource group and on the Key Vault. Default true. Set false when your landing zone assigns them.
       */
      assign_provisioning_roles?: boolean;
      /**
       * Schema 5.4. Give the Azure Local resource provider its Azure Connected Machine Resource Manager role on the resource group. Default true. Set false when the resource group already has this assignment under another name (the deployment would fail with RoleAssignmentExists).
       */
      assign_hci_rp_role?: boolean;
      /**
       * Schema 5.4. Kind of the site's network setting: LAN or WLAN. Default LAN.
       */
      network_kind?: 'LAN' | 'WLAN';
      /**
       * Schema 5.4. The time setting of the site configuration, used while the machines are provisioned. Default: Automatic. (networking.ntp_servers is OS configuration; it is not copied here.)
       */
      ntp?: {
        /**
         * Automatic or Manual.
         */
        configuration?: 'Automatic' | 'Manual';
        /**
         * The NTP server (address or name) when configuration is Manual.
         */
        server?: string;
        /**
         * The alternate NTP server when configuration is Manual.
         */
        alternate_server?: string;
      };
      /**
       * Schema 5.4. Auto (create the site and configuration when missing), Create (they must not exist) or Reuse (they must exist). Default Auto.
       */
      site_mode?: 'Auto' | 'Create' | 'Reuse';
      /**
       * Schema 5.4. Name of the ARM deployment. Default: ztp-<site_name>.
       */
      deployment_name?: string;
      /**
       * Schema 5.4. Skip the Bootstrap stage's check of the Azure prerequisites (the feature, the resource providers and the catalog). Default false.
       */
      skip_azure_check?: boolean;
      /**
       * Schema 5.4. Resolve stage: also consider preview trains when maintenance_iso is latest. Default false.
       */
      include_preview?: boolean;
      /**
       * Schema 5.4. Resolve stage: the highest train to consider when maintenance_iso is latest, for example 2609 to stay on the train of a given solution release. Default: none.
       */
      max_train?: string;
      /**
       * Schema 5.4. Resubmit a failed OS install job once. Default true.
       */
      retry_provision_os?: boolean;
      /**
       * Schema 5.4. The per-node virtual USB image that carries the maintenance ISO.
       */
      usb_image?: {
        /**
         * Image size in GiB. The maintenance ISO needs about 1 GiB; 4 is the size that booted on Dell 16G servers. Default 4.
         */
        size_gb?: number;
        /**
         * File-name prefix of the images (<prefix><node>.img). Default ztp-usb-.
         */
        name_prefix?: string;
      };
      /**
       * Schema 5.4. The maintenance environment's Configurator service, which the Device stage reaches before the claim.
       */
      maintenance_environment?: {
        /**
         * TCP port of the service (https://<address>:<port>/BootstrapOobeService). Default 20001, the port Microsoft documents.
         */
        port?: number;
        /**
         * The service's local user. Default edgeuser, as Microsoft documents. Its password is maintenance_password.
         */
        username?: string;
      };
      /**
       * Schema 5.4. How long azurelocal-ztp waits at each stage, and how often it polls. The defaults are the values that worked on Dell AX servers; a server with a long POST (large memory) or a slow link may need more.
       */
      timeouts?: {
        /**
         * Bootstrap stage: overall budget until the maintenance environment is up and every node is ready for the portal. Default 120.
         */
        bootstrap_minutes?: number;
        /**
         * Bootstrap stage: budget until a valid voucher appears. Default 90.
         */
        bootstrap_voucher_minutes?: number;
        /**
         * Bootstrap stage: how long the BMC may show no change before the stage reports a stall. Default 20.
         */
        bootstrap_stall_minutes?: number;
        /**
         * Vouchers stage: how long to wait for each node's voucher in its image. Default 120.
         */
        voucher_wait_minutes?: number;
        /**
         * Device stage: how long the maintenance environment may take to report the static address (and to be found by the scan). Default 30.
         */
        device_minutes?: number;
        /**
         * Ready stage: polling budget until every machine is ready to cluster. Default 180.
         */
        ready_minutes?: number;
        /**
         * Network stage: how long each Azure configuration job may take. Default 60.
         */
        network_minutes?: number;
        /**
         * Restore stage: how long to wait after the BIOS restart before checking that the Arc machines are Connected again. Default 5.
         */
        restore_settle_minutes?: number;
        /**
         * Boot and Restore stages: how long to wait for a node's BIOS to report the new values after the restart. Default 30.
         */
        bios_minutes?: number;
        /**
         * Network stage: how long to wait for an edge machine to report its network adapters. The stage polls every poll_interval_seconds (at least 5) until the management MAC is in the list, because the list can still be empty right after Ready. Default 10; 0 reads once and does not wait. When the budget is spent without the management MAC the machine is not verified in any mode (adapters never reported, a Warning that is never a success state) and the Handoff stage reads the adapters again.
         */
        adapters_minutes?: number;
        /**
         * Ready and Network stages: seconds between polls. Default 60.
         */
        poll_interval_seconds?: number;
      };
    };
  };
  /**
   * How the toolkit's OS configuration run (Invoke-AzureLocalOsConfiguration.ps1) treats the machines after the OS is installed, whichever way it was installed. Optional; every key has a default. (since 5.4.3)
   */
  os_configuration?: {
    /**
     * Wipe the leftover local storage (storage pools, virtual disks and the data on non-boot, non-system local disks) of every machine in the OS configuration run's Apply mode, so a re-used machine starts clean. Boot, system, SAN (Fibre Channel, iSCSI) and USB disks are never touched. The Plan mode lists the disks per machine and wipes nothing; in a pipeline that list is what the approval gate shows. Default false: leftover storage is reported as blocking, and nothing is wiped. (since 5.4.3)
     */
    clear_storage?: boolean;
    /**
     * How a guarded network change is confirmed (since 5.4.4): the management address, gateway, DNS, VLAN, the remote-management firewall rules, DHCP off on the other ports and disabled adapters are staged on the node, which applies and checks them and reverts by itself unless the orchestrator confirms through a new session on the new address.
     */
    network?: {
      /**
       * The window for the orchestrator's confirmation. With no confirmation inside it the node restores its snapshot. The run setting networkRollbackMinutes overrides it. (since 5.4.4)
       */
      confirm_minutes?: number;
      /**
       * How long the node's own checks must stay green before it waits for the confirmation. The run setting networkStableSeconds overrides it. (since 5.4.4)
       */
      stable_seconds?: number;
    };
    /**
     * How the OS configuration reaches the nodes and how their remote management (WinRM, RDP, ICMP) is secured. The environment class (scenario.environment_class) picks the profile; these keys refine it. The baseline holds in every class and no key changes it: AllowUnencrypted false, Basic and CredSSP off, no SkipCACheck or SkipCNCheck, TLS 1.2 or higher. transport, bootstrap_transport and allowed_source_cidrs are since 5.4.4; the other keys are since 5.6.
     */
    remoting?: {
      /**
       * winrm (HTTP, 5985), winrm_https (5986, a certificate on the node) or arc (Azure Arc Run Command: the exception for sites with no route to the nodes; not recommended for network changes). The command line's -Transport WinRM or ArcRunCommand overrides it.
       */
      transport?: 'winrm' | 'winrm_https' | 'arc';
      /**
       * How a node whose WinRM firewall rule blocks this host is opened once, without touching the node by hand. none: such a node fails with the diagnosis. arc: Azure Arc Run Command (outbound 443 only; the wait is capped, default 3 minutes, then the route fails cleanly). smb: TCP 445 from a Windows orchestrator to the node, the local Administrator, one small service run once with sc.exe; Windows orchestrator only. auto: the allowed routes in the order smb, arc. Each runs one small script that starts WinRM, creates the listener if none exists and sets the WinRM rules' scope, then everything else runs over WinRM. production and dmz also need the pipeline approval (-ApprovedBootstrap). The environment class decides whether a bootstrap is allowed at all.
       */
      bootstrap_transport?: 'none' | 'arc' | 'smb' | 'auto';
      /**
       * The runner and jump server addresses, as the node sees them (after NAT), allowed to use WinRM, RDP and ICMP on the nodes, in addition to the management and out-of-band networks. IPv4 or IPv6 CIDR; /0 to /8 is refused, dev and production refuse anything wider than /24 (/64 for IPv6), dmz takes /32 or /128 only. The dmz class does not add the management network.
       */
      allowed_source_cidrs?: string[];
      /**
       * true: the nodes' firewall accepts WinRM, RDP and ICMP from any source (and TrustedHosts is '*' on the machine running the automation). Honoured only in the classes lab and test, where it is implied unless you set false; it is an error in dev, production and dmz.
       */
      allow_any_source?: boolean;
      /**
       * The TrustedHosts policy on the machine running the automation. auto: the class decides. exact: only the nodes' addresses. wildcard: '*', lab and test only. The previous value is restored after the run.
       */
      trusted_hosts?: 'auto' | 'exact' | 'wildcard';
      /**
       * auto: the class decides (HTTP in lab and test; HTTPS in dev, production and dmz). true: WinRM over HTTPS (5986). false: HTTP only, which production and dmz refuse and dev warns about.
       */
      use_https?: 'auto' | true | false;
      /**
       * true: you confirm the network of the nodes has no route to production. Only a statement in lab and test (it changes the warning text, not the behaviour); it is not allowed in dev, production or dmz, where Any is never accepted.
       */
      isolation_confirmed?: boolean;
      /**
       * The server certificate for the HTTPS listener: the 40-hex thumbprint of a certificate already in the node's LocalMachine\My store, or a secret reference (keyvault://<vault>/<secret>, env://<VARIABLE>, file://<name> or command://<name>) of a secret that holds the certificate as a base64 PFX without a password (for Key Vault, a certificate's secret). Empty: each node gets a self-signed Server Authentication certificate with its DNS names and management IP as subject alternative names, as the pre-join bootstrap only (not allowed in dmz).
       */
      certificate?: string;
    };
  };
  /**
   * Disconnected operations: the control plane appliance, its endpoints, identity and certificates.
   */
  disconnected?: {
    /**
     * management: this instance runs the control plane appliance. workload: it is managed by a management instance.
     */
    role: 'management' | 'workload';
    /**
     * Folder the control plane appliance files are kept in. Not read by the tools yet: a documented placeholder.
     */
    base_path?: string;
    /**
     * DNS suffix of the disconnected control plane. Not read by the tools yet: a documented placeholder.
     */
    domain_suffix?: string;
    ingress?: ApplianceEndpoint;
    management?: ApplianceEndpoint1;
    /**
     * DNS server the control plane uses.
     */
    dns_server?: string;
    /**
     * Time sources of the control plane, as host names or addresses. Not read by the tools yet: a documented placeholder.
     */
    time_servers?: string[];
    /**
     * The identity provider of the disconnected control plane (Active Directory Federation Services).
     */
    identity?: {
      /**
       * URL of the identity authority (for example the AD FS endpoint).
       */
      authority?: string;
      /**
       * Application (client) id registered for the control plane in the identity provider.
       */
      client_id?: string;
      /**
       * User principal name of the first operator. Not read by the tools yet: a documented placeholder.
       */
      root_operator_upn?: string;
      /**
       * LDAP server that serves the directory. Not read by the tools yet: a documented placeholder.
       */
      ldap_server?: string;
      /**
       * true to use LDAP over TLS. Not read by the tools yet: a documented placeholder.
       */
      ldaps?: boolean;
      /**
       * Identifier of the directory group that is synchronized. Not read by the tools yet: a documented placeholder.
       */
      sync_group_identifier?: string;
    };
    /**
     * Name of the operator subscription. Not read by the tools yet: a documented placeholder.
     */
    operator_subscription_name?: string;
    /**
     * Resource group the appliance resources are placed in.
     */
    resource_group?: string;
    /**
     * true when an internal certificate authority issues the appliance certificates. Not read by the tools yet: a documented placeholder.
     */
    internal_ca?: boolean;
  };
  /**
   * Switches, firewalls, console servers and other devices in the design.
   */
  network_devices?: NetworkDevice[];
  /**
   * Part 2 of the implementation steps: the Azure foundation the instance depends on. Optional; leave it out when the foundation exists and is managed elsewhere.
   */
  landing_zone?: {
    /**
     * Azure management groups of the landing zone.
     */
    management_groups?: {
      /**
       * Name (id) of the management group.
       */
      name: string;
      /**
       * Display name of the management group.
       */
      display_name?: string;
      /**
       * Parent management group name; empty for the tenant root. Read by Deploy-ManagementGroups.ps1.
       */
      parent?: string;
      /**
       * Which group of the fixed Azure landing zone hierarchy this is: root, platform, identity, connectivity, management, security or landing_zones. The Terraform landing zone module builds exactly this hierarchy and takes the names from the groups that carry a role. Leave it out when Terraform does not build the hierarchy.
       */
      role?: 'root' | 'platform' | 'identity' | 'connectivity' | 'management' | 'security' | 'landing_zones';
    }[];
    /**
     * Subscriptions by role. azure.subscription_id is the one the instance uses.
     */
    subscriptions?: {
      /**
       * Name of the subscription; the other landing_zone entries refer to it.
       */
      name: string;
      /**
       * Subscription id (a GUID). Use your own; the templates hold only a placeholder.
       */
      id?: string;
      /**
       * What the subscription is for.
       */
      role: 'connectivity' | 'identity' | 'management' | 'security' | 'devops' | 'workload' | 'azure_local';
      /**
       * Management group the subscription is under.
       */
      management_group?: string;
      /**
       * Schema 5.6.19. The billing scope a new subscription is created under, when the entry has no id: an enrollment account (Enterprise Agreement), an invoice section (Microsoft Customer Agreement) or a customer (Microsoft Partner Agreement), as Microsoft Learn (Programmatically create Azure subscriptions) writes it. Deploy-Subscriptions.ps1 (phase 01, task 02) passes it to New-AzSubscriptionAlias; an entry with an id is an existing subscription and does not need it.
       */
      billing_scope?: string;
      /**
       * Schema 5.6.19. The workload type of a new subscription: Production or DevTest (the Workload parameter of New-AzSubscriptionAlias). DevTest needs the Dev/Test offer on your agreement. Read by Deploy-Subscriptions.ps1 for an entry with no id.
       */
      workload?: 'Production' | 'DevTest';
    }[];
    /**
     * Resource groups of the landing zone.
     */
    resource_groups?: {
      /**
       * Name of the resource group.
       */
      name: string;
      /**
       * Name of a subscription in landing_zone.subscriptions.
       */
      subscription?: string;
      /**
       * Azure region of the resource group.
       */
      location?: string;
      /**
       * What the resource group is for, in words.
       */
      purpose?: string;
    }[];
    /**
     * Cost Management budgets of the landing zone (schema 5.6.30; Microsoft Learn: Tutorial: Create and manage budgets). A budget is free: it tracks the cost of a subscription or a resource group and sends an e-mail when a threshold is passed; it never stops or deletes anything. Deploy-CostBudgets.ps1 and Deploy-CostBudgets.azcli.ps1 (phase 01, task 04) create each entry, and update an existing budget of the same name to what the file says. Leave the list out for no budget.
     */
    budgets?: {
      /**
       * Name of the budget, unique in its scope: 1 to 63 letters, digits, hyphens and underscores (Microsoft Learn: Naming rules and restrictions, Microsoft.Consumption budgets).
       */
      name: string;
      /**
       * What the budget tracks: subscription (the whole subscription) or resource_group (one resource group of the subscription, named in resource_group).
       */
      scope?: 'subscription' | 'resource_group';
      /**
       * Name of a subscription in landing_zone.subscriptions. Empty: azure.subscription_id.
       */
      subscription?: string;
      /**
       * The resource group the budget tracks. Required when scope is resource_group, and not allowed otherwise. The resource group must exist (task 03).
       */
      resource_group?: string;
      /**
       * The amount of the budget for one time grain, in the billing currency of the subscription (a Cost Management budget carries no currency of its own). Greater than 0.
       */
      amount: number;
      /**
       * The period the amount covers; the tracked cost starts again at 0 at the start of each period: Monthly, Quarterly or Annually (the BillingMonth, BillingQuarter and BillingAnnual grains of the API are for Web Direct accounts only and are not offered). Azure cannot change the time grain of an existing budget: the scripts report it and change nothing; delete the budget or use another name.
       */
      time_grain?: 'Monthly' | 'Quarterly' | 'Annually';
      /**
       * First day of the budget, YYYY-MM-01: the first of a month, on or after 2017-06-01 and not more than twelve months ahead (Microsoft Learn: Budgets - Create Or Update). Empty: the first day of the current month (UTC) when the budget is created; an existing budget keeps its start date.
       */
      start_date?: string;
      /**
       * Last day of the budget, YYYY-MM-DD, after start_date. Empty: Azure sets ten years after the start date; an existing budget keeps its end date.
       */
      end_date?: string;
      /**
       * Percentages of the amount at which an e-mail is sent when the actual cost passes them, each greater than 0 and at most 1000. Together with forecast_thresholds at most five (a budget has at most five notifications). Default 80 and 100.
       *
       * @maxItems 5
       */
      thresholds?: [] | [number] | [number, number] | [number, number, number] | [number, number, number, number] | [number, number, number, number, number];
      /**
       * Percentages of the amount at which an e-mail is sent when the forecast cost of the period passes them (an early warning), each greater than 0 and at most 1000. Empty: no forecast alert.
       *
       * @maxItems 5
       */
      forecast_thresholds?:
        [] | [number] | [number, number] | [number, number, number] | [number, number, number, number] | [number, number, number, number, number];
      /**
       * E-mail addresses that get the alert of every threshold. At least one.
       *
       * @minItems 1
       */
      contact_emails: [string, ...string[]];
    }[];
    /**
     * Azure Policy of the landing zone. Tier 1 is the tag policy: the built-in policy 'Require a tag on resources' assigned in audit mode (enforcement mode DoNotEnforce, so non-compliance is reported and nothing is denied) at one management group, once for each required tag. Optional.
     */
    policy?: {
      /**
       * Tag names that every resource should carry, one audit assignment of the built-in policy 'Require a tag on resources' for each. The names follow your tagging standard; the tools assume none. Tag names are case-insensitive in Azure, must not contain < > % &  ? / and are at most 80 characters here.
       *
       * @minItems 1
       */
      required_tags?: [string, ...string[]];
      /**
       * Name (id) of the management group the tag policy is assigned at; the assignment cascades to everything under it. Empty or absent: the tenant root management group, whose id is azure.tenant_id. A management group id has 1 to 90 letters, digits, hyphens, underscores, periods and parentheses, starts with a letter or digit and does not end with a period.
       */
      management_group?: string;
      /**
       * Schema 5.6.28. Azure Policy assignments at the scope of the Azure Local subscription (azure.subscription_id), made by the Terraform security module. The tag policy of required_tags is separate.
       */
      assignments?: {
        /**
         * Name of the assignment (its resource name, unique in its scope).
         */
        name: string;
        /**
         * Resource ID of the policy definition or initiative.
         */
        policy_definition_id: string;
        /**
         * Display name of the assignment.
         */
        display_name: string;
        /**
         * Description of the assignment.
         */
        description?: string;
        /**
         * Enforcement mode: true (Default) applies the policy's effect, false only reports (DoNotEnforce). Default true.
         */
        enforce?: boolean;
        /**
         * Message shown when a resource is not compliant.
         */
        non_compliance_message?: string;
      }[];
      /**
       * Schema 5.6.28. Azure Policy assignments at the scope of a resource group of the landing zone, made by the Terraform security module.
       */
      resource_group_assignments?: {
        /**
         * Name of the assignment (its resource name, unique in its scope).
         */
        name: string;
        /**
         * Name of the resource group the policy is assigned to (an entry of landing_zone.resource_groups).
         */
        resource_group: string;
        /**
         * Resource ID of the policy definition or initiative.
         */
        policy_definition_id: string;
        /**
         * Display name of the assignment.
         */
        display_name: string;
        /**
         * Description of the assignment.
         */
        description?: string;
        /**
         * Enforcement mode: true (Default) applies the policy's effect, false only reports (DoNotEnforce). Default true.
         */
        enforce?: boolean;
        /**
         * Message shown when a resource is not compliant.
         */
        non_compliance_message?: string;
      }[];
    };
    /**
     * Azure virtual networks.
     */
    networks?: {
      /**
       * Name of the virtual network.
       */
      name: string;
      /**
       * Name of the subscription (landing_zone.subscriptions[].name) that holds the network.
       */
      subscription?: string;
      /**
       * Resource group of the network.
       */
      resource_group?: string;
      /**
       * Azure region of the network.
       */
      location?: string;
      /**
       * hub or spoke.
       */
      role?: 'hub' | 'spoke';
      /**
       * Address ranges of the virtual network, in CIDR form.
       *
       * @minItems 1
       */
      address_space: [Cidr, ...Cidr[]];
      /**
       * DNS servers of the virtual network.
       */
      dns_servers?: Ipv4[];
      /**
       * Subnets of the virtual network.
       */
      subnets?: {
        /**
         * Name of the subnet, for example GatewaySubnet.
         */
        name: string;
        /**
         * Address range of the subnet in CIDR form.
         */
        prefix: string;
        /**
         * Name of the network security group on the subnet.
         */
        network_security_group?: string;
        /**
         * Name of the route table on the subnet.
         */
        route_table?: string;
      }[];
      /**
       * Names of networks this one peers with. Not read by the tools yet: a documented placeholder.
       */
      peer_with?: string[];
      /**
       * Schema 5.6.23. Whether the peerings that start in this network accept traffic that was sent by a machine outside the peered network (Microsoft Learn: Virtual network peering, Allow forwarded traffic). Default true. A peering is made in both directions; each direction uses the options of the network it starts in.
       */
      allow_forwarded_traffic?: boolean;
      /**
       * Schema 5.6.23. Whether the peerings that start in this network let the peer use the VPN or ExpressRoute gateway of this network (Microsoft Learn: Virtual network peering, Gateway transit). Set it on the hub that has the gateway. Default false. Cannot be true together with use_remote_gateways on the same network.
       */
      allow_gateway_transit?: boolean;
      /**
       * Schema 5.6.23. Whether the peerings that start in this network use the gateway of the peer (Microsoft Learn: Virtual network peering, Use remote gateways). Set it on the spokes. The peer must set allow_gateway_transit to true and have a gateway. Default false.
       */
      use_remote_gateways?: boolean;
    }[];
    /**
     * Schema 5.6.21. Network security groups (NSG) of the Azure landing zone networks, with their rules. A subnet names its group in landing_zone.networks[].subnets[].network_security_group; New-LandingZoneNsg.ps1 (phase 04, manual deployment, task 06) creates each group listed here in the subscription, resource group and region of every network whose subnets name it (Deploy-VirtualNetworks.ps1 looks the group up there and attaches it), and adds the rules that are missing. A group that no subnet names is not created. These are Azure virtual network groups, not the Azure Local groups of networking.network_security_groups.
     */
    network_security_groups?: {
      /**
       * Schema 5.6.21. Name of the network security group, 1 to 80 characters: letters, digits, underscore, period and hyphen; it starts with a letter or digit and ends with a letter, digit or underscore. It cannot be changed afterwards.
       */
      name: string;
      /**
       * Schema 5.6.21. The security rules of the group. A group with no rules has only the default rules Azure adds (Microsoft Learn, Azure network security groups overview). The script adds the rules that are missing; a rule that exists with the same name is left alone and, when it differs from the file, reported. It never removes or changes a rule.
       */
      rules?: {
        /**
         * Schema 5.6.21. Name of the rule, 1 to 80 characters, with the same characters as the group name. Unique inside the group.
         */
        name: string;
        /**
         * Schema 5.6.21. Priority of the rule, 100 to 4096. A lower number is processed first. Two rules of a group cannot have the same priority and direction (Microsoft Learn, Azure network security groups overview).
         */
        priority: number;
        /**
         * Schema 5.6.21. Whether the rule applies to incoming (Inbound) or outgoing (Outbound) traffic.
         */
        direction: 'Inbound' | 'Outbound';
        /**
         * Schema 5.6.21. Allow or Deny the traffic the rule matches.
         */
        access: 'Allow' | 'Deny';
        /**
         * Schema 5.6.21. Protocol the rule matches: * (any, the default), Tcp, Udp, Icmp, Esp or Ah (New-AzNetworkSecurityRuleConfig -Protocol).
         */
        protocol?: '*' | 'Tcp' | 'Udp' | 'Icmp' | 'Esp' | 'Ah';
        /**
         * Schema 5.6.21. Source the rule matches: * (any, the default), IPv4 addresses or ranges in CIDR form, or one service tag such as VirtualNetwork or Internet (a rule takes only one service tag, and a service tag cannot be mixed with addresses). A list.
         *
         * @minItems 1
         */
        source_address_prefixes?: [string, ...string[]];
        /**
         * Schema 5.6.21. Source ports the rule matches: * (any, the default), a port or a range such as 1024-2048, each from 0 to 65535. A list.
         *
         * @minItems 1
         */
        source_port_ranges?: [string, ...string[]];
        /**
         * Schema 5.6.21. Destination the rule matches: * (any, the default), IPv4 addresses or ranges in CIDR form, or one service tag. A list.
         *
         * @minItems 1
         */
        destination_address_prefixes?: [string, ...string[]];
        /**
         * Schema 5.6.21. Destination ports the rule matches: * (any), a port or a range such as 8000-8100, each from 0 to 65535. A list. Required: New-AzNetworkSecurityRuleConfig has no default for it.
         *
         * @minItems 1
         */
        destination_port_ranges: [string, ...string[]];
        /**
         * Schema 5.6.21. Optional text for the rule, at most 140 characters.
         */
        description?: string;
      }[];
    }[];
    /**
     * Gateways, bastion and firewall of the connectivity hub.
     */
    connectivity?: {
      /**
       * The VPN gateway of the hub.
       */
      vpn_gateway?: {
        /**
         * Name of the VPN gateway.
         */
        name: string;
        /**
         * Resource group of the VPN gateway.
         */
        resource_group?: string;
        /**
         * Name of the virtual network the gateway sits in.
         */
        network?: string;
        /**
         * SKU of the VPN gateway, for example VpnGw1AZ.
         */
        sku?: string;
        /**
         * Schema 5.6.28. Name of the public IP address of the VPN gateway (of its first instance in active-active mode). Needed by the Terraform networking module.
         */
        public_ip_name?: string;
        /**
         * Schema 5.6.28. Name of the public IP address of the second instance; needed when active_active is true (Microsoft Learn: About active-active mode VPN gateways).
         */
        secondary_public_ip_name?: string;
        /**
         * Schema 5.6.28. Active-active mode: both gateway instances carry tunnels; it needs a route-based VPN, a SKU other than Basic and two Standard static public IPs (Microsoft Learn: About active-active mode VPN gateways). Default false.
         */
        active_active?: boolean;
        /**
         * BGP autonomous system number of the gateway.
         */
        bgp_asn?: number;
        /**
         * Site-to-site connections to other sites.
         */
        site_to_site?: {
          /**
           * Name of the connection.
           */
          connection_name: string;
          /**
           * Name of the local network gateway resource.
           */
          local_gateway_name?: string;
          /**
           * Public IPv4 address of the peer VPN device. The Terraform generator (New-IacVariableFiles.ps1) writes it to the local network gateway.
           */
          peer_public_ip?: string;
          /**
           * Address ranges behind the peer, in CIDR form. The Terraform generator (New-IacVariableFiles.ps1) writes it to the local network gateway.
           */
          peer_address_prefixes?: Cidr[];
          /**
           * BGP peer address of the peer device.
           */
          peer_bgp_address?: string;
          /**
           * BGP autonomous system number of the peer.
           */
          peer_asn?: number;
          /**
           * A Key Vault secret reference: keyvault://<vault>/<secret>. The vault must be listed in key_vaults.
           */
          shared_key: string;
        }[];
        /**
         * Point-to-site VPN for individual users.
         */
        point_to_site?: {
          /**
           * Address pool handed to point-to-site clients, in CIDR form.
           */
          address_pool: string;
          /**
           * How clients sign in: entra_id, certificate or radius. Configure-P2sVpn.ps1 (phase 04, manual deployment, task 04) builds entra_id and certificate; radius is not built (it needs the server address and its secret).
           */
          authentication?: 'entra_id' | 'certificate' | 'radius';
          /**
           * Schema 5.6.19. The tunnel types the gateway accepts: OpenVPN, IkeV2 or SSTP (the VpnClientProtocol of Set-AzVirtualNetworkGateway). With entra_id only OpenVPN is allowed (Microsoft Learn, Configure P2S VPN Gateway for Microsoft Entra ID authentication). With certificate the default is OpenVPN and IkeV2.
           */
          protocols?: ('OpenVPN' | 'IkeV2' | 'SSTP')[];
          /**
           * Schema 5.6.19. The name of the root certificate on the gateway, for authentication certificate. The name identifies the certificate in the portal and does not have to match anything in the certificate.
           */
          root_certificate_name?: string;
          /**
           * Schema 5.6.19. A secret reference to the public certificate data of the root certificate (the base64 text of the .cer file, without the BEGIN and END lines), for authentication certificate. The data is public; a reference keeps the file free of a long value.
           */
          root_certificate?: string;
        };
      };
      /**
       * Azure Bastion of the hub.
       */
      bastion?: {
        /**
         * Name of the Bastion host.
         */
        name: string;
        /**
         * Resource group of the Bastion host.
         */
        resource_group?: string;
        /**
         * SKU of the Bastion host: Basic, Standard or Premium (New-AzBastion -Sku). New-AzureBastion.ps1 (phase 04, manual deployment, task 05) needs it.
         */
        sku?: string;
        /**
         * Schema 5.6.19. Name of the virtual network the Bastion host is in: an entry of landing_zone.networks with a subnet named AzureBastionSubnet of /26 or larger (Microsoft Learn: Azure Bastion configuration settings). The subscription and region of the host are those of that entry.
         */
        network?: string;
        /**
         * Schema 5.6.28. Name of the public IP address of the Bastion host (Standard SKU, static: Microsoft Learn, About Azure Bastion configuration settings). Needed by the Terraform networking module.
         */
        public_ip_name?: string;
      };
      /**
       * Schema 5.6.19. An Azure NAT gateway for the outbound traffic of subnets of a landing zone network. New-NatGateway.ps1 (phase 04, manual deployment, task 07) creates it with a Standard public IP address and associates the subnets.
       */
      nat_gateway?: {
        /**
         * Name of the NAT gateway.
         */
        name: string;
        /**
         * Resource group of the NAT gateway and its public IP address; default: the resource group of the network.
         */
        resource_group?: string;
        /**
         * Name of the virtual network (an entry of landing_zone.networks) whose subnets the gateway serves. Its subscription and region are those of that entry.
         */
        network?: string;
        /**
         * Names of the subnets of that network that use the NAT gateway for outbound traffic.
         */
        subnets?: string[];
        /**
         * Minutes a TCP connection may stay idle before the NAT gateway drops it: 4 to 120 (Microsoft Learn, Azure NAT Gateway). Leave it out for the Azure default of 4.
         */
        idle_timeout_minutes?: number;
        /**
         * Schema 5.6.28. Name of the public IP address of the NAT gateway. Needed by the Terraform networking module.
         */
        public_ip_name?: string;
        /**
         * Schema 5.6.28. SKU of the NAT gateway and of its public IP: Standard or StandardV2 (zone redundant; it takes StandardV2 public IPs only). Microsoft Learn: Azure NAT Gateway SKUs. Default Standard.
         */
        sku?: 'Standard' | 'StandardV2';
      };
      /**
       * Azure Firewall of the hub.
       */
      firewall?: {
        /**
         * Name of the firewall. Documentation only; not read by the tools. A record of the landing zone design.
         */
        name: string;
        /**
         * Resource group of the firewall. Documentation only; not read by the tools. A record of the landing zone design.
         */
        resource_group?: string;
        /**
         * SKU of the firewall. Documentation only; not read by the tools. A record of the landing zone design.
         */
        sku?: string;
        /**
         * Private address of the firewall. Documentation only; not read by the tools. A record of the landing zone design.
         */
        private_ip?: string;
      };
    };
    /**
     * Management VMs: domain controllers, jump box, Windows Admin Center, syslog.
     */
    virtual_machines?: {
      /**
       * Name of the virtual machine.
       */
      name: string;
      hostname?: NetbiosName;
      /**
       * What the machine is: domain_controller, jumpbox, windows_admin_center, syslog, management or other.
       */
      role: 'domain_controller' | 'jumpbox' | 'windows_admin_center' | 'syslog' | 'management' | 'other';
      /**
       * Where the VM runs.
       */
      deploy_target?: 'azure' | 'azure_local' | 'onprem';
      /**
       * Name of the subscription that holds the machine.
       */
      subscription?: string;
      /**
       * Resource group of the machine.
       */
      resource_group?: string;
      /**
       * Name of the virtual network the machine is in.
       */
      network?: string;
      /**
       * Name of the subnet the machine is in.
       */
      subnet?: string;
      /**
       * Private IPv4 address of the machine.
       */
      private_ip?: string;
      /**
       * Azure VM size, for example Standard_D2s_v5.
       */
      size?: string;
      /**
       * Schema 5.6.19. Operating system image of the machine: windows_server_2022 or windows_server_2025 (Windows Server Datacenter: Azure Edition) or ubuntu_2404 (Ubuntu Server 24.04 LTS). Deploy-ManagementVMs.ps1 (phase 04, manual deployment, task 11) turns it into the Azure Marketplace image (publisher, offer, SKU, latest version) and sets the machine up as a Windows or Linux machine.
       */
      os?: 'windows_server_2022' | 'windows_server_2025' | 'ubuntu_2404';
      /**
       * Local administrator user name of the machine. The password is a Key Vault secret.
       */
      admin_username?: string;
      /**
       * A Key Vault secret reference: keyvault://<vault>/<secret>. The vault must be listed in key_vaults.
       */
      admin_password?: string;
      /**
       * Schema 5.6.28. For a machine with role domain_controller: new_forest (the first domain controller: it creates the forest of identity.active_directory.domain_fqdn) or replica (an additional domain controller of that existing domain). No default: the toolkit's Ansible domain controller role stops when a domain controller has none.
       */
      dc_promotion?: 'new_forest' | 'replica';
      /**
       * Schema 5.6.28. For a machine with role domain_controller: a Key Vault secret reference (keyvault://<vault>/<secret>) to the Directory Services Restore Mode (safe mode) password the promotion sets. The toolkit reads it; it never generates or stores one. The vault must be listed in key_vaults.
       */
      dsrm_password?: string;
      /**
       * Schema 5.6.28. Size of the OS disk in GB (VMs in Azure). Default 128.
       */
      os_disk_size_gb?: number;
      /**
       * Schema 5.6.28. Storage type of the OS disk (VMs in Azure). Default Premium_LRS.
       */
      os_disk_type?: 'Standard_LRS' | 'StandardSSD_LRS' | 'StandardSSD_ZRS' | 'Premium_LRS' | 'Premium_ZRS';
      /**
       * Schema 5.6.28. Caching of the OS disk (VMs in Azure). Default ReadWrite.
       */
      os_disk_caching?: 'None' | 'ReadOnly' | 'ReadWrite';
      /**
       * Schema 5.6.28. Version of the Marketplace image of os (VMs in Azure): latest, or a version such as 26100.1234.250101. Default latest.
       */
      image_version?: string;
    }[];
    /**
     * The Log Analytics workspace of the landing zone.
     */
    log_analytics?: {
      /**
       * Name of the workspace. Documentation only; not read by the tools. operations.monitoring.log_analytics_workspace names the workspace the monitoring scripts use.
       */
      name: string;
    };
    /**
     * Storage accounts of the landing zone.
     */
    storage_accounts?: {
      /**
       * Name of the storage account (3 to 24 lowercase letters and digits).
       */
      name: string;
      /**
       * Resource group of the storage account.
       */
      resource_group?: string;
      /**
       * SKU of the storage account, for example Standard_LRS.
       */
      sku?: string;
      /**
       * What the account is for, for example cloud witness.
       */
      purpose?: string;
    }[];
  };
  /**
   * Part 1 of the implementation steps: the pipeline platform, the project and its settings, the environments, the sign-in to Azure and the self-hosted runners (tasks 01 to 06 of automation / 01-cicd-infra). Optional. Schema 5.5 added repository, settings, environments, authentication, runners, runner_network, runner_access, api_token and state.key.
   */
  devops?: {
    /**
     * The CI/CD platform: github, gitlab or azure_devops.
     */
    platform: 'github' | 'gitlab' | 'azure_devops';
    /**
     * URL of the CI/CD platform (an organization or instance URL).
     */
    url?: string;
    /**
     * Organization, group or project collection.
     */
    organization?: string;
    /**
     * Name of the project or organization on the platform.
     */
    project?: string;
    /**
     * Schema 5.5. Key Vault reference to a token with administrator rights on the organization or project. The setup scripts (tasks 02 to 05) use it when the platform CLI is not already signed in. Without it they read GH_TOKEN, GITLAB_TOKEN or AZURE_DEVOPS_EXT_PAT from the environment.
     */
    api_token?: string;
    /**
     * Schema 5.5. Name of the subscription in landing_zone.subscriptions that holds the runners (role devops). Default: the subscription with role devops.
     */
    subscription?: string;
    /**
     * Schema 5.5. Resource group of the runners, their identity and their network.
     */
    resource_group?: string;
    /**
     * Schema 5.5. Create devops.resource_group. False when it exists.
     */
    create_resource_group?: boolean;
    /**
     * Schema 5.5. The deployment repository or project that task 02 creates.
     */
    repository?: {
      /**
       * Repository name. Default: devops.project.
       */
      name?: string;
      /**
       * GitHub: owner/repo of a template repository. GitLab: the ID or path of the template project. Azure DevOps: the clone URL to import. Empty creates an empty repository.
       */
      template?: string;
      /**
       * Repository visibility.
       */
      visibility?: 'private' | 'internal';
      /**
       * The protected default branch.
       */
      default_branch?: string;
    };
    /**
     * Schema 5.5. What task 03 sets on the repository: branch protection, approvals and security.
     */
    settings?: {
      /**
       * Approvals a pull request needs before it merges. 0 for a sandbox.
       */
      required_approvals?: number;
      /**
       * The team or group whose members review: a GitHub team slug (org/team), a GitLab group path or an Azure DevOps group name.
       */
      reviewers?: string;
      /**
       * Allow squash merges only.
       */
      squash_only?: boolean;
      /**
       * Turn on secret scanning and push protection (GitHub), secret push rules (GitLab) or the secret file check (Azure DevOps).
       */
      secret_scanning?: boolean;
      /**
       * All conversations must be resolved before a merge.
       */
      resolve_conversations?: boolean;
      /**
       * Pipeline checks that must pass before a merge.
       */
      required_status_checks?: string[];
    };
    /**
     * Schema 5.5. The deployment environments that task 04 creates, with their approval gate.
     */
    environments?: {
      /**
       * Environment name, for example azr-prod-us, or ztp-reinstall for the approval in front of the ZTP Boot stage.
       */
      name: string;
      /**
       * A named reviewer must approve each deployment.
       */
      approval_required?: boolean;
      /**
       * GitHub user names or org/team slugs, GitLab user names or group paths, Azure DevOps e-mail addresses.
       */
      approvers?: string[];
      /**
       * Delay before a deployment starts (GitHub).
       */
      wait_minutes?: number;
      /**
       * The only branch that may deploy to the environment.
       */
      deployment_branch?: string;
    }[];
    /**
     * Schema 5.6.25. What the toolkit's own pipelines (the files under pipelines/) select: the runner label and the approval environment of each pipeline. Task 05 sets them as repository variables (GitHub) or project CI/CD variables (GitLab); Azure DevOps cannot read a variable there, so task 05 writes them into pipelines/azure-devops/variables/approval-environments.yml and pipeline-settings.yml, which the pipelines read when they are compiled (D126: no run parameter carries a deployment value). The pipeline files hold no runner label, pool or environment name of their own.
     */
    pipelines?: {
      /**
       * Schema 5.6.25. The one label by which the pipelines choose the general runner: runs-on on GitHub (after self-hosted and linux) and tags on GitLab. It must be an entry of devops.runners[].labels of the general runner, and a label no other runner of the repository has. On GitLab the tags of a runner are set when its authentication token is created, so list the same tag in labels. Azure DevOps chooses the runner by its pool, devops.runners[].pool, and ignores this key.
       */
      runner_label?: string;
      /**
       * Schema 5.6.25. The approval environment of each pipeline. Each value is the name of an entry of devops.environments[] that has approval_required true; two pipelines may use the same entry.
       */
      environments?: {
        /**
         * Schema 5.6.25. The environment that gates the Apply job of the OS configuration pipelines (pipelines/github-actions/os-configuration.yml, pipelines/gitlab/os-configuration.gitlab-ci.yml, pipelines/azure-devops/os-configuration.yml).
         */
        os_configuration?: string;
        /**
         * Schema 5.6.25. The environment of the second approval in front of a storage wipe (stage ConfirmStorageWipe of pipelines/azure-devops/os-configuration.yml). Use other approvers than for os_configuration where you can.
         */
        os_configuration_clear_storage?: string;
        /**
         * Schema 5.6.25. The environment that gates the Deploy job of the ARM deployment pipelines (pipelines/github-actions/arm-deployment.yml, pipelines/gitlab/stages/arm-deployment.yml, pipelines/azure-devops/arm-deployment.yml).
         */
        arm_deployment?: string;
        /**
         * Schema 5.6.25. The environment that gates the Apply job of the CI/CD infrastructure pipelines (the runners; pipelines/github-actions/cicd-infra.yml, pipelines/gitlab/stages/deploy-cicd-infra.yml, pipelines/azure-devops/cicd-infra.yml).
         */
        cicd_infra?: string;
        /**
         * Schema 5.6.25. The environment that gates the Terraform apply and the on-premises Ansible jobs of the Terraform and Ansible sample pipelines (pipelines/github-actions/azure-local-deploy.yml, pipelines/azure-devops/azure-local-deploy.yml, pipelines/gitlab/.gitlab-ci.yml).
         */
        terraform_deployment?: string;
        /**
         * Schema 5.6.28. The environment that gates every day 2 job that changes the cluster: the update (pipelines/github-actions/day2-update.yml, pipelines/gitlab/stages/day2-update.yml, pipelines/azure-devops/day2-update.yml), the node maintenance, the changing operations of the cluster operations pipeline, and the storage performance test of the validation pipeline. One environment for all of them on purpose: on Azure DevOps its Exclusive lock check then keeps an update and a node reboot from running on the cluster at the same time. Give it the approvers of your change process.
         */
        operations?: string;
      };
      /**
       * Schema 5.6.28. When the toolkit's scheduled pipelines run. A schedule is a five-field cron expression in UTC (the same syntax on GitHub Actions, GitLab CI and Azure DevOps; the platforms do not follow daylight saving time). GitHub Actions and Azure DevOps read a schedule only from the pipeline file (a cron expression cannot come from a variable there), so the sample pipeline file carries the default below and a test keeps the two equal; when you change the key, change the cron line of your copy of the pipeline file too. GitLab keeps a schedule in the project (CI/CD > Schedules), not in the file: create it with this value.
       */
      schedules?: {
        /**
         * Schema 5.6.28. When the day 2 check for updates runs (pipelines/github-actions/day2-check-updates.yml, pipelines/gitlab/stages/day2-check-updates.yml, pipelines/azure-devops/day2-check-updates.yml; owner directive D74: check for updates on a schedule). Five-field cron in UTC; empty means no schedule. The update agent of the cluster checks once a day (Learn: Use Azure Update Manager to update Azure Local), so daily is enough; the minute is not 0 because GitHub delays scheduled runs at the start of an hour, when many start at once. The run fails when the check finds something that needs attention (exit code 1), so the platform's own notification for a failed run is the alert. D126: the key works on all three platforms: task 05 writes it into the cron line of the GitHub workflow and of the Azure DevOps pipeline (with devops.repository.default_branch as the branch of the Azure DevOps schedule) and creates or updates the GitLab project schedule (deactivates it when the key is empty).
         */
        check_for_updates?: string;
      };
      /**
       * Schema 5.6.27. Azure DevOps only. The name of the Azure Resource Manager service connection (workload identity federation) that task 05 creates and that the Azure DevOps pipelines sign in through; task 01 puts the same name in the subject of the federated credential. The pipelines (pipelines/azure-devops/*.yml) read it as AZL_SERVICE_CONNECTION, a compile-time variable of pipelines/azure-devops/variables/pipeline-settings.yml that task 05 writes (D126: not a run parameter). Required when devops.platform is azure_devops; GitHub and GitLab ignore it.
       */
      service_connection?: string;
      /**
       * Schema 5.6.27. Azure DevOps only. The name of the variable group (Pipelines > Library) task 05 writes the sign-in values (ARM_*) and the state settings (TF_BACKEND_*) to. With entries in devops.environments[] there is one group per environment, named <variable_group>-<environment>. The Azure DevOps pipelines that link a group (azure-local-deploy.yml, os-configuration.yml) read its name as AZL_VARIABLE_GROUP of pipelines/azure-devops/variables/pipeline-settings.yml, which task 05 writes with a group entry (D126: not a run parameter); task 05 also writes the group <name> for the repository, which the pipelines read. Required when devops.platform is azure_devops; GitHub and GitLab ignore it.
       */
      variable_group?: string;
      /**
       * Schema 5.6.28. The path, in the deployment repository, of the infrastructure file the toolkit's pipelines pass to the scripts (-InfrastructureFile). Task 05 sets it as AZL_INFRASTRUCTURE_FILE (GitHub repository variable, GitLab project variable); the Azure DevOps pipelines read it as AZL_INFRASTRUCTURE_FILE of pipelines/azure-devops/variables/pipeline-settings.yml, which task 05 writes (D126: not a run parameter). The pipeline files hold no path of their own.
       */
      infrastructure_file?: string;
      /**
       * Schema 5.6.28. The repository path of the ZTP handoff files (a handoff file or a directory of *.ztp-handoff.json) the OS configuration pipelines pass to the script (-HandoffPath). A path that does not exist (a cluster installed from ISO) is not passed. Task 05 sets it as AZL_HANDOFF_PATH (GitHub, GitLab); the Azure DevOps pipeline reads it as AZL_HANDOFF_PATH of pipelines/azure-devops/variables/pipeline-settings.yml (none for no handoff), which task 05 writes (D126: not a run parameter). A run can instead take the artifact of a ZTP run (its run ID).
       */
      handoff_path?: string;
      /**
       * Schema 5.6.28. The tool versions every toolkit pipeline installs, the same on GitHub, GitLab and Azure DevOps. Task 05 sets each as an AZL_*_VERSION variable (GitHub repository variable, GitLab project variable, Azure DevOps variable group). The pipeline files hold no version of their own.
       */
      tool_versions?: {
        /**
         * Schema 5.6.28. The Terraform release the pipelines install (AZL_TERRAFORM_VERSION): hashicorp/setup-terraform, TerraformInstaller, or pipelines/gitlab/Use-AzlGitLabTool.ps1. Default: the version the toolkit's runners carry (tool_versions.terraform of the cicd-runner module, cicd_runner_terraform_version of the Ansible role).
         */
        terraform?: string;
        /**
         * Schema 5.6.28. The Python minor version of the Ansible jobs (AZL_PYTHON_VERSION): actions/setup-python, UsePythonVersion, or the python<version> virtual environment of Use-AzlGitLabTool.ps1. ansible-core 2.21 needs 3.12 or later.
         */
        python?: string;
        /**
         * Schema 5.6.28. The ansible-core release the Ansible jobs install with pip (AZL_ANSIBLE_CORE_VERSION).
         */
        ansible_core?: string;
        /**
         * Schema 5.6.28. The ansible-lint release the lint jobs install with pip (AZL_ANSIBLE_LINT_VERSION).
         */
        ansible_lint?: string;
        /**
         * Schema 5.6.28. The Az PowerShell module version (AZL_AZ_POWERSHELL_VERSION): preferredAzurePowerShellVersion of AzurePowerShell@5 on Azure DevOps, Install-Module Az -RequiredVersion on GitHub and GitLab.
         */
        az_powershell?: string;
        /**
         * Schema 5.6.28. The powershell-yaml module version the pipelines install to read infrastructure.yml (AZL_POWERSHELL_YAML_VERSION). Default: the version the toolkit is tested with (README).
         */
        powershell_yaml?: string;
        /**
         * Schema 5.6.28. The Az.KeyVault module version the pipelines install to read keyvault:// secrets (AZL_AZ_KEYVAULT_VERSION). Default: the version the toolkit is tested with (README).
         */
        az_keyvault?: string;
      };
    };
    /**
     * Schema 5.5. How the pipelines sign in to Azure (tasks 01 and 05). The app registration is azure.automation_identity.name.
     */
    authentication?: {
      /**
       * oidc: a federated credential per repository and environment, no secret. client_secret: a secret, stored only in Key Vault (devops.authentication.client_secret) and in the platform as a masked variable. Every toolkit pipeline follows it: task 05 sets AZL_AUTH_METHOD (GitHub, GitLab, the Azure DevOps variable group), and the sign-in steps choose OIDC or the secret by it (schema 5.6.28). A managed identity of the runner is not a method of the pipelines.
       */
      method?: 'oidc' | 'client_secret';
      /**
       * Key Vault reference where task 01 stores the generated client secret (method client_secret).
       */
      client_secret?: string;
      /**
       * Roles the service principal gets on each subscription. Default: Contributor and User Access Administrator, as the automation docs say. Narrow them when you can.
       */
      roles?: string[];
      /**
       * Also add the Microsoft Graph application permission RoleManagement.ReadWrite.Directory and grant admin consent. High privilege: leave false unless a pipeline assigns Entra roles.
       */
      grant_graph_role_management?: boolean;
      /**
       * Register Microsoft.Compute and the EncryptionAtHost feature on each subscription.
       */
      register_encryption_at_host?: boolean;
    };
    /**
     * Schema 5.5. The self-hosted runners that task 06 deploys with Terraform. One Linux general pool and at most one Windows ztp runner; use the module directly for more. Replaces devops.runner when present.
     */
    runners?: {
      /**
       * Name prefix of the VM or VMs, for example vm-contoso-runner-lnx.
       */
      name: string;
      /**
       * Operating system.
       */
      os_type: 'linux' | 'windows';
      /**
       * general: ARM, Arc, Terraform, Ansible and OS configuration. ztp: the azurelocal-ztp Boot, Bootstrap and Vouchers stages (Windows only).
       */
      purpose?: 'general' | 'ztp';
      /**
       * Number of VMs.
       */
      count?: number;
      /**
       * vm or vmss. Windows and ztp runners are VMs.
       */
      compute_type?: 'vm' | 'vmss';
      /**
       * VM size. Default Standard_D2s_v5 (Linux) and Standard_D4s_v5 (Windows ztp).
       */
      size?: string;
      /**
       * Labels added to the defaults (azure, the OS, terraform, ansible, ztp). The pipelines choose the general runner by one of them, devops.pipelines.runner_label.
       */
      labels?: string[];
      /**
       * Key Vault reference to the secret the runner reads at boot: a PAT or App token (GitHub), the runner authentication token (GitLab), a PAT with Agent Pools read and manage (Azure DevOps). Only the reference is here.
       */
      registration_secret?: string;
      /**
       * The Azure Pipelines agent pool, or the GitHub runner group. A ztp runner gets its own. Required on Azure DevOps (task 06 stops without it, there is no default pool); the Azure DevOps pipelines read the pool of the general runner as AZL_AGENT_POOL of pipelines/azure-devops/variables/pipeline-settings.yml, which task 05 writes (D126).
       */
      pool?: string;
      /**
       * Static private addresses, one per VM. Empty uses dynamic addresses.
       */
      private_ips?: Ipv4[];
      /**
       * The runner subnet inside runner_network.address_space.
       */
      subnet?: {
        /**
         * Name of the subnet the runner machines are placed in.
         */
        name: string;
        /**
         * Address range of that subnet, in CIDR form.
         */
        prefix: string;
      };
      /**
       * Data disk for the ZTP media, images and vouchers. 512 or more for ztp.
       */
      data_disk_gb?: number;
      /**
       * Schema 5.6.28. The SSH public key of the administrator of a Linux runner (a public key, not a secret): the key itself (ssh-ed25519, ssh-rsa or ecdsa-sha2-nistp*), or a reference the toolkit's secret resolver reads (file://<name> in secrets.file.directory, keyvault://, env://, command://). Task 05 sets AZL_RUNNER_SSH_PUBLIC_KEY from the general Linux runner's key (GitHub, GitLab, the Azure DevOps variable group), and task 06 reads it from there.
       */
      admin_ssh_public_key?: string;
      /**
       * Schema 5.6.28. Local administrator user name of the runner machines: the admin_username Terraform gives the VMs, and the account the Ansible cicd_runner playbook connects as (ansible_user of the cicd-runners inventory).
       */
      admin_username?: string;
      /**
       * Schema 5.6.28. Client (application) ID of the runner's user-assigned managed identity (GUID), once it exists. Not a secret.
       */
      identity_client_id?: string;
      /**
       * Schema 5.6.28. Name of the network security group of the runner subnet. Task 06 needs it; set an existing group's name to adopt it with terraform import.
       */
      nsg_name?: string;
      /**
       * Schema 5.6.28. Name of the user-assigned managed identity the runner signs in to Azure as. Task 06 needs it.
       */
      managed_identity_name?: string;
      /**
       * Schema 5.6.28. Windows runners only: Key Vault reference to the secret task 06 writes the generated administrator password to. The vault must be the vault of registration_secret. Absent: the password is kept in the Terraform state only.
       */
      windows_admin_password_secret?: string;
      /**
       * Schema 5.6.28. Availability zones the runner machines are spread over (the VM scale set spans them). Empty: no zone.
       */
      zones?: ('1' | '2' | '3')[];
      /**
       * Schema 5.6.28. Size of the OS disk in GB. Absent: the size the Terraform module gives the OS (default_os_disk_size_gb: 64 on Linux, 128 on Windows).
       */
      os_disk_size_gb?: number;
      /**
       * Schema 5.6.28. Storage type of the OS disk and of the data disk. Default Premium_LRS.
       */
      os_disk_type?: 'Standard_LRS' | 'StandardSSD_LRS' | 'StandardSSD_ZRS' | 'Premium_LRS' | 'Premium_ZRS';
      /**
       * Schema 5.6.28. Caching of the OS disk. Default ReadWrite.
       */
      os_disk_caching?: 'None' | 'ReadOnly' | 'ReadWrite';
      /**
       * Schema 5.6.28. Caching of the data disk (data_disk_gb). Default ReadWrite.
       */
      data_disk_caching?: 'None' | 'ReadOnly' | 'ReadWrite';
      /**
       * Schema 5.6.28. Encryption at host of the runner machines. The Microsoft.Compute/EncryptionAtHost feature must be registered on the subscription (task 01 does this with devops.authentication.register_encryption_at_host). Default false.
       */
      encryption_at_host?: boolean;
      /**
       * Schema 5.6.28. Marketplace image of the runner machines. Absent: the image the Terraform module gives the OS (default_images: Ubuntu 24.04 LTS on Linux, Windows Server 2025 Datacenter Azure Edition on Windows).
       */
      image?: {
        /**
         * Image publisher.
         */
        publisher: string;
        /**
         * Image offer.
         */
        offer: string;
        /**
         * Image SKU.
         */
        sku: string;
        /**
         * Image version. Default latest.
         */
        version?: string;
      };
    }[];
    /**
     * Schema 5.5. The VNet of the runners, the peering with the hub and the lab ranges they reach.
     */
    runner_network?: {
      /**
       * Name of the virtual network the runners are placed in.
       */
      vnet_name?: string;
      /**
       * Address ranges of that virtual network, in CIDR form.
       *
       * @minItems 1
       */
      address_space?: [Cidr, ...Cidr[]];
      /**
       * DNS servers of that virtual network.
       */
      dns_servers?: Ipv4[];
      /**
       * Peering with the hub VNet. The hub half is created in the hub subscription unless create_hub_side is false.
       */
      hub_peering?: {
        /**
         * Peer the runner VNet with the hub.
         */
        enabled?: boolean;
        /**
         * Name of the hub in landing_zone.networks (its subscription and resource group give the VNet ID).
         */
        hub_network?: string;
        /**
         * Resource ID of the hub VNet. Use it instead of hub_network.
         */
        hub_vnet_id?: string;
        /**
         * Use the hub VPN or ExpressRoute gateway to reach the lab.
         */
        use_remote_gateways?: boolean;
        /**
         * Create the hub half of the peering. False when the network team owns it.
         */
        create_hub_side?: boolean;
        /**
         * Schema 5.6.28. Name of the spoke half of the peering (on the runner VNet). Needed when enabled is true.
         */
        spoke_name?: string;
        /**
         * Schema 5.6.28. Name of the hub half of the peering (on the hub VNet). Needed when enabled and create_hub_side are true.
         */
        hub_name?: string;
      };
      /**
       * Lab networks the runners reach: management, storage, BMC.
       */
      reachable_cidrs?: Cidr[];
      /**
       * TCP ports allowed outbound to the lab networks. Default 22, 443, 445, 3389, 5985, 5986.
       */
      reachable_tcp_ports?: string[];
      /**
       * The BMC networks. The ztp runner accepts inbound TCP 445 from these only. Required for a ztp runner.
       */
      bmc_cidrs?: Cidr[];
      /**
       * Ranges that may reach SSH or RDP on the runners. Empty allows none.
       */
      admin_source_cidrs?: Cidr[];
      /**
       * Schema 5.6.28. The runner NSG allows HTTPS (443) outbound to the internet: GitHub, GitLab, Azure DevOps, package repositories and runner downloads. Default true.
       */
      allow_internet_https?: boolean;
      /**
       * Schema 5.6.28. The runner NSG allows HTTP (80) outbound to the internet: package mirrors with signed metadata. Default true.
       */
      allow_internet_http?: boolean;
      /**
       * Schema 5.6.28. The runner NSG allows ICMP outbound to reachable_cidrs and bmc_cidrs, for reachability checks. Default true.
       */
      allow_icmp?: boolean;
    };
    /**
     * Schema 5.5. What the runners may do in Azure (least privilege).
     */
    runner_access?: {
      /**
       * Resource groups where the runners are Contributor. Default: azure.resource_group. Add the Azure Local managed resource group if it can take deployments.
       */
      resource_groups?: ResourceGroup[];
      /**
       * Role Based Access Control Administrator on those resource groups, which the Azure Local deployment and ZTP need.
       */
      rbac_administrator?: boolean;
      /**
       * Limit the roles the runners may assign to these role definition GUIDs. Empty allows any role.
       */
      rbac_delegable_role_ids?: Guid[];
      /**
       * Azure Connected Machine Resource Administrator on those resource groups, so jobs can run Arc Run Command on the machines.
       */
      arc_run_command?: boolean;
      /**
       * Vaults the runners read secrets from. Default: every vault in key_vaults.
       */
      key_vaults?: KeyVaultName[];
      /**
       * Schema 5.6.28. Other role assignments of the runner identities, each with a short name, a scope (a resource ID) and a role name.
       */
      additional_role_assignments?: {
        /**
         * Short name of the assignment (unique in the list).
         */
        name: string;
        /**
         * Resource ID of the scope: a subscription, a resource group or a resource.
         */
        scope: string;
        /**
         * Name of the role, for example Reader.
         */
        role_definition_name: string;
      }[];
    };
    /**
     * One runner (the form before devops.runners[]). Kept for files written before 5.5; use devops.runners[].
     */
    runner?: {
      /**
       * Name of the runner.
       */
      name: string;
      /**
       * Kind of runner: vm, container_app or existing.
       */
      type: 'vm' | 'container_app' | 'existing';
      /**
       * Subscription of the runner.
       */
      subscription?: string;
      /**
       * Resource group of the runner.
       */
      resource_group?: string;
      /**
       * Virtual network of the runner.
       */
      network?: string;
      /**
       * Subnet of the runner.
       */
      subnet?: string;
      /**
       * Private address of the runner.
       */
      private_ip?: string;
      /**
       * VM size of the runner.
       */
      size?: string;
      /**
       * Runner tags or labels that jobs select.
       */
      labels?: string[];
      /**
       * A Key Vault secret reference: keyvault://<vault>/<secret>. The vault must be listed in key_vaults.
       */
      registration_token?: string;
    };
    /**
     * Where the Terraform state is kept.
     */
    state?: {
      /**
       * Schema 5.5. Subscription of the state storage account.
       */
      subscription_id?: string;
      /**
       * Schema 5.5. Blob name of the CI/CD runners state. Default cicd-infra.tfstate.
       */
      key?: string;
      /**
       * Storage account that holds the state.
       */
      storage_account?: string;
      /**
       * Blob container that holds the state. Default tfstate (task 05 sets TF_BACKEND_CONTAINER for the pipelines, task 06 and New-IacVariableFiles.ps1 write it to the backend settings).
       */
      container?: string;
      /**
       * Resource group of the state storage account.
       */
      resource_group?: string;
      /**
       * Schema 5.6.28. Blob name of the state of the azure-local Terraform environment (src/terraform/environments/azure-local). Default azure-local.tfstate. Task 05 sets TF_BACKEND_KEY from it for the pipelines, and the generated backend.hcl names it.
       */
      azure_local_key?: string;
      /**
       * Schema 5.6.28. Redundancy of the state storage account (Microsoft Learn: Azure Storage redundancy). Default GRS.
       */
      replication_type?: 'LRS' | 'ZRS' | 'GRS' | 'RAGRS' | 'GZRS' | 'RAGZRS';
      /**
       * Schema 5.6.28. Public network access of the state storage account. false (default): private endpoints only. allowed_ip_ranges needs true.
       */
      public_network_access?: boolean;
      /**
       * Schema 5.6.28. Public IP addresses or CIDR ranges that may reach the state storage account (its IP network rules). Needs public_network_access true; IP rules apply to public access only (Microsoft Learn: Configure Azure Storage firewalls and virtual networks).
       */
      allowed_ip_ranges?: string[];
      /**
       * Schema 5.6.28. Blob versioning of the state storage account: every overwrite of a state file keeps the earlier version. Default true.
       */
      versioning?: boolean;
      /**
       * Schema 5.6.28. Days a deleted state blob stays recoverable, 1 to 365 (Microsoft Learn: Soft delete for blobs). Default 30.
       */
      blob_soft_delete_days?: number;
      /**
       * Schema 5.6.28. Days a deleted state container stays recoverable, 1 to 365 (Microsoft Learn: Soft delete for containers). Default 30.
       */
      container_soft_delete_days?: number;
      /**
       * Schema 5.6.28. Traffic that passes the network rules of the state storage account: AzureServices (trusted Microsoft services), Logging, Metrics, or None. Default AzureServices, Logging and Metrics.
       */
      network_bypass?: ('AzureServices' | 'Logging' | 'Metrics' | 'None')[];
    };
  };
  /**
   * Anything this schema doesn't define: settings for one environment or one tool, each under its own key (for example extensions.devops_runner). Tools ignore keys they don't own. Secrets here are keyvault:// references too.
   */
  extensions?: {
    [k: string]: unknown;
  };
}
/**
 * One machine. Describe its management port either with management (schema 5.0) or, from 5.2, with network_adapters, which lists every port and derives management from the port that owns the management address.
 */
export interface Node {
  /**
   * Host name: up to 15 characters. Also the edge machine name and, for an ISO install, the Arc machine name. With simplified provisioning the Arc machine name is arc_machine_name, which defaults to this.
   */
  name: string;
  /**
   * The machine's management port and address (schema 5.0 and 5.1). From 5.2, network_adapters describes it instead: the port with role management and an ip_assignment other than none. When both are given they must agree; prefer network_adapters.
   */
  management?: {
    /**
     * Management address. ARM physicalNodesSettings[].ipv4Address. How it gets onto the management port before deployment is networking.management.ip_assignment: set on the port (static), reserved in DHCP for mac_address (dhcp), or already there (preconfigured). With network_adapters it is the management port's ip_address.
     */
    ip_address: string;
    /**
     * MAC of the management port. Provisioning finds and targets the port by it: simplified provisioning names the port by this MAC when it sets the static address (edge machine networkAdapters[].macAddress), and node preparation finds the adapter by it. With ip_assignment dhcp, reserve ip_address for this MAC. Required with simplified provisioning.
     */
    mac_address?: string;
    /**
     * Name of the management port in the installed OS, for example 'SLOT 3 Port 1'. Optional: mac_address identifies the port. Simplified provisioning also sends it with the port's settings; leave it out unless you know the name the OS gives the port.
     */
    adapter_name?: string;
  };
  /**
   * Every physical network port of the machine (schema 5.2): name, MAC, roles and how each gets its host address. Exactly one port owns the management address: role management and an ip_assignment other than none. Intents name ports by these names. List them on every node or on none.
   *
   * @minItems 1
   */
  network_adapters?: [NetworkAdapter, ...NetworkAdapter[]];
  /**
   * Serial number (Dell service tag). Maps each simplified-provisioning voucher to its machine.
   */
  serial_number?: string;
  /**
   * The baseboard management controller (BMC) of the machine: address, type and login. ZTP drives the machine through it over Redfish (virtual media, boot override, BIOS settings, power); hardware discovery reads the machine through it.
   */
  bmc?: {
    /**
     * IPv4 address of the BMC (iDRAC, iLO, XCC). It must answer HTTPS (TCP 443) from the host that runs ZTP or discovery.
     */
    ip_address?: string;
    /**
     * Kind of BMC: idrac (Dell), ilo (HPE), xcc (Lenovo) or other. Only Dell iDRAC is proven end to end in this phase; BMC kinds other than idrac are planned. Hardware inventory (Get-HardwareInventory.ps1) compares it with the vendor it detects from the Redfish answers; other is not compared.
     */
    type?: 'idrac' | 'ilo' | 'xcc' | 'other';
    /**
     * BMC account name of this machine: a secret reference (keyvault://, env://, file:// or command://) or the plain name. azurelocal-ztp uses one login for every machine (hardware.bmc) and stops when a node sets another.
     */
    username?: string;
    /**
     * A secret reference: keyvault://<vault>/<secret> (the vault listed in key_vaults), env://, file:// or command://, read through the toolkit's resolver (scripts/common/secrets/AzlSecret.psm1), never the password itself. azurelocal-ztp uses one login for every machine (hardware.bmc) and stops when a node sets another.
     */
    password?: string;
  };
  /**
   * Rack identifier, for the as-built record. Documentation only; not read by the tools. A location label; the deployment uses nodes[].zone.
   */
  rack?: string;
  /**
   * Position in the rack, for example U12, for the as-built record.
   */
  rack_position?: string;
  /**
   * Rack-aware: the local availability zone. ARM localAvailabilityZones.
   */
  zone?: string;
  /**
   * Storage address on each storage network, in networking.storage.networks order, when networking.storage.auto_ip is false.
   */
  storage_ips?: Ipv4[];
  /**
   * Name of the machine's Arc resource (Microsoft.HybridCompute/machines). Default: name. Simplified provisioning sets it when it claims the machine (edge machine arcMachineResourceId); without it the service names the Arc machine ROE1-<id>, and an Arc machine can't be renamed. The deployment uses it in ARM arcNodeResourceIds. An ISO install registers the Arc machine under the host name, so leave it out there. 1-54 letters, digits, '-', '_' and '.', not ending in '.'.
   */
  arc_machine_name?: string;
  /**
   * @deprecated
   * Deprecated: use arc_machine_name. Read as arc_machine_name when that isn't set.
   */
  arc_resource_name?: string;
  bios?: BiosSettings;
  bios_during_provisioning?: BiosSettings1;
  /**
   * Schema 5.3. Simplified provisioning: the address the machine's maintenance environment answers on (its Configurator service, TCP 20001), when it is known: a DHCP reservation, or an address set at the console. azurelocal-ztp's Device stage then talks to it directly. Without it, the Device stage finds the maintenance environment by MAC, scanning networking.management.provisioning_dhcp_range.
   */
  maintenance_address?: string;
  san?: NodeSan;
}
/**
 * One physical network port of the machine (schema 5.2). List every port, used or not, so each tool reads the same NICs. A port can carry several roles (a converged design).
 */
export interface NetworkAdapter {
  /**
   * The port's name in this file: the key that networking.intents[].adapters, networking.storage.networks[].adapter and networking.cluster_networks[].adapter use. The same on every machine, unique on the machine. It labels a physical adapter that is found on the node by mac_address, so it does not have to be the name the OS gave the adapter (OS names differ between installs and between ZTP and ISO installs, for example Port0, SLOT 3 Port 1 or NIC1). Discovery writes it from the slot and the port, for example 'Slot 3 Port 1'. The name the deployment sends to Azure is what the OS calls the adapter (read by MAC) or os_name_override when set. A file that already uses the OS name here keeps working.
   */
  name: string;
  /**
   * The port's identity. Tools find the physical adapter on a node by this MAC (case and separators are ignored), never by a name: node preparation, the ARM parameters and the pre-cluster verification all resolve the OS adapter name from it. Hardware discovery writes it. Required. Also needed for a DHCP reservation and, with simplified provisioning, for the management port.
   */
  mac_address: string;
  /**
   * Where the port is, for example Embedded (a LOM), Slot 3 or OCP 1. From 5.4 azurelocal-ztp reads it: a management or provisioning port in slot Embedded makes it enable the embedded NICs in the BIOS (provisioning.simplified.enable_embedded_nics), and a slot that also holds a SAN adapter (nodes[].san.hbas[].slot) is never turned off.
   */
  slot?: string;
  /**
   * The number of the port on its adapter, counted from 1, as the BMC reports it (Redfish PhysicalPortNumber, else the order of the port on the card). With slot and pci_location it says which physical connector the port is. Written by hardware discovery; a record of the hardware, nothing is configured from it. Documentation only; not read by the tools.
   */
  port_index?: number;
  /**
   * Where the adapter sits on the PCI bus, as hardware discovery reports it (bus, device, function as decimal numbers). A verification aid, informational: OS configuration compares it with the node's own hardware information (Get-NetAdapterHardwareInfo) and reports a difference; the port is still found by mac_address.
   */
  pci_location?: {
    /**
     * PCI bus number (decimal).
     */
    bus?: number;
    /**
     * PCI device number (decimal).
     */
    device?: number;
    /**
     * PCI function number (decimal).
     */
    function?: number;
  };
  /**
   * The adapter manufacturer as hardware discovery reports it, for example the Manufacturer of the Redfish NetworkAdapter. Informational: no tool behaves differently for a brand; every make is handled through the same keys (mac_address, slot, port_index, model, speed_gbps, rdma). Documentation only; not read by the tools.
   */
  vendor?: string;
  /**
   * Optional, off by default. The name you want this adapter to have in the OS, for example 'Mgmt1', 'Compute1' or 'Storage1'. Without it nothing is renamed: the OS configuration step NicNames leaves every adapter name alone and the deployment sends the name the OS already uses (found by mac_address). With it, NicNames renames the adapter found by mac_address to this name (a guarded change, idempotent, the management adapter last) and the deployment sends this name. Give the same value for the same port (name) on every machine: Network ATC needs one adapter name per intent adapter on every node. 1 to 64 characters: letters, digits, space, underscore, dot, hyphen and parentheses.
   */
  os_name_override?: string;
  /**
   * Card model, for example 'NVIDIA ConnectX-6 Dx'. Ports in one intent must be the same make, model and speed.
   */
  model?: string;
  /**
   * Link speed of the port in Gbit/s, as the BMC reports it.
   */
  speed_gbps?: number;
  /**
   * RDMA technology the port supports: none, iwarp, roce (RoCE) or roce_v2 (RoCEv2). A record of the hardware; what is sent to Azure is networking.intents[].overrides.adapter.network_direct_technology. Documentation only; not read by the tools.
   */
  rdma?: 'none' | 'iwarp' | 'roce' | 'roce_v2';
  /**
   * What the port is for: management, compute, storage (the Network ATC traffic types), provisioning (the maintenance environment of simplified provisioning reaches Azure through this port, before the machine is claimed; how it gets its address there is networking.management.provisioning_network), iscsi:a or iscsi:b (schema 5.3: a port that carries iSCSI traffic to the SAN's fabric A or B; give it a static address, prefix_length and VLAN, no gateway), or unused. A converged port lists several, for example [management, compute]. unused stands alone.
   *
   * @minItems 1
   */
  roles: [
    'management' | 'compute' | 'storage' | 'provisioning' | 'iscsi:a' | 'iscsi:b' | 'unused',
    ...('management' | 'compute' | 'storage' | 'provisioning' | 'iscsi:a' | 'iscsi:b' | 'unused')[]
  ];
  /**
   * How the installed OS gets this port's host address before deployment. For the management port this is the management address mode (config/variables/docs/infrastructure-file.md): dhcp_reservation is Mode A (Reserved, recommended); static is Mode B (Static with DHCP) or Mode C (Static without management DHCP). static: ip_address is set on the port (with simplified provisioning azurelocal-ztp's Device stage sets it by MAC before the OS install, the install resets every port to DHCP, and OS configuration sets it again by MAC; otherwise the operator or the toolkit). dhcp_reservation: the port keeps DHCP and the DHCP server reserves ip_address for mac_address. dhcp: the port keeps DHCP with no reservation, so its address can change (a warning). preconfigured: the port is already configured; tools leave it alone. none: no host address before deployment (Network ATC or the storage networks give it one, or it isn't used); node preparation turns DHCP off on it. Exactly one management port per machine owns the management address: the one with role management and an ip_assignment other than none.
   */
  ip_assignment: 'static' | 'dhcp_reservation' | 'dhcp' | 'preconfigured' | 'none';
  /**
   * The host address. For the management port this is ARM physicalNodesSettings[].ipv4Address. Required with static. With dhcp_reservation give the reserved address: without it the tools can only check that the port has a DHCP address (a warning), and the deployment still needs it unless use_dhcp is true (a file with scope ztp doesn't deploy).
   */
  ip_address?: string;
  /**
   * Prefix length of ip_address. Default for the management port: from networking.management.subnet, which it must match.
   */
  prefix_length?: number;
  /**
   * Default gateway on this port. Default for the management port: networking.management.gateway. Leave it out on every other port: validation fails when more than one physical adapter has a default gateway.
   */
  gateway?: string;
  /**
   * Default for the management port: networking.management.dns_servers, which it must match.
   */
  dns_servers?: Ipv4[];
  /**
   * The VLAN of this port's traffic. With vlan_mode tagged the host tags it; with vlan_mode access the switch port is an access port in this VLAN and the host sends untagged frames (it records the switch side). Without vlan_mode, 0 or absent means untagged and anything else is tagged by the host.
   */
  vlan_id?: number;
  /**
   * access: the switch port is an access (untagged) port; the host doesn't tag, so simplified provisioning sends VLAN 0. tagged: the switch port is a trunk and the host tags vlan_id.
   */
  vlan_mode?: 'access' | 'tagged';
  /**
   * Optional. The VLAN ids the switch port of this adapter allows, when the port is a trunk that carries more than the VLAN of the port itself: the tenant (compute) VLANs of the compute adapters. The pre-cluster verification checks that every VLAN used by compute traffic in networking.vlans[] and networking.logical_networks[] is in this list on the compute adapters; without it a tagged compute port is reported Skipped (the file says nothing about what the port allows). This is switch-side metadata for the checklist of the gate; it does not configure the switch or the NIC.
   */
  allowed_vlans?: number[];
  /**
   * Where the port is cabled.
   */
  switch_port?: {
    /**
     * The switch, for example a network_devices[].hostname.
     */
    switch?: string;
    /**
     * The switch port, for example Ethernet1/11.
     */
    port?: string;
    /**
     * Free text about the switch port, for example the cable label. Documentation only; not read by the tools. A label for the cabling record; the gate reads switch_port.switch and port only.
     */
    description?: string;
  };
  /**
   * Free text about the port.
   */
  notes?: string;
}
/**
 * BIOS attributes for this machine in their FINAL state, merged over hardware.bios (a key here wins). See hardware.bios.
 */
export interface BiosSettings {
  /**
   * The value of the BIOS attribute, as a string.
   */
  [k: string]: string;
}
/**
 * Schema 5.3. Temporary BIOS attributes for this machine's OS install only, merged over hardware.bios_during_provisioning (a key here wins); during-provisioning values win over bios. azurelocal-ztp sets each key back to its bios value in its Restore stage. See hardware.bios_during_provisioning.
 */
export interface BiosSettings1 {
  /**
   * The value of the BIOS attribute, as a string.
   */
  [k: string]: string;
}
/**
 * Schema 5.3. This machine's SAN connections: its Fibre Channel HBAs and their WWPNs (storage.san.type fibre_channel), or its iSCSI initiator IQN (storage.san.type iscsi; the iSCSI ports' addresses are on network_adapters with role iscsi:a and iscsi:b). Needed on every machine when storage.san.type is set.
 */
export interface NodeSan {
  /**
   * The host bus adapters in this machine that reach the SAN: Fibre Channel HBAs, and from 5.4 iSCSI offload adapters. azurelocal-ztp reads their slots (schema 5.4): while the OS installs it turns those PCIe slots off in the BIOS, so the maintenance environment can't install onto a SAN LUN, and turns them on again afterwards (provisioning.simplified.isolate_san_adapters).
   *
   * @minItems 1
   */
  hbas?: [
    {
      /**
       * Where the HBA is, as a PCIe slot label: Slot 2, Slot2 or slot-2 (the number is what counts). azurelocal-ztp turns the BIOS attribute of that slot off for the OS install and puts it back afterwards; the attribute name per vendor is in its config/oem/<vendor>.json. For another label (for example OCP 1), or a vendor azurelocal-ztp has no mapping for, give bios_attribute.
       */
      slot: string;
      /**
       * Schema 5.4. fibre_channel (default; with storage.san.type fibre_channel the ports with their WWPNs are needed for zoning, rule AZL-028) or iscsi_offload (an adapter that presents SAN LUNs to the BIOS; it needs no ports here, its addresses are on network_adapters with role iscsi:a or iscsi:b).
       */
      type?: 'fibre_channel' | 'iscsi_offload';
      /**
       * Schema 5.4. The vendor's BIOS attribute name for this adapter's slot, as the BMC's Redfish Bios resource names it. With no vendor mapping in azurelocal-ztp this is the only way to isolate the adapter during the install; with a mapping it overrides the attribute derived from slot. An explicit bios_during_provisioning key for the same attribute still wins.
       */
      bios_attribute?: string;
      /**
       * Schema 5.4. The value of bios_attribute that turns the slot off for the OS install. Default: the vendor mapping's disabled value, else Disabled.
       */
      bios_disabled_value?: string;
      /**
       * Schema 5.4. The value that turns the slot back on when azurelocal-ztp finds it already at bios_disabled_value in the Restore stage (for example a crashed earlier run left it off). Otherwise Restore puts back the value it found before the install. Default: the vendor mapping's enabled value, else Enabled.
       */
      bios_enabled_value?: string;
      /**
       * Model of the host bus adapter, as the machine reports it.
       */
      model?: string;
      /**
       * The ports of the host bus adapter.
       *
       * @minItems 1
       */
      ports?: [
        {
          wwpn: Wwpn;
          /**
           * A name in storage.san.fibre_channel.fabrics.
           */
          fabric: string;
        },
        ...{
          wwpn: Wwpn;
          /**
           * A name in storage.san.fibre_channel.fabrics.
           */
          fabric: string;
        }[]
      ];
    },
    ...{
      /**
       * Where the HBA is, as a PCIe slot label: Slot 2, Slot2 or slot-2 (the number is what counts). azurelocal-ztp turns the BIOS attribute of that slot off for the OS install and puts it back afterwards; the attribute name per vendor is in its config/oem/<vendor>.json. For another label (for example OCP 1), or a vendor azurelocal-ztp has no mapping for, give bios_attribute.
       */
      slot: string;
      /**
       * Schema 5.4. fibre_channel (default; with storage.san.type fibre_channel the ports with their WWPNs are needed for zoning, rule AZL-028) or iscsi_offload (an adapter that presents SAN LUNs to the BIOS; it needs no ports here, its addresses are on network_adapters with role iscsi:a or iscsi:b).
       */
      type?: 'fibre_channel' | 'iscsi_offload';
      /**
       * Schema 5.4. The vendor's BIOS attribute name for this adapter's slot, as the BMC's Redfish Bios resource names it. With no vendor mapping in azurelocal-ztp this is the only way to isolate the adapter during the install; with a mapping it overrides the attribute derived from slot. An explicit bios_during_provisioning key for the same attribute still wins.
       */
      bios_attribute?: string;
      /**
       * Schema 5.4. The value of bios_attribute that turns the slot off for the OS install. Default: the vendor mapping's disabled value, else Disabled.
       */
      bios_disabled_value?: string;
      /**
       * Schema 5.4. The value that turns the slot back on when azurelocal-ztp finds it already at bios_disabled_value in the Restore stage (for example a crashed earlier run left it off). Otherwise Restore puts back the value it found before the install. Default: the vendor mapping's enabled value, else Enabled.
       */
      bios_enabled_value?: string;
      /**
       * Model of the host bus adapter, as the machine reports it.
       */
      model?: string;
      /**
       * The ports of the host bus adapter.
       *
       * @minItems 1
       */
      ports?: [
        {
          wwpn: Wwpn;
          /**
           * A name in storage.san.fibre_channel.fabrics.
           */
          fabric: string;
        },
        ...{
          wwpn: Wwpn;
          /**
           * A name in storage.san.fibre_channel.fabrics.
           */
          fabric: string;
        }[]
      ];
    }[]
  ];
  /**
   * The machine's iSCSI initiator name. Unique in the file.
   */
  initiator_iqn?: string;
}
/**
 * BMC (iDRAC, iLO, XCC) login used for every machine unless a node sets its own.
 */
export interface BmcCredentials {
  /**
   * The BMC user name of every machine: a secret reference (keyvault://, env://, file:// or command://) or the user name itself. azurelocal-ztp and hardware discovery read a reference through the toolkit's resolver (scripts/common/secrets/AzlSecret.psm1).
   */
  username: string;
  /**
   * The BMC password of every machine: a secret reference, keyvault://<vault>/<secret> (the vault listed in key_vaults), env://<VARIABLE>, file://<name> or command://<name>, never the password itself. azurelocal-ztp (since 5b75c9a) and hardware discovery read it through the toolkit's resolver (scripts/common/secrets/AzlSecret.psm1).
   */
  password: string;
  /**
   * Schema 5.4. azurelocal-ztp, Boot stage: also set the iDRAC Remote File Share attribute RFS.<n>.WriteProtected to Read Write before it inserts the virtual media. iDRAC 7.30 rejects WriteProtected=false in InsertMedia, and the maintenance environment cannot write its voucher to a read-only drive. Default: true for Dell (azurelocal-ztp config/oem/dell.json, bmc.rfsWriteAttribute), false for the other vendors, whose BMCs have no such attribute. Set it when your BMC differs from its vendor's usual behaviour.
   */
  rfs_write_attribute?: boolean;
  /**
   * Schema 5.4. Check the BMCs' TLS certificates. Default false: BMCs ship a self-signed certificate, so azurelocal-ztp accepts it. Set true once the BMCs carry a certificate that the management host trusts.
   */
  verify_certificate?: boolean;
}
/**
 * BIOS attributes for every machine, as they are when the machine is finished (schema 5.2; from 5.3 this is the FINAL state): a node's bios is merged over it. azurelocal-ztp applies them at its Boot stage, and in its Restore stage sets back to these values any key that bios_during_provisioning changed for the OS install. See $defs/bios_settings.
 */
export interface BiosSettings2 {
  /**
   * The value of the BIOS attribute, as a string.
   */
  [k: string]: string;
}
/**
 * Schema 5.3. BIOS attributes that hold for the OS install only: TEMPORARY values. A node's bios_during_provisioning is merged over this one, and during-provisioning values win over bios. azurelocal-ztp applies them at its Boot stage. In its Restore stage, after the OS install and before Handoff, it sets each key back to its bios value (or, when bios doesn't name the key, to the original value it saved), restarts the node and waits for Arc to reconnect. From 5.4 azurelocal-ztp derives the SAN-adapter case itself from nodes[].san.hbas[].slot (provisioning.simplified.isolate_san_adapters); the raw keys remain as explicit overrides and win. Example: bios { Slot2: Enabled } with bios_during_provisioning { Slot2: Disabled } turns off a Fibre Channel HBA in slot 2 while the maintenance environment installs the OS (it would otherwise install onto the SAN LUN), and turns it on again afterwards. On Dell, a slot can also be BootDriverDisabled: visible to the OS but never a boot device. A key here should also be in bios, so the final state is explicit. See $defs/bios_settings.
 */
export interface BiosSettings3 {
  /**
   * The value of the BIOS attribute, as a string.
   */
  [k: string]: string;
}
/**
 * The capacity drives in each machine (Storage Spaces Direct).
 */
export interface DriveGroup {
  /**
   * Media type of the capacity drives: nvme, ssd or hdd.
   */
  media?: 'nvme' | 'ssd' | 'hdd';
  /**
   * Number of capacity drives in each machine.
   */
  count?: number;
  /**
   * Size of one capacity drive in TB (decimal terabytes). Get-HardwareInventory.ps1 compares it with the size the BMC reports (within 5 percent).
   */
  size_tb?: number;
}
/**
 * The cache drives in each machine (Storage Spaces Direct). Leave out when there is no cache tier.
 */
export interface DriveGroup1 {
  /**
   * Media type of the cache drives: nvme, ssd or hdd.
   */
  media?: 'nvme' | 'ssd' | 'hdd';
  /**
   * Number of cache drives in each machine.
   */
  count?: number;
  /**
   * Size of one cache drive in TB (decimal terabytes). Get-HardwareInventory.ps1 compares it with the size the BMC reports (within 5 percent).
   */
  size_tb?: number;
}
export interface Intent {
  /**
   * Name of the Network ATC intent, for example management_compute or storage. The same on every machine.
   */
  name: string;
  /**
   * Traffic types the intent carries: management, compute and storage (ARM trafficType). Management and storage can each be in one intent only; compute can be in any number.
   *
   * @minItems 1
   */
  traffic: ['management' | 'compute' | 'storage', ...('management' | 'compute' | 'storage')[]];
  /**
   * Adapters of the intent, by the key nodes[].network_adapters[].name (the port's name in this file, the same on every machine; the file finds the physical adapter by its MAC, so the OS may call it anything). With nodes[].network_adapters (5.2) each name must be a port in every node's list. The name the deployment sends to Azure (ARM intentList adapter) is what the OS calls that adapter on the nodes, found by MAC, or nodes[].network_adapters[].os_name_override when the file sets one. The first adapter matters: the management virtual adapter takes the MAC of the first adapter of the management intent, so that adapter owns the management address.
   *
   * @minItems 1
   */
  adapters: [string, ...string[]];
  /**
   * Network ATC overrides. Leave out to keep Network ATC's defaults, which Microsoft recommends (Learn: 'We recommend that you use the default values'). The deployment sends the adapter overrides on every intent (ARM overrideAdapterProperty true) so Azure's network validation sees the value that is meant: storage intents get RDMA on and a 9014 packet, an intent without storage traffic gets RDMA off and the default 1514 packet. A value given here wins over that default.
   */
  overrides?: {
    /**
     * Data Center Bridging (DCB) quality of service overrides for the storage traffic (ARM qosPolicyOverrides). Leave out to keep Network ATC's validated defaults: cluster priority 7, SMB priority 3, SMB bandwidth 50 percent.
     */
    qos?: {
      /**
       * 802.1p priority value of the cluster heartbeat traffic, 0 to 7 (ARM priorityValue8021Action_Cluster). Network ATC default 7 (Learn: Deploy host networking with Network ATC, Default Data Center Bridging (DCB) configuration). The physical switches must carry the same value.
       */
      cluster_priority?: number;
      /**
       * 802.1p priority value of the SMB Direct (RDMA storage) traffic, 0 to 7 (ARM priorityValue8021Action_SMB). Network ATC default 3 (Learn: Deploy host networking with Network ATC, Default Data Center Bridging (DCB) configuration). The physical switches must carry the same value.
       */
      smb_priority?: number;
      /**
       * Share of the link reserved for SMB Direct storage traffic, 1 to 100 percent (ARM bandwidthPercentage_SMB). Network ATC default 50 (Learn: Deploy host networking with Network ATC, Default Data Center Bridging (DCB) configuration).
       */
      smb_bandwidth_percent?: number;
    };
    /**
     * Physical adapter property overrides (ARM adapterPropertyOverrides: jumboPacket, networkDirect, networkDirectTechnology). Microsoft: change these only on OEM guidance and validate them with the OEM.
     */
    adapter?: {
      /**
       * Value of the adapter's JumboPacket property in bytes: 1514 (standard frame), 4088 or 9014 (jumbo). The ARM parameter takes it as a string. Leave out for the default this tool sets: 9014 on an intent that carries storage traffic, 1514 on any other. Learn recommends a maximum transmission unit of 9216 bytes on the physical switches for RDMA storage traffic and the same MTU end to end on hosts and switches; for an external SAN storage fabric use the MTU your storage vendor specifies.
       */
      jumbo_packet?: 1514 | 4088 | 9014;
      /**
       * RDMA (Network Direct) on the adapters of this intent. true is sent to ARM as networkDirect 'Enabled', false as 'Disabled'. Leave out for the default this tool sets: on for an intent that carries storage traffic, off for any other. Set false to disable RDMA, for example when you test in virtual machines.
       */
      network_direct?: boolean;
      /**
       * RDMA technology of the adapters: iwarp, roce_v2 (RoCEv2) or roce (RoCE, version 1). Sent to ARM as networkDirectTechnology 'iWARP', 'RoCEv2' or 'RoCE'; Learn's network considerations name RoCEv2 and iWARP, the ARM model also accepts RoCE. Used only when network_direct is on; leave out for RoCEv2, the value of Microsoft's quickstart parameters file. Set the technology your adapter vendor and switches are configured for.
       */
      network_direct_technology?: 'iwarp' | 'roce' | 'roce_v2';
    };
    /**
     * Virtual switch overrides of the intent's switch-embedded team (ARM virtualSwitchConfigurationOverrides). Leave out for Network ATC's defaults.
     */
    virtual_switch?: {
      /**
       * SR-IOV on the intent's virtual switch (ARM enableIov). Cannot be changed after the switch exists.
       */
      enable_iov?: boolean;
      /**
       * Load balancing of the switch-embedded team: dynamic or hyper_v_port (ARM loadBalancingAlgorithm 'Dynamic' or 'HyperVPort').
       */
      load_balancing_algorithm?: 'dynamic' | 'hyper_v_port';
    };
  };
}
export interface LogicalNetwork {
  /**
   * Name of the Azure Local logical network resource.
   */
  name: string;
  /**
   * false skips this logical network when the logical networks are created, without removing it from the file. Default true. (Since 5.6.3.)
   */
  enabled?: boolean;
  /**
   * How machines on this logical network get addresses: Static (the ip_pool is used; address_prefix is needed) or Dynamic (DHCP). Default Static. ARM and az stack-hci-vm: ipAllocationMethod. (Since 5.6.3.)
   */
  ip_allocation_method?: 'Static' | 'Dynamic';
  /**
   * Name of the network security group to associate with the logical network. The association is made when the logical network is created, so create the group first (networking.network_security_groups[], New-NetworkSecurityGroup.ps1): the name must be one of that list, and sdn.enabled must be true. Leave it out for a logical network without a group. The script does not associate a group with a logical network that exists. (Since 5.6.3.)
   */
  nsg_name?: string;
  /**
   * Name of the external virtual switch on the cluster that this logical network is created on (az stack-hci-vm: --vm-switch-name; it cannot be changed afterwards). Leave it out: the script reads the external virtual switches of the cluster with Get-VMSwitch -SwitchType External, the command Microsoft Learn gives, and uses the one it finds. Name it only when the cluster has more than one external switch (for example one for each compute intent); the name must be one the cluster reports. Network ATC names the switch after the intent, but the script does not build a name from the intent.
   */
  vm_switch_name?: string;
  /**
   * What the network is for (since 5.6). management and oob mark a network the machines' remote management may be reached from: the remote management security profile adds its subnet to the allowed sources of dev and production (a candidate, not a trust: prefer listing the controller addresses in os_configuration.remoting.allowed_source_cidrs). automation, compute, storage and other have no effect on remote management.
   */
  purpose?: 'management' | 'oob' | 'automation' | 'compute' | 'storage' | 'other';
  /**
   * VLAN ID of the logical network; 0 for untagged. Needed when ip_allocation_method is Static (Learn: DNS server, gateway and VLAN ID must be specified for a static logical network). For a Dynamic network, leave it out for 0.
   */
  vlan_id?: number;
  /**
   * Address prefix of the logical network in CIDR form. Needed when ip_allocation_method is Static (az stack-hci-vm takes one prefix). Not used for a Dynamic network; it is still read by the remote management security profile and the pre-cluster verification.
   */
  address_prefix?: string;
  /**
   * Default gateway of the logical network, inside address_prefix. Needed when ip_allocation_method is Static (Learn: gateway, DNS server and VLAN ID must be specified for a static logical network). Not used for a Dynamic network.
   */
  gateway?: string;
  /**
   * DNS servers handed to machines on this logical network (az stack-hci-vm: --dns-servers). Needed when ip_allocation_method is Static; not used for a Dynamic network.
   */
  dns_servers?: Ipv4[];
  /**
   * The one address range Azure Local hands to virtual machines on this logical network (first and last address, both inside address_prefix), sent as --ip-pool-start and --ip-pool-end. Needed when ip_allocation_method is Static. The pool type is not a key: Learn's static examples give none. Not used for a Dynamic network.
   */
  ip_pool?: {
    /**
     * First address of the pool that virtual machines on this logical network draw from.
     */
    start: string;
    /**
     * Last address of that pool.
     */
    end: string;
  };
}
/**
 * Address of the appliance's ingress (the endpoint operators and tools call). Not read by the tools yet: a documented placeholder.
 */
export interface ApplianceEndpoint {
  /**
   * IPv4 address of the ingress.
   */
  ip_address?: string;
  /**
   * Default gateway of the ingress network.
   */
  gateway?: string;
  /**
   * Prefix length of the ingress network, 8 to 30.
   */
  prefix_length?: number;
}
/**
 * Address of the appliance's management endpoint.
 */
export interface ApplianceEndpoint1 {
  /**
   * IPv4 address of the management endpoint.
   */
  ip_address?: string;
  /**
   * Default gateway of the management network.
   */
  gateway?: string;
  /**
   * Prefix length of the management network, 8 to 30.
   */
  prefix_length?: number;
}
export interface NetworkDevice {
  /**
   * Host name of the network device.
   */
  hostname: string;
  /**
   * Kind of device: switch, firewall, router, console_server, load_balancer or wireless_controller.
   */
  type: 'switch' | 'firewall' | 'router' | 'console_server' | 'load_balancer' | 'wireless_controller';
  /**
   * primary, secondary or standalone.
   */
  role?: 'primary' | 'secondary' | 'standalone';
  /**
   * Vendor of the device.
   */
  vendor?: string;
  /**
   * Model of the device. Written into the cluster document by Generate-ClusterConfigMD.ps1; no deployment step reads it.
   */
  model?: string;
  /**
   * Serial number of the device. Documentation only; not read by the tools. A record of the device.
   */
  serial_number?: string;
  /**
   * Firmware or OS version of the device. Documentation only; not read by the tools. A record of the device.
   */
  firmware_version?: string;
  /**
   * How the device is managed.
   */
  management?: {
    /**
     * An IPv4 address, or dhcp.
     */
    ip_address?: Ipv4 | 'dhcp';
    /**
     * VLAN of the management interface of the device. Documentation only; not read by the tools. A record of the device.
     */
    vlan_id?: number;
    /**
     * Protocol used to manage the device: ssh, https, telnet or snmp. Set-PowerSwitchEndpoint.ps1 and Test-OpengearVerification.ps1 check the management port this protocol uses (ssh 22, https 443, telnet 23; snmp is not checked).
     */
    protocol?: 'ssh' | 'https' | 'telnet' | 'snmp';
  };
  /**
   * The login of the device. The password is a Key Vault reference.
   */
  credentials?: {
    /**
     * User name of the device login.
     */
    username: string;
    /**
     * A Key Vault secret reference: keyvault://<vault>/<secret>. The vault must be listed in key_vaults.
     */
    password: string;
  };
  /**
   * High availability of the device.
   */
  ha?: {
    /**
     * true when the device is one half of a high availability pair. Documentation only; not read by the tools. A record of the device.
     */
    enabled?: boolean;
    /**
     * The high availability mode, as the vendor names it. Documentation only; not read by the tools. A record of the device.
     */
    mode?: string;
    /**
     * The ID of the high availability domain the two switches of a pair share (Dell OS10: vlt-domain). Both switches of the pair give the same ID. New-SwitchConfiguration.ps1 writes the pair section only when it is set.
     */
    domain_id?: number;
    /**
     * The management address of the other switch of the pair, which the pair uses as its backup heartbeat (Dell OS10: vlt-domain backup destination). Usually the other entry's management.ip_address. Needed with domain_id.
     */
    peer_address?: string;
    /**
     * Election priority of this switch in the pair; the lower value becomes the primary (Dell OS10: vlt-domain primary-priority). Needed with domain_id. Give the two switches different values.
     */
    priority?: number;
    /**
     * The MAC address the pair presents as one system to the devices below it (Dell OS10: vlt-domain vlt-mac). The same on both switches of the pair and unique in the network. Needed with domain_id.
     */
    system_mac?: string;
  };
  /**
   * Maximum frame size of the switch ports that face the machines, the uplinks and the link between the two switches of a pair, in bytes. Read by New-SwitchConfiguration.ps1, which needs it for a switch. Microsoft Learn (Physical network requirements for Azure Local: the switch supports jumbo frames of 9,014 bytes): at least 9014 for storage traffic. Dell OS10 accepts up to 9216.
   */
  mtu?: number;
  /**
   * The switch ports by role, as the switch names them (Dell OS10: ethernet1/1/2). Read by New-SwitchConfiguration.ps1.
   */
  ports?: {
    /**
     * Ports to the network above the rack (trunks with the management, out-of-band and workload VLANs).
     */
    uplinks?: string[];
    /**
     * Ports cabled to the machines' network adapters (trunks with the VLANs of the intents; with RDMA storage on the switch they get the PFC and ETS policies of the storage intent).
     */
    node_ports?: string[];
    /**
     * Ports of the link between the two switches of a pair (Dell OS10: VLTi, the vlt-domain discovery interfaces). Needed with ha.domain_id.
     */
    peer_link?: string[];
    /**
     * The VLAN the switch puts the untagged frames of the node ports in (Dell OS10: switchport access vlan on a trunk port). Needed when networking.management.vlan_id is 0, so the machines send management traffic untagged (New-SwitchConfiguration.ps1 stops with the key name without it); when the machines tag the management VLAN it is optional and the node ports carry only tagged VLANs unless it is set. It is not also one of the tagged VLANs of the node ports.
     */
    native_vlan_id?: number;
  };
}
