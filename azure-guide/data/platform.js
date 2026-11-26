GUIDE.add({
  id: 'storage-db', title: 'Storage & Databases', order: 2,
  services: [
    {
      id: 'adls', name: 'ADLS Gen2 and Blob Storage', priority: 'must', short: 'The data lake storage layer on Azure.',
      overview: 'Azure Data Lake Storage Gen2 is a Blob Storage account with the hierarchical namespace (HNS) turned on. That adds real directories, atomic rename and delete, and POSIX-style ACLs, which analytics engines such as Spark rely on. You address it with `abfss://container@account.dfs.core.windows.net/path`.',
      whenToUse: ['Any data lake, raw landing zone or Delta table store.', 'Backups, logs and large files.', 'Use plain Blob (no HNS) for simple object storage with no analytics directory semantics.'],
      concepts: ['Storage account contains containers; containers hold directories and files.', 'Hierarchical namespace: fast, atomic directory operations.', 'Access tiers: Hot, Cool, Cold, Archive (archive is offline and needs rehydration).', 'Redundancy: LRS, ZRS, GRS, GZRS (and read-access variants).', 'Lifecycle management rules move or delete data by age.', 'Auth: Microsoft Entra ID with RBAC and ACLs, managed identity, SAS tokens, account keys.'],
      useCases: ['Bronze/silver/gold zones for a lakehouse', 'Landing zone for ADF copies and Event Hubs Capture', 'Long-term archive'],
      examples: [
        { title: 'Create an ADLS Gen2 account and containers', lang: 'bash', code: `az storage account create -n mydatalake001 -g rg-data -l westeurope \\
  --sku Standard_ZRS --kind StorageV2 --enable-hierarchical-namespace true \\
  --allow-blob-public-access false --min-tls-version TLS1_2

for c in raw silver gold; do
  az storage container create --account-name mydatalake001 -n $c --auth-mode login
done` },
        { title: 'Grant a managed identity read access to data', lang: 'bash', code: `az role assignment create \\
  --assignee <principal-id> --role "Storage Blob Data Reader" \\
  --scope /subscriptions/<sub>/resourceGroups/rg-data/providers/Microsoft.Storage/storageAccounts/mydatalake001` },
        { title: 'Lifecycle rule: cool after 30 days, delete after 365', lang: 'json', code: `{
  "rules": [{
    "name": "age-out-raw", "enabled": true, "type": "Lifecycle",
    "definition": {
      "filters": {"blobTypes": ["blockBlob"], "prefixMatch": ["raw/"]},
      "actions": {"baseBlob": {
        "tierToCool": {"daysAfterModificationGreaterThan": 30},
        "delete": {"daysAfterModificationGreaterThan": 365}}}
    }
  }]
}` }
      ],
      pricing: 'Per GB-month by tier and redundancy, plus operations and data transfer. Cool and Archive have early-deletion periods and higher access cost.',
      tips: ['Disable shared key access and use Entra ID with managed identities.', 'Use private endpoints and the storage firewall.', 'Enable soft delete and versioning for important data.', 'Keep files large (128 MB to 1 GB) and use Delta or Parquet.'],
      related: ['databricks', 'adf', 'synapse', 'entra-rbac', 'networking', 'key-vault'],
      interview: [
        { q: 'ADLS Gen2 vs Blob Storage?', a: 'ADLS Gen2 is Blob Storage with the hierarchical namespace enabled. It adds true directories, atomic and fast rename and delete (important because Spark and Hive commit output by renaming), POSIX ACLs and the ABFS driver, while keeping Blob features such as tiers and lifecycle rules. Plain Blob has a flat namespace where a "folder" rename copies every blob.' },
        { q: 'How do RBAC and ACLs work together?', a: 'Azure RBAC is checked first. If a role assignment (such as Storage Blob Data Reader) allows the action, access is granted and ACLs are not evaluated. If RBAC does not grant it, POSIX ACLs are checked. Use RBAC for broad container-level access and ACLs for folder-level control. A user also needs execute permission on every parent directory to traverse, and default ACLs set the permissions of new children.' },
        { q: 'You are the subscription Owner but get a 403 reading a blob. Why?', a: 'Owner is a control-plane role. It lets you manage the storage account but does not grant data-plane access. You need a data role such as Storage Blob Data Reader or Contributor (or an ACL) on the account, container or path.' },
        { q: 'How do you structure a data lake?', a: 'Separate containers or accounts for zones (raw or bronze, silver, gold), then source system, dataset and Hive-style date folders such as `orders/year=2025/month=06/day=01/`. Use Delta or Parquet, avoid tiny files, and align folder security boundaries with ACLs or separate containers.' },
        { q: 'Explain access tiers and archive behavior.', a: 'Hot is for frequent access, Cool (30-day minimum) and Cold (90-day minimum) for infrequent access with lower storage but higher access cost, and Archive (180-day minimum) is offline and cheapest. Archived blobs must be rehydrated to a online tier, which takes hours. Lifecycle management rules automate transitions and deletion.' },
        { q: 'Which redundancy option do you pick?', a: 'LRS keeps three copies in one datacenter, cheapest. ZRS spreads across three zones in a region. GRS and GZRS add asynchronous copies in a paired region for disaster recovery, and the read-access variants allow reading the secondary. Choose by RPO and RTO; production lakes commonly use ZRS or GZRS. Remember geo-replication is asynchronous, so a failover can lose recent writes.' },
        { q: 'How do you secure a data lake storage account?', a: 'Entra ID authentication with managed identities, shared key access disabled, least-privilege RBAC and ACLs, private endpoints with the firewall denying public access, TLS 1.2 minimum, soft delete and versioning, encryption (Microsoft-managed or customer-managed keys in Key Vault), Defender for Storage, and diagnostic logs sent to Log Analytics. If SAS tokens are needed, prefer short-lived user delegation SAS.' }
      ]
    },
    {
      id: 'azure-sql', name: 'Azure SQL Database', priority: 'imp', short: 'Managed SQL Server for transactional workloads.',
      overview: 'Azure SQL Database is a fully managed relational database based on SQL Server. Data engineers meet it as a common source system, a metadata or control store for pipelines, and a small serving layer.',
      whenToUse: ['Transactional apps and pipeline control tables.', 'Not for large-scale analytics; use a warehouse or lakehouse.'],
      concepts: ['Purchasing models: vCore (choose cores and tier) and DTU (bundled).', 'Tiers: General Purpose, Business Critical, Hyperscale; serverless compute can auto-pause.', 'Elastic pools share resources across databases.', 'Failover groups and active geo-replication for disaster recovery.', 'Change tracking, CDC and temporal tables for change data.'],
      useCases: ['Source for ADF incremental loads', 'Control and audit tables for metadata-driven pipelines'],
      examples: [
        { title: 'Watermark table and update procedure', lang: 'sql', code: `CREATE TABLE etl.watermark (table_name sysname PRIMARY KEY, last_value datetime2);

CREATE PROCEDURE etl.usp_update_watermark @table sysname, @value datetime2
AS
  UPDATE etl.watermark SET last_value = @value WHERE table_name = @table;` }
      ],
      pricing: 'Per vCore-hour or DTU by tier, plus storage and backup storage beyond the free allowance. Serverless bills per second while active.',
      tips: ['Extract from a readable secondary or use CDC to avoid loading the primary.', 'Use managed identity authentication for ADF and Databricks.'],
      related: ['adf', 'databricks', 'key-vault'],
      interview: [
        { q: 'How do you extract data from an operational Azure SQL database without hurting it?', a: 'Use a read-only secondary replica, incremental queries on a watermark column, SQL change tracking or CDC, and schedule heavy extracts off-peak. ADF Copy with source partition options reads in parallel but should be throttled. Mirroring or Synapse Link style features can replicate to analytics storage without queries on the primary.' },
        { q: 'Change tracking vs CDC vs temporal tables?', a: 'Change tracking records which rows changed (keys and operation) with low overhead but not the old values. CDC reads the transaction log and stores full before and after row data in change tables. Temporal tables keep full row history automatically in a history table, useful for auditing and point-in-time queries.' },
        { q: 'vCore vs DTU?', a: 'DTU bundles CPU, memory and I/O into a single unit for simple sizing. vCore lets you choose cores, memory and storage separately, supports serverless and reserved capacity, and gives more transparency. New workloads usually use vCore.' }
      ]
    },
    {
      id: 'cosmos-db', name: 'Azure Cosmos DB', priority: 'imp', short: 'Globally distributed NoSQL database.',
      overview: 'Cosmos DB stores JSON documents (and other models) with single-digit millisecond latency, automatic indexing and multi-region distribution. Capacity is measured in Request Units per second (RU/s).',
      whenToUse: ['Low-latency, high-scale operational data by key.', 'Event-driven designs using the change feed.', 'Not for ad-hoc analytics or heavy joins.'],
      concepts: ['Partition key decides distribution; each logical partition has a 20 GB limit.', 'RU/s: provisioned, autoscale or serverless.', 'Five consistency levels: strong, bounded staleness, session (default), consistent prefix, eventual.', 'Change feed: ordered log of inserts and updates.', 'Analytical store with Synapse Link or Fabric mirroring for analytics without impacting RUs.'],
      useCases: ['Product catalog, user profiles, IoT state', 'Change feed to stream updates into the lake'],
      examples: [
        { title: 'Query with a partition key (Python)', lang: 'python', code: `from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential

client = CosmosClient("https://myacct.documents.azure.com:443/", credential=DefaultAzureCredential())
container = client.get_database_client("shop").get_container_client("orders")
items = container.query_items(
    "SELECT * FROM c WHERE c.customerId = @id",
    parameters=[{"name": "@id", "value": "c-1"}],
    partition_key="c-1")` }
      ],
      pricing: 'Per RU/s provisioned (or per RU consumed in serverless) plus storage per GB and replicated regions.',
      tips: ['Pick a partition key that has high cardinality and appears in most queries.', 'Prefer point reads and single-partition queries.', 'Use the analytical store instead of running analytics on the transactional store.'],
      related: ['event-hubs', 'synapse', 'functions', 'databricks'],
      interview: [
        { q: 'How do you choose a partition key?', a: 'High cardinality, even distribution of storage and requests, and present in most queries so they hit one partition. A poor key creates hot partitions and cross-partition fan-out queries that cost many RUs. For multiple access patterns, consider hierarchical partition keys or a denormalized copy.' },
        { q: 'Explain the consistency levels.', a: 'Strong gives linearizable reads, with highest latency and limits for multi-region. Bounded staleness bounds lag by time or versions. Session guarantees read-your-writes within a client session and is the default. Consistent prefix guarantees ordered reads without gaps. Eventual has the lowest latency and cost but no ordering guarantee. Most apps use session.' },
        { q: 'How do you run analytics on Cosmos DB data without affecting the app?', a: 'Enable the analytical store (a column-oriented copy maintained automatically) and query it through Synapse Link, or use Fabric mirroring. That avoids spending transactional RUs. Alternatively stream the change feed to the lake with Functions or Spark.' },
        { q: 'What is the change feed?', a: 'A persistent, ordered record of inserts and updates per partition key range that can be read from any point and consumed by Functions triggers or the change feed processor. It does not show deletes by default (use soft-delete flags or the all versions mode where available).' }
      ]
    }
  ]
});

