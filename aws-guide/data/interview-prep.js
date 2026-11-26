AWSGUIDE.add({
  id: 'prep', title: 'Interview Prep', order: 0,
  services: [
    {
      id: 'prep-guide', name: 'How to prepare', short: 'What a 4-year data engineer is expected to know, and a study order.',
      sections: [
        {
          title: 'What interviewers expect at 4 years',
          list: [
            'You have owned pipelines end to end: ingestion, transformation, orchestration, monitoring and on-call.',
            'You explain trade-offs, not definitions. "Why Glue and not EMR here?" matters more than "What is Glue?".',
            'You can debug: slow jobs, skew, small files, failed loads, schema changes, duplicate data.',
            'You think about cost, security and data quality without being asked.',
            'You can design a pipeline on a whiteboard from requirements, and size it with rough numbers.'
          ]
        },
        {
          title: 'Typical interview rounds',
          table: {
            head: ['Round', 'What is tested', 'Where to practice here'],
            rows: [
              ['SQL and Python', 'Window functions, joins, dedupe, sessionization, PySpark transformations', 'Not covered here. Practice separately every day.'],
              ['AWS service depth', 'Glue, S3, Athena, Redshift, Kinesis, EMR, IAM, Step Functions', 'Service pages and "All interview Q&A"'],
              ['System design', 'Batch, streaming and lake/warehouse architecture', 'Design pages in this section'],
              ['Project deep dive', 'Your real pipelines, decisions, failures, numbers', 'Section below'],
              ['Behavioral', 'Ownership, conflict, incident handling, mentoring', 'Section below']
            ]
          }
        },
        {
          title: 'Study order (about 3 to 4 weeks)',
          ordered: true,
          list: [
            'Week 1: S3 (layout, formats, partitions, lifecycle), IAM, Glue (jobs, catalog, crawlers, bookmarks), Athena.',
            'Week 2: Redshift (dist and sort keys, COPY, WLM, Spectrum), EMR and Spark tuning, Lake Formation.',
            'Week 3: Streaming (Kinesis, MSK, Firehose), DMS and CDC, orchestration (Step Functions, MWAA), Lambda and SQS.',
            'Week 4: Design pages, comparisons, scenario questions, then mock interviews out loud.'
          ]
        },
        {
          title: 'A framework for any design question',
          ordered: true,
          list: [
            'Clarify: data sources, volume per day, growth, latency (batch, near real time, real time), consumers, SLA, budget.',
            'Ingest: how data arrives (files, CDC, API, events) and the landing zone.',
            'Store: raw, curated and serving layers; file format; partitioning.',
            'Process: engine choice (Glue, EMR, Lambda, Redshift SQL) and why.',
            'Serve: who queries it and with what (Athena, Redshift, QuickSight, APIs).',
            'Operate: orchestration, retries, idempotency, monitoring, alerting, data quality.',
            'Secure and optimize: IAM, encryption, Lake Formation, PII handling, cost levers.'
          ]
        },
        {
          title: 'Talking about your projects',
          text: 'Prepare three stories with numbers. For each: the business problem, the architecture and why you chose it, your specific contribution, one hard problem and how you solved it, and the measurable result.',
          list: [
            'Numbers to know: daily data volume, row counts, job runtime before and after, cost saved, SLA met, number of consumers.',
            'Prepare one failure or incident: what broke, how you detected it, the fix, and what you changed to prevent a repeat.',
            'Prepare one optimization story, for example reducing a Glue job from 2 hours to 25 minutes by fixing small files and skew.',
            'Be honest about what you did yourself versus what the team did.'
          ]
        },
        {
          title: 'Good questions to ask the interviewer',
          list: [
            'How do you handle data quality failures and who owns them?',
            'What is the split between batch and streaming, and what are the latency expectations?',
            'How are pipelines deployed and tested (CI/CD, IaC)?',
            'What does on-call look like for the data platform?'
          ]
        }
      ]
    },
    {
      id: 'compare', name: 'Service comparisons', short: 'Side-by-side tables for the "X vs Y" questions.',
      sections: [
        {
          title: 'Processing: Glue vs EMR vs Lambda vs Redshift SQL',
          table: {
            head: ['', 'Glue', 'EMR', 'Lambda', 'Redshift SQL'],
            rows: [
              ['Model', 'Serverless Spark / Python', 'Managed clusters, EKS or Serverless', 'Serverless functions', 'In-warehouse SQL (ELT)'],
              ['Best for', 'Routine ETL, low ops', 'Heavy, tuned or custom big data jobs', 'Small events and light transforms', 'Transforms on data already loaded'],
              ['Limits', 'Less tuning control', 'More to operate', '15 min, 10 GB memory', 'Needs data in the warehouse'],
              ['Cost shape', 'Per DPU-second', 'EC2 + surcharge, Spot friendly', 'Per ms and request', 'Cluster or RPU time']
            ]
          }
        },
        {
          title: 'Streaming and messaging: Kinesis vs MSK vs SQS vs SNS vs EventBridge',
          table: {
            head: ['', 'Kinesis Streams', 'MSK (Kafka)', 'SQS', 'SNS', 'EventBridge'],
            rows: [
              ['Pattern', 'Ordered stream, replay', 'Ordered log, replay, large ecosystem', 'Queue, one consumer gets each message', 'Pub/sub fan-out', 'Event routing by rules'],
              ['Ordering', 'Per shard', 'Per partition', 'FIFO queues only', 'FIFO topics only', 'Not guaranteed'],
              ['Replay', 'Yes (retention 1 to 365 days)', 'Yes (configurable)', 'No, messages are deleted', 'No', 'Archive and replay'],
              ['Ops', 'Low', 'Medium to high', 'None', 'None', 'None'],
              ['Use when', 'AWS-native streaming analytics', 'Kafka ecosystem, very high scale', 'Buffer and decouple work', 'Notify many subscribers', 'React to AWS and app events']
            ]
          }
        },
        {
          title: 'Query and storage: Athena vs Redshift vs Redshift Spectrum vs DynamoDB vs RDS',
          table: {
            head: ['', 'Athena', 'Redshift', 'DynamoDB', 'RDS / Aurora'],
            rows: [
              ['Type', 'Serverless SQL on S3', 'MPP data warehouse', 'Key-value NoSQL', 'Relational OLTP'],
              ['Workload', 'Ad-hoc, infrequent analytics', 'Repeated BI, large joins', 'Millisecond lookups by key', 'Transactions and joins on app data'],
              ['Pricing', 'Per TB scanned', 'Per node or RPU time', 'Per request or capacity', 'Per instance and storage'],
              ['Avoid for', 'Low-latency app queries', 'High-rate single-row writes', 'Ad-hoc analytics, joins', 'Petabyte-scale analytics']
            ]
          }
        },
        {
          title: 'Orchestration: Step Functions vs MWAA vs Glue Workflows vs EventBridge Scheduler',
          table: {
            head: ['', 'Step Functions', 'MWAA (Airflow)', 'Glue Workflows', 'EventBridge Scheduler'],
            rows: [
              ['Definition', 'JSON state machine', 'Python DAG', 'Console or API graph of Glue items', 'Cron or rate rule'],
              ['Strength', 'Serverless, event driven, retries, 200+ integrations', 'Backfills, rich scheduling, large ecosystem', 'Simple chains of Glue jobs', 'Trigger things on a schedule'],
              ['Weakness', 'No native backfill concept', 'Always-on cost and ops', 'Glue only', 'No dependencies or state']
            ]
          }
        },
        {
          title: 'File formats: CSV vs JSON vs Parquet vs ORC vs Avro',
          table: {
            head: ['', 'CSV / JSON', 'Parquet', 'ORC', 'Avro'],
            rows: [
              ['Layout', 'Row, text', 'Columnar', 'Columnar', 'Row, binary'],
              ['Schema', 'None / loose', 'Embedded', 'Embedded', 'Embedded, strong evolution'],
              ['Best for', 'Interchange, small data', 'Analytics in Spark, Athena, Redshift', 'Hive and Presto heavy stacks', 'Streaming, Kafka, row-by-row writes'],
              ['Compression', 'Poor unless gzipped', 'Very good', 'Very good', 'Good']
            ]
          }
        },
        {
          title: 'Table formats: Iceberg vs Hudi vs Delta',
          text: 'All three add ACID transactions, upserts and deletes, schema evolution and time travel on top of Parquet in S3. Iceberg has the broadest AWS support (Athena, Glue, EMR, Redshift) and is the default recommendation on AWS. Hudi is strong for record-level upserts and incremental pulls. Delta is closely tied to Databricks and Spark, with growing support elsewhere. Say which one your team used and why.'
        },
        {
          title: 'S3 storage classes',
          table: {
            head: ['Class', 'Use', 'Retrieval'],
            rows: [
              ['Standard', 'Frequently accessed data', 'Immediate'],
              ['Intelligent-Tiering', 'Unknown or changing access patterns', 'Immediate, automatic tiering'],
              ['Standard-IA / One Zone-IA', 'Infrequent access, backups', 'Immediate, retrieval fee'],
              ['Glacier Instant Retrieval', 'Archive read a few times a year', 'Milliseconds'],
              ['Glacier Flexible Retrieval', 'Archive', 'Minutes to hours'],
              ['Glacier Deep Archive', 'Long-term compliance', 'Within 12 hours (standard) or 48 hours (bulk)']
            ]
          }
        }
      ]
    },
    {
      id: 'design-batch', name: 'Design: batch ETL pipeline', short: 'Daily files and database data into a curated lake and warehouse.',
      sections: [
        {
          title: 'Scenario',
          text: '"Design a daily pipeline that ingests sales data from an on-premises database and partner CSV files, cleans it, and makes it available to analysts by 7 AM. Volume is about 200 GB a day."'
        },
        {
          title: 'Architecture',
          code: {
            lang: 'text', code: 'Sources                 Ingest              Lake (S3)                    Serve\n-------                 ------              ---------                    -----\nOLTP database  --DMS--> s3://lake/raw/  --Glue--> s3://lake/curated/ --> Athena\nPartner CSV    --SFTP/S3-> (bronze)      (silver)  (Parquet, partitioned) --> Redshift (marts)\n                                           |                             --> QuickSight\n                          EventBridge -> Step Functions / MWAA (orchestrate, retry, alert)\n                          Glue Data Catalog + Lake Formation (schema, access)\n                          CloudWatch alarms -> SNS (failure and freshness alerts)'
          }
        },
        {
          title: 'Key decisions to explain',
          list: [
            '`Raw` zone keeps data as received (immutable, partitioned by load date) so you can always replay.',
            '`Curated` zone holds cleaned Parquet with schema enforcement, deduplication and partitioning by business date.',
            'Glue for transforms at this volume; EMR if tuning and Spot savings matter. Say why.',
            'Idempotent jobs: overwrite one partition per run, or `MERGE` into Iceberg, so reruns do not duplicate rows.',
            'Data quality gate between raw and curated: row counts, null checks, uniqueness, referential checks (Glue Data Quality or Deequ). Fail or quarantine bad records.',
            'Load marts into Redshift with `COPY` and a staging table, or let analysts query the curated layer with Athena.',
            'Orchestration with dependencies, retries with backoff, and an alert if the 7 AM SLA is at risk.'
          ]
        },
        {
          title: 'Numbers to mention',
          list: [
            '200 GB per day of CSV becomes roughly 40 to 60 GB of Parquet (compression varies).',
            'Target Parquet file size of 128 MB to 1 GB to avoid small files.',
            'A Glue job with 10 to 20 G.1X workers typically finishes this in well under an hour. Explain how you would verify with a test run.'
          ]
        }
      ],
      interview: [
        { q: 'How do you make this pipeline idempotent?', a: 'Each run processes one logical date. It reads only that date from raw and overwrites the matching partition in curated (dynamic partition overwrite), or merges on a primary key into an Iceberg table. Nothing depends on the current time, so rerunning the same date gives the same result with no duplicates.' },
        { q: 'A partner sends a late file for yesterday. What happens?', a: 'Because processing is keyed by business date and idempotent, I reprocess that partition and downstream marts for that date. If dashboards must not change silently, I record the late arrival in a log table and notify consumers. For Iceberg tables I can also use time travel to compare before and after.' },
        { q: 'The source adds a column. How does the pipeline cope?', a: 'Raw stays untouched. In curated, use a format that tolerates added columns (Parquet or Iceberg with schema evolution) and an explicit schema check that alerts on unexpected changes rather than failing silently. For removed or retyped columns, fail the run and alert so a human decides. Data contracts with the source team reduce surprises.' },
        { q: 'How would you reduce the cost of this pipeline?', a: 'Convert to compressed Parquet, partition on the common filter, compact small files, use S3 lifecycle rules on raw data, right-size Glue workers (and use auto scaling), use Glue Flex or EMR Spot for non-urgent jobs, use Redshift Serverless or pause clusters off-hours, and stop crawlers from running more often than needed.' }
      ],
      related: ['glue', 's3', 'athena', 'redshift', 'dms', 'step-functions', 'mwaa']
    },
    {
      id: 'design-streaming', name: 'Design: real-time streaming pipeline', short: 'Clickstream or events to dashboards and the lake in seconds.',
      sections: [
        {
          title: 'Scenario',
          text: '"Design a pipeline for website clickstream events, about 20,000 events per second at peak. Product needs a dashboard updated within a minute, and analysts need the full history in the lake."'
        },
        {
          title: 'Architecture',
          code: {
            lang: 'text', code: 'Web/App --> API Gateway / SDK --> Kinesis Data Streams (or MSK)\n                                     |\n              +----------------------+----------------------+\n              |                      |                      |\n        Firehose -> S3           Lambda / Flink          Enhanced fan-out\n   (Parquet, buffered,        (enrich, aggregate)        consumer (fraud etc.)\n    partitioned by hour)            |\n              |                  DynamoDB / OpenSearch / Redshift streaming ingestion\n          Athena / Glue                 |\n          (history)                 Dashboard (< 1 min)\n\n  Dead-letter: failed records -> SQS / S3 error prefix, with CloudWatch alarms'
          }
        },
        {
          title: 'Sizing',
          list: [
            'Assume 1 KB per event: 20,000 events per second is about 20 MB/s in.',
            'Each shard accepts 1 MB/s or 1,000 records/s, whichever is hit first. Here both limits give 20 shards, so plan about 25 for headroom, or use on-demand mode.',
            'Each shard offers 2 MB/s out shared across standard consumers; use enhanced fan-out for several independent consumers.'
          ]
        },
        {
          title: 'Key decisions to explain',
          list: [
            'Stream choice: Kinesis for AWS-native simplicity, MSK if Kafka is already the standard.',
            'Partition key with high cardinality (user or session id) to avoid hot shards.',
            'Firehose to land data in S3 as Parquet with buffering (for example 128 MB or 5 minutes) and dynamic partitioning, so the lake gets large files, not millions of tiny ones.',
            'Idempotent consumers and a deduplication key, because delivery is at least once.',
            'Handling late and out-of-order events with event time and watermarks (Managed Service for Apache Flink or Spark Structured Streaming).',
            'Backpressure and failures: batch size, retries with backoff, bisect on error, dead-letter destination.',
            'Replay: stream retention plus raw copy in S3.'
          ]
        }
      ],
      interview: [
        { q: 'How do you avoid hot shards?', a: 'Choose a partition key with many evenly distributed values, such as user or session id, not a country or a constant. If one key is genuinely hot, add a random suffix and aggregate downstream. Watch `WriteProvisionedThroughputExceeded` per shard and use on-demand mode or split shards when needed.' },
        { q: 'How do you get exactly-once results from an at-least-once stream?', a: 'Make the consumer idempotent. Give every event a unique id and write with upsert or `MERGE` on that id, or deduplicate within a window in the stream processor. Use checkpoints (KCL with DynamoDB, Flink state) so a restart resumes from the last committed position.' },
        { q: 'How do you handle late or out-of-order events?', a: 'Aggregate by event time, not arrival time. Use watermarks to say how late data may be (for example 10 minutes), keep window state until then, and update results when late events arrive. Events later than the watermark go to a side output or are corrected by a periodic batch recompute from the lake (a lambda-style correction).' },
        { q: 'The consumer Lambda is falling behind. What do you do?', a: 'Check the iterator age metric. Raise the batch size, increase the parallelization factor (up to 10 concurrent batches per shard), make the function faster or move heavy work out, add shards for more parallelism, and enable bisect-on-error plus an on-failure destination so one bad record does not block a shard.' },
        { q: 'Why not write directly from the stream to the warehouse row by row?', a: 'Warehouses are built for bulk loads. Row-level inserts are slow and costly. Instead buffer micro-batches to S3 and `COPY`, or use Redshift streaming ingestion from Kinesis or MSK, which loads into a materialized view with low latency.' }
      ],
      related: ['kinesis', 'msk', 'lambda', 's3', 'redshift', 'dynamodb']
    },
    {
      id: 'design-lakehouse', name: 'Design: data lake and warehouse', short: 'Zones, formats, governance and serving layers for a company-wide platform.',
      sections: [
        {
          title: 'Scenario',
          text: '"Design a central data platform for a company with several business units. It must support BI, data science and ad-hoc analysis, with PII controls and cost visibility."'
        },
        {
          title: 'Architecture',
          code: {
            lang: 'text', code: 'Sources: OLTP (DMS CDC), SaaS APIs (AppFlow), events (Kinesis/MSK), files\n   |\n   v\nS3 raw (bronze)  -->  S3 cleaned (silver, Iceberg/Parquet)  -->  S3 curated (gold, marts)\n   |                        |                                        |\n   +---- Glue Data Catalog + Lake Formation (access, tags, audit) ----+\n   |                                                                  |\n Glue / EMR / Redshift SQL transforms, orchestrated by MWAA or Step Functions\n                                                                      |\n                      Athena (ad-hoc)   Redshift (BI marts)   SageMaker (ML)   QuickSight'
          }
        },
        {
          title: 'Key decisions to explain',
          list: [
            'Medallion layers (bronze, silver, gold) with clear ownership and quality rules per layer.',
            'Open table format (Iceberg) for upserts, deletes, schema evolution and time travel on S3.',
            'One Glue Data Catalog as the shared metadata layer; Lake Formation tags for PII and domain-level access.',
            'Separate AWS accounts for producers and consumers, with cross-account sharing instead of copies.',
            'Encryption with KMS, S3 Block Public Access, VPC endpoints, CloudTrail data events for sensitive buckets.',
            'Cost visibility through tagging, S3 lifecycle rules, Athena workgroups with scan limits, and Redshift usage limits.',
            'Data quality checks and lineage so consumers trust the gold layer.'
          ]
        }
      ],
      interview: [
        { q: 'Data lake, data warehouse or lakehouse? How do you decide?', a: 'A lake (S3) stores any format cheaply and suits raw, semi-structured and ML data. A warehouse (Redshift) gives fast, governed SQL on modeled data. A lakehouse uses open table formats like Iceberg so the same S3 data supports warehouse-like features (transactions, upserts, time travel). On AWS I often use S3 + Iceberg as the system of record, with Athena for ad-hoc work and Redshift for high-concurrency BI marts.' },
        { q: 'How do you handle PII?', a: 'Classify data (Macie can help find PII), tag sensitive columns with Lake Formation LF-Tags, restrict access by tag, mask or tokenize at the silver layer where possible, encrypt with KMS, log access with CloudTrail, and support deletion requests with Iceberg row-level deletes plus snapshot expiry.' },
        { q: 'How do you give different teams access without copying data?', a: 'Keep one copy in S3, register it in the Glue Catalog, and use Lake Formation grants (or cross-account sharing with resource links) so each team sees only its tables and columns. Redshift data sharing does the same for warehouse tables.' },
        { q: 'How do you control cost on a shared platform?', a: 'Tag every resource by team, use S3 lifecycle and Intelligent-Tiering, compact files, use Athena workgroups with per-query and daily scan limits, use Redshift Serverless max RPU and usage limits, schedule Glue and EMR jobs on Spot or Flex capacity where possible, and review Cost Explorer by tag weekly.' }
      ],
      related: ['s3', 'glue', 'lake-formation', 'athena', 'redshift', 'kms']
    },
    {
      id: 'scenarios', name: 'Scenario questions', short: 'Problems you will be asked to debug or solve, with model answers.',
      interview: [
        { q: 'Your Glue or Spark job is slow and produces thousands of tiny output files. What do you do?', a: 'Tiny files come from too many output partitions or many small tasks. Reduce them with `coalesce` or `repartition` before writing, set a target file size, write partitioned data with a sensible partition granularity (day, not minute), use Glue `groupFiles` and `groupSize` for reading many small inputs, and run periodic compaction (an Athena `CTAS`/`OPTIMIZE` for Iceberg, or a Spark compaction job). Also buffer longer in Firehose.' },
        { q: 'How do you handle data skew in a join or aggregation?', a: 'Identify the hot keys (check task durations in the Spark UI and counts per key). Then broadcast the small side, enable adaptive query execution skew handling, salt the hot keys and aggregate in two stages, or process hot keys separately. In Redshift, choose a different distribution key or `EVEN`.' },
        { q: 'Duplicates appear in the curated table. How do you find the cause and prevent it?', a: 'Find where duplicates start by comparing counts and key uniqueness at each layer. Common causes: a retry that appended again, at-least-once delivery without dedupe, a join that fans out, or overlapping source extracts. Prevent with idempotent writes (overwrite a partition or `MERGE` on a key), deduplicating by key with `row_number()` ordered by update time, and a uniqueness check as a quality gate.' },
        { q: 'You must backfill two years of history for a changed transformation. How?', a: 'Make the job parameterized by date range and idempotent. Run backfills in date chunks in parallel with limits (Airflow backfill or a Step Functions Distributed Map), write to a new location or a new Iceberg branch first, validate counts and sample values against the old output, then swap. Throttle so it does not starve the daily job, and watch cost.' },
        { q: 'How do you detect and handle bad or missing data?', a: 'Add checks at layer boundaries: row counts vs source, null and range checks, uniqueness, referential integrity, freshness (latest partition age). Fail critical checks, quarantine bad rows into an error prefix with the reason, and alert through SNS. Track metrics over time to catch drift.' },
        { q: 'A pipeline that ran fine for months fails with an out-of-memory error. Why?', a: 'Data volume or distribution changed: a larger input, a skewed key, a very large partition or a new wide column. Check input size trend and the failing stage in the Spark UI. Increase partitions, use larger workers temporarily, fix skew, avoid `collect` and large broadcasts, and add a volume alert so growth is noticed before failure.' },
        { q: 'How do you implement SCD Type 2 in a lake?', a: 'Use a table format with `MERGE` (Iceberg, Hudi, Delta) or a warehouse table. Compare incoming rows with the current rows on the business key and a hash of tracked columns. For changed rows, close the old record (`end_date`, `is_current=false`) and insert a new one with `start_date`. Run it as one atomic operation and keep the logic idempotent.' },
        { q: 'Your Athena query bill spiked. What do you check?', a: 'Find the expensive queries in the query history by data scanned and by user or workgroup. Typical causes: `SELECT *` on a wide table, no partition filter, CSV or JSON instead of Parquet, a new dashboard running a full scan every minute. Fix with partitioning and Parquet, column selection, result reuse, and workgroup scan limits.' },
        { q: 'A Glue job must reach a private RDS database. What do you set up?', a: 'Create a Glue connection with the VPC, subnet and a security group. The security group needs a self-referencing inbound rule so Glue workers can talk to each other, and the database security group must allow it. The subnet needs an S3 VPC endpoint (or NAT) for Glue to reach S3, and NAT or endpoints for other AWS services such as Secrets Manager. Store the credentials in Secrets Manager.' },
        { q: 'How do you secure a data pipeline end to end?', a: 'Least-privilege IAM roles per job (and `iam:PassRole` restricted), encryption at rest with KMS and in transit with TLS, private subnets and VPC endpoints, no credentials in code (Secrets Manager), Lake Formation for table and column access, CloudTrail and S3 access logs for audit, and separate accounts for dev, test and prod.' },
        { q: 'Tell me about a pipeline failure you handled.', a: 'Use this structure with a real example: what broke and its business impact, how you detected it (alert, user report), how you diagnosed it (logs, metrics, Spark UI), the immediate fix and any data repair or backfill, and what you changed to prevent it (monitoring, validation, retries, runbook). Give times and numbers.' },
        { q: 'How would you design for exactly-once processing end to end?', a: 'True exactly-once across systems is rare. Aim for at-least-once delivery plus idempotent processing: unique event ids, upserts on a key, and transactional or atomic writes (Iceberg commits, Redshift transactions). Checkpoint source offsets together with the output where the engine supports it.' }
      ],
      related: ['glue', 'athena', 'redshift', 'kinesis']
    }
  ]
});
