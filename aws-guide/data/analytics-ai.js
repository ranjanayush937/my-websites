AWSGUIDE.add({
  id: 'analytics-ai', title: 'Data Engineering & Analytics', order: 1,
  services: [
    {
      id: 'athena', name: 'Amazon Athena', short: 'Run SQL directly on files in S3.',
      overview: 'Athena is a serverless query engine (Trino-based). You point it at data in S3, define a table in the Glue Data Catalog, and query with standard SQL.',
      whenToUse: ['Ad-hoc analysis of logs and data-lake files.', 'Not for low-latency app queries.'],
      concepts: ['Tables defined in the Glue Data Catalog.', 'Formats: Parquet and ORC are far cheaper to scan than CSV or JSON.', 'Partitioning reduces data scanned.', 'Workgroups for cost control.'],
      useCases: ['Query ALB or CloudTrail logs', 'Data lake exploration'],
      examples: [
        { title: 'Create a table over CSV files', lang: 'sql', code: 'CREATE EXTERNAL TABLE sales (\n  order_id string,\n  amount double,\n  order_date date\n)\nROW FORMAT DELIMITED FIELDS TERMINATED BY \',\'\nLOCATION \'s3://my-bucket/sales/\'\nTBLPROPERTIES (\'skip.header.line.count\'=\'1\');' },
        { title: 'Query it', lang: 'sql', code: 'SELECT date_trunc(\'month\', order_date) AS month, sum(amount) AS revenue\nFROM sales\nGROUP BY 1\nORDER BY 1;' },
        { title: 'Run from the CLI', code: 'aws athena start-query-execution \\\n  --query-string "SELECT count(*) FROM sales" \\\n  --result-configuration OutputLocation=s3://my-bucket/athena-results/' }
      ],
      pricing: 'Per TB of data scanned (10 MB minimum per query). Converting to Parquet and partitioning cuts the bill sharply.',
      tips: ['Store data as partitioned Parquet.', 'Select only the columns you need.', 'Use workgroups to cap scan limits.'],
      related: ['s3', 'glue']
    },
    {
      id: 'glue', name: 'AWS Glue', short: 'Serverless ETL and data catalog.',
      overview: 'Glue discovers schemas, stores them in the Data Catalog, and runs Spark or Python ETL jobs without cluster management.',
      whenToUse: ['Transform and move data between S3, databases and warehouses.', 'Maintain a shared table catalog for Athena, Redshift Spectrum and EMR.'],
      concepts: ['Data Catalog: databases and tables.', 'Crawler: infers schema and creates tables.', 'Job: Spark, Python shell or Ray.', 'Workflows and triggers.', 'DPU: unit of compute.'],
      useCases: ['Convert CSV to partitioned Parquet', 'Nightly ETL into a data lake'],
      examples: [
        { title: 'Crawl an S3 prefix', code: 'aws glue create-crawler --name sales-crawler --role AWSGlueServiceRole-demo \\\n  --database-name lake --targets \'{"S3Targets":[{"Path":"s3://my-bucket/sales/"}]}\'\naws glue start-crawler --name sales-crawler' },
        { title: 'Glue job: CSV to Parquet', lang: 'python', code: 'import sys\nfrom awsglue.utils import getResolvedOptions\nfrom awsglue.context import GlueContext\nfrom pyspark.context import SparkContext\n\nglue = GlueContext(SparkContext())\ndf = glue.spark_session.read.option("header", "true").csv("s3://my-bucket/sales/")\ndf.write.mode("overwrite").partitionBy("order_date").parquet("s3://my-bucket/sales_parquet/")' }
      ],
      pricing: 'Per DPU-hour, billed per second (1-minute minimum). Crawlers are billed per DPU-hour. The Data Catalog has a free tier.',
      tips: ['Use job bookmarks for incremental loads.', 'Right-size the number of workers.'],
      related: ['athena', 's3', 'kinesis']
    },
    {
      id: 'kinesis', name: 'Amazon Kinesis', short: 'Real-time streaming data ingest and processing.',
      overview: 'Kinesis Data Streams ingests high-volume ordered records for custom consumers. Amazon Data Firehose (formerly Kinesis Data Firehose) delivers a stream to S3, Redshift or OpenSearch with no consumer code.',
      whenToUse: ['Clickstreams, IoT telemetry, log aggregation.', 'Several consumers reading the same ordered stream.'],
      concepts: ['Stream and shards (or on-demand mode).', 'Partition key decides the shard.', 'Retention 24 hours to 365 days.', 'Consumers: Lambda, KCL apps, Managed Service for Apache Flink.'],
      useCases: ['Real-time dashboards', 'Streaming logs to S3 for Athena'],
      examples: [
        { title: 'Create a stream and put a record', code: 'aws kinesis create-stream --stream-name clicks --stream-mode-details StreamMode=ON_DEMAND\naws kinesis put-record --stream-name clicks --partition-key user-1 \\\n  --cli-binary-format raw-in-base64-out --data \'{"page":"/home"}\'' }
      ],
      pricing: 'On-demand: per GB in and out plus stream-hour. Provisioned: per shard-hour and per million PUT payload units.',
      tips: ['Choose a partition key with many distinct values.', 'Use Firehose when you only need delivery to a destination.'],
      related: ['lambda', 's3', 'glue', 'dynamodb']
    },
    {
      id: 'bedrock', name: 'Amazon Bedrock', short: 'Use foundation models through one API.',
      overview: 'Bedrock gives API access to foundation models from Amazon and other providers for text, chat, images and embeddings, without managing infrastructure. Your prompts are not used to train the base models.',
      whenToUse: ['Add generative AI features to an app.', 'Build retrieval-augmented generation (RAG) with Knowledge Bases.'],
      concepts: ['Model access must be enabled per model and Region.', 'Converse API: one request format across chat models.', 'Knowledge Bases: managed RAG over your S3 documents.', 'Guardrails: content and PII filters.', 'Agents: models that call your APIs.'],
      useCases: ['Support chatbot over company docs', 'Document summarization', 'Semantic search with embeddings'],
      examples: [
        { title: 'Chat with the Converse API', lang: 'python', code: 'import boto3\n\nbr = boto3.client("bedrock-runtime", region_name="us-east-1")\nresp = br.converse(\n    modelId="amazon.nova-lite-v1:0",  # use a model you have access to\n    messages=[{"role": "user", "content": [{"text": "Explain S3 in two sentences."}]}],\n    inferenceConfig={"maxTokens": 200, "temperature": 0.3},\n)\nprint(resp["output"]["message"]["content"][0]["text"])' },
        { title: 'List available models', code: 'aws bedrock list-foundation-models --query \'modelSummaries[].modelId\' --output text' }
      ],
      pricing: 'On-demand: per 1,000 input and output tokens, varying by model. Provisioned throughput is billed per model unit-hour.',
      tips: ['Start with a small model and move up only if quality requires it.', 'Add Guardrails for user-facing apps.', 'Limit output tokens to control cost.'],
      related: ['lambda', 's3', 'iam']
    }
  ]
});
