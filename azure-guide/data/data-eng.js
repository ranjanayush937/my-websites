GUIDE.add({
  id: 'data-eng', title: 'Data Engineering & Analytics', order: 1,
  services: [
    {
      id: 'adf', name: 'Azure Data Factory', priority: 'must', short: 'Cloud ETL/ELT orchestration and data movement.',
      overview: 'Data Factory (ADF) is the main Azure service for moving data and orchestrating pipelines. You build pipelines from activities (Copy, Data Flow, Lookup, ForEach, notebook and stored procedure calls) that run on integration runtimes, and start them with triggers. It orchestrates compute; it is not meant to be the heavy transformation engine.',
      whenToUse: ['Copying data between 100+ sources and sinks, including on-premises databases.', 'Scheduling and sequencing jobs across Databricks, Synapse, SQL and Functions.', 'Low-code transformation with mapping data flows for simple to medium logic.'],
      concepts: ['Pipeline: a group of activities. Activity: one step (Copy, Lookup, ForEach, If, Execute Pipeline, Databricks notebook).', 'Linked service: connection information. Dataset: the shape and location of data.', 'Integration runtime (IR): the compute that runs activities. Azure IR (managed), self-hosted IR (on-premises or private network), Azure-SSIS IR.', 'Triggers: schedule, tumbling window, storage event, custom event.', 'Parameters, variables and expressions such as `@pipeline().parameters.runDate`.', 'DIU (data integration unit): the unit of Copy activity compute.'],
      useCases: ['Nightly load from on-premises SQL Server to ADLS', 'Metadata-driven ingestion of hundreds of tables', 'Orchestrating Databricks notebooks and a warehouse load'],
      examples: [
        { title: 'Watermark query for an incremental Copy activity', desc: 'Two Lookup activities fetch the old and new watermark. The Copy source query uses them.', lang: 'text', code: `@concat('SELECT * FROM sales.orders WHERE modified_at > ''',
  activity('LookupOldWatermark').output.firstRow.watermark,
  ''' AND modified_at <= ''',
  activity('LookupNewWatermark').output.firstRow.newwatermark, '''')` },
        { title: 'Pass the tumbling window range to a pipeline', lang: 'text', code: `Pipeline parameters:
  windowStart = @trigger().outputs.windowStartTime
  windowEnd   = @trigger().outputs.windowEndTime

Folder written by the Copy activity:
  raw/orders/@{formatDateTime(pipeline().parameters.windowStart, 'yyyy/MM/dd/HH')}/` },
        { title: 'Run a pipeline from the CLI', lang: 'bash', code: `az datafactory pipeline create-run \\
  --resource-group rg-data --factory-name adf-prod \\
  --name pl_load_orders --parameters '{"runDate":"2025-06-01"}'` }
      ],
      pricing: 'Per activity run and orchestration, per DIU-hour for Copy, per vCore-hour for mapping data flows, plus self-hosted IR activity. Data flow clusters cost the most.',
      tips: ['Use managed identity and Key Vault references; never store passwords in linked services.', 'Do transformations in Databricks or SQL; keep ADF for orchestration and movement.', 'Make every load idempotent and parameterized by date.', 'Connect Git only to the dev factory and promote through CI/CD.'],
      related: ['databricks', 'synapse', 'adls', 'key-vault', 'monitor', 'devops-iac'],
      interview: [
        { q: 'Explain the main components of ADF.', a: 'A pipeline holds activities. Activities use datasets that describe data and linked services that hold connection details. Integration runtimes execute the work, and triggers start pipelines (schedule, tumbling window, storage or custom event). Parameters and expressions make pipelines reusable.' },
        { q: 'What are the integration runtime types and when do you need self-hosted?', a: 'Azure IR is fully managed and reaches public endpoints and (with managed VNet) private ones. Self-hosted IR is software you install on a machine or VM to reach on-premises or private-network sources; scale it with several nodes. Azure-SSIS IR runs existing SSIS packages. I use self-hosted IR whenever the source is not reachable from Azure IR, such as an on-premises SQL Server.' },
        { q: 'How do you implement incremental loading?', a: 'The classic watermark pattern: a Lookup reads the last watermark (for example max `modified_at`) from a control table, a second Lookup gets the current maximum from the source, a Copy activity moves rows between the two values, and a stored procedure updates the watermark only after success. Alternatives are SQL change tracking or CDC, the Copy activity filter on file last-modified time, and the built-in incremental CDC resource. Always make the load re-runnable.' },
        { q: 'How do you build a metadata-driven pipeline for hundreds of tables?', a: 'Keep a control table with source, target, load type and watermark column. A Lookup reads the rows, a ForEach iterates over them, and each iteration runs a parameterized Copy or an Execute Pipeline child. Know the limits: Lookup returns at most 5,000 rows or 4 MB, ForEach runs up to 50 iterations in parallel, and you cannot nest a ForEach inside a ForEach, so call a child pipeline instead.' },
        { q: 'Schedule trigger vs tumbling window vs storage event trigger?', a: 'A schedule trigger fires at clock times and has no memory of past windows. A tumbling window trigger fires for contiguous, non-overlapping windows, passes the window start and end to the pipeline, supports retry, dependencies between windows and backfill of past windows, and maps to one pipeline. A storage event trigger fires when a blob is created or deleted (through Event Grid). Use tumbling window for reliable interval processing and event triggers for file arrival.' },
        { q: 'Copy activity vs mapping data flow vs Databricks?', a: 'Copy moves data fast with little transformation. Mapping data flows are visual Spark transformations, with cluster start-up time and higher cost, good for simple to medium logic and teams that prefer no code. Databricks notebooks suit complex logic, large volumes, unit-testable code and Delta features. For production I prefer ADF for orchestration and Copy, Databricks for heavy transformation.' },
        { q: 'A Copy activity is slow. How do you speed it up?', a: 'Increase DIUs and parallel copies, enable partition options on the source (physical partitions or dynamic ranges) so reads run in parallel, use staging with COPY or PolyBase when loading Synapse, place the IR close to the data (same region, scaled-out self-hosted IR), and check throttling at the source or sink. Write fewer, larger files to the lake.' },
        { q: 'How do you do CI/CD for ADF?', a: 'Connect Git to the development factory only. Developers work in feature branches and merge to collaboration; publishing generates ARM templates in the `adf_publish` branch (or use the ADF utilities npm package to validate and export in the pipeline). A release pipeline stops active triggers, deploys the ARM templates with per-environment parameter overrides (linked service endpoints, Key Vault names), then restarts triggers.' },
        { q: 'How do you handle failures and alerting?', a: 'Set retries on activities, use activity dependency conditions (Succeeded, Failed, Completed, Skipped) to branch to a notification or cleanup path, send diagnostic logs to Log Analytics, and create Azure Monitor alerts on failed pipeline runs that notify through an action group. Log run IDs, row counts and status to an audit table.' },
        { q: 'How do you secure credentials and network access in ADF?', a: 'Use the factory managed identity and grant it RBAC on targets. Where passwords are unavoidable, reference Key Vault secrets in linked services. For private networks, use managed virtual network with managed private endpoints, or a self-hosted IR inside the network.' }
      ]
    },
    {
      id: 'databricks', name: 'Azure Databricks', priority: 'must', short: 'Apache Spark and Delta Lake lakehouse platform.',
      overview: 'Azure Databricks is a managed Spark platform with notebooks, jobs, SQL warehouses and Delta Lake. It is the main place for heavy transformation, streaming and ML on Azure, usually reading and writing Delta tables in ADLS Gen2 and governed by Unity Catalog.',
      whenToUse: ['Large-scale batch and streaming transformation.', 'Lakehouse with ACID tables, upserts and time travel.', 'Teams writing PySpark or SQL with software engineering practices.'],
      concepts: ['Cluster: all-purpose (interactive) vs job cluster (created per run) vs serverless compute and SQL warehouses.', 'Delta Lake: Parquet files plus a transaction log (`_delta_log`) giving ACID, schema enforcement, time travel and `MERGE`.', 'Unity Catalog: governance with a `catalog.schema.table` namespace, grants, lineage, row filters and column masks.', 'Auto Loader: incremental file ingestion (`cloudFiles`).', 'Workflows (jobs), Delta Live Tables (declarative pipelines with data quality expectations).', 'Medallion layers: bronze (raw), silver (clean), gold (business).'],
      useCases: ['Bronze to silver to gold pipelines', 'Streaming ingestion from Event Hubs', 'SCD2 and CDC merges into Delta tables'],
      examples: [
        { title: 'Auto Loader into a bronze Delta table', lang: 'python', code: `(spark.readStream.format("cloudFiles")
  .option("cloudFiles.format", "json")
  .option("cloudFiles.schemaLocation", "abfss://meta@acct.dfs.core.windows.net/schemas/orders")
  .load("abfss://raw@acct.dfs.core.windows.net/orders/")
  .writeStream
  .option("checkpointLocation", "abfss://meta@acct.dfs.core.windows.net/chk/orders")
  .trigger(availableNow=True)          # process what is new, then stop
  .toTable("main.bronze.orders"))` },
        { title: 'Upsert with MERGE', lang: 'sql', code: `MERGE INTO main.silver.orders AS t
USING updates AS s
  ON t.order_id = s.order_id
WHEN MATCHED AND s.op = 'D' THEN DELETE
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED AND s.op <> 'D' THEN INSERT *;` },
        { title: 'Table maintenance', lang: 'sql', code: `OPTIMIZE main.silver.orders ZORDER BY (customer_id);
VACUUM main.silver.orders RETAIN 168 HOURS;   -- 7 days, the default
DESCRIBE HISTORY main.silver.orders;
SELECT * FROM main.silver.orders VERSION AS OF 12;` }
      ],
      pricing: 'You pay Databricks units (DBUs) per hour by workload type plus the underlying Azure VMs and storage. Job compute costs less per DBU than all-purpose. Spot VMs and auto-termination reduce cost.',
      tips: ['Use job clusters or serverless for production, all-purpose clusters only for development, with auto-termination.', 'Use Unity Catalog and a managed identity (access connector) for storage access; avoid account keys and mounts.', 'Do not partition small tables; prefer liquid clustering or Z-ORDER.', 'Run `OPTIMIZE` regularly and keep `VACUUM` retention at the default unless you are sure.'],
      related: ['adls', 'adf', 'event-hubs', 'key-vault', 'purview', 'fabric'],
      interview: [
        { q: 'What does Delta Lake add on top of Parquet?', a: 'A transaction log next to the data files. It provides ACID transactions, so concurrent writers and readers see consistent snapshots, plus schema enforcement and evolution, time travel (query older versions), `MERGE` for upserts and deletes, and one table that works for both batch and streaming.' },
        { q: 'How do you implement an upsert or SCD Type 2 with Delta?', a: 'Use `MERGE INTO` joining incoming rows to the target on the business key. For Type 2, compare a hash of tracked columns; for changed rows, close the current record (set `end_date`, `is_current = false`) and insert a new current version. A common pattern is to union the staged changes with a copy of rows that need closing, so a single `MERGE` does both steps.' },
        { q: 'What do OPTIMIZE, Z-ORDER and VACUUM do?', a: '`OPTIMIZE` compacts many small files into larger ones. `ZORDER BY` co-locates related values in the same files so data skipping works for filters on those columns (liquid clustering is the newer, more flexible alternative). `VACUUM` deletes data files no longer referenced by the log and older than the retention (default 7 days). Lowering retention below that breaks time travel and can break long-running readers.' },
        { q: 'Auto Loader vs COPY INTO?', a: 'Auto Loader (`cloudFiles`) discovers new files incrementally using directory listing or file notifications, scales to millions of files, tracks progress in a checkpoint and supports schema inference and evolution. `COPY INTO` is an idempotent SQL command that skips files already loaded, simpler for smaller or occasional loads. I use Auto Loader for continuous or large ingestion.' },
        { q: 'Job cluster vs all-purpose cluster, and how do you control cost?', a: 'All-purpose clusters are shared and interactive and cost more per DBU. Job clusters start for a run and terminate afterward, with lower DBU rates, which suits production. Reduce cost with auto-termination, autoscaling, spot instances for workers, cluster policies, instance pools, serverless compute, and right-sizing from the Spark UI.' },
        { q: 'What is Unity Catalog and why use it?', a: 'It is the central governance layer: one metastore across workspaces with a three-level namespace, SQL grants on catalogs, schemas, tables and volumes, row filters and column masks, lineage and audit. It uses storage credentials and external locations to control access to ADLS without distributing keys. It replaces per-workspace Hive metastores and mount-based access.' },
        { q: 'How do you securely access ADLS from Databricks?', a: 'Create an Azure Databricks access connector (managed identity), give it a Storage Blob Data role on the storage account, register it as a Unity Catalog storage credential and define external locations. Users then get table or volume grants and never see keys. Without Unity Catalog, use a service principal with OAuth and a Key Vault-backed secret scope. Avoid storage account keys and DBFS mounts.' },
        { q: 'Should you partition Delta tables?', a: 'Often not. Databricks guidance is to avoid partitioning tables under about 1 TB, because partitions create many small files and add little over data skipping. Partition only large tables on a low-cardinality column used in filters, such as date. Otherwise use Z-ORDER or liquid clustering.' },
        { q: 'A Databricks job got slower. How do you debug it?', a: 'Open the Spark UI. Look for skewed tasks (a few tasks far longer than the median), large shuffles and spills, too many small files or tiny tasks, missed broadcast joins, repeated reads that need caching, and Python UDFs. Check that adaptive query execution is on, use `OPTIMIZE`, fix the skewed key (salting or skew hints), broadcast small tables and resize the cluster last.' },
        { q: 'How does Structured Streaming achieve reliability?', a: 'A checkpoint stores source offsets and state. After a failure the query resumes from the checkpoint, and with a replayable source plus an idempotent or transactional sink such as Delta, results are effectively exactly-once. Use watermarks to bound state and drop very late data, and the `availableNow` trigger to run streaming code as an incremental batch.' },
        { q: 'What are Delta Live Tables?', a: 'A declarative pipeline framework: you define tables or views with SQL or Python and DLT manages dependencies, orchestration, retries and infrastructure. Data quality expectations can warn, drop or fail on bad rows. It reduces boilerplate for medallion pipelines. It is now part of the Lakeflow product family, so check current naming.' }
      ]
    },
    {
      id: 'synapse', name: 'Azure Synapse Analytics', priority: 'must', short: 'Warehouse (dedicated SQL pool), serverless SQL and Spark in one workspace.',
      overview: 'Synapse combines a dedicated SQL pool (MPP data warehouse), a serverless SQL pool (query files in the lake, pay per TB), Apache Spark pools and ADF-style pipelines. Microsoft now positions Microsoft Fabric as its next-generation analytics platform, but Synapse remains widely used and is common in interviews.',
      whenToUse: ['Dedicated pool: governed star-schema warehouse with many concurrent BI users.', 'Serverless pool: ad-hoc SQL over Parquet, CSV or Delta in ADLS without loading.', 'Spark pool: lake processing inside the same workspace.'],
      concepts: ['Dedicated SQL pool spreads data over 60 distributions: hash, round-robin or replicated.', 'Clustered columnstore index (CCI) is the default and best for large fact tables.', 'Scale with DWUs; pause the pool when idle (compute billing stops).', '`COPY INTO` and PolyBase load from ADLS; `CTAS` creates tables in parallel.', 'Serverless: `OPENROWSET`, external tables, `CETAS`, pay per data processed.', 'Workload management: resource classes and workload groups.'],
      useCases: ['Enterprise data warehouse for Power BI', 'Logical data warehouse over the lake', 'Loading ADLS Parquet into star schemas'],
      examples: [
        { title: 'Hash-distributed fact table with a columnstore index', lang: 'sql', code: `CREATE TABLE dbo.FactSales
(
  SaleId BIGINT NOT NULL, CustomerKey INT NOT NULL,
  DateKey INT NOT NULL, Amount DECIMAL(12,2)
)
WITH (
  DISTRIBUTION = HASH(CustomerKey),
  CLUSTERED COLUMNSTORE INDEX
);` },
        { title: 'Parallel load from the lake', lang: 'sql', code: `COPY INTO dbo.StgSales
FROM 'https://acct.dfs.core.windows.net/curated/sales/*.parquet'
WITH (FILE_TYPE = 'PARQUET', CREDENTIAL = (IDENTITY = 'Managed Identity'));` },
        { title: 'Query the lake with the serverless pool', lang: 'sql', code: `SELECT TOP 10 *
FROM OPENROWSET(
  BULK 'https://acct.dfs.core.windows.net/curated/sales/year=2025/*/*.parquet',
  FORMAT = 'PARQUET') AS r;` }
      ],
      pricing: 'Dedicated: per DWU-hour while running (pause to stop). Serverless: per TB of data processed. Spark pools: per vCore-hour. Storage billed separately.',
      tips: ['Load into a round-robin staging table, then CTAS into the final distribution.', 'Hash on a high-cardinality join column; never on a date or a nullable column.', 'Update statistics after big loads.', 'Pause dedicated pools outside business hours.'],
      related: ['adls', 'adf', 'databricks', 'fabric', 'entra-rbac'],
      interview: [
        { q: 'Dedicated SQL pool vs serverless SQL pool vs Spark pool?', a: 'Dedicated is a provisioned MPP warehouse with local storage, best for repeated, high-concurrency BI on modeled data. Serverless has no infrastructure and charges per TB processed, best for ad-hoc exploration and light logical warehouse layers over lake files. Spark pools run notebooks and large transformations. I choose by workload: load and model in dedicated, explore in serverless, transform in Spark or Databricks.' },
        { q: 'How do you choose a distribution type in a dedicated pool?', a: 'The pool has 60 distributions. Hash distributes rows by a column so equal values land together; choose a high-cardinality column used in joins or group by, avoid dates and columns with many nulls, and avoid skew. Round-robin spreads evenly with no key, good for staging. Replicated keeps a full copy on each compute node, good for small dimensions (roughly under 2 GB). Matching hash keys on joined tables avoids data movement.' },
        { q: 'Why is CTAS preferred over INSERT ... SELECT or SELECT INTO?', a: '`CREATE TABLE AS SELECT` is a minimally logged, fully parallel operation that lets you set the distribution and index in the same statement. It is faster and also the standard way to rewrite a table with a different distribution or to implement upserts by swapping tables.' },
        { q: 'What makes columnstore performance good or bad?', a: 'Columnstore compresses data into row groups. Quality is best when row groups are near 1 million rows. With 60 distributions, a partition needs about 60 million rows to fill them, so over-partitioning small tables creates poor row groups. Trickle inserts and heavy updates create open or deleted rows; rebuild the index to fix. Small tables may be better as heap or clustered index.' },
        { q: 'A query is slow in a dedicated pool. What do you check?', a: 'Use the DMVs (`sys.dm_pdw_exec_requests`, `sys.dm_pdw_request_steps`) to find the slow step. Look for data movement steps such as shuffle or broadcast, which signal mismatched distributions; data skew across distributions; missing or stale statistics (`UPDATE STATISTICS`); poor columnstore health; and queueing from resource class or workload group limits. Then fix distribution, statistics or workload settings.' },
        { q: 'How do you control cost with serverless SQL?', a: 'It bills by data processed, so use Parquet or Delta rather than CSV, select only needed columns, filter on partition folders (`filepath()` or Delta partitions), and create external tables or views on top. `CETAS` can materialize frequent aggregates into smaller files.' },
        { q: 'Synapse vs Databricks vs Fabric: how do you choose?', a: 'Databricks is strongest for code-first Spark, streaming, ML and Delta. Synapse fits SQL-centric teams that need a dedicated warehouse or serverless SQL. Fabric bundles lakehouse, warehouse, pipelines and Power BI on OneLake with a capacity model and is where Microsoft is investing for new projects. The decision depends on skills, existing estate, governance needs and cost model.' }
      ]
    },
    {
      id: 'fabric', name: 'Microsoft Fabric', priority: 'imp', short: 'Unified SaaS analytics platform on OneLake.',
      overview: 'Fabric packages data engineering, data warehousing, real-time analytics, data science and Power BI into one SaaS product. All data is stored in OneLake as Delta Parquet, billed against shared capacity.',
      whenToUse: ['Microsoft-centric organizations that want a single product and tight Power BI integration.', 'New analytics projects that would otherwise combine Synapse, Data Factory and Power BI.'],
      concepts: ['OneLake: one logical data lake per tenant; all items store Delta tables.', 'Lakehouse (Spark, files and tables) and Warehouse (T-SQL), both over OneLake.', 'Shortcuts: reference data in ADLS, S3 or other lakehouses without copying.', 'Data Factory pipelines and Dataflow Gen2; notebooks; Eventstream and KQL databases for real time.', 'Direct Lake: Power BI reads Delta files directly with import-like speed.', 'Capacity (F SKUs) in capacity units, with smoothing and throttling.'],
      useCases: ['End-to-end medallion lakehouse with Power BI', 'Unifying data across clouds using shortcuts'],
      examples: [
        { title: 'Read a lakehouse table in a Fabric notebook', lang: 'python', code: `df = spark.read.table("sales_lakehouse.orders")
daily = df.groupBy("order_date").sum("amount")
daily.write.mode("overwrite").format("delta").saveAsTable("gold_daily_sales")` }
      ],
      pricing: 'Capacity-based: you buy an F SKU (capacity units) shared across all workloads, billed per hour or reserved. OneLake storage is billed separately.',
      tips: ['Monitor capacity usage; heavy jobs can throttle everyone sharing it.', 'Use shortcuts instead of copying data.', 'Product features change quickly, so check current documentation.'],
      related: ['synapse', 'databricks', 'adls', 'purview'],
      interview: [
        { q: 'What is OneLake and what are shortcuts?', a: 'OneLake is the single logical lake that comes with a Fabric tenant, storing everything as open Delta Parquet. A shortcut is a pointer to data elsewhere (another lakehouse, ADLS Gen2, S3), so it appears in the lakehouse without being copied.' },
        { q: 'Lakehouse vs Warehouse in Fabric?', a: 'The lakehouse is Spark-first, handles files and Delta tables and suits engineers and data scientists. The warehouse is T-SQL-first with full DML and suits SQL developers. Both store Delta in OneLake, and each can query the other.' },
        { q: 'What is Direct Lake mode?', a: 'A Power BI semantic model mode that loads column data directly from Delta files in OneLake into memory on demand. It avoids a separate import refresh and avoids the per-query latency of DirectQuery.' },
        { q: 'How does Fabric compare with Synapse?', a: 'Fabric is SaaS with shared capacity, OneLake and deeper Power BI integration, and is the platform Microsoft is evolving for new work. Synapse is PaaS with separate pools you size and pause. Existing Synapse workloads are still supported; migration decisions depend on features needed and effort.' }
      ]
    },
    {
      id: 'event-hubs', name: 'Azure Event Hubs', priority: 'must', short: 'High-throughput event streaming platform (Kafka compatible).',
      overview: 'Event Hubs ingests millions of events per second into partitioned, ordered logs that several consumer groups can read independently. It also exposes a Kafka endpoint, and Capture can write the stream to ADLS automatically.',
      whenToUse: ['Telemetry, clickstream, logs and CDC events.', 'Feeding Stream Analytics, Databricks or Functions.', 'Kafka applications that you do not want to run yourself.'],
      concepts: ['Namespace contains event hubs; each event hub has partitions.', 'Partition key keeps related events in one partition and in order.', 'Consumer group: an independent view of the stream.', 'Throughput units (Standard: 1 MB/s or 1,000 events/s in and 2 MB/s out each), processing units (Premium), capacity units (Dedicated); auto-inflate.', 'Retention: 1 to 7 days on Standard, longer on Premium and Dedicated.', 'Capture: automatic Avro files to ADLS or Blob. Checkpoints are stored in Blob storage by SDK consumers.'],
      useCases: ['Real-time clickstream into Delta tables', 'Archiving raw events to ADLS with Capture', 'Kafka migration without managing brokers'],
      examples: [
        { title: 'Send events with managed identity (Python)', lang: 'python', code: `import json
from azure.eventhub import EventHubProducerClient, EventData
from azure.identity import DefaultAzureCredential

producer = EventHubProducerClient(
    fully_qualified_namespace="myns.servicebus.windows.net",
    eventhub_name="clicks",
    credential=DefaultAzureCredential())

with producer:
    batch = producer.create_batch(partition_key="user-1")
    batch.add(EventData(json.dumps({"page": "/home"})))
    producer.send_batch(batch)` },
        { title: 'Read the stream in Databricks (Kafka endpoint)', lang: 'python', code: `df = (spark.readStream.format("kafka")
  .option("kafka.bootstrap.servers", "myns.servicebus.windows.net:9093")
  .option("subscribe", "clicks")
  .option("kafka.security.protocol", "SASL_SSL")
  .option("kafka.sasl.mechanism", "PLAIN")
  .option("kafka.sasl.jaas.config", jaas_config)   # built from a secret in Key Vault
  .load())` }
      ],
      pricing: 'Per throughput unit-hour (Standard), processing unit (Premium) or capacity unit (Dedicated), plus per million ingress events and Capture hours.',
      tips: ['Choose a partition key with many distinct values.', 'Pick enough partitions up front; on Standard the count is fixed after creation.', 'Make consumers idempotent; delivery is at least once.', 'Enable Capture for a cheap raw archive and replay source.'],
      related: ['stream-analytics', 'databricks', 'adls', 'functions', 'service-bus'],
      interview: [
        { q: 'How do partitions and consumer groups work?', a: 'Events with the same partition key go to the same partition and stay ordered there; there is no order across partitions. Each consumer group reads the whole stream independently, with its own offsets. Inside a group, each partition is read by one consumer at a time, so parallelism is limited by partition count.' },
        { q: 'Event Hubs vs Service Bus vs Event Grid?', a: 'Event Hubs is a stream for high-volume telemetry with replay and many readers. Service Bus is an enterprise message broker for commands and business messages with queues, topics, sessions, dead-lettering and per-message settlement. Event Grid routes discrete events (a blob was created) to handlers with push delivery. Streams use Event Hubs, transactional workflows use Service Bus, reactive notifications use Event Grid.' },
        { q: 'How do you scale Event Hubs and avoid hot partitions?', a: 'Scale ingress with more throughput or processing units (auto-inflate raises TUs automatically). Parallelism comes from partitions, which cannot be changed after creation on Standard, so plan for peak consumer parallelism. Avoid hot partitions with a high-cardinality partition key, or no key at all if order does not matter.' },
        { q: 'What delivery guarantee does it give and how do consumers handle it?', a: 'At least once. Consumers checkpoint their position (SDK processors store it in Blob storage), and after a restart they resume from the last checkpoint, so some events can be seen twice. Handle that with idempotent writes or deduplication on an event id, and checkpoint after processing, not before.' },
        { q: 'What is Event Hubs Capture?', a: 'A built-in feature that writes the stream to ADLS or Blob as Avro files on a time or size window, with no code. It gives a cheap, durable raw archive for replay and batch analytics. Files follow a path pattern with namespace, event hub, partition and time.' },
        { q: 'How do you use Kafka applications with it?', a: 'Standard tier and above expose a Kafka-compatible endpoint on port 9093. Point existing producers and consumers at the namespace and authenticate with SASL (connection string or OAuth). A Kafka topic maps to an event hub and a Kafka consumer group to an Event Hubs consumer group.' }
      ]
    },
    {
      id: 'stream-analytics', name: 'Azure Stream Analytics', priority: 'imp', short: 'Serverless real-time SQL queries over streams.',
      overview: 'Stream Analytics runs continuous SQL-like queries over Event Hubs, IoT Hub or Blob input and writes results to outputs such as ADLS, SQL, Cosmos DB or Power BI. It handles windowing and late events without servers to manage.',
      whenToUse: ['Simple to medium real-time aggregation, filtering and alerting with SQL skills.', 'Complex stateful logic, ML or code reuse points to Databricks or Flink.'],
      concepts: ['Job: input, query, output.', 'Windows: tumbling, hopping, sliding, session, snapshot.', '`TIMESTAMP BY` uses event time instead of arrival time.', 'Late arrival and out-of-order policies.', 'Streaming units (SU) measure compute; partition-aligned queries scale out.', 'Reference data joins from Blob or SQL.'],
      useCases: ['Per-minute counts and averages for a dashboard', 'Threshold alerts from IoT telemetry'],
      examples: [
        { title: 'Count events per page in 1-minute tumbling windows', lang: 'sql', code: `SELECT
  page,
  COUNT(*) AS views,
  System.Timestamp() AS window_end
INTO dashboardOutput
FROM clicks TIMESTAMP BY eventTime
PARTITION BY PartitionId
GROUP BY page, PartitionId, TumblingWindow(minute, 1)` }
      ],
      pricing: 'Per streaming unit-hour while the job runs, or a cluster-based model for dedicated capacity.',
      tips: ['Keep the query partitioned end to end (embarrassingly parallel) so SUs scale.', 'Set late arrival and out-of-order tolerance deliberately.', 'Monitor watermark delay and SU utilization.'],
      related: ['event-hubs', 'adls', 'databricks', 'cosmos-db'],
      interview: [
        { q: 'Name the window types and when you use each.', a: 'Tumbling: fixed, non-overlapping intervals (counts per minute). Hopping: fixed size that slides by a smaller hop, so windows overlap (a 10-minute average updated every minute). Sliding: emits only when events enter or leave the window. Session: groups events separated by gaps shorter than a timeout (user sessions). Snapshot: groups events with the same timestamp.' },
        { q: 'How does it handle late and out-of-order events?', a: 'You choose event time with `TIMESTAMP BY` and set a late arrival tolerance and an out-of-order tolerance. Events within tolerance are placed in the right window (adding output delay); events beyond it are adjusted or dropped. Larger tolerances improve accuracy but delay results.' },
        { q: 'Stream Analytics vs Databricks Structured Streaming?', a: 'Stream Analytics is low-code SQL with fast setup, ideal for straightforward windows, joins and routing. Databricks suits complex logic, custom code, ML, large state, Delta merges and unified batch plus streaming. I pick Stream Analytics for simple operational pipelines and Databricks for the core lakehouse.' },
        { q: 'What delivery guarantee does Stream Analytics provide?', a: 'Exactly-once processing of events and at-least-once delivery to outputs. Some sinks can see duplicates after a restart, so design idempotent outputs (upsert on a key).' }
      ]
    },
    {
      id: 'purview', name: 'Microsoft Purview', priority: 'imp', short: 'Data catalog, classification and lineage.',
      overview: 'Purview scans data sources to build a catalog (Data Map), classifies sensitive data, tracks lineage from tools like ADF, Synapse and Databricks, and provides a business glossary and governance policies.',
      whenToUse: ['Finding and understanding data across the estate.', 'Detecting PII and applying sensitivity labels.', 'Showing lineage for audits and impact analysis.'],
      concepts: ['Data Map: metadata about assets from scanned sources.', 'Scans and classification rules (built-in and custom).', 'Business glossary and collections for organizing and access.', 'Lineage: from ADF, Synapse, Databricks and Fabric runs.', 'Sensitivity labels and data policies.'],
      useCases: ['PII discovery before sharing a dataset', 'Impact analysis before changing a table'],
      pricing: 'Based on Data Map capacity units and scan compute, with additional charges for governance features.',
      tips: ['Scan on a schedule and review classification results with data owners.', 'Assign glossary terms to critical columns.', 'Use Unity Catalog for Databricks access control and Purview for estate-wide discovery.'],
      related: ['adf', 'databricks', 'synapse', 'adls'],
      interview: [
        { q: 'What problems does Purview solve for a data engineer?', a: 'It makes data discoverable (catalog and glossary), identifies sensitive data with classifiers so it can be protected, and shows end-to-end lineage so you can see which pipelines and reports depend on a table before changing it.' },
        { q: 'Purview vs Unity Catalog?', a: 'Unity Catalog governs and enforces access inside Databricks (grants, masks, lineage across notebooks and jobs). Purview is an estate-wide catalog across many systems for discovery, classification and policy. They complement each other, and Purview can scan Unity Catalog metadata.' },
        { q: 'How does lineage get captured?', a: 'Supported services push lineage when pipelines run, for example ADF Copy and Data Flow activities and Databricks jobs, and Purview connects it to the scanned assets. Custom or unsupported processes need the Atlas API to register lineage.' }
      ]
    }
  ]
});
