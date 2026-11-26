GUIDE.add({
  id: 'prep', title: 'Interview Prep', order: 0,
  services: [
    {
      id: 'prep-guide', name: 'How to prepare', short: 'What a 4-year Databricks data engineer is expected to know, and a study order.',
      sections: [
        {
          title: 'What interviewers expect at 4 years',
          list: [
            'You have built and run production pipelines on Databricks, not only notebooks: jobs, retries, monitoring, cost.',
            'You can explain Delta Lake internals (log, MERGE, OPTIMIZE, VACUUM) and why you chose a design.',
            'You can debug performance with the Spark UI: skew, shuffles, small files, spill, memory errors.',
            'You know governance basics with Unity Catalog and how to secure data and secrets.',
            'You can write PySpark and SQL live (window functions, joins, dedupe, nested data) and explain the complexity.'
          ]
        },
        {
          title: 'Typical interview rounds',
          table: {
            head: ['Round', 'What is tested', 'Where to practice here'],
            rows: [
              ['PySpark and SQL coding', 'Window functions, dedupe, joins, aggregations, JSON flattening', 'PySpark coding patterns'],
              ['Spark and Delta depth', 'Execution model, skew, joins, MERGE, OPTIMIZE, streaming', 'Delta Lake, Spark internals, Spark tuning pages'],
              ['Platform and governance', 'Clusters, Unity Catalog, jobs, security, cost', 'Platform and Operations pages'],
              ['System design', 'Medallion, streaming and CDC pipelines', 'Design pages'],
              ['Project deep dive and behavioral', 'Your pipelines, incidents, trade-offs', 'Section below']
            ]
          }
        },
        {
          title: 'Study order (about 3 weeks)',
          ordered: true,
          list: [
            'Week 1: Delta Lake fundamentals, MERGE and SCD patterns, OPTIMIZE and VACUUM, Spark internals. Do PySpark coding exercises daily.',
            'Week 2: Spark tuning (skew, joins, AQE), Auto Loader, Structured Streaming, DLT, Workflows, compute and cost.',
            'Week 3: Unity Catalog, security, CI/CD with bundles, design pages, scenario questions, mock interviews out loud.'
          ]
        },
        {
          title: 'A framework for any design question',
          ordered: true,
          list: [
            'Clarify: sources, volume, latency, consumers, SLAs, governance needs, budget.',
            'Ingest: Auto Loader for files, streaming for events, CDC tools or JDBC for databases; land raw in bronze.',
            'Transform: silver (clean, conform, deduplicate with MERGE or APPLY CHANGES) and gold (business aggregates).',
            'Storage: Delta in Unity Catalog, clustering, file sizing, retention.',
            'Serve: SQL warehouses, BI tools, Delta Sharing, feature tables.',
            'Operate: Workflows, retries, idempotency, monitoring, data quality, cost controls.',
            'Secure: Unity Catalog grants, masks, service principals, private networking.'
          ]
        },
        {
          title: 'Talking about your projects',
          text: 'Prepare three stories with numbers: the problem, the architecture and why, your part, one hard problem and the fix, and the measured result.',
          list: [
            'Know volumes, runtimes before and after, cost saved, number of tables and consumers.',
            'Have one performance story, such as removing skew or small files to cut a job from hours to minutes.',
            'Have one incident story: detection, diagnosis, fix, prevention.',
            'Have one design trade-off story, such as streaming vs scheduled `availableNow` batch.'
          ]
        },
        {
          title: 'Optional certification path',
          text: 'The Databricks Certified Data Engineer Associate and Professional exams cover much of this material (Delta, ingestion, pipelines, governance, production). They are a useful structure for study but interviews focus on your hands-on reasoning.'
        }
      ]
    },
    {
      id: 'compare', name: 'Comparisons', short: 'Side-by-side tables for the "X vs Y" questions.',
      sections: [
        {
          title: 'Ingestion: Auto Loader vs COPY INTO vs DLT vs batch read',
          table: {
            head: ['', 'Auto Loader', 'COPY INTO', 'DLT streaming table', 'Plain batch read'],
            rows: [
              ['State', 'Checkpoint of processed files', 'Tracks loaded files per table', 'Managed by pipeline', 'None; you manage it'],
              ['Scale', 'Millions of files', 'Thousands of files', 'Same as Auto Loader underneath', 'Re-lists folder'],
              ['Schema evolution', 'Yes, with rescued data', 'Basic with `mergeSchema`', 'Yes', 'Manual'],
              ['Best for', 'Continuous or large ingestion', 'Simple SQL loads', 'Declarative medallion pipelines', 'One-off loads']
            ]
          }
        },
        {
          title: 'Layout: partitioning vs Z-ORDER vs liquid clustering',
          table: {
            head: ['', 'Partitioning', 'Z-ORDER', 'Liquid clustering'],
            rows: [
              ['How', 'Folder per value', 'Sorts data in files during OPTIMIZE', '`CLUSTER BY`, incremental clustering'],
              ['Changing keys', 'Rewrite the table', 'Choose per OPTIMIZE run', '`ALTER TABLE ... CLUSTER BY`, no rewrite'],
              ['Risk', 'Small files, skew, high cardinality', 'Cost on every OPTIMIZE', 'Newer feature; check runtime support'],
              ['Use when', 'Very large table, low-cardinality filter', 'Legacy tables', 'Default for new tables']
            ]
          }
        },
        {
          title: 'Tables: managed vs external, Delta vs Parquet vs Iceberg',
          table: {
            head: ['', 'Managed table', 'External table', 'Parquet files', 'Iceberg'],
            rows: [
              ['Data location', 'UC-managed', 'Your path', 'Your path', 'Your path'],
              ['Drop table', 'Deletes data (recoverable for a time)', 'Keeps files', 'Not a table', 'Depends on catalog'],
              ['ACID / MERGE', 'Yes (Delta)', 'Yes (Delta)', 'No', 'Yes'],
              ['Note', 'Predictive optimization available', 'Other systems can own files', 'Cheap, no transactions', 'Delta UniForm can expose Delta as Iceberg']
            ]
          }
        },
        {
          title: 'Compute: all-purpose vs job vs serverless vs SQL warehouse',
          table: {
            head: ['', 'All-purpose cluster', 'Job cluster', 'Serverless compute', 'SQL warehouse'],
            rows: [
              ['Use', 'Development, ad hoc', 'Production runs', 'Notebooks and jobs without cluster setup', 'BI and SQL'],
              ['Cost', 'Highest DBU rate', 'Lower DBU rate', 'Usage-based, VM cost bundled', 'DBU per hour while running'],
              ['Lifecycle', 'Until terminated', 'Per run', 'Managed by Databricks', 'Auto-stop']
            ]
          }
        },
        {
          title: 'Spark joins',
          table: {
            head: ['Join', 'How it works', 'When used'],
            rows: [
              ['Broadcast hash', 'Small table sent to every executor; no shuffle of the large side', 'One side under the threshold (10 MB default) or hinted'],
              ['Sort-merge', 'Both sides shuffled and sorted by key', 'Default for large tables'],
              ['Shuffle hash', 'Shuffle then hash map per partition', 'When one side is smaller but too big to broadcast'],
              ['Broadcast nested loop', 'Compares all pairs', 'Non-equi joins, last resort']
            ]
          }
        },
        {
          title: 'Orchestration: Workflows vs Airflow vs ADF',
          table: {
            head: ['', 'Workflows', 'Airflow', 'Azure Data Factory'],
            rows: [
              ['Strength', 'Native, cheap, DLT and UC integration', 'Code-based DAGs, huge ecosystem, backfills', 'Connectors and data movement, Azure integration'],
              ['Weakness', 'Mostly Databricks tasks', 'Platform to operate', 'Complex logic is awkward'],
              ['Pick when', 'Pipelines are mostly on Databricks', 'Many systems and complex dependencies', 'Azure-centric estate and copy-heavy ingestion']
            ]
          }
        },
        {
          title: 'Databricks vs other engines',
          table: {
            head: ['', 'Databricks', 'EMR', 'Synapse / Fabric', 'Snowflake'],
            rows: [
              ['Core', 'Spark + Photon + Delta + UC', 'Managed Spark/Hadoop clusters', 'SQL warehouse plus Spark', 'SQL warehouse'],
              ['Strength', 'Unified ETL, streaming, ML, governance', 'Cheap, configurable clusters', 'Microsoft ecosystem and Power BI', 'SQL ease, concurrency'],
              ['Tradeoff', 'Premium platform cost', 'More to operate', 'Different tools per service', 'Less native Spark and ML code'],
              ['Table format', 'Delta (UniForm for Iceberg)', 'Parquet, Iceberg, Delta, Hudi', 'Delta (Fabric), proprietary (dedicated pool)', 'Proprietary, Iceberg tables supported']
            ]
          }
        }
      ]
    },
    {
      id: 'design-medallion', name: 'Design: medallion batch pipeline', short: 'Files and database data into bronze, silver and gold on Delta.',
      sections: [
        { title: 'Scenario', text: '"Design a daily pipeline that loads orders from an operational database and partner CSV files, cleans them, and produces gold tables for dashboards by 7 AM. About 200 GB per day."' },
        {
          title: 'Architecture',
          code: { lang: 'text', code: `Sources: DB extracts / partner files --> cloud storage landing (volumes)
            |
   Auto Loader (availableNow) --> bronze Delta (raw + ingest metadata)
            |
   Databricks job: dedupe, cast, conform, quality checks, MERGE --> silver Delta
            |
   Aggregates --> gold Delta / materialized views --> SQL warehouse --> BI

 Orchestration: Workflows job on a job cluster (or serverless), service principal, retries
 Governance:    Unity Catalog catalogs per layer or environment, masks for PII
 Operations:    OPTIMIZE / predictive optimization, freshness alerts, system table cost reports` }
        },
        {
          title: 'Key decisions to explain',
          list: [
            'Bronze stores data as received plus `ingested_at` and `source_file`, so it can be replayed.',
            'Silver enforces schema, types and keys; `MERGE` makes reruns idempotent; bad rows go to a quarantine table.',
            'Gold is modeled for consumers (star schema or aggregates) and clustered on common filters.',
            'Auto Loader with `availableNow` gives incremental processing on a cheap job cluster instead of an always-on stream.',
            'Quality gates: constraints, DLT expectations or checks that fail the job before gold is refreshed.',
            'Cost: job compute, spot workers, autoscaling, and compaction. SLA: alert before 7 AM if a task runs long.'
          ]
        }
      ],
      interview: [
        { q: 'How do you make each layer idempotent?', a: 'Bronze ingestion is idempotent through Auto Loader checkpoints. Silver uses `MERGE` on a business key (after deduplicating the batch) or overwrites a single partition. Gold is rebuilt from silver for the affected dates. Parameterize by run date so a rerun reproduces the same output.' },
        { q: 'Where do you put data quality checks?', a: 'At the bronze to silver boundary: schema, nulls, ranges, uniqueness, referential checks. Bad rows are quarantined with a reason and a count metric is emitted. Before gold, reconcile totals against silver or the source and fail the job if thresholds break, so dashboards never show half-loaded data.' },
        { q: 'Why separate bronze, silver and gold?', a: 'It isolates concerns: bronze preserves raw history for replay and audit, silver gives a clean, conformed, deduplicated base for many uses, and gold serves specific business needs. Each layer has clear ownership, quality rules and access controls, and issues can be fixed by reprocessing a layer.' },
        { q: 'How would you reduce cost and runtime?', a: 'Use job clusters or serverless with autoscaling and spot workers, incremental processing instead of full reloads, liquid clustering and compaction, broadcast joins and early filtering, avoid Python UDFs, and tune only after looking at the Spark UI. Track cost per job in system tables.' }
      ],
      related: ['auto-loader', 'delta-lake', 'workflows', 'unity-catalog', 'compute']
    },
    {
      id: 'design-streaming', name: 'Design: streaming pipeline', short: 'Events from Kafka or Event Hubs to Delta and live dashboards.',
      sections: [
        { title: 'Scenario', text: '"Process clickstream events (about 20,000 per second at peak) into the lakehouse. Product needs per-minute metrics within a minute or two; analysts need full history."' },
        {
          title: 'Architecture',
          code: { lang: 'text', code: `Apps --> Kafka / Event Hubs --> Structured Streaming (bronze: raw JSON/Avro + offsets)
                                     |
                       Structured Streaming / DLT (silver: parse, dedupe by event_id, watermark)
                                     |
                       gold: 1-minute windows (append mode, watermark) --> SQL warehouse --> dashboard
 Checkpoints per query in a volume or external location; alerts on batch duration and lag
 Raw copy retained in bronze for replay; late events beyond watermark corrected by batch recompute` }
        },
        {
          title: 'Key decisions to explain',
          list: [
            'Latency target decides continuous (`processingTime`) vs scheduled `availableNow` micro-batches; continuous costs 24/7 compute.',
            'Source throttling with `maxOffsetsPerTrigger`; enough partitions for read parallelism.',
            'Deduplicate with an event id inside a watermark; idempotent sinks via `MERGE` in `foreachBatch`.',
            'Event-time windows with watermarks bound state; RocksDB state store for large state.',
            'Optimized writes and compaction to avoid small files from frequent commits.',
            'Monitoring: input vs processing rate, batch duration, state size, and consumer lag.'
          ]
        }
      ],
      interview: [
        { q: 'How do you size a streaming job?', a: 'Estimate throughput (events per second and bytes), set `maxOffsetsPerTrigger` so a micro-batch finishes comfortably inside the trigger interval, choose enough workers for the peak, and test with a backlog. Watch processed rows per second versus input rate and batch duration, and keep headroom for spikes.' },
        { q: 'How do you avoid small files from a stream?', a: 'Use a longer trigger interval, enable optimized writes and auto compaction, cluster the table, and schedule `OPTIMIZE`. For very high-frequency commits, write bronze larger batches and compact before downstream reads.' },
        { q: 'What do you do about late events?', a: 'Set a watermark for the tolerated lateness, send events later than that to a side table, and correct affected windows with a periodic batch recompute from bronze. Document the lateness assumption with the business.' },
        { q: 'Streaming or scheduled incremental batch?', a: 'If minutes of latency are acceptable, running the same streaming code with `availableNow` on a schedule is cheaper and simpler to operate than an always-on cluster. I choose continuous streaming only for sub-minute requirements.' }
      ],
      related: ['streaming', 'auto-loader', 'delta-lake', 'dlt']
    },
    {
      id: 'design-cdc', name: 'Design: CDC into the lakehouse', short: 'Keeping a silver table in sync with an operational database, with SCD2.',
      sections: [
        { title: 'Scenario', text: '"Replicate customer and order tables from an OLTP database into the lakehouse with inserts, updates and deletes, keep history for customers, and handle out-of-order events."' },
        {
          title: 'Architecture',
          code: { lang: 'text', code: `OLTP DB --(Debezium/Kafka, DMS, Fivetran, ADF CDC)--> change files or topics
   |
   Auto Loader / Structured Streaming --> bronze_cdc (op, key, payload, change_ts, lsn)
   |
   DLT APPLY CHANGES   or   foreachBatch MERGE (latest per key by sequence)
   |
   silver_customers (current, SCD1)   and   silver_customers_history (SCD2)
   |
   gold marts` }
        },
        {
          title: 'Key decisions to explain',
          list: [
            'Capture insert, update and delete events with an operation flag and a monotonic sequence (LSN or commit timestamp).',
            'Keep raw change events in bronze for audit and replay.',
            'Apply changes by key ordered by sequence, so out-of-order events do not overwrite newer data.',
            'Deletes: apply as hard deletes in silver or soft delete with a flag, depending on audit needs.',
            'SCD2 history with start and end timestamps and a current flag, or DLT `STORED AS SCD TYPE 2`.',
            'Initial snapshot plus ongoing changes: load the snapshot, then start streaming changes from the recorded position.'
          ]
        },
        {
          title: 'Example: apply changes in foreachBatch',
          code: { lang: 'python', code: `from delta.tables import DeltaTable
from pyspark.sql import functions as F, Window

def apply_cdc(batch_df, batch_id):
    w = Window.partitionBy("customer_id").orderBy(F.col("change_ts").desc())
    latest = batch_df.withColumn("rn", F.row_number().over(w)).filter("rn = 1").drop("rn")
    (DeltaTable.forName(spark, "main.silver.customers").alias("t")
       .merge(latest.alias("s"), "t.customer_id = s.customer_id")
       .whenMatchedDelete(condition="s.op = 'D' AND s.change_ts >= t.change_ts")
       .whenMatchedUpdateAll(condition="s.op <> 'D' AND s.change_ts >= t.change_ts")
       .whenNotMatchedInsertAll(condition="s.op <> 'D'")
       .execute())` }
        }
      ],
      interview: [
        { q: 'How do you handle out-of-order change events?', a: 'Carry a sequence value (log sequence number or commit timestamp) with every event. In the merge, keep only the latest event per key in a batch and apply it only when its sequence is newer than the target row. DLT `APPLY CHANGES` with `SEQUENCE BY` does this automatically.' },
        { q: 'How do you handle deletes?', a: 'Receive them as events with an operation flag. Either delete the row in silver (current state) while keeping the event in bronze and in SCD2 history, or mark it deleted with a flag and timestamp if downstream users need to know. If the source has no delete events, compare periodic full key snapshots to detect missing keys.' },
        { q: 'How do you bootstrap the initial load?', a: 'Take a consistent snapshot, load it into bronze or silver, record the log position at the snapshot time, and start the CDC stream from that position so no changes are missed or duplicated. Tools such as Debezium and DMS support snapshot plus CDC modes.' },
        { q: 'MERGE in foreachBatch vs DLT APPLY CHANGES?', a: 'DLT is declarative: less code, built-in ordering, SCD1/2 and quality metrics. A hand-written `foreachBatch` merge gives full control over logic, custom sinks and conditions, and works in plain jobs. I pick DLT for standard CDC and `foreachBatch` for unusual rules.' }
      ],
      related: ['streaming', 'dlt', 'delta-lake', 'auto-loader']
    },
    {
      id: 'scenarios', name: 'Scenario questions', short: 'Problems you will be asked to debug or solve, with model answers.',
      interview: [
        { q: 'A nightly job went from 30 minutes to 3 hours. What do you do?', a: 'Compare the Spark UI of a good and a bad run. Check input size growth, a new skewed key, a changed join strategy (broadcast lost because statistics changed), small files from upstream, spill, a cluster that lost spot nodes, or a changed runtime version. Fix the cause (compaction, skew handling, hint, plan changes) and add a duration alert so regressions are noticed early.' },
        { q: 'MERGE fails with "multiple source rows matched". Why and how do you fix it?', a: 'More than one source row matches the same target row on the merge key, which is ambiguous for updates. Deduplicate the source first, usually with `row_number()` ordered by the latest timestamp, or aggregate it, so there is one row per key. Verify the key really is unique in the target as well.' },
        { q: 'Two jobs write to the same Delta table and one fails with a concurrent modification error. What now?', a: 'This is an optimistic concurrency conflict. Reduce the overlap: partition or cluster writes so jobs touch different files, add explicit predicates to MERGE and DELETE, schedule conflicting jobs sequentially, use row-level concurrency with deletion vectors, and add retries. Never remove the checks.' },
        { q: 'Someone deleted data from a production table by mistake. How do you recover?', a: 'Use `DESCRIBE HISTORY` to find the version before the delete and either `RESTORE TABLE ... TO VERSION AS OF` or copy the lost rows from that version into the table. This works only if the old files are not yet vacuumed (7 days by default), so act quickly. Afterwards tighten permissions and add table protections.' },
        { q: 'How do you delete a customer\'s data for GDPR?', a: 'Run `DELETE` for the subject key on every table that contains it (bronze, silver, gold and derived stores), then run `VACUUM` after the retention window so the old files are physically removed. Record the request in an audit table. Design with a stable subject key and avoid copying PII into many tables, using masking and tokenization.' },
        { q: 'A user gets a permission error reading a table they were granted SELECT on. Why?', a: 'In Unity Catalog the user also needs `USE CATALOG` on the catalog and `USE SCHEMA` on the schema. Other causes: the compute uses an unsupported access mode, a row filter or mask blocks it, the catalog is not bound to that workspace, or the underlying external location is not accessible.' },
        { q: 'Your streaming job fails after a source schema change. How do you recover?', a: 'Check the error and Auto Loader schema evolution mode. For additive changes, the stream stops once to update the stored schema; restart it (jobs should retry) with `mergeSchema` on the sink. For incompatible changes, fix the logic, and if the checkpoint is incompatible, start a new one and backfill from bronze or from a chosen offset to avoid gaps.' },
        { q: 'You must reprocess six months of data after a bug. How?', a: 'Make the pipeline parameterized by date range and idempotent. Run chunks in parallel with limits, writing to a new table or a Delta branch first, validate counts and sample values against the old output, then swap or merge. Throttle so daily jobs are not starved, and use a bigger one-time cluster if cost-effective.' },
        { q: 'How do you migrate a Hive metastore workspace to Unity Catalog?', a: 'Plan catalogs and schemas, set up storage credentials and external locations, upgrade external tables with `SYNC` and managed tables with `DEEP CLONE` or CTAS, replace mounts with volumes, rewrite two-level table names to three-level, move permissions to UC grants, test jobs and dashboards, then cut over by team or domain.' },
        { q: 'How do you process only new data in a gold job without a full scan?', a: 'Stream from the silver Delta table with `availableNow` (checkpoint remembers progress), or read its Change Data Feed from the last processed version, or filter on a high-watermark column stored in a control table. Prefer the checkpoint or CDF because they handle late arrivals correctly.' },
        { q: 'A cluster loses spot workers mid-job. What happens?', a: 'Spark reschedules lost tasks on other nodes and recomputes lost shuffle data, so the job usually survives but slows down, and repeated losses can fail it. Use on-demand for the driver, spot with fallback for workers, enable autoscaling, keep tasks idempotent and set job retries.' },
        { q: 'Tell me about a pipeline you optimized.', a: 'Pick a real example: the symptom and baseline numbers, how you diagnosed it (Spark UI stages, skew, small files, shuffle size), the specific changes (broadcast, salting, compaction, clustering, removing a UDF, resizing), the result in time and cost, and how you guard against regression.' },
        { q: 'How do you design for exactly-once?', a: 'Combine replayable sources with checkpoints and atomic Delta commits for streaming, make batch writes idempotent through `MERGE` or partition overwrite, and carry unique ids so duplicates can be detected. For external sinks use idempotent writes or transactional protocols.' }
      ],
      related: ['delta-lake', 'spark-tuning', 'streaming', 'unity-catalog']
    }
  ]
});
