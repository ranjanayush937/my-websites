GUIDE.add({
  id: 'pipelines', title: 'Pipelines & Orchestration', order: 3,
  services: [
    {
      id: 'auto-loader', name: 'Auto Loader', priority: 'must', short: 'Incremental, scalable file ingestion into Delta.',
      overview: 'Auto Loader (`cloudFiles` source) incrementally detects and processes new files arriving in cloud storage. It scales to millions of files, tracks progress in a checkpoint, infers and evolves schemas, and is the standard way to build bronze tables from files.',
      whenToUse: ['Ingesting files (JSON, CSV, Parquet, Avro, text) that keep arriving in a folder.', 'Replacing custom "list the folder and diff" logic.'],
      concepts: ['Format `cloudFiles` with `cloudFiles.format`.', 'File discovery modes: directory listing (default, incremental) and file notification (uses cloud events and queues; better for huge or deep directories).', 'Schema inference stored at `cloudFiles.schemaLocation`; evolution modes `addNewColumns` (default), `rescue`, `failOnNewColumns`, `none`.', '`_rescued_data` column captures data that does not match the schema.', 'Checkpoint tracks processed files (exactly-once ingestion).', 'Triggers: continuous, `processingTime`, or `availableNow` to run as an incremental batch.', 'Rate limits: `cloudFiles.maxFilesPerTrigger`, `maxBytesPerTrigger`.'],
      useCases: ['Landing zone to bronze', 'Ingesting partner file drops'],
      examples: [
        { title: 'Bronze ingestion with schema evolution and rescued data', lang: 'python', code: `from pyspark.sql import functions as F

(spark.readStream.format("cloudFiles")
  .option("cloudFiles.format", "json")
  .option("cloudFiles.schemaLocation", "/Volumes/main/meta/schemas/orders")
  .option("cloudFiles.schemaEvolutionMode", "addNewColumns")
  .option("cloudFiles.inferColumnTypes", "true")
  .load("/Volumes/main/landing/orders/")
  .select("*", F.current_timestamp().alias("ingested_at"), F.col("_metadata.file_path").alias("source_file"))
  .writeStream
  .option("checkpointLocation", "/Volumes/main/meta/checkpoints/orders")
  .option("mergeSchema", "true")
  .trigger(availableNow=True)
  .toTable("main.bronze.orders"))` }
      ],
      pricing: 'File notification mode uses cloud queue and event services with small costs. Listing mode costs storage API calls.',
      tips: ['Use `availableNow` with a job schedule for cost-efficient incremental batch.', 'Keep the checkpoint and schema locations outside the data folder and never delete them casually.', 'Add the source file path and ingestion time to bronze.'],
      related: ['streaming', 'dlt', 'delta-lake', 'workflows'],
      interview: [
        { q: 'What is Auto Loader and why use it over a plain batch read?', a: 'It remembers which files it has processed in its checkpoint, so each run reads only new files, even when the folder holds millions. It also infers and evolves schemas and captures bad data in `_rescued_data`. A plain batch read must list and re-read the folder or maintain your own state.' },
        { q: 'Auto Loader vs COPY INTO?', a: '`COPY INTO` is a SQL command that idempotently loads new files; it is simple and good for thousands of files or occasional loads. Auto Loader scales to far larger file counts, supports file notification, schema evolution and streaming semantics. For continuous or large ingestion I use Auto Loader; for small ad-hoc loads `COPY INTO`.' },
        { q: 'Directory listing vs file notification mode?', a: 'Listing mode lists the input path (incrementally, in lexical order) and works with no extra setup. File notification mode sets up cloud events and a queue so new files are pushed to Auto Loader, avoiding expensive listings in very large directories at the cost of extra cloud resources and permissions.' },
        { q: 'How does Auto Loader handle schema changes?', a: 'It stores the inferred schema at the schema location. With `addNewColumns` the stream stops when new columns appear, updates the stored schema, and picks up the new columns on restart (jobs should retry). With `rescue` new or mismatched data lands in `_rescued_data`. `failOnNewColumns` fails; `none` ignores. I choose by how strict the source contract is.' },
        { q: 'How do you guarantee exactly-once ingestion?', a: 'The checkpoint stores the files already processed, and the Delta sink commits atomically, so after a failure the stream resumes without skipping or duplicating files. If a file is modified in place after ingestion it is not reprocessed by default, so sources should write new files.' }
      ]
    },
    {
      id: 'streaming', name: 'Structured Streaming', priority: 'must', short: 'Streaming on Delta: checkpoints, triggers, watermarks, foreachBatch.',
      overview: 'Structured Streaming treats a stream as an unbounded table processed in micro-batches. On Databricks it reads from Kafka, Event Hubs, Kinesis, Auto Loader and Delta tables, and writes to Delta with exactly-once guarantees through checkpoints.',
      whenToUse: ['Low-latency ingestion and transformation.', 'Incremental processing of Delta tables (even in scheduled batch mode).'],
      concepts: ['Sources: Kafka, Event Hubs (Kafka endpoint), Kinesis, files via Auto Loader, Delta table (`readStream.table`).', 'Output modes: append, update, complete.', 'Triggers: default micro-batch, `processingTime="1 minute"`, `availableNow=True` (process everything available, then stop).', 'Checkpoint: offsets and state; one checkpoint per query; never share or delete.', 'Event time, watermarks (`withWatermark`) and windows (`window()`); late data older than the watermark can be dropped in stateful operations.', 'Stateful operations: aggregations, deduplication, stream-stream joins (need watermarks); RocksDB state store for large state.', '`foreachBatch` runs arbitrary batch logic per micro-batch, such as MERGE; use `txnVersion` and `txnAppId` for idempotent writes.', 'Delta as a source: changes appended by streams; use `skipChangeCommits` or Change Data Feed when upstream updates or deletes.'],
      useCases: ['Event Hubs or Kafka to Delta', 'CDC merge into silver with foreachBatch', 'Incremental gold aggregates'],
      examples: [
        { title: 'Windowed aggregation with a watermark', lang: 'python', code: `from pyspark.sql import functions as F

events = spark.readStream.table("main.bronze.clicks")
agg = (events
  .withWatermark("event_time", "10 minutes")
  .groupBy(F.window("event_time", "5 minutes"), "page")
  .agg(F.count("*").alias("views")))

(agg.writeStream
   .outputMode("append")
   .option("checkpointLocation", "/Volumes/main/meta/checkpoints/page_views")
   .toTable("main.gold.page_views_5m"))` },
        { title: 'Upsert each micro-batch with foreachBatch', lang: 'python', code: `from delta.tables import DeltaTable
from pyspark.sql import functions as F, Window

def upsert(batch_df, batch_id):
    w = Window.partitionBy("id").orderBy(F.col("ts").desc())
    latest = batch_df.withColumn("rn", F.row_number().over(w)).filter("rn = 1").drop("rn")
    (DeltaTable.forName(spark, "main.silver.customers").alias("t")
       .merge(latest.alias("s"), "t.id = s.id")
       .whenMatchedUpdateAll(condition="s.ts > t.ts")
       .whenNotMatchedInsertAll()
       .execute())

(spark.readStream.table("main.bronze.customers_cdc")
   .writeStream.foreachBatch(upsert)
   .option("checkpointLocation", "/Volumes/main/meta/checkpoints/customers_silver")
   .trigger(availableNow=True)
   .start())` },
        { title: 'Read from Kafka or Event Hubs', lang: 'python', code: `raw = (spark.readStream.format("kafka")
   .option("kafka.bootstrap.servers", "broker:9093")
   .option("subscribe", "orders")
   .option("startingOffsets", "latest")
   .option("maxOffsetsPerTrigger", 100000)
   .load()
   .select(F.col("key").cast("string"), F.col("value").cast("string"), "timestamp"))` }
      ],
      pricing: 'Continuous streams keep a cluster running 24/7, so cost is higher than scheduled batch. `availableNow` with a schedule is often much cheaper when minutes of latency are acceptable.',
      tips: ['Use a unique checkpoint per query and keep it with the table lifecycle.', 'Set watermarks to bound state size.', 'Use `availableNow` unless you truly need continuous latency.', 'Make `foreachBatch` logic idempotent.'],
      related: ['auto-loader', 'dlt', 'delta-lake', 'workflows'],
      interview: [
        { q: 'How does Structured Streaming provide fault tolerance and exactly-once?', a: 'A checkpoint records the offsets read for each micro-batch and operator state. After a failure, the query replays the last uncommitted batch from the replayable source. Because the Delta sink commits atomically and recognizes repeated batches, the result is effectively exactly-once. Non-idempotent sinks need extra care, such as `foreachBatch` with idempotent writes.' },
        { q: 'What is a watermark and why do you need one?', a: 'A watermark declares how late event-time data can arrive. Spark keeps state for windows or dedupe keys until the watermark passes, then drops that state and ignores later events for them. Without it, state grows forever for aggregations, dedupe and stream-stream joins, and append-mode window output cannot be finalized.' },
        { q: 'availableNow vs continuous triggers?', a: '`availableNow` processes all data that is available (in several micro-batches if needed) and then stops, so you can run streaming code as a scheduled incremental batch job on a short-lived job cluster, saving cost. A continuous or `processingTime` trigger keeps the query and cluster running for low latency. Choose by the real latency requirement.' },
        { q: 'How do you upsert streaming data into a Delta table?', a: 'Use `foreachBatch` and run a `MERGE` on each micro-batch, after deduplicating the batch by key (latest by sequence). Include the idempotency options or a deterministic merge so a replayed batch does not corrupt data. For CDC feeds, DLT `APPLY CHANGES` does this declaratively.' },
        { q: 'A streaming job is lagging. What do you check?', a: 'The streaming query progress metrics: input rows per second versus processed rows per second, batch duration, and trigger interval. Check skew or heavy operators in the Spark UI, state store size, sink write time (small files, MERGE cost), source throttling settings (`maxOffsetsPerTrigger`), partition counts at the source, and cluster size. Fix by tuning batch size, adding resources, optimizing the sink or simplifying state.' },
        { q: 'What happens if you change a streaming query?', a: 'Some changes are safe (filters, projections, adding sinks), but changes to stateful operators, the source, or output schema can make the checkpoint incompatible, requiring a new checkpoint and a plan to avoid reprocessing or gaps. Test changes on a copy and know the compatibility rules in the docs.' },
        { q: 'Stream-static vs stream-stream joins?', a: 'A stream-static join joins each micro-batch to a static (or slowly changing Delta) table and needs no state, and the static side is re-read per batch. A stream-stream join buffers both sides in state and needs watermarks and time-range conditions to bound the state.' },
        { q: 'How do you handle schema changes in a streaming pipeline?', a: 'Additive changes can be handled with Auto Loader schema evolution and `mergeSchema` on the sink, with the job set to retry after the schema update. Breaking changes need a controlled migration. Store raw payloads in bronze so you can always reprocess.' }
      ]
    },
    {
      id: 'dlt', name: 'Delta Live Tables (Lakeflow Declarative Pipelines)', priority: 'imp', short: 'Declarative pipelines with data quality expectations and CDC.',
      overview: 'DLT lets you declare tables and their transformations in SQL or Python; the framework works out dependencies, runs the pipeline, manages clusters, retries and monitoring. Expectations add data quality rules. The product is now part of the Lakeflow family (Lakeflow Spark Declarative Pipelines), so syntax and names may differ in newer docs.',
      whenToUse: ['Medallion pipelines where you want less boilerplate and built-in quality checks.', 'CDC processing with `APPLY CHANGES` / AUTO CDC.'],
      concepts: ['Streaming table: incremental append-only processing. Materialized view: query result maintained (incrementally when possible). View: not persisted.', 'Expectations: `EXPECT` (record and keep), `ON VIOLATION DROP ROW`, `ON VIOLATION FAIL UPDATE`.', '`APPLY CHANGES INTO` handles CDC with `KEYS`, `SEQUENCE BY` and SCD type 1 or 2.', 'Triggered vs continuous pipelines; development vs production mode; enhanced autoscaling.', 'Pipeline event log is queryable for lineage and quality metrics.'],
      useCases: ['Bronze to silver to gold with quality gates', 'SCD2 from a CDC stream without hand-written MERGE'],
      examples: [
        { title: 'Bronze, silver with expectations, gold (SQL)', lang: 'sql', code: `CREATE OR REFRESH STREAMING TABLE bronze_orders
AS SELECT * FROM STREAM read_files('/Volumes/main/landing/orders/', format => 'json');

CREATE OR REFRESH STREAMING TABLE silver_orders (
  CONSTRAINT valid_id EXPECT (order_id IS NOT NULL) ON VIOLATION DROP ROW,
  CONSTRAINT positive_amount EXPECT (amount >= 0)
)
AS SELECT order_id, customer_id, CAST(amount AS DECIMAL(12,2)) AS amount, order_ts
FROM STREAM(bronze_orders);

CREATE OR REFRESH MATERIALIZED VIEW gold_daily_sales
AS SELECT date(order_ts) AS d, sum(amount) AS revenue FROM silver_orders GROUP BY date(order_ts);` },
        { title: 'CDC with SCD Type 2 (SQL)', lang: 'sql', code: `CREATE OR REFRESH STREAMING TABLE silver_customers;

APPLY CHANGES INTO LIVE.silver_customers
FROM STREAM(LIVE.bronze_customers_cdc)
KEYS (customer_id)
APPLY AS DELETE WHEN op = 'D'
SEQUENCE BY change_ts
COLUMNS * EXCEPT (op, change_ts)
STORED AS SCD TYPE 2;` },
        { title: 'Python flavour', lang: 'python', code: `import dlt
from pyspark.sql import functions as F

@dlt.table
@dlt.expect_or_drop("valid_id", "order_id IS NOT NULL")
def silver_orders():
    return dlt.read_stream("bronze_orders").select("order_id", "customer_id", "amount")` }
      ],
      pricing: 'Billed as DLT compute with DBU rates by edition (Core, Pro, Advanced) plus cloud VMs, or serverless.',
      tips: ['Use expectations to measure quality and decide drop versus fail per rule.', 'Prefer `APPLY CHANGES` for CDC instead of hand-written merges.', 'Check current naming and syntax in the docs because the product is evolving.'],
      related: ['streaming', 'auto-loader', 'delta-lake', 'unity-catalog'],
      interview: [
        { q: 'What problems does DLT solve compared to hand-written notebooks and jobs?', a: 'It removes orchestration and boilerplate: you declare tables, DLT infers the dependency graph, manages checkpoints, retries and cluster scaling, and gives built-in quality expectations, lineage and an event log. You trade some control for productivity and consistency.' },
        { q: 'Explain expectations and their actions.', a: 'An expectation is a SQL boolean rule on each row. By default violations are recorded in metrics and the row is kept (warn). `ON VIOLATION DROP ROW` removes bad rows, and `ON VIOLATION FAIL UPDATE` stops the update. Metrics for each rule are in the event log, so you can track quality over time.' },
        { q: 'Streaming table vs materialized view?', a: 'A streaming table processes append-only input incrementally, reading each record once, good for ingestion and event data. A materialized view stores a query result and refreshes it, incrementally where possible, good for aggregations and joins that can change. Choose streaming tables for raw to silver and materialized views for gold aggregates.' },
        { q: 'How does APPLY CHANGES work?', a: 'You give the CDC source, the key columns, a sequencing column to order events and what marks a delete. DLT applies inserts, updates and deletes correctly even if events arrive out of order, and can keep history as SCD Type 2 with start and end columns. It replaces custom merge code with deduplication and ordering logic.' },
        { q: 'When would you avoid DLT?', a: 'When you need very custom logic or non-Delta sinks, tight control over clusters and tuning, arbitrary side effects, or when the team already has mature jobs and testing in place. DLT is also tied to Databricks, so portability is lower.' }
      ]
    },
    {
      id: 'workflows', name: 'Workflows (Jobs)', priority: 'must', short: 'Scheduling and orchestrating tasks, with retries and repair runs.',
      overview: 'Databricks Workflows (Lakeflow Jobs) orchestrates tasks as a DAG: notebooks, Python scripts, wheels, SQL, DLT pipelines, dbt, JAR and nested jobs, with dependencies, schedules, triggers, parameters, retries and notifications.',
      whenToUse: ['Orchestrating Databricks-centered pipelines.', 'Use Airflow or ADF when orchestrating many non-Databricks systems.'],
      concepts: ['Job: a set of tasks with dependencies; task types include notebook, Python, SQL, pipeline, dbt, run job, if/else condition and for-each.', 'Job clusters can be shared across tasks in a run to cut start-up time.', 'Triggers: cron schedule, file arrival, table update, continuous.', 'Parameters and task values pass information between tasks (`dbutils.jobs.taskValues`).', 'Retries, timeouts, `max_concurrent_runs`, notifications, and repair run (rerun only failed tasks).', 'Run as a service principal; permissions per job.'],
      useCases: ['Nightly ETL: ingest, transform, quality check, publish', 'File-arrival triggered ingestion'],
      examples: [
        { title: 'Pass values between tasks', lang: 'python', code: `# Task 1
dbutils.jobs.taskValues.set(key="row_count", value=int(df.count()))

# Task 2 (depends on task 1)
n = dbutils.jobs.taskValues.get(taskKey="ingest", key="row_count", default=0, debugValue=0)
if n == 0:
    dbutils.notebook.exit("no data")` },
        { title: 'Trigger a run from the CLI', lang: 'bash', code: `databricks jobs run-now --job-id 12345 --json '{"job_parameters": {"run_date": "2025-06-01"}}'` }
      ],
      pricing: 'Jobs compute bills at the cheaper jobs DBU rate. Orchestration itself has no extra charge.',
      tips: ['Parameterize by run date and make tasks idempotent.', 'Use repair runs instead of rerunning whole jobs.', 'Set timeouts and failure notifications on every job.'],
      related: ['compute', 'cicd', 'dlt', 'auto-loader'],
      interview: [
        { q: 'How do you orchestrate a multi-step pipeline on Databricks?', a: 'Create a job with tasks and dependencies (ingest, transform, quality check, publish), pass the run date as a parameter, run on a shared job cluster or serverless, set retries and timeouts, add failure notifications and run as a service principal. Deploy it with an Asset Bundle so it is versioned.' },
        { q: 'What is a repair run?', a: 'When a job run fails, a repair run reruns only the failed tasks and the tasks downstream of them, reusing the successful results. It saves time and cost compared to restarting everything, which is why tasks should be idempotent.' },
        { q: 'Workflows vs Airflow vs ADF?', a: 'Workflows is native: cheapest and simplest for Databricks tasks, with deep integration (clusters, DLT, Unity Catalog lineage). Airflow suits large estates with many non-Databricks systems and code-based DAGs. ADF is strong for data movement from many sources and for scheduling across Azure services. Many teams use ADF or Airflow as the outer orchestrator and call Databricks jobs.' },
        { q: 'How do you run a job when a file arrives?', a: 'Use a file arrival trigger on a Unity Catalog volume or external location, or run Auto Loader with `availableNow` on a short schedule. Either way, make processing idempotent through checkpoints.' }
      ]
    }
  ]
});
