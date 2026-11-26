GUIDE.add({
  id: 'delta-spark', title: 'Delta Lake & Spark', order: 2,
  services: [
    {
      id: 'delta-lake', name: 'Delta Lake fundamentals', priority: 'must', short: 'ACID tables on object storage: the transaction log, MERGE, time travel.',
      overview: 'Delta Lake is the default table format on Databricks. A Delta table is a folder of Parquet files plus a `_delta_log` directory of JSON commit files (with periodic Parquet checkpoints). The log records which files make up each version of the table, which gives ACID transactions, schema enforcement, time travel and efficient upserts on cloud storage.',
      whenToUse: ['Any table you write on Databricks: bronze, silver and gold layers.', 'Pipelines that need upserts, deletes, concurrent writers and safe reruns.', 'Batch and streaming on the same table.'],
      concepts: ['Transaction log: each commit adds a numbered JSON file listing files added and removed. A checkpoint (Parquet) is written every 10 commits to speed up reads.', 'Optimistic concurrency control: writers do not lock; a conflicting commit fails and retries or raises an exception such as `ConcurrentAppendException`.', 'Schema enforcement rejects writes that do not match; schema evolution (`mergeSchema`, `MERGE WITH SCHEMA EVOLUTION`) adds columns deliberately.', 'Time travel: `VERSION AS OF` and `TIMESTAMP AS OF`; `RESTORE TABLE` rolls back.', '`MERGE INTO` for upsert, delete and SCD logic. Deletion vectors speed up deletes and updates by marking rows instead of rewriting files.', 'Change Data Feed (CDF): row-level change records with `table_changes()`.', 'Constraints (`NOT NULL`, `CHECK`), generated columns, identity columns.', 'Managed vs external tables; shallow and deep `CLONE`.'],
      useCases: ['Idempotent upserts from CDC feeds', 'Rolling back a bad load with `RESTORE`', 'Auditing changes with `DESCRIBE HISTORY`'],
      examples: [
        { title: 'Create a table and look at its history', lang: 'sql', code: `CREATE TABLE main.silver.orders (
  order_id BIGINT NOT NULL,
  customer_id BIGINT,
  amount DECIMAL(12,2),
  order_ts TIMESTAMP,
  CONSTRAINT positive_amount CHECK (amount >= 0)
) USING DELTA;

DESCRIBE HISTORY main.silver.orders;
DESCRIBE DETAIL main.silver.orders;` },
        { title: 'Upsert with MERGE (source must have one row per key)', lang: 'sql', code: `MERGE INTO main.silver.orders AS t
USING (
  SELECT * FROM (
    SELECT *, row_number() OVER (PARTITION BY order_id ORDER BY updated_at DESC) AS rn
    FROM staging_orders) WHERE rn = 1
) AS s
ON t.order_id = s.order_id
WHEN MATCHED AND s.is_deleted THEN DELETE
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;` },
        { title: 'Time travel, restore and change feed', lang: 'sql', code: `SELECT * FROM main.silver.orders VERSION AS OF 12;
SELECT * FROM main.silver.orders TIMESTAMP AS OF '2025-06-01 00:00:00';
RESTORE TABLE main.silver.orders TO VERSION AS OF 12;

ALTER TABLE main.silver.orders SET TBLPROPERTIES (delta.enableChangeDataFeed = true);
SELECT * FROM table_changes('main.silver.orders', 13);   -- adds _change_type, _commit_version` },
        { title: 'PySpark DeltaTable API', lang: 'python', code: `from delta.tables import DeltaTable

target = DeltaTable.forName(spark, "main.silver.orders")
(target.alias("t")
   .merge(updates_df.alias("s"), "t.order_id = s.order_id")
   .whenMatchedUpdateAll()
   .whenNotMatchedInsertAll()
   .execute())` }
      ],
      pricing: 'Delta Lake is open source and free; you pay for the compute and the storage underneath. Extra table versions and unvacuumed files add storage cost.',
      tips: ['Deduplicate the MERGE source first; two source rows matching one target row fails the merge.', 'Put a selective condition (partition or clustering column) in the `ON` clause so MERGE touches fewer files.', 'Keep `VACUUM` retention at least 7 days.', 'Use Unity Catalog managed tables for automatic maintenance (predictive optimization).'],
      related: ['delta-optimize', 'spark-internals', 'streaming', 'unity-catalog', 'dlt'],
      interview: [
        { q: 'What is Delta Lake and how does it give ACID on cloud storage?', a: 'Delta stores data as Parquet files and records every change in an ordered transaction log (`_delta_log`). A write adds data files, then atomically commits a log entry that lists them; readers build a snapshot from the log, so they only see complete commits. Concurrent writers use optimistic concurrency: if two commits conflict, one fails and is retried. That gives atomicity, consistency, isolation and durability without a database server.' },
        { q: 'How does MERGE work and what are common failure causes?', a: '`MERGE` joins the source to the target on a condition, then applies `WHEN MATCHED` and `WHEN NOT MATCHED` actions. Delta finds the touched files, rewrites them (or marks rows with deletion vectors) and commits. A frequent error is that multiple source rows match one target row; dedupe the source, usually with `row_number()` by update time. Others are schema mismatches and concurrent-write conflicts. For speed, add partition or cluster predicates and keep the source small.' },
        { q: 'How do you implement SCD Type 2 with Delta?', a: 'Compare incoming rows to current rows on the business key and a hash of the tracked columns. In one `MERGE`, close the current row (`end_date`, `is_current = false`) when a change exists, and insert the new version. A common trick is to union the changes twice: once with a null merge key so they are inserted as new rows, and once with the real key so they match and close the old row. In DLT, `APPLY CHANGES ... STORED AS SCD TYPE 2` does it declaratively.' },
        { q: 'Explain time travel. How long can you go back?', a: 'You can read an older version by number or timestamp as long as its log entries and data files still exist. Log history is kept for 30 days by default (`delta.logRetentionDuration`) and removed data files are kept for 7 days (`delta.deletedFileRetentionDuration`) until `VACUUM`. So practical time travel is bounded by the shorter of those. Use `RESTORE` to roll back a table, and `DESCRIBE HISTORY` to find versions.' },
        { q: 'Schema enforcement vs schema evolution?', a: 'Enforcement is the default: a write with extra, missing or differently typed columns fails, protecting table quality. Evolution lets a write change the schema on purpose, for example `option("mergeSchema","true")` for new columns or schema evolution in `MERGE`. Type changes are limited. In pipelines I allow additive changes in bronze and silver and alert on anything else.' },
        { q: 'What is Change Data Feed and when would you use it?', a: 'CDF records row-level changes (insert, update_preimage, update_postimage, delete) for each version when `delta.enableChangeDataFeed` is true. Downstream jobs read `table_changes()` or stream the changes to process only what changed, for example to push updates to a serving store or to build gold tables incrementally without scanning the whole silver table.' },
        { q: 'Delta vs plain Parquet?', a: 'Parquet is just a file format: no transactions, no safe concurrent writes, no updates or deletes, and schema changes are manual. Delta adds the log, so you get ACID, upserts, time travel, schema enforcement, data skipping statistics and batch plus streaming on one table. Delta also reads and writes Parquet underneath, so the storage cost is similar.' },
        { q: 'Managed vs external tables?', a: 'A managed table stores its data in the location Unity Catalog manages for the catalog or schema; dropping it removes the data (recoverable for a period with `UNDROP`). An external table points to your own storage path; dropping it removes only the metadata and the files stay. Use managed tables by default for governance and automatic optimization, and external when other systems must own or read the files directly.' },
        { q: 'How are concurrent writes handled?', a: 'Optimistic concurrency. Each writer reads a snapshot, does its work and tries to commit the next version. If another commit touched the same files in a conflicting way, it fails with an exception such as `ConcurrentAppendException` or `ConcurrentDeleteReadException`. Reduce conflicts by partitioning or clustering so writers touch different files, adding explicit predicates to `MERGE`, using row-level concurrency with deletion vectors, and retrying.' },
        { q: 'What does CLONE do?', a: 'A shallow clone creates a new table that references the source files without copying them, which is fast and good for testing or backups of metadata. A deep clone copies the data too, giving an independent table (useful for migrations and disaster recovery, and incremental because repeated deep clones copy only new files).' }
      ]
    },
    {
      id: 'delta-optimize', name: 'Delta performance and maintenance', priority: 'must', short: 'OPTIMIZE, liquid clustering, Z-ORDER, VACUUM, partitioning, data skipping.',
      overview: 'Delta tables need housekeeping. Many small files slow reads, poor layout defeats data skipping, and old files cost storage. Databricks provides compaction, clustering, vacuuming and automatic options to manage this.',
      whenToUse: ['A table has many small files or slow filters.', 'You are choosing between partitioning, Z-ORDER and liquid clustering.'],
      concepts: ['`OPTIMIZE` compacts small files into larger ones (target around 1 GB by default for tables, adjustable).', '`ZORDER BY` co-locates related values in files so data skipping works across several columns.', 'Liquid clustering (`CLUSTER BY`) replaces partitioning and Z-ORDER, can change keys without rewriting the table and works incrementally.', '`VACUUM` deletes unreferenced files older than the retention period (default 7 days).', 'Optimized writes and auto compaction reduce small files at write time.', 'Predictive optimization runs OPTIMIZE and VACUUM automatically on Unity Catalog managed tables.', 'Data skipping uses min/max statistics on the first 32 columns by default (`delta.dataSkippingNumIndexedCols`).', 'Disk cache keeps hot remote files on local SSD; Spark cache keeps DataFrames in memory.'],
      useCases: ['Speeding up a dashboard table', 'Reducing storage after heavy updates', 'Choosing a layout for a multi-TB fact table'],
      examples: [
        { title: 'Liquid clustering', lang: 'sql', code: `CREATE TABLE main.gold.events (
  event_id BIGINT, user_id BIGINT, event_date DATE, payload STRING
) CLUSTER BY (event_date, user_id);

OPTIMIZE main.gold.events;                       -- incremental clustering
ALTER TABLE main.gold.events CLUSTER BY (user_id);   -- change keys without a rewrite` },
        { title: 'Classic layout with Z-ORDER and maintenance', lang: 'sql', code: `OPTIMIZE main.silver.orders ZORDER BY (customer_id);
VACUUM main.silver.orders;                         -- retention 7 days by default
ALTER TABLE main.silver.orders SET TBLPROPERTIES (
  delta.autoOptimize.optimizeWrite = true,
  delta.autoOptimize.autoCompact = true);` },
        { title: 'Dry-run a VACUUM to see what would be deleted', lang: 'sql', code: `VACUUM main.silver.orders DRY RUN;` }
      ],
      pricing: 'OPTIMIZE and VACUUM use compute you pay for. They reduce later query cost and storage. Predictive optimization is billed as serverless compute.',
      tips: ['Do not partition tables under about 1 TB; choose liquid clustering.', 'Never set VACUUM retention below 7 days unless you are sure no reader or stream needs older files.', 'Cluster or Z-ORDER by columns that appear in filters and joins, not by high-volume random IDs only.'],
      related: ['delta-lake', 'spark-tuning', 'unity-catalog'],
      interview: [
        { q: 'Partitioning vs Z-ORDER vs liquid clustering: how do you choose?', a: 'Hive-style partitioning creates a folder per value; it helps for very large tables with a low-cardinality filter column (such as date) but causes small files and rigid layout. Z-ORDER sorts data within files on several columns to improve data skipping but is applied during `OPTIMIZE` and needs the same columns each time. Liquid clustering (`CLUSTER BY`) is the current recommendation: incremental, flexible keys that you can change without rewriting, and works with streaming writes. For new tables I use liquid clustering unless there is a strong reason to partition.' },
        { q: 'What does OPTIMIZE do and when do you run it?', a: 'It rewrites many small files into fewer larger ones (bin-packing) and, with clustering or Z-ORDER, orders data for skipping. Run it after heavy ingestion, after many small streaming commits, or on a schedule for hot tables. On Unity Catalog managed tables, predictive optimization can do it for you. Pair it with optimized writes to avoid creating tiny files in the first place.' },
        { q: 'What does VACUUM do and what is the risk?', a: '`VACUUM` physically deletes data files that are no longer referenced by the latest versions and are older than the retention threshold (7 days by default). The risk is lowering retention: long-running queries, streams that fall behind, and time travel to older versions can fail because their files are gone. Deleted data for compliance (GDPR) is only truly removed after a `VACUUM`.' },
        { q: 'How does data skipping work?', a: 'Delta stores min and max values (and null counts) per file for the first columns (32 by default). When a query filters on a column, files whose range cannot match are skipped. It works best when data is clustered or sorted by that column. Put frequently filtered columns early in the schema or adjust the number of indexed columns, and avoid collecting stats on long strings.' },
        { q: 'A table has millions of small files. What do you do?', a: 'Find the cause: too many tiny streaming micro-batches, over-partitioning, or many small concurrent writes. Fix at write time with optimized writes, auto compaction, larger trigger intervals and lower partition cardinality. Fix existing data with `OPTIMIZE`. Consider liquid clustering instead of partitions.' },
        { q: 'Spark cache vs disk cache?', a: 'Spark `cache()` or `persist()` stores a DataFrame in executor memory (and optionally disk) for reuse within an application and is cleared when it ends. The Databricks disk cache automatically copies remote Parquet and Delta files to local SSD on workers, speeding repeated reads across queries without code changes. They serve different purposes, and the disk cache needs SSD-backed instance types.' },
        { q: 'What are deletion vectors?', a: 'Instead of rewriting a Parquet file when a few rows are deleted or updated, Delta records the removed row positions in a small deletion vector file. Writes become much faster, and reads apply the vectors. `OPTIMIZE` later rewrites files to purge them physically.' }
      ]
    },
    {
      id: 'spark-internals', name: 'Spark internals', priority: 'must', short: 'Jobs, stages, tasks, shuffles, lazy evaluation and the Catalyst optimizer.',
      overview: 'Databricks runs Apache Spark. Interviewers expect you to explain how Spark executes a query, what causes a shuffle, and how to read the Spark UI, because every tuning decision depends on that.',
      whenToUse: ['You need to explain why a job is slow or fails.', 'You are choosing between joins, repartition and caching strategies.'],
      concepts: ['Driver plans and coordinates; executors run tasks in parallel on partitions.', 'Transformations are lazy; an action (`count`, `write`, `collect`, `show`) triggers a job.', 'Narrow transformations (`filter`, `select`, `map`) need no data movement; wide ones (`groupBy`, `join`, `distinct`, `orderBy`) cause a shuffle and a stage boundary.', 'Job → stages (split at shuffles) → tasks (one per partition).', 'Catalyst optimizer: logical plan, optimization (predicate pushdown, column pruning), physical plan. Tungsten: efficient memory and code generation. Photon: native vectorized engine.', 'Adaptive Query Execution (AQE): at runtime coalesces shuffle partitions, switches join strategies and splits skewed partitions.', 'Join strategies: broadcast hash join, sort-merge join, shuffle hash join, broadcast nested loop. Default broadcast threshold is 10 MB (`spark.sql.autoBroadcastJoinThreshold`).', '`spark.sql.shuffle.partitions` defaults to 200; `spark.sql.files.maxPartitionBytes` to 128 MB.'],
      useCases: ['Explaining a query plan with `df.explain()`', 'Reading stages and tasks in the Spark UI'],
      examples: [
        { title: 'Inspect the plan', lang: 'python', code: `df = spark.table("main.silver.orders").join(spark.table("main.silver.customers"), "customer_id")
df.explain("formatted")   # look for BroadcastHashJoin vs SortMergeJoin, Exchange (shuffle), PushedFilters` },
        { title: 'Force a broadcast join', lang: 'python', code: `from pyspark.sql.functions import broadcast
result = orders.join(broadcast(small_dim), "dim_id")` },
        { title: 'repartition vs coalesce', lang: 'python', code: `df.repartition(200, "customer_id")   # full shuffle, evenly sized, hash by column
df.coalesce(10)                       # no shuffle, only reduces partitions` }
      ],
      pricing: 'Not applicable. Efficiency here translates directly into fewer DBUs and VM hours.',
      tips: ['Read `explain()` and the SQL tab of the Spark UI before changing configs.', 'Use built-in functions rather than Python UDFs.', 'Leave AQE enabled (it is on by default).'],
      related: ['spark-tuning', 'delta-optimize', 'pyspark-coding', 'compute'],
      interview: [
        { q: 'Explain how Spark executes a job.', a: 'Your code builds a logical plan lazily. When an action runs, Catalyst optimizes the plan and creates a physical plan, which Spark splits into stages at shuffle boundaries. Each stage is a set of tasks, one per partition, scheduled on executor cores. Results of a shuffle are written to local disk and fetched by the next stage. The driver tracks all of this.' },
        { q: 'Narrow vs wide transformations?', a: 'A narrow transformation produces each output partition from one input partition (`select`, `filter`, `withColumn`, `map`) and is pipelined without moving data. A wide transformation (`groupBy`, `join`, `distinct`, `repartition`, `orderBy`) needs data from many partitions, so Spark shuffles data across the network and starts a new stage. Minimizing and tuning shuffles is most of Spark performance work.' },
        { q: 'What join strategies does Spark use and how do you influence them?', a: 'Broadcast hash join sends a small table to every executor and avoids shuffling the large side; used when one side is under the broadcast threshold (10 MB by default, higher via config or a `broadcast()` hint). Sort-merge join shuffles and sorts both sides and is the default for large tables. Shuffle hash join builds a hash map per partition. Broadcast nested loop handles non-equi joins. AQE can switch to broadcast at runtime when statistics show a side is small.' },
        { q: 'repartition vs coalesce?', a: '`repartition(n)` does a full shuffle and can increase or decrease partitions, producing even sizes, optionally by column. `coalesce(n)` only merges existing partitions without a shuffle, so it can only reduce and can leave uneven sizes. Use `coalesce` before writing to cut output files cheaply, and `repartition` to rebalance skewed or to increase parallelism.' },
        { q: 'What is AQE and what does it do?', a: 'Adaptive Query Execution re-optimizes the plan during execution using real shuffle statistics. It coalesces many small shuffle partitions, converts a sort-merge join to a broadcast join when a side turns out small, and splits skewed partitions in a join. It is enabled by default and removes much manual tuning of `shuffle.partitions`.' },
        { q: 'Transformations vs actions? What is lazy evaluation good for?', a: 'Transformations describe a computation; actions run it. Laziness lets Spark see the whole pipeline, then push filters down, prune columns, combine steps and pick join strategies before reading data. A side effect is that errors often appear only at the action, and the same transformation chain re-executes for each action unless you cache.' },
        { q: 'Why are Python UDFs slow and what is the alternative?', a: 'A regular Python UDF moves rows between the JVM and a Python process one at a time and blocks optimizations. Prefer built-in functions and SQL expressions. If you need custom Python, use pandas UDFs (Arrow-based, vectorized) or Spark SQL higher-order functions. Photon and Catalyst cannot optimize inside a UDF.' },
        { q: 'What is the difference between Photon and regular Spark?', a: 'Photon is Databricks native vectorized query engine written in C++. It accelerates SQL and DataFrame operations on Delta and Parquet (scans, joins, aggregations, writes) without code changes, costing more DBUs per hour but often finishing faster. It does not speed up Python UDFs or RDD code.' }
      ]
    },
    {
      id: 'spark-tuning', name: 'Spark performance tuning', priority: 'must', short: 'Skew, small files, shuffles, memory errors and how to diagnose them.',
      overview: 'A systematic approach to slow or failing Spark jobs: find the stage that dominates, identify whether the problem is skew, shuffle volume, spill, small files or the cluster size, and then fix the cause instead of just adding nodes.',
      whenToUse: ['A job got slower or fails with out-of-memory errors.', 'You are asked "how would you optimize this pipeline?"'],
      concepts: ['Spark UI: Jobs, Stages, Tasks (look at min, median and max duration), SQL/DataFrame tab for the plan and metrics, Executors tab for GC and spill.', 'Skew: a few tasks take far longer than the median. Spill: memory not enough, data written to disk. GC time high: memory pressure.', 'Small files: thousands of tiny tasks and slow listing. Large shuffles: big shuffle read and write sizes.', 'Fixes: AQE skew handling, broadcast joins, salting, filtering earlier, column pruning, fewer wide transformations, right file sizes, caching reused data, larger or memory-optimized workers.', 'Driver OOM usually comes from `collect()`, `toPandas()` or a huge broadcast; executor OOM from big partitions or skew.'],
      useCases: ['Reducing a nightly job from hours to minutes', 'Fixing OOM in a join'],
      examples: [
        { title: 'Salting a skewed join key', lang: 'python', code: `from pyspark.sql import functions as F

N = 16
big = big.withColumn("salt", (F.rand() * N).cast("int"))
small = small.withColumn("salt", F.explode(F.array([F.lit(i) for i in range(N)])))
joined = big.join(small, ["key", "salt"]).drop("salt")` },
        { title: 'Common session settings for tuning', lang: 'python', code: `spark.conf.set("spark.sql.adaptive.enabled", "true")                 # default on
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")        # default on
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", 100 * 1024 * 1024)   # 100 MB, if executors can hold it
spark.conf.set("spark.sql.files.maxPartitionBytes", 128 * 1024 * 1024)` },
        { title: 'Find the hot keys', lang: 'python', code: `(df.groupBy("customer_id").count()
   .orderBy(F.desc("count")).show(20))` }
      ],
      pricing: 'Tuning reduces DBUs and VM time directly. Adding workers to a skewed job costs more without helping.',
      tips: ['Fix the data layout and plan before resizing the cluster.', 'Filter and select early so less data enters the shuffle.', 'Avoid `collect()` on large data.', 'Check that the cluster uses enough cores for the partition count, without hundreds of idle cores.'],
      related: ['spark-internals', 'delta-optimize', 'compute', 'cost-monitoring'],
      interview: [
        { q: 'A job is slow. Walk me through how you investigate.', a: 'Open the Spark UI and find the longest stage. Check whether the time is in reading (many small files, no filter pushdown), a shuffle (large shuffle read/write), or a few long tasks (skew). Look at spill and GC in the Executors tab. Then fix the cause: prune and filter earlier, broadcast the small side, handle skew, compact files, replace UDFs, and only then resize the cluster or switch instance types.' },
        { q: 'How do you recognize and fix data skew?', a: 'In the stage view, a few tasks have much larger input or duration than the median. Count rows per key to confirm. Fixes: let AQE split skewed partitions, broadcast one side, salt the hot key so it spreads over several partitions and aggregate in two steps, filter and handle hot keys separately, or change the join or grouping key.' },
        { q: 'Your job fails with OutOfMemoryError. Driver or executor?', a: 'Check the error and where it happens. Driver OOM comes from `collect()`, `toPandas()`, large broadcast variables or too many partitions in metadata; avoid collecting, write results to storage and limit broadcasts. Executor OOM comes from huge or skewed partitions, large aggregations or caching; increase partitions, fix skew, use memory-optimized workers, and avoid caching more than needed.' },
        { q: 'How do you choose the number of partitions?', a: 'Aim for partitions of about 100 to 200 MB and at least a few times the total cores so all cores stay busy. For reads this comes from `maxPartitionBytes`; for shuffles AQE coalesces from `shuffle.partitions`. Too few partitions cause spill and idle cores; too many cause scheduling overhead and small output files.' },
        { q: 'When should you cache a DataFrame?', a: 'When it is reused several times in the same job after an expensive computation, and it fits in memory (or you accept spill to disk). Do not cache data used once, and unpersist when done. Delta tables read repeatedly across queries benefit from the automatic disk cache instead.' },
        { q: 'How do you reduce shuffle cost?', a: 'Filter and select before joins and aggregations, broadcast small tables, pre-aggregate before joining, avoid unnecessary `distinct` and `orderBy`, use `reduce`-style aggregations that combine locally first, bucket or cluster data on the join key when repeatedly joining the same tables, and keep AQE on.' },
        { q: 'How would you speed up a pipeline that reads thousands of small input files?', a: 'Compact the source if you control it. Otherwise rely on Spark file coalescing (`maxPartitionBytes` and `openCostInBytes`), use Auto Loader with batch limits, and write the result as larger Delta files with optimized writes. Listing cost drops further with file notification mode on Auto Loader.' }
      ]
    },
    {
      id: 'pyspark-coding', name: 'PySpark coding patterns', priority: 'must', short: 'The DataFrame and SQL patterns asked in coding rounds.',
      overview: 'Most Databricks interviews include a live PySpark or SQL exercise. These patterns cover the common ones: deduplication, top N per group, running totals, sessionization, flattening nested data and incremental detection.',
      whenToUse: ['Preparing for the coding round.', 'Reviewing window functions and DataFrame APIs.'],
      concepts: ['Window functions: `row_number`, `rank`, `dense_rank`, `lag`, `lead`, running `sum` with a frame.', 'Joins: inner, left, left anti (rows with no match), left semi (rows with a match).', 'Nested data: `explode`, `from_json`, `col("a.b")`, `inline`.', 'Aggregation: `groupBy().agg()`, `pivot`, `collect_list`, `approx_count_distinct`.', 'Null handling: `coalesce`, `na.fill`, `isNull`, null-safe equality `eqNullSafe`.'],
      useCases: ['Latest record per key', 'Detect new or changed rows between loads'],
      examples: [
        { title: 'Keep the latest row per key', lang: 'python', code: `from pyspark.sql import functions as F, Window

w = Window.partitionBy("customer_id").orderBy(F.col("updated_at").desc())
latest = (df.withColumn("rn", F.row_number().over(w))
            .filter("rn = 1").drop("rn"))` },
        { title: 'Top 3 products per category by revenue', lang: 'python', code: `w = Window.partitionBy("category").orderBy(F.desc("revenue"))
top3 = (sales.groupBy("category", "product").agg(F.sum("amount").alias("revenue"))
             .withColumn("rank", F.dense_rank().over(w))
             .filter("rank <= 3"))` },
        { title: 'Running total and previous value', lang: 'python', code: `w = Window.partitionBy("account").orderBy("txn_date").rowsBetween(Window.unboundedPreceding, Window.currentRow)
out = (tx.withColumn("balance", F.sum("amount").over(w))
         .withColumn("prev_amount", F.lag("amount").over(Window.partitionBy("account").orderBy("txn_date"))))` },
        { title: 'Sessionize events (30-minute inactivity gap)', lang: 'python', code: `w = Window.partitionBy("user_id").orderBy("event_ts")
e = events.withColumn("prev_ts", F.lag("event_ts").over(w))
e = e.withColumn("new_session",
      (F.col("event_ts").cast("long") - F.col("prev_ts").cast("long") > 1800).cast("int"))
e = e.withColumn("session_id", F.sum(F.coalesce("new_session", F.lit(1))).over(w))` },
        { title: 'Parse JSON and explode an array', lang: 'python', code: `from pyspark.sql.types import StructType, StructField, StringType, ArrayType, IntegerType

schema = StructType([
  StructField("order_id", StringType()),
  StructField("items", ArrayType(StructType([
      StructField("sku", StringType()), StructField("qty", IntegerType())])))])

parsed = raw.withColumn("j", F.from_json("payload", schema))
items = (parsed.select("j.order_id", F.explode("j.items").alias("item"))
               .select("order_id", "item.sku", "item.qty"))` },
        { title: 'New and changed rows between two loads (anti join)', lang: 'python', code: `new_rows = today.join(yesterday, "id", "left_anti")
changed = (today.alias("t").join(yesterday.alias("y"), "id")
                .filter(F.col("t.row_hash") != F.col("y.row_hash")).select("t.*"))` },
        { title: 'Pivot monthly sales', lang: 'python', code: `pivoted = (sales.groupBy("product")
                .pivot("month", ["Jan", "Feb", "Mar"])
                .agg(F.sum("amount")))` },
        { title: 'Consecutive days streak (gaps and islands)', lang: 'python', code: `w = Window.partitionBy("user_id").orderBy("login_date")
d = (logins.dropDuplicates(["user_id", "login_date"])
           .withColumn("grp", F.datediff("login_date", F.lit("1970-01-01")) - F.row_number().over(w)))
streaks = d.groupBy("user_id", "grp").agg(F.count("*").alias("days"), F.min("login_date").alias("start"))` },
        { title: 'Pandas UDF instead of a row-wise UDF', lang: 'python', code: `import pandas as pd
from pyspark.sql.functions import pandas_udf

@pandas_udf("double")
def to_celsius(f: pd.Series) -> pd.Series:
    return (f - 32) * 5.0 / 9.0

df.withColumn("c", to_celsius("fahrenheit"))` },
        { title: 'Write partitioned output with controlled file count', lang: 'python', code: `(df.repartition("event_date")
   .write.mode("overwrite")
   .option("partitionOverwriteMode", "dynamic")
   .partitionBy("event_date")
   .format("delta").saveAsTable("main.silver.events"))` }
      ],
      pricing: 'Not applicable.',
      tips: ['State assumptions about duplicates and nulls before coding.', 'Prefer built-in functions to UDFs.', 'Explain the complexity: which steps shuffle.'],
      related: ['spark-internals', 'delta-lake', 'spark-tuning'],
      interview: [
        { q: 'row_number vs rank vs dense_rank?', a: '`row_number` gives unique sequential numbers even for ties. `rank` gives tied rows the same number and then skips (1, 1, 3). `dense_rank` gives tied rows the same number without gaps (1, 1, 2). Use `row_number` to pick exactly one row per key and `dense_rank` for "top N distinct values".' },
        { q: 'left anti join vs left semi join vs NOT IN?', a: 'A left semi join returns left rows that have a match on the right (like `EXISTS`). A left anti join returns left rows with no match (like `NOT EXISTS`). `NOT IN` returns nothing if the subquery contains a null, so prefer anti join or `NOT EXISTS` for safety and speed.' },
        { q: 'groupBy vs window function?', a: '`groupBy` collapses rows to one per group. A window function computes over related rows but keeps every input row, which is what you want for rankings, running totals and comparisons with the previous row. Both shuffle by the partition key.' },
        { q: 'How do you remove duplicates? What is the difference between `dropDuplicates` and a window approach?', a: '`dropDuplicates(cols)` keeps an arbitrary row per key, which is fine for exact duplicates. If you need a specific row, such as the most recent, use `row_number()` over a window ordered by the timestamp and keep rank 1.' },
        { q: 'How would you find the second highest salary per department?', a: 'Use `dense_rank()` over `partitionBy("dept").orderBy(desc("salary"))` and filter rank equals 2. `dense_rank` handles ties correctly; `row_number` would skip a tied second value.' }
      ]
    }
  ]
});
