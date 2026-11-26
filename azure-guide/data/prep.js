GUIDE.add({
  id: 'prep', title: 'Interview Prep', order: 0,
  services: [
    {
      id: 'prep-guide', name: 'How to prepare', short: 'What a 4-year Azure data engineer is expected to know, and a study order.',
      sections: [
        {
          title: 'What interviewers expect at 4 years',
          list: [
            'You have owned pipelines end to end: ingestion, transformation, orchestration, monitoring and support.',
            'You explain trade-offs. "Why Databricks for this step and not a data flow?" matters more than definitions.',
            'You can debug slow Spark jobs, failed ADF runs, skew, small files, schema drift and duplicates.',
            'You think about identity, networking, cost and data quality without being asked.',
            'You can design a pipeline on a whiteboard from requirements and size it with rough numbers.'
          ]
        },
        {
          title: 'Typical interview rounds',
          table: {
            head: ['Round', 'What is tested', 'Where to practice here'],
            rows: [
              ['SQL and Python / PySpark', 'Window functions, joins, dedupe, PySpark transformations, Delta MERGE', 'Databricks page for Delta. Practice SQL and PySpark separately.'],
              ['Azure service depth', 'ADF, Databricks, ADLS, Synapse, Event Hubs, RBAC', 'Service pages and "All interview Q&A"'],
              ['System design', 'Batch, streaming and lakehouse architectures', 'Design pages in this section'],
              ['Project deep dive', 'Your real pipelines, decisions, failures, numbers', 'Section below'],
              ['Behavioral', 'Ownership, incident handling, working with stakeholders', 'Section below']
            ]
          }
        },
        {
          title: 'Study order (about 3 to 4 weeks)',
          ordered: true,
          list: [
            'Week 1: ADLS Gen2 (layout, RBAC vs ACLs, tiers), Entra ID and managed identities, ADF (pipelines, IRs, triggers, incremental load).',
            'Week 2: Databricks and Delta Lake (MERGE, OPTIMIZE, Auto Loader, Unity Catalog, streaming), Spark tuning.',
            'Week 3: Synapse (dedicated vs serverless, distributions), Fabric basics, Event Hubs and Stream Analytics, Key Vault, networking.',
            'Week 4: Design pages, comparisons, scenario questions, then mock interviews out loud.'
          ]
        },
        {
          title: 'A framework for any design question',
          ordered: true,
          list: [
            'Clarify: sources, volume per day, growth, latency (batch, near real time, real time), consumers, SLA, budget, compliance.',
            'Ingest: how data arrives (files, CDC, API, events) and the landing zone.',
            'Store: bronze, silver and gold in ADLS Gen2 with Delta; partitioning and file sizes.',
            'Process: engine choice (Databricks, Synapse, Fabric, ADF data flows, Stream Analytics) and why.',
            'Serve: who queries it and with what (Synapse, Databricks SQL, Power BI, APIs).',
            'Operate: orchestration, retries, idempotency, monitoring, alerting, data quality.',
            'Secure and optimize: managed identities, private endpoints, Unity Catalog or Purview, PII handling, cost levers.'
          ]
        },
        {
          title: 'Talking about your projects',
          text: 'Prepare three stories with numbers. For each: the business problem, the architecture and why you chose it, your own contribution, one hard problem and how you solved it, and the measured result.',
          list: [
            'Know your numbers: daily volume, row counts, runtimes before and after, cost saved, SLA met, number of consumers.',
            'Prepare one failure or incident: what broke, how you found it, the fix and what you changed so it does not repeat.',
            'Prepare one optimization story, such as cutting a Databricks job from 2 hours to 25 minutes by fixing small files and skew.',
            'Be clear about what you did yourself versus what the team did.'
          ]
        },
        {
          title: 'Good questions to ask the interviewer',
          list: [
            'Which platform is the center: Databricks, Synapse or Fabric, and is a migration planned?',
            'How are pipelines tested and deployed (CI/CD, IaC)?',
            'How are data quality failures detected and who owns them?',
            'What does on-call look like for the data platform?'
          ]
        }
      ]
    },
    {
      id: 'compare', name: 'Service comparisons', short: 'Side-by-side tables, including an AWS to Azure mapping.',
      sections: [
        {
          title: 'AWS to Azure service mapping',
          table: {
            head: ['Purpose', 'AWS', 'Azure'],
            rows: [
              ['Object / lake storage', 'S3', 'ADLS Gen2 / Blob Storage'],
              ['ETL orchestration and movement', 'Glue workflows, Step Functions, MWAA', 'Data Factory (or Synapse / Fabric pipelines)'],
              ['Spark ETL', 'Glue, EMR', 'Databricks, Synapse Spark, Fabric'],
              ['Data warehouse', 'Redshift', 'Synapse dedicated SQL pool, Fabric Warehouse'],
              ['Query files in lake', 'Athena', 'Synapse serverless SQL, Databricks SQL'],
              ['Streaming ingest', 'Kinesis Data Streams, MSK', 'Event Hubs (Kafka endpoint)'],
              ['Stream processing', 'Managed Service for Apache Flink', 'Stream Analytics, Databricks Structured Streaming'],
              ['Queue / pub-sub', 'SQS, SNS', 'Service Bus, Storage Queues'],
              ['Event routing', 'EventBridge', 'Event Grid'],
              ['Serverless functions', 'Lambda', 'Functions'],
              ['NoSQL', 'DynamoDB', 'Cosmos DB'],
              ['Relational', 'RDS, Aurora', 'Azure SQL Database, Azure Database for PostgreSQL / MySQL'],
              ['Data catalog and governance', 'Glue Data Catalog, Lake Formation', 'Purview, Unity Catalog'],
              ['Identity', 'IAM roles', 'Entra ID, RBAC, managed identity'],
              ['Secrets / keys', 'Secrets Manager, KMS', 'Key Vault'],
              ['Monitoring', 'CloudWatch, CloudTrail', 'Azure Monitor, Log Analytics, Activity Log'],
              ['Infrastructure as code', 'CloudFormation, CDK', 'Bicep / ARM, Terraform']
            ]
          }
        },
        {
          title: 'Processing: ADF vs Databricks vs Synapse vs Fabric',
          table: {
            head: ['', 'Data Factory', 'Databricks', 'Synapse', 'Fabric'],
            rows: [
              ['Role', 'Orchestration and data movement', 'Spark and Delta lakehouse compute', 'Warehouse, serverless SQL, Spark, pipelines', 'Unified SaaS analytics on OneLake'],
              ['Best for', 'Copy, schedule, dependencies', 'Heavy transformation, streaming, ML', 'SQL-centric warehouse and lake queries', 'Microsoft-centric end to end with Power BI'],
              ['Code style', 'Low-code, JSON', 'PySpark, Scala, SQL', 'T-SQL, Spark', 'T-SQL, Spark, low-code'],
              ['Cost model', 'Per activity, DIU, data flow vCore-hour', 'DBUs + VMs', 'DWU-hours, per TB, vCore-hours', 'Capacity units']
            ]
          }
        },
        {
          title: 'Messaging: Event Hubs vs Service Bus vs Event Grid vs Storage Queues',
          table: {
            head: ['', 'Event Hubs', 'Service Bus', 'Event Grid', 'Storage Queues'],
            rows: [
              ['Pattern', 'Partitioned stream, replay', 'Broker: queues and topics', 'Event routing, push', 'Simple queue'],
              ['Ordering', 'Per partition', 'Sessions (FIFO per session)', 'Not guaranteed', 'Best effort'],
              ['Replay', 'Yes within retention', 'No', 'No', 'No'],
              ['Use when', 'Telemetry, logs, CDC at high volume', 'Business messages, workflows', 'Reacting to Azure resource events', 'Cheap, huge, simple queues']
            ]
          }
        },
        {
          title: 'Serving data: Synapse dedicated vs serverless vs Databricks SQL vs Azure SQL vs Cosmos DB',
          table: {
            head: ['', 'Synapse dedicated', 'Synapse serverless', 'Databricks SQL', 'Azure SQL', 'Cosmos DB'],
            rows: [
              ['Type', 'MPP warehouse', 'Query engine on lake files', 'SQL warehouse on Delta', 'Relational OLTP', 'NoSQL by key'],
              ['Best for', 'Repeated BI on modeled data', 'Ad-hoc exploration', 'Lakehouse BI and SQL', 'Transactions, small marts', 'Millisecond lookups'],
              ['Billing', 'DWU-hour', 'Per TB processed', 'DBU per hour', 'vCore or DTU', 'RU/s']
            ]
          }
        },
        {
          title: 'Orchestration: ADF vs Databricks Workflows vs Airflow vs Logic Apps',
          table: {
            head: ['', 'ADF', 'Databricks Workflows', 'Airflow (self-hosted or managed)', 'Logic Apps'],
            rows: [
              ['Strength', 'Many connectors, copy, triggers', 'Native to Databricks tasks and DLT', 'Code-based DAGs, backfills, portability', 'App and SaaS integration workflows'],
              ['Weakness', 'Complex logic is clumsy in JSON', 'Mostly Databricks tasks', 'Extra platform to run', 'Not a data movement engine']
            ]
          }
        },
        {
          title: 'Storage redundancy and tiers',
          table: {
            head: ['Option', 'Meaning', 'Typical use'],
            rows: [
              ['LRS', '3 copies in one datacenter', 'Dev/test, rebuildable data'],
              ['ZRS', '3 copies across zones in one region', 'Production with zone resilience'],
              ['GRS / GZRS', 'Plus async copy in a paired region', 'Disaster recovery'],
              ['Hot / Cool / Cold', 'Frequent / infrequent (30 d) / rare (90 d) access', 'Lifecycle by age'],
              ['Archive', 'Offline, 180 d minimum, hours to rehydrate', 'Compliance archive']
            ]
          }
        },
        {
          title: 'Table formats',
          text: 'Delta Lake is the default on Azure (Databricks, Fabric OneLake, Synapse Spark and serverless reads). Iceberg and Hudi exist, and Databricks and Fabric are adding interoperability, but be ready to explain Delta first: transaction log, `MERGE`, time travel, `OPTIMIZE`, `VACUUM`.'
        }
      ]
    },
    {
      id: 'design-batch', name: 'Design: batch ETL pipeline', short: 'On-premises database and partner files into a curated lakehouse by 7 AM.',
      sections: [
        { title: 'Scenario', text: '"Design a daily pipeline that ingests sales data from an on-premises SQL Server and partner CSV files, cleans it, and gives analysts curated tables by 7 AM. Volume is about 200 GB a day."' },
        {
          title: 'Architecture',
          code: { lang: 'text', code: `On-prem SQL Server --(ADF self-hosted IR, incremental Copy)--> ADLS raw (bronze, Parquet)
Partner SFTP/CSV   --(ADF Copy or storage event trigger)----> ADLS raw
                                   |
                     Databricks job (Delta, MERGE, quality checks)
                                   |
                     ADLS silver (cleaned Delta) --> gold (marts, Delta)
                                   |
        Synapse dedicated/serverless or Databricks SQL --> Power BI

 Orchestration: ADF master pipeline (tumbling window trigger, retries)
 Security: managed identities, Key Vault, private endpoints
 Governance: Unity Catalog + Purview
 Monitoring: Log Analytics KQL alerts, freshness checks` }
        },
        {
          title: 'Key decisions to explain',
          list: [
            'ADF for movement and orchestration; Databricks for transformation, because logic and volume suit Spark and Delta.',
            'Watermark or CDC for incremental extraction from SQL Server through a self-hosted IR (scaled to several nodes).',
            '`Bronze` keeps data as received, partitioned by load date, so any day can be replayed.',
            'Silver applies schema, deduplication and type fixes; `MERGE` into Delta keeps loads idempotent.',
            'Data quality gate between layers (Delta Live Tables expectations, Great Expectations or custom checks). Quarantine bad rows and alert.',
            'Tumbling window trigger for reliable, backfillable daily windows; an alert if the 7 AM SLA is at risk.',
            'Run on job clusters or serverless with spot workers to control cost.'
          ]
        },
        {
          title: 'Numbers to mention',
          list: [
            '200 GB of CSV becomes about 40 to 60 GB as compressed Parquet or Delta (varies by data).',
            'Target file size 128 MB to 1 GB; run `OPTIMIZE` regularly.',
            'Validate cluster size with a test run on a full day of data before promising the SLA.'
          ]
        }
      ],
      interview: [
        { q: 'How do you make the pipeline idempotent?', a: 'Process one logical window per run. Bronze writes to a path keyed by the window, silver uses `MERGE` on the business key (or overwrites one partition), and watermarks advance only after success. Rerunning a window gives the same result with no duplicates.' },
        { q: 'A partner sends a corrected file for yesterday. What happens?', a: 'The event or manual run reprocesses that date. Bronze stores the new file beside the old with its load time, silver `MERGE` applies the changes, and gold marts for that date are rebuilt. Delta time travel lets you compare before and after, and consumers are notified of the restatement.' },
        { q: 'The source adds a column. How does the pipeline react?', a: 'Bronze stores the raw file untouched. Delta schema evolution (`mergeSchema` or Auto Loader schema evolution) can add the new column in a controlled way, while a schema check alerts on unexpected changes. Type changes or removed columns fail the run so a person decides.' },
        { q: 'How would you cut the cost of this pipeline?', a: 'Use job clusters or serverless with spot workers and autoscaling, compact files and use Parquet or Delta, avoid mapping data flows for heavy work, use lifecycle rules to cool or delete old raw data, pause dedicated SQL pools off hours, and right-size from Spark UI metrics.' }
      ],
      related: ['adf', 'databricks', 'adls', 'synapse', 'key-vault']
    },
    {
      id: 'design-streaming', name: 'Design: real-time streaming pipeline', short: 'Clickstream events to a live dashboard and the lakehouse.',
      sections: [
        { title: 'Scenario', text: '"Design a pipeline for website clickstream events, about 20,000 events per second at peak. Product needs a dashboard updated within a minute, and analysts need the full history in the lake."' },
        {
          title: 'Architecture',
          code: { lang: 'text', code: `Web/App --> Event Hubs (partitioned by session or user)
                |
   +------------+-------------------------+
   |                                      |
 Capture (Avro to ADLS, raw archive)   Databricks Structured Streaming / Stream Analytics
                                          |  (enrich, window, dedupe)
                          +---------------+----------------+
                          |                                |
                 Delta tables (silver/gold)        Power BI streaming / Cosmos DB / SQL
                          |                                |
                 Databricks SQL / Synapse           Live dashboard (< 1 min)

 Errors: bad events to a dead-letter Delta table; alerts via Azure Monitor` }
        },
        {
          title: 'Sizing',
          list: [
            'Assume 1 KB per event: about 20 MB/s ingress.',
            'A Standard throughput unit takes 1 MB/s or 1,000 events/s, so about 20 TUs at peak. Use auto-inflate or Premium/Dedicated for headroom.',
            'Partitions set consumer parallelism and cannot be changed on Standard, so create enough (for example 32).'
          ]
        },
        {
          title: 'Key decisions to explain',
          list: [
            'Event Hubs (managed, Kafka compatible) as the ingestion buffer, with Capture as a raw archive for replay.',
            'High-cardinality partition key to avoid hot partitions.',
            'Databricks Structured Streaming for stateful logic and Delta sinks; Stream Analytics when the logic is simple SQL windows.',
            'Event time with watermarks for late and out-of-order events.',
            'Idempotent sinks (Delta `MERGE` on event id) because delivery is at least once.',
            'Checkpoints for restart, plus alerts on consumer lag and watermark delay.'
          ]
        }
      ],
      interview: [
        { q: 'How do you avoid hot partitions?', a: 'Pick a partition key with many evenly distributed values (user or session id), or send without a key if order is not needed. Watch per-partition throughput metrics and increase partitions at design time, since Standard cannot add them later.' },
        { q: 'How do you get exactly-once results?', a: 'The platform is at least once, so make the sink idempotent: a stable event id and a Delta `MERGE` (or `dropDuplicatesWithinWatermark`). Structured Streaming checkpoints give effectively exactly-once to Delta because commits are atomic and tied to offsets.' },
        { q: 'How do you handle late events?', a: 'Aggregate on event time, set a watermark for how late data may be, keep state until the watermark passes, and send anything later to a side table. A periodic batch recompute from the raw archive corrects older windows.' },
        { q: 'Consumers are falling behind. What do you check?', a: 'Compare incoming and processing rates, check partition skew, cluster size and batch duration, downstream sink latency and throttling, and checkpoint or state size. Fix with more cores, optimized writes, larger micro-batches, repartitioning or scaling the sink.' },
        { q: 'Why not stream directly into a warehouse row by row?', a: 'Warehouses are efficient with batches. Land micro-batches in Delta in the lake and let the warehouse or SQL engine read from there, or use a service designed for streaming ingestion.' }
      ],
      related: ['event-hubs', 'databricks', 'stream-analytics', 'adls', 'cosmos-db']
    },
    {
      id: 'design-lakehouse', name: 'Design: enterprise lakehouse', short: 'Medallion layers, governance and serving for many teams.',
      sections: [
        { title: 'Scenario', text: '"Design a central data platform for a company with several business units. It must support BI, data science and ad-hoc analysis, with PII controls and cost visibility."' },
        {
          title: 'Architecture',
          code: { lang: 'text', code: `Sources: SQL/ERP (ADF CDC), SaaS APIs, events (Event Hubs), files
   |
   v
ADLS Gen2:  bronze (raw)  -->  silver (cleaned Delta)  -->  gold (marts)
   |                 Databricks / Fabric transformations, orchestrated by ADF or Workflows
   |
Governance: Unity Catalog (access, lineage)  +  Purview (estate-wide catalog, classification)
Security:   Entra groups, managed identities, Key Vault, private endpoints
   |
Serving: Databricks SQL / Synapse / Fabric  -->  Power BI   |   ML (Databricks ML, Azure ML)
Operations: Azure Monitor, cost tags, budgets, CI/CD with Bicep/Terraform` }
        },
        {
          title: 'Key decisions to explain',
          list: [
            'Medallion layers with ownership and quality rules per layer; Delta as the table format.',
            'Separate storage accounts or containers per zone and per sensitivity, with RBAC and ACLs aligned to Entra groups.',
            'Unity Catalog metastore shared by workspaces; storage credentials through managed identity; row filters and column masks for PII.',
            'Purview scans for classification and lineage across the whole estate.',
            'Hub-and-spoke network, private endpoints, no public access to storage.',
            'Cost control with tags, budgets and alerts, cluster policies, serverless and spot, lifecycle rules.',
            'Everything deployed through IaC and CI/CD per environment.'
          ]
        }
      ],
      interview: [
        { q: 'Data lake, data warehouse or lakehouse?', a: 'A lake stores any data cheaply, a warehouse gives governed, fast SQL on modeled data, and a lakehouse puts warehouse features (ACID, upserts, time travel, governance) on lake storage with Delta. On Azure I usually use ADLS plus Delta as the system of record with Databricks or Fabric, and a warehouse engine for heavy BI where needed.' },
        { q: 'How do you handle PII?', a: 'Discover and classify it (Purview), tag columns, restrict access with Unity Catalog grants, row filters and column masks, mask or tokenize at silver, encrypt storage with platform or customer-managed keys, audit access, and support deletion requests with Delta `DELETE` plus `VACUUM` after the retention period.' },
        { q: 'How do different teams share data without copies?', a: 'Keep one copy in ADLS governed by Unity Catalog and share through grants or Delta Sharing for external parties. In Fabric, shortcuts and workspace permissions play the same role.' },
        { q: 'How do you keep cost under control on a shared platform?', a: 'Tag by team and project, set budgets and alerts, enforce cluster policies and auto-termination, prefer job and serverless compute, use spot workers, pause or scale warehouses, apply lifecycle rules, and review usage dashboards regularly.' }
      ],
      related: ['databricks', 'adls', 'purview', 'entra-rbac', 'networking']
    },
    {
      id: 'scenarios', name: 'Scenario questions', short: 'Problems you will be asked to debug or solve, with model answers.',
      interview: [
        { q: 'A Databricks job writes thousands of tiny files. What do you do?', a: 'Reduce the number of output tasks with `coalesce` or `repartition`, enable optimized writes and auto compaction on the Delta table, write at a sensible partition granularity, and run `OPTIMIZE` on a schedule. For many small input files, let Auto Loader batch them and avoid per-file processing.' },
        { q: 'How do you deal with data skew?', a: 'Find the hot keys from the Spark UI (a few tasks much longer than the rest) and counts per key. Then use adaptive query execution skew join handling, broadcast the small side, salt the hot key and aggregate in two stages, or process hot keys separately.' },
        { q: 'Duplicates appear in the silver table. How do you find and prevent them?', a: 'Compare counts and key uniqueness at each layer to find where they start. Causes include appended retries, at-least-once delivery, a fan-out join and overlapping extracts. Prevent with `MERGE` on a business key, `row_number()` dedupe ordered by update time, and a uniqueness check as a quality gate.' },
        { q: 'Design an incremental load from a table with no reliable modified date.', a: 'Use SQL change tracking or CDC if the database supports it. If not, compare hashes or full snapshots of the key columns against the previous load, or extract the full table on a schedule with Delta `MERGE` applying inserts, updates and deletes. Agree with the source team on adding an audit column when possible.' },
        { q: 'How do you backfill two years of history after a logic change?', a: 'Parameterize the job by date range and keep it idempotent. Run date chunks in parallel with limits (ADF tumbling window backfill or a Databricks workflow loop), write to a new Delta table or version, validate counts and sample values against the old output, then switch consumers. Throttle so daily runs are not starved.' },
        { q: 'An ADF pipeline succeeded but the data is incomplete. How did that happen?', a: 'Common causes: a Copy activity that read a stale watermark, an activity set to continue on failure, a source delivering a partial file, or a dependency condition (Completed instead of Succeeded) that let the flow proceed. Add row count and freshness checks against the source, use proper dependency conditions, and write audit logs per run.' },
        { q: 'You must delete a customer\'s data for a GDPR request from a Delta lake. How?', a: 'Use `DELETE FROM table WHERE customer_id = ...` on every table that holds the data, then run `VACUUM` once the retention period has passed so old file versions with the data are physically removed. Track this in an audit table, and design data models with a stable subject key to find all copies.' },
        { q: 'Databricks cannot read from ADLS with a 403 error. What do you check?', a: 'The identity in use (access connector, service principal or user) and its data-plane role on the storage account or container, ACLs on the folders, whether the firewall or private endpoint and DNS allow the cluster network, the Unity Catalog external location and storage credential, and whether shared key access was disabled while the code still uses an account key.' },
        { q: 'A Synapse dedicated pool query got slow after a data load. Why?', a: 'Likely stale statistics, poor columnstore row groups from many small inserts, skewed distribution, or data movement from a poorly chosen distribution key. Update statistics, rebuild the index, check `sys.dm_pdw_request_steps` for shuffle steps, and revisit distribution.' },
        { q: 'How do you secure a data pipeline end to end?', a: 'Managed identities with least-privilege RBAC and ACLs, secrets only in Key Vault, private endpoints and disabled public access, encryption at rest and in transit, Unity Catalog or Purview for governance, diagnostic logs and alerts, and separate subscriptions or resource groups per environment with IaC.' },
        { q: 'Tell me about a pipeline failure you handled.', a: 'Use a real example: what broke and its business impact, how you detected it, how you diagnosed it (ADF run output, Spark UI, logs), the immediate fix and any repair or backfill, and what you changed to prevent a repeat (monitoring, validation, retries, runbook). Include times and numbers.' },
        { q: 'How do you design for exactly-once processing end to end?', a: 'True end-to-end exactly-once is rare. Combine at-least-once delivery with idempotent processing: unique event ids, `MERGE` upserts, and atomic Delta commits. Store source offsets with the output (Structured Streaming checkpoints) so restarts neither skip nor double-count.' }
      ],
      related: ['databricks', 'adf', 'synapse', 'adls']
    }
  ]
});