GUIDE.add({
  id: 'integration', title: 'Compute & Integration', order: 3,
  services: [
    {
      id: 'functions', name: 'Azure Functions', priority: 'imp', short: 'Serverless event-driven code.',
      overview: 'Functions run small pieces of code in response to triggers such as HTTP calls, timers, blob uploads or Event Hubs and Service Bus messages. Durable Functions add stateful workflows.',
      whenToUse: ['Light event-driven processing and glue code.', 'Short transformations or API calls inside a pipeline.', 'Heavy or long processing belongs in Databricks, Batch or containers.'],
      concepts: ['Triggers and bindings.', 'Hosting plans: Consumption, Flex Consumption, Premium, Dedicated; timeouts and scaling differ.', 'Durable Functions: orchestrator and activity functions for fan-out and fan-in.', 'Managed identity for access to other services.'],
      useCases: ['Process a blob when it lands', 'Call an external API on a schedule', 'Consume Event Hubs events and write to Cosmos DB'],
      examples: [
        { title: 'Event Hubs triggered function (Python v2 model)', lang: 'python', code: `import azure.functions as func, logging
app = func.FunctionApp()

@app.event_hub_message_trigger(arg_name="events", event_hub_name="clicks",
                               connection="EventHubConnection", cardinality="many")
def process(events: list[func.EventHubEvent]):
    for e in events:
        logging.info("event: %s", e.get_body().decode())` }
      ],
      pricing: 'Consumption: per execution and GB-second with a monthly free grant. Premium and Dedicated plans bill for reserved instances.',
      tips: ['Use managed identity connections instead of connection strings.', 'Keep functions idempotent; triggers can deliver duplicates.', 'Set batch sizes and concurrency to protect downstream systems.'],
      related: ['event-hubs', 'service-bus', 'event-grid', 'cosmos-db', 'adls'],
      interview: [
        { q: 'Which hosting plan would you pick?', a: 'Consumption (or Flex Consumption) scales to zero and bills per use, good for spiky light work, with a execution time limit and possible cold starts. Premium keeps pre-warmed instances, supports VNet integration and longer runs. Dedicated runs on an App Service plan you already pay for. Choose by latency, networking needs and execution time.' },
        { q: 'How do you process an Event Hubs stream reliably with Functions?', a: 'Use the Event Hubs trigger with batching, one function instance per partition at most, and checkpointing handled by the runtime after the batch succeeds. Make processing idempotent, catch and route poison events to a dead-letter store, and tune batch size so downstream systems are not overwhelmed.' },
        { q: 'When do you use Durable Functions?', a: 'When you need a multi-step, long-running or fan-out/fan-in workflow in code with automatic state and retries, for example processing many files in parallel then aggregating. For orchestrating data services without writing code, ADF is usually better.' }
      ]
    },
    {
      id: 'service-bus', name: 'Azure Service Bus', priority: 'imp', short: 'Enterprise message broker with queues and topics.',
      overview: 'Service Bus provides reliable messaging with queues (one consumer per message) and topics with subscriptions (publish and subscribe), plus sessions, dead-letter queues, duplicate detection and transactions.',
      whenToUse: ['Commands and business messages that must not be lost.', 'Ordered processing per key using sessions.', 'Event Hubs is better for high-volume telemetry streams.'],
      concepts: ['Queue, topic, subscription with filters.', 'Peek-lock vs receive-and-delete; lock duration and complete/abandon.', 'Dead-letter queue and max delivery count.', 'Sessions for FIFO per session id.', 'Duplicate detection window.'],
      useCases: ['Order processing workers', 'Fan-out of domain events to several services'],
      pricing: 'Standard: per operation plus base charge. Premium: per messaging unit with isolation and larger messages.',
      tips: ['Use peek-lock and complete only after successful processing.', 'Monitor the dead-letter queue.', 'Prefer managed identity authentication.'],
      related: ['event-hubs', 'event-grid', 'functions'],
      interview: [
        { q: 'Service Bus queue vs topic?', a: 'A queue delivers each message to one of its competing consumers. A topic copies each message to every subscription, and each subscription behaves like its own queue with optional filter rules. Use queues for work distribution and topics for fan-out.' },
        { q: 'How does Service Bus guarantee processing?', a: 'In peek-lock mode the message is locked while a consumer works. The consumer completes it on success; if the lock expires or it abandons the message, it is redelivered. After the max delivery count it goes to the dead-letter queue. Delivery is at least once, so handlers must be idempotent, optionally helped by duplicate detection.' },
        { q: 'Service Bus vs Storage Queues?', a: 'Storage Queues are simple and cheap with very large capacity but have fewer features. Service Bus adds topics, sessions, dead-lettering, transactions, duplicate detection and ordering. Choose Service Bus for enterprise messaging needs.' }
      ]
    },
    {
      id: 'event-grid', name: 'Azure Event Grid', priority: 'good', short: 'Event routing from Azure services and your apps.',
      overview: 'Event Grid pushes discrete events (for example "blob created") from sources to handlers such as Functions, Logic Apps, webhooks and Event Hubs, with filtering and retries.',
      whenToUse: ['React to file arrival in ADLS and start a pipeline.', 'Loosely coupled notifications between services.'],
      concepts: ['Topics (system and custom), event subscriptions, filters.', 'Push delivery with retry and dead-lettering to a storage account.', 'ADF storage event triggers use Event Grid.'],
      useCases: ['Blob created triggers an ADF pipeline or a Function'],
      pricing: 'Per million operations, with a monthly free allowance.',
      tips: ['Filter by subject prefix and suffix to avoid unrelated events.', 'Handlers must be idempotent.'],
      related: ['adf', 'functions', 'adls', 'service-bus'],
      interview: [
        { q: 'How does a file landing in ADLS start an ADF pipeline?', a: 'A storage event trigger registers an Event Grid subscription on the storage account. When a blob is created, Event Grid pushes the event to ADF, which starts the pipeline and passes the file path as trigger parameters. Filter by container prefix and file suffix to avoid partial or unrelated files.' },
        { q: 'Event Grid vs Event Hubs?', a: 'Event Grid reacts to individual events and routes them to handlers with push delivery. Event Hubs ingests continuous high-volume streams that consumers pull and replay. Event Grid answers "something happened", Event Hubs carries "the stream of what is happening".' }
      ]
    }
  ]
});

