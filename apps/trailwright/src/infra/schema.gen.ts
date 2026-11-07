/* Generated from infrastructure.schema.json (schema 5, azurelocal-toolkit). Do not edit: run npm run schema:types. */

export type Guid = string;
export type ResourceGroup = string;
export type KeyVaultName = string;
export type StorageAccountName = string;
export type Ipv4 = string;
/**
 * A Key Vault secret reference: keyvault://<vault>/<secret>. The vault must be listed in key_vaults.
 */
export type KvRef = string;
export type Cidr = string;
/**
 * Up to 15 letters, digits and hyphens.
 */
export type NetbiosName = string;
export type AzureRegion = string;

/**
 * The one environment file for an Azure Local instance: the design choices, the machines, the networks, identity, Azure targets, provisioning (ISO or simplified machine provisioning with ZTP) and the cluster deployment. Every Azure Local tool reads this file: azurelocal-toolkit, azurelocal-ztp, Trailwright (writes it), Beacon, Sonar and Ranger. Keys are snake_case. Secrets are never values: they are keyvault://<vault>/<secret> references. Sections reject unknown keys; put anything else under extensions.
 */
export interface AzureLocalInfrastructureYml {
  /**
   * About this file.
   */
  _metadata: {
    /**
     * The schema version this file follows. Major 5. A minor version adds optional keys only; a major version can rename or remove keys.
     */
    schema_version: string;
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
    notes?: string;
  };
  /**
   * The design choices. Every other section is read in the light of these: a choice makes its section required, and tools pick their path from here. All of them are required, so nothing is assumed.
   */
  scenario: {
    /**
     * active_directory: machines join an AD domain (needs identity.active_directory). local_identity: no AD, secrets in Key Vault (needs identity.local_identity). https://learn.microsoft.com/azure/azure-local/deploy/deployment-local-identity-with-key-vault
     */
    identity: 'active_directory' | 'local_identity';
    /**
     * s2d: Storage Spaces Direct (hyperconverged). san: external SAN only (disaggregated; needs storage.san). hybrid: both.
     */
    storage_architecture: 's2d' | 'san' | 'hybrid';
    /**
     * switched: storage traffic goes through top-of-rack switches. switchless: machines are cabled directly to each other for storage. A single machine uses switched.
     */
    storage_connectivity: 'switched' | 'switchless';
    /**
     * standard, or rack_aware (machines split across two local availability zones; every node needs a zone).
     */
    topology: 'standard' | 'rack_aware';
    /**
     * connected to Azure, or disconnected operations (needs the disconnected section).
     */
    connectivity: 'connected' | 'disconnected';
    /**
     * Azure public cloud or Azure Government.
     */
    cloud: 'public' | 'government';
    /**
     * How the machines reach Azure. Paths with a proxy need networking.outbound.proxy; paths with Arc gateway need networking.outbound.arc_gateway; private_path needs networking.outbound.private_path.
     */
    outbound_path: 'direct' | 'proxy' | 'arc_gateway' | 'proxy_arc_gateway' | 'private_path';
    /**
     * iso: the OS is installed from an ISO (by hand or out-of-band). simplified: simplified machine provisioning from Azure, which azurelocal-ztp automates (needs provisioning.simplified, and a serial number, BMC address and management MAC on every node).
     */
    os_install: 'iso' | 'simplified';
    /**
     * How the cluster is deployed: the Azure portal or an ARM template.
     */
    deploy_method: 'portal' | 'arm';
  };
  /**
   * Where the machines are.
   */
  site: {
    /**
     * Short site code, 2 to 8 uppercase letters or digits.
     */
    code: string;
    /**
     * Display name of the site. Also the display name of the Microsoft.Edge site in simplified provisioning.
     */
    name: string;
    /**
     * Physical location, for example a city.
     */
    location?: string;
    datacenter?: string;
    customer?: string;
    owner?: string;
    /**
     * Windows time zone ID of the site, for example UTC or Eastern Standard Time. Simplified provisioning sets it on the site.
     */
    time_zone?: string;
  };
  /**
   * Which environment this file describes.
   */
  environment: {
    /**
     * Environment identifier: lowercase letters, digits and hyphens.
     */
    name: string;
    type: 'lab' | 'demo' | 'poc' | 'dev' | 'test' | 'stg' | 'prd';
    owner?: string;
    description?: string;
  };
  /**
   * Azure tags applied to the resources the tools create. A policy that requires tags isn't supported by simplified provisioning.
   */
  tags?: {
    [k: string]: string;
  };
  /**
   * The Azure targets of the instance: tenant, region, and the subscription and resource group of the Arc machines, the cluster and (unless provisioning.simplified says otherwise) the site and edge machines.
   */
  azure: {
    tenant_id: Guid;
    /**
     * Azure region, for example eastus. Simplified provisioning works only in eastus in the preview.
     */
    location: string;
    subscription_id: Guid;
    resource_group: ResourceGroup;
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
      type: 'managed_identity' | 'service_principal';
      /**
       * Managed identity resource name, or the service principal's display name.
       */
      name: string;
      client_id?: Guid;
      subscription_id?: Guid;
      resource_group?: ResourceGroup;
    };
  };
  /**
   * Every Key Vault that a keyvault:// reference in this file names, with where it is. Tools resolve references against this list, and grant roles on the vault from it.
   */
  key_vaults?: {
    name: KeyVaultName;
    subscription_id: Guid;
    resource_group: ResourceGroup;
    /**
     * What the vault holds, for example management, deployment or backup.
     */
    purpose?: string;
  }[];
  /**
   * The Azure Local instance (the cluster deployment).
   */
  cluster: {
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
    witness: {
      /**
       * cloud (an Azure Storage account), file_share (disconnected operations), or none. Two machines need a witness. https://learn.microsoft.com/azure/azure-local/concepts/cluster-witness
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
      name: KeyVaultName;
      /**
       * ARM createNewKeyVault.
       */
      create_new?: boolean;
      soft_delete_retention_days?: number;
    };
    /**
     * Key Vault audit logs. ARM diagnosticStorageAccountName, logsRetentionInDays and storageAccountType.
     */
    diagnostics?: {
      storage_account?: StorageAccountName;
      logs_retention_days?: number;
      storage_account_type?: string;
    };
  };
  /**
   * The machines, one entry each. ARM physicalNodesSettings and arcNodeResourceIds. Up to 16 with Storage Spaces Direct, up to 64 disaggregated (the validator checks which applies).
   *
   * @minItems 1
   * @maxItems 64
   */
  nodes: [Node, ...Node[]];
  /**
   * What every machine is. The layout is the same on every machine.
   */
  hardware: {
    /**
     * OEM, for example Dell, HPE, Lenovo or DataON. ZTP picks config/oem/<vendor>.json from it.
     */
    vendor: string;
    /**
     * Model, for example AX-760. Used to select the SBE.
     */
    model: string;
    /**
     * Physical cores per machine.
     */
    cpu_cores?: number;
    /**
     * Memory per machine, GiB.
     */
    memory_gib?: number;
    gpu?: {
      enabled?: boolean;
      model?: string;
      count_per_node?: number;
    };
    bmc?: BmcCredentials;
    /**
     * Solution Builder Extension. The version is the one validated with provisioning.os_version. ARM sbeVersion, sbeFamily, sbePublisher, sbeManifestSource and sbeManifestCreationDate.
     */
    sbe?: {
      publisher?: string;
      family?: string;
      version?: string;
      manifest_source?: string;
      manifest_creation_date?: string;
      /**
       * Folder on the management host with the OEM's SBE files as downloaded: one SBE_*.zip, its SBE_*.xml and SBE_Discovery_<oem>.xml. Used to prepare machines before Validate.
       */
      bundle_path?: string;
      /**
       * Test only. Use the SBE in bundle_path even though the OEM's manifest doesn't list it as validated with provisioning.os_version. The hash is still checked. Default false.
       */
      allow_unvalidated?: boolean;
    };
    /**
     * The physical network cards in every machine, and what each port is for.
     */
    network_cards?: {
      label?: string;
      make?: string;
      model?: string;
      ports?: {
        /**
         * Adapter name in the OS, as the intents use it.
         */
        name: string;
        speed_gbps?: number;
        rdma?: 'none' | 'iwarp' | 'roce' | 'roce_v2';
        /**
         * unused, intent:<intent name>, cluster:a, cluster:b, iscsi:a or iscsi:b.
         */
        role?: string;
      }[];
    }[];
    /**
     * Drives per machine.
     */
    drives?: {
      capacity?: DriveGroup;
      cache?: DriveGroup;
    };
  };
  /**
   * The on-premises networks.
   */
  networking: {
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
       * 0 means untagged. Can't be changed after deployment. With ip_assignment static, simplified provisioning also sets it on the management port (edge machine networkAdapters[].vlanId).
       */
      vlan_id?: number;
      /**
       * ARM dnsServers.
       *
       * @minItems 1
       */
      dns_servers: [Ipv4, ...Ipv4[]];
      /**
       * How each machine's management address (nodes[].management.ip_address) is set before deployment, on the management port (nodes[].management.mac_address). static (default): the address, the subnet mask, the gateway, the DNS servers and vlan_id are set on that port. Simplified provisioning sets them at the OS install (edge machine siteDetails.deviceConfiguration.network.networkAdapters[], ipAssignmentType Manual, keyed by the MAC); for an ISO install the operator or the toolkit sets them. dhcp: the port stays on DHCP, so reserve each ip_address in DHCP for its MAC. preconfigured: the port is already configured, and the tools don't change it. Not the same as use_dhcp, which is the deployment's ARM useDhcp.
       */
      ip_assignment?: 'static' | 'dhcp' | 'preconfigured';
      /**
       * ARM useDhcp: the deployment takes the host and cluster addresses from DHCP instead of static addresses and the infrastructure_pool. Default false. A deployment setting, not how each machine's management port gets its address before deployment: that is ip_assignment.
       */
      use_dhcp?: boolean;
      /**
       * At least six contiguous addresses in the management subnet, outside the machines' addresses. ARM startingIPAddress and endingIPAddress.
       */
      infrastructure_pool?: {
        start: Ipv4;
        end: Ipv4;
      };
    };
    /**
     * The out-of-band network of the BMCs.
     */
    oob?: {
      subnet?: Cidr;
      gateway?: Ipv4;
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
    intents: [Intent, ...Intent[]];
    /**
     * Storage networks (Storage Spaces Direct). ARM storageNetworkList, enableStorageAutoIp and storageConnectivitySwitchless.
     */
    storage?: {
      /**
       * Network ATC assigns the storage addresses. When false, each node lists its storage_ips. Default true.
       */
      auto_ip?: boolean;
      /**
       * Switchless only: one or two links between each pair of machines.
       */
      switchless_links?: 'single' | 'dual';
      /**
       * Top-of-rack switches.
       */
      tor_switches?: number;
      /**
       * dedicated: storage on its own ports. converged: storage shares ports with other traffic.
       */
      layout?: 'dedicated' | 'converged';
      networks?: {
        /**
         * For example StorageNetwork1.
         */
        name: string;
        /**
         * Adapter name in the OS.
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
     * Disaggregated (SAN) only: the cluster networks on standalone ports, fabric A and B. ARM sanNetworkList.
     */
    cluster_networks?: {
      name: string;
      adapter: string;
      vlan_id: number;
      subnet: Cidr;
    }[];
    /**
     * Every VLAN in the design, by name.
     */
    vlans?: {
      name: string;
      id: number;
      subnet?: Cidr;
      purpose?: string;
    }[];
    /**
     * Arc VM logical networks created after deployment.
     */
    logical_networks?: LogicalNetwork[];
    /**
     * Details of scenario.outbound_path.
     */
    outbound?: {
      proxy?: {
        url: string;
        bypass?: string[];
      };
      /**
       * The Arc gateway resource, in the same subscription as the machines.
       */
      arc_gateway?: {
        name: string;
        resource_group?: ResourceGroup;
      };
      private_path?: {
        transport?: 'expressroute' | 'site_to_site_vpn';
        virtual_network?: string;
        workload_subnet?: string;
        firewall_subnet?: string;
        firewall_private_ip?: Ipv4;
        firewall_port?: number;
        arc_private_link_scope?: boolean;
        proxy_bypass?: string[];
      };
    };
  };
  /**
   * Accounts and the identity provider (scenario.identity).
   */
  identity: {
    /**
     * The deployment's local administrator on every machine. Not the built-in Administrator: the deployment renames it. ARM localAdminUserName and localAdminPassword.
     */
    local_admin: {
      username: string;
      /**
       * A Key Vault secret reference: keyvault://<vault>/<secret>. The vault must be listed in key_vaults.
       */
      password: string;
    };
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
         * A Key Vault secret reference: keyvault://<vault>/<secret>. The vault must be listed in key_vaults.
         */
        password: string;
      };
      /**
       * Addresses of domain controllers, for pre-checks.
       */
      domain_controllers?: Ipv4[];
      /**
       * Groups created in the OU for administration of the instance.
       */
      security_groups?: {
        name: string;
        purpose?: string;
        members?: string[];
      }[];
      /**
       * Service and administration accounts, apart from the LCM user.
       */
      service_accounts?: {
        name: string;
        purpose?: string;
        password?: KvRef;
      }[];
    };
    /**
     * Local identity with Key Vault. The instance's secrets go to cluster.key_vault.
     */
    local_identity?: {
      /**
       * ARM dnsServerConfig: use_dns_server (UseDnsServer) or use_forwarder (UseForwarder).
       */
      dns_server_config: 'use_dns_server' | 'use_forwarder';
      dns_zone?: string;
      dns_forwarders?: Ipv4[];
    };
    /**
     * Entra ID groups, role assignments and PIM.
     */
    entra?: {
      groups?: {
        name: string;
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
      /**
       * User principal names of emergency access accounts, excluded from Conditional Access.
       */
      break_glass_accounts?: string[];
    };
  };
  /**
   * Volumes and the SAN.
   */
  storage?: {
    /**
     * ARM configurationMode: express (Express), infra_only (InfraOnly) or keep_storage (KeepStorage).
     */
    configuration_mode?: 'express' | 'infra_only' | 'keep_storage';
    volumes?: {
      name: string;
      size_gib: number;
      resiliency?: 'two_way' | 'three_way' | 'four_way' | 'parity' | 'nested_two_way';
    }[];
    san?: {
      type: 'fibre_channel' | 'iscsi';
      /**
       * LUN of the infrastructure volume (250 GB minimum). ARM infraVolLunId.
       */
      infra_volume_lun_id?: string;
      /**
       * LUN of the performance history volume (20 GB minimum). ARM infraPerfLunId.
       */
      performance_history_lun_id?: string;
      luns?: {
        name: string;
        size_gib: number;
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
    drift_control?: boolean;
    credential_guard?: boolean;
    smb_signing?: boolean;
    smb_cluster_encryption?: boolean;
    bitlocker_boot_volume?: boolean;
    bitlocker_data_volumes?: boolean;
    wdac?: boolean;
    backup_key_vault?: KeyVaultName;
    telemetry?: {
      streaming_data?: boolean;
      episodic_data_upload?: boolean;
      eu_location?: boolean;
    };
  };
  /**
   * SDN enabled by Azure Arc.
   */
  sdn?: {
    enabled: boolean;
    prefix?: string;
    dns_records?: 'dynamic' | 'static';
    default_access_policy?: boolean;
  };
  operations?: {
    update_method?: 'portal' | 'powershell';
    monitoring?: {
      enabled: boolean;
      log_analytics_workspace?: string;
      workspace_resource_group?: ResourceGroup;
      data_collection_rule?: string;
      data_collection_endpoint?: string;
      health_alerts?: boolean;
      alert_email?: string;
    };
    backup?: {
      enabled: boolean;
      approach?: 'host' | 'guest' | 'both';
      solution?: string;
      recovery_vault?: string;
      resource_group?: ResourceGroup;
      policy?: string;
    };
    disaster_recovery?: {
      method?: 'none' | 'asr' | 'hyper_v_replica';
      recovery_vault?: string;
      resource_group?: ResourceGroup;
      replication_policy?: string;
      recovery_plan?: string;
      /**
       * Network the VMs fail over to.
       */
      network?: string;
      /**
       * Isolated network for test failovers.
       */
      test_network?: string;
      storage_account?: StorageAccountName;
      target_rto_minutes?: number;
      target_rpo_minutes?: number;
    };
    /**
     * Who hears about alerts. A webhook URL is a secret.
     */
    notifications?: {
      emails?: string[];
      teams_webhook?: KvRef;
    };
    licensing?: {
      /**
       * Azure Hybrid Benefit for the host fee and Windows Server guests.
       */
      azure_hybrid_benefit?: boolean;
      windows_server_subscription?: boolean;
      azure_verification_for_vms?: boolean;
    };
  };
  /**
   * How the OS gets onto the machines (scenario.os_install), and the OS version.
   */
  provisioning?: {
    /**
     * The solution version the machines run: latest, latest-preview, or a version such as 12.2610.1004.50. Pin a version. Simplified provisioning installs it, and the SBE must be validated with it.
     */
    os_version: string;
    /**
     * OS installed from an ISO. There is no unattended install: the OS is installed, then the tools take over.
     */
    iso?: {
      /**
       * microsoft (the Azure portal download) or oem (the OEM's image).
       */
      image_source?: 'microsoft' | 'oem';
      image_version?: string;
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
       * Subscription of the site and edge machines, when it isn't azure.subscription_id.
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
       * The local administrator that the provisioned OS gets. Prepare signs in as <node>\<username>.
       */
      admin: {
        username: string;
        /**
         * A Key Vault secret reference: keyvault://<vault>/<secret>. The vault must be listed in key_vaults.
         */
        password: string;
      };
      /**
       * The SMB share the BMCs mount the images from.
       */
      media_share: {
        name: string;
        /**
         * The management host's address as the BMCs reach it.
         */
        host?: string;
        /**
         * Instead of host: the local adapter whose IPv4 address the BMCs reach. Wins over host.
         */
        host_adapter?: string;
      };
    };
  };
  /**
   * Disconnected operations: the control plane appliance, its endpoints, identity and certificates.
   */
  disconnected?: {
    role: 'management' | 'workload';
    base_path?: string;
    domain_suffix?: string;
    ingress?: ApplianceEndpoint;
    management?: ApplianceEndpoint;
    dns_server?: Ipv4;
    time_servers?: string[];
    identity?: {
      authority?: string;
      client_id?: string;
      root_operator_upn?: string;
      ldap_server?: string;
      ldaps?: boolean;
      sync_group_identifier?: string;
    };
    operator_subscription_name?: string;
    resource_group?: string;
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
    management_groups?: {
      name: string;
      display_name?: string;
      /**
       * Parent management group name; empty for the tenant root.
       */
      parent?: string;
    }[];
    /**
     * Subscriptions by role. azure.subscription_id is the one the instance uses.
     */
    subscriptions?: {
      name: string;
      id?: Guid;
      /**
       * What the subscription is for.
       */
      role: 'connectivity' | 'identity' | 'management' | 'security' | 'devops' | 'workload' | 'azure_local';
      management_group?: string;
    }[];
    resource_groups?: {
      name: ResourceGroup;
      /**
       * Name of a subscription in landing_zone.subscriptions.
       */
      subscription?: string;
      location?: AzureRegion;
      purpose?: string;
    }[];
    /**
     * Resource provider namespaces to register, for example Microsoft.AzureStackHCI.
     */
    resource_providers?: string[];
    /**
     * Azure virtual networks.
     */
    networks?: {
      name: string;
      subscription?: string;
      resource_group?: ResourceGroup;
      location?: AzureRegion;
      role?: 'hub' | 'spoke';
      /**
       * @minItems 1
       */
      address_space: [Cidr, ...Cidr[]];
      dns_servers?: Ipv4[];
      subnets?: {
        name: string;
        prefix: Cidr;
        network_security_group?: string;
        route_table?: string;
      }[];
      /**
       * Names of networks this one peers with.
       */
      peer_with?: string[];
    }[];
    connectivity?: {
      vpn_gateway?: {
        name: string;
        resource_group?: ResourceGroup;
        network?: string;
        sku?: string;
        bgp_asn?: number;
        site_to_site?: {
          connection_name: string;
          local_gateway_name?: string;
          peer_public_ip?: Ipv4;
          peer_address_prefixes?: Cidr[];
          peer_bgp_address?: Ipv4;
          peer_asn?: number;
          shared_key: KvRef;
        }[];
        point_to_site?: {
          address_pool: Cidr;
          authentication?: 'entra_id' | 'certificate' | 'radius';
        };
      };
      bastion?: {
        name: string;
        resource_group?: ResourceGroup;
        sku?: string;
      };
      firewall?: {
        name: string;
        resource_group?: ResourceGroup;
        sku?: string;
        private_ip?: Ipv4;
      };
    };
    /**
     * Management VMs: domain controllers, jump box, Windows Admin Center, syslog.
     */
    virtual_machines?: {
      name: string;
      hostname?: NetbiosName;
      role: 'domain_controller' | 'jumpbox' | 'windows_admin_center' | 'syslog' | 'management' | 'other';
      /**
       * Where the VM runs.
       */
      deploy_target?: 'azure' | 'azure_local' | 'onprem';
      subscription?: string;
      resource_group?: ResourceGroup;
      network?: string;
      subnet?: string;
      private_ip?: Ipv4;
      size?: string;
      os?: string;
      admin_username?: string;
      admin_password?: KvRef;
    }[];
    log_analytics?: {
      name: string;
      resource_group?: ResourceGroup;
      retention_days?: number;
    };
    storage_accounts?: {
      name: StorageAccountName;
      resource_group?: ResourceGroup;
      sku?: string;
      purpose?: string;
    }[];
  };
  /**
   * Part 1 of the implementation steps: the pipeline platform and runner. Optional.
   */
  devops?: {
    platform: 'github' | 'gitlab' | 'azure_devops';
    url?: string;
    /**
     * Organization, group or project collection.
     */
    organization?: string;
    project?: string;
    runner?: {
      name: string;
      type: 'vm' | 'container_app' | 'existing';
      subscription?: string;
      resource_group?: ResourceGroup;
      network?: string;
      subnet?: string;
      private_ip?: Ipv4;
      size?: string;
      /**
       * Runner tags or labels that jobs select.
       */
      labels?: string[];
      registration_token?: KvRef;
    };
    state?: {
      storage_account?: StorageAccountName;
      container?: string;
      resource_group?: ResourceGroup;
    };
  };
  /**
   * Anything this schema doesn't define: settings for one environment or one tool, each under its own key (for example extensions.devops_runner). Tools ignore keys they don't own. Secrets here are keyvault:// references too.
   */
  extensions?: {
    [k: string]: unknown;
  };
}
export interface Node {
  /**
   * Host name: up to 15 characters. Also the edge machine name and, for an ISO install, the Arc machine name. With simplified provisioning the Arc machine name is arc_machine_name, which defaults to this.
   */
  name: string;
  /**
   * The machine's management port and address.
   */
  management: {
    /**
     * Management address. ARM physicalNodesSettings[].ipv4Address. How it gets onto the management port before deployment is networking.management.ip_assignment: set on the port (static), reserved in DHCP for mac_address (dhcp), or already there (preconfigured).
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
   * Serial number (Dell service tag). Maps each simplified-provisioning voucher to its machine.
   */
  serial_number?: string;
  bmc?: {
    ip_address?: Ipv4;
    type?: 'idrac' | 'ilo' | 'xcc' | 'other';
    username?: string;
    password?: KvRef;
  };
  rack?: string;
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
}
/**
 * BMC (iDRAC, iLO, XCC) login used for every machine unless a node sets its own.
 */
export interface BmcCredentials {
  /**
   * A reference to the secret holding the user name, or the user name itself.
   */
  username: string;
  password: KvRef;
}
export interface DriveGroup {
  media?: 'nvme' | 'ssd' | 'hdd';
  count?: number;
  size_tb?: number;
}
export interface Intent {
  name: string;
  /**
   * @minItems 1
   */
  traffic: ['management' | 'compute' | 'storage', ...('management' | 'compute' | 'storage')[]];
  /**
   * Adapter names in the OS, the same on every machine.
   *
   * @minItems 1
   */
  adapters: [string, ...string[]];
  /**
   * Network ATC overrides. Leave out to keep Network ATC's defaults, which Microsoft recommends.
   */
  overrides?: {
    qos?: {
      cluster_priority?: number;
      smb_priority?: number;
      smb_bandwidth_percent?: number;
    };
    adapter?: {
      jumbo_packet?: 1514 | 4088 | 9014;
      network_direct?: boolean;
      network_direct_technology?: 'iwarp' | 'roce' | 'roce_v2';
    };
    virtual_switch?: {
      enable_iov?: boolean;
      load_balancing_algorithm?: 'dynamic' | 'hyper_v_port';
    };
  };
}
export interface LogicalNetwork {
  name: string;
  vlan_id?: number;
  address_prefix?: Cidr;
  gateway?: Ipv4;
  dns_servers?: Ipv4[];
  ip_pool?: {
    start: Ipv4;
    end: Ipv4;
  };
}
export interface ApplianceEndpoint {
  ip_address?: Ipv4;
  gateway?: Ipv4;
  prefix_length?: number;
}
export interface NetworkDevice {
  hostname: string;
  type: 'switch' | 'firewall' | 'router' | 'console_server' | 'load_balancer' | 'wireless_controller';
  role?: 'primary' | 'secondary' | 'standalone';
  vendor?: string;
  model?: string;
  serial_number?: string;
  firmware_version?: string;
  management?: {
    /**
     * An IPv4 address, or dhcp.
     */
    ip_address?: Ipv4 | 'dhcp';
    vlan_id?: number;
    protocol?: 'ssh' | 'https' | 'telnet' | 'snmp';
  };
  credentials?: {
    username: string;
    password: KvRef;
  };
  ha?: {
    enabled?: boolean;
    mode?: string;
  };
}