GUIDE.add({
  id: 'security-ops', title: 'Security, Networking & Operations', order: 4,
  services: [
    {
      id: 'entra-rbac', name: 'Entra ID, RBAC and Managed Identity', priority: 'must', short: 'Who can access what in Azure.',
      overview: 'Microsoft Entra ID is the identity provider. Azure RBAC assigns roles to users, groups, service principals and managed identities at a scope (management group, subscription, resource group or resource). Managed identities let services authenticate without secrets.',
      whenToUse: ['Always. Every Azure resource access is authorized by RBAC or service-specific mechanisms.'],
      concepts: ['Role assignment = principal + role + scope; permissions are inherited down the scope tree.', 'Control plane (manage resources) vs data plane (read data); roles such as Owner do not grant data access.', 'System-assigned managed identity: tied to a resource lifetime. User-assigned: separate, reusable.', 'Service principal: app identity with a secret or certificate.', 'Groups, conditional access and Privileged Identity Management (PIM) for just-in-time elevation.'],
      useCases: ['ADF reads from ADLS using its managed identity', 'Group-based access for analysts to specific containers'],
      examples: [
        { title: 'Let an ADF managed identity write to a container', lang: 'bash', code: `PRINCIPAL=$(az datafactory show -g rg-data -n adf-prod --query identity.principalId -o tsv)
az role assignment create --assignee-object-id $PRINCIPAL --assignee-principal-type ServicePrincipal \\
  --role "Storage Blob Data Contributor" \\
  --scope /subscriptions/<sub>/resourceGroups/rg-data/providers/Microsoft.Storage/storageAccounts/mydatalake001/blobServices/default/containers/raw` }
      ],
      pricing: 'RBAC and managed identities are free. Some Entra features (PIM, conditional access) need paid licenses.',
      tips: ['Assign roles to groups, not individuals.', 'Prefer managed identities over secrets.', 'Grant at the narrowest scope that works.'],
      related: ['key-vault', 'adls', 'adf', 'databricks'],
      interview: [
        { q: 'Managed identity vs service principal?', a: 'A managed identity is a service principal whose credentials Azure creates and rotates for you; your code never handles a secret. A regular service principal needs a client secret or certificate you must store and rotate. Use managed identities whenever the service supports them, and a service principal for external systems such as CI/CD.' },
        { q: 'System-assigned vs user-assigned managed identity?', a: 'System-assigned is created with a resource and deleted with it, one per resource. User-assigned is a standalone resource that can be attached to several resources and keeps its role assignments, which helps when many services need the same access or when you want to pre-grant permissions before deployment.' },
        { q: 'Explain control plane vs data plane.', a: 'The control plane manages resources (create a storage account, change a firewall). The data plane works with the data inside (read a blob, query a Key Vault secret). RBAC roles are scoped to one or the other, so Owner or Contributor can manage a storage account yet still need Storage Blob Data roles to read its data.' },
        { q: 'How do you design access for a data platform?', a: 'Create Entra groups per role and domain (for example data-engineers, analysts-sales). Assign groups data roles on specific containers, Unity Catalog or warehouse grants for tables, and Key Vault roles for secrets. Pipelines use managed identities with minimal rights. Use PIM for elevated admin access and review access regularly.' }
      ]
    },
    {
      id: 'key-vault', name: 'Azure Key Vault', priority: 'imp', short: 'Store secrets, keys and certificates.',
      overview: 'Key Vault stores secrets (passwords, connection strings), cryptographic keys and certificates with access control, auditing and rotation. Pipelines and apps read secrets at runtime instead of storing them in code.',
      whenToUse: ['Any credential that cannot be avoided by using managed identities.', 'Customer-managed encryption keys for storage and databases.'],
      concepts: ['Secrets, keys, certificates.', 'Authorization through Azure RBAC (recommended) or legacy access policies.', 'Soft delete and purge protection prevent accidental permanent loss.', 'Versioned secrets and expiry dates.', 'Integration: ADF linked services, Databricks secret scopes, Functions references.'],
      useCases: ['Database password used by ADF', 'Databricks secret scope for a service principal'],
      examples: [
        { title: 'Store and read a secret', lang: 'bash', code: `az keyvault secret set --vault-name kv-data-prod --name sql-password --value '<password>'
az keyvault secret show --vault-name kv-data-prod --name sql-password --query value -o tsv` },
        { title: 'Read it from Python with managed identity', lang: 'python', code: `from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

client = SecretClient("https://kv-data-prod.vault.azure.net", DefaultAzureCredential())
password = client.get_secret("sql-password").value` }
      ],
      pricing: 'Per 10,000 operations by object type; premium tier with HSM-backed keys costs more.',
      tips: ['Use RBAC authorization and grant "Key Vault Secrets User" to pipelines.', 'Enable soft delete and purge protection.', 'Use a separate vault per environment.'],
      related: ['adf', 'databricks', 'entra-rbac', 'adls'],
      interview: [
        { q: 'How do ADF and Databricks use Key Vault?', a: 'ADF linked services can reference a Key Vault secret, and ADF reads it with its managed identity (granted a secrets reader role). Databricks creates a Key Vault-backed secret scope so notebooks call `dbutils.secrets.get` and never see or print the value in plain text.' },
        { q: 'RBAC vs access policies in Key Vault?', a: 'Access policies are the older per-vault model granting broad permissions per object type. Azure RBAC is the recommended model: consistent with the rest of Azure, scoped to vault or individual secret, and manageable with groups and PIM. New vaults should use RBAC.' },
        { q: 'What do soft delete and purge protection do?', a: 'Soft delete keeps a deleted vault or object recoverable for a retention period. Purge protection prevents anyone, including admins, from permanently deleting it before that period ends, which protects encryption keys from accidental or malicious loss.' }
      ]
    },
    {
      id: 'networking', name: 'Networking and Private Endpoints', priority: 'imp', short: 'Keeping data services off the public internet.',
      overview: 'Production data platforms usually disable public access and connect services through virtual networks. Private endpoints give a PaaS service a private IP in your VNet, and private DNS zones resolve its name to that address.',
      whenToUse: ['Regulated or sensitive data.', 'Any enterprise landing zone.'],
      concepts: ['VNet, subnets, NSGs, route tables, Azure Firewall.', 'Private endpoint: private IP for a service instance; needs private DNS (for example `privatelink.dfs.core.windows.net`).', 'Service endpoint: lets a subnet reach a service over the backbone, but the service keeps a public endpoint.', 'Databricks VNet injection and secure cluster connectivity (no public IPs).', 'ADF and Synapse managed virtual network with managed private endpoints; self-hosted IR for on-premises.', 'ExpressRoute or VPN to on-premises.'],
      useCases: ['ADLS reachable only from the data platform VNet', 'Databricks clusters in a customer VNet'],
      examples: [
        { title: 'Private endpoint for the DFS endpoint of a storage account', lang: 'bash', code: `az network private-endpoint create -g rg-data -n pe-lake-dfs \\
  --vnet-name vnet-data --subnet snet-private \\
  --private-connection-resource-id <storage-account-resource-id> \\
  --group-id dfs --connection-name lake-dfs` }
      ],
      pricing: 'Private endpoints bill per hour plus per GB processed. Firewalls, NAT and gateways add their own cost.',
      tips: ['Create private endpoints for each sub-resource you use (blob and dfs are separate).', 'Link private DNS zones to every VNet that needs resolution.', 'Test name resolution first when connections fail.'],
      related: ['adls', 'databricks', 'adf', 'synapse'],
      interview: [
        { q: 'Private endpoint vs service endpoint?', a: 'A private endpoint puts a network interface with a private IP for one specific service instance in your VNet, so you can disable public access and reach it from on-premises too. A service endpoint keeps the public endpoint but restricts access to selected subnets over the Azure backbone. Private endpoints are more isolated and more common for sensitive data.' },
        { q: 'ADF cannot reach a storage account that has public access disabled. What do you check?', a: 'Whether ADF uses an Azure IR in a managed virtual network with a managed private endpoint to the storage account (and that it is approved), or a self-hosted IR inside a network with access. Also check the private DNS zone and the right sub-resource (dfs vs blob), the firewall settings, and the managed identity roles.' },
        { q: 'How do you secure Databricks networking?', a: 'Deploy the workspace with VNet injection in your own VNet, enable secure cluster connectivity (no public IPs on nodes), use private link for the control plane and storage, restrict outbound traffic with a firewall, and use network security groups.' },
        { q: 'Why do private endpoint connections often fail on DNS?', a: 'The service name must resolve to the private IP instead of the public one. That needs a private DNS zone (such as `privatelink.dfs.core.windows.net`) linked to the VNet, or DNS forwarding from on-premises to Azure. If the name still resolves to a public address, traffic is blocked by the firewall.' }
      ]
    },
    {
      id: 'monitor', name: 'Azure Monitor and Log Analytics', priority: 'imp', short: 'Metrics, logs, alerts and dashboards.',
      overview: 'Azure Monitor collects metrics and logs from Azure services. Diagnostic settings send resource logs (ADF runs, Databricks jobs, storage access) to a Log Analytics workspace, where you query them with KQL and trigger alerts.',
      whenToUse: ['Monitoring pipeline success, latency and freshness.', 'Auditing access and troubleshooting failures.'],
      concepts: ['Metrics (numeric time series) and logs (events).', 'Diagnostic settings route logs to Log Analytics, storage or Event Hubs.', 'KQL queries.', 'Alert rules and action groups (email, SMS, webhook, Teams).', 'Workbooks and dashboards.'],
      useCases: ['Alert on failed ADF pipeline runs', 'Dashboard of daily load durations'],
      examples: [
        { title: 'KQL: failed ADF pipeline runs per hour', lang: 'sql', code: `ADFPipelineRun
| where Status == "Failed"
| summarize failures = count() by PipelineName, bin(TimeGenerated, 1h)
| order by TimeGenerated desc` }
      ],
      pricing: 'Log Analytics bills per GB ingested and retained beyond the free period; alerts bill per rule.',
      tips: ['Send ADF, Synapse and Databricks diagnostics to one workspace.', 'Set retention and daily caps to control cost.', 'Alert on business signals too, such as data freshness and row counts.'],
      related: ['adf', 'databricks', 'adls'],
      interview: [
        { q: 'How do you monitor and alert on ADF pipelines?', a: 'Turn on diagnostic settings to send pipeline, activity and trigger run logs to Log Analytics. Write KQL queries on failures and duration, create alert rules with action groups to notify the team, and use the ADF monitoring view for run details. Add custom audit logging for row counts and SLA checks.' },
        { q: 'How do you detect a pipeline that did not run at all?', a: 'A failure alert will not fire when nothing runs. Alert on data freshness instead: a query on the latest partition or watermark time, or a KQL query that checks that an expected run exists, with an alert when it is missing. Tumbling window triggers also show queued or missed windows.' },
        { q: 'How do you control Log Analytics cost?', a: 'Collect only needed log categories, use resource-specific tables, set a daily cap and retention policy, move old data to archive, and use basic logs for high-volume low-value tables.' }
      ]
    },
    {
      id: 'devops-iac', name: 'CI/CD and Infrastructure as Code', priority: 'imp', short: 'Bicep, Terraform, Azure DevOps and GitHub Actions for data platforms.',
      overview: 'Data platform resources and pipelines should be defined in code, reviewed and deployed through CI/CD. Bicep and Terraform create infrastructure, while ADF, Databricks and SQL changes are promoted through environments.',
      whenToUse: ['Repeatable dev, test and prod environments.', 'Auditable changes and safe rollbacks.'],
      concepts: ['Bicep (native Azure IaC), ARM templates, Terraform.', 'Azure DevOps Pipelines or GitHub Actions with environments and approvals.', 'ADF: Git integration and ARM template promotion.', 'Databricks: Asset Bundles or Terraform provider for jobs and clusters; repos for notebooks.', 'Secrets in Key Vault; deploy with a service principal or workload identity federation.'],
      useCases: ['Deploy a storage account, ADF and Key Vault per environment', 'Promote Databricks jobs from dev to prod'],
      examples: [
        { title: 'Bicep: ADLS Gen2 account', lang: 'text', code: `param name string
param location string = resourceGroup().location

resource lake 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: name
  location: location
  sku: { name: 'Standard_ZRS' }
  kind: 'StorageV2'
  properties: {
    isHnsEnabled: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
  }
}` },
        { title: 'Deploy it', lang: 'bash', code: `az deployment group create -g rg-data --template-file lake.bicep --parameters name=mydatalake001` }
      ],
      pricing: 'Bicep and ARM are free. Azure DevOps and GitHub charge by parallel jobs and users beyond free tiers.',
      tips: ['Use separate subscriptions or resource groups per environment.', 'Run what-if (`az deployment group what-if`) before applying.', 'Keep environment differences in parameters, not in copied templates.'],
      related: ['adf', 'databricks', 'key-vault', 'entra-rbac'],
      interview: [
        { q: 'How do you promote a data platform from dev to prod?', a: 'Infrastructure is deployed from Bicep or Terraform with environment parameters. ADF is developed in Git on dev and promoted through its ARM templates with parameter overrides. Databricks code and jobs are versioned in Git and deployed with Asset Bundles or Terraform. Pipelines run tests, require approvals for prod, and use separate identities and Key Vaults per environment.' },
        { q: 'Bicep vs Terraform?', a: 'Bicep is Azure-only, has day-one support for new Azure features, and needs no state file. Terraform is multi-cloud with a large provider ecosystem and explicit state, useful when you manage Databricks, Azure and other providers together. Pick based on team skills and scope.' },
        { q: 'How do you test data pipelines?', a: 'Unit test transformation functions locally (pytest with a small Spark session), run integration tests in a dev environment on sample data, validate schema and data quality checks as part of the pipeline, and compare row counts or checksums after a deployment to staging.' }
      ]
    }
  ]
});
