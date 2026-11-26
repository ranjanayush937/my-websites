GUIDE.add({
  id: 'platform', title: 'Platform & Governance', order: 1,
  services: [
    {
      id: 'architecture', name: 'Architecture and the lakehouse', priority: 'imp', short: 'Control plane, compute plane, workspaces and the lakehouse idea.',
      overview: 'Databricks is a lakehouse platform: data lives in open formats (Delta, Parquet) in your cloud storage, and Databricks supplies compute, governance and tooling on top. It runs on AWS, Azure and Google Cloud with the same core concepts.',
      whenToUse: ['You need to explain what Databricks is and how it differs from a warehouse or a Hadoop cluster.'],
      concepts: ['Control plane (Databricks-managed): web UI, notebooks, job scheduler, cluster manager, Unity Catalog metadata service.', 'Compute plane: where Spark runs. Classic compute runs in your cloud account and network; serverless compute runs in the Databricks account.', 'Your data stays in your cloud storage (S3, ADLS Gen2 or GCS).', 'Account vs workspace: the account holds users, groups, metastores and billing; a workspace is an environment with notebooks, jobs and clusters.', 'Databricks Runtime (DBR): Spark plus Delta, libraries and optimizations; use LTS versions for production.', 'Storage access: Unity Catalog volumes and external locations; legacy DBFS root and mounts are discouraged.', 'Lakehouse: warehouse-like reliability and governance on lake storage, serving BI, ETL, streaming and ML from one copy of data.'],
      useCases: ['Platform overview in an architecture interview', 'Explaining data residency and security to a security team'],
      pricing: 'You pay DBUs (Databricks units) by workload type and tier, plus the cloud provider charges for VMs, storage and networking (except for serverless, which bundles compute).',
      tips: ['Use Unity Catalog for governance from day one.', 'Separate workspaces by environment (dev, test, prod), sharing one metastore per region.'],
      related: ['compute', 'unity-catalog', 'security-network', 'delta-lake'],
      interview: [
        { q: 'What is the lakehouse architecture?', a: 'It combines the cheap, open storage of a data lake with the reliability and performance features of a warehouse by adding a transactional table layer (Delta Lake) and a governance layer (Unity Catalog). One copy of data in open formats supports ETL, SQL analytics, streaming and ML, avoiding duplicated lake and warehouse stacks.' },
        { q: 'Explain the control plane and the compute plane.', a: 'The control plane is the Databricks-managed backend: web application, notebook and job services, cluster management and metadata. The compute plane is where data processing runs. In classic compute, clusters run in the customer cloud account and VNet and read customer storage; in serverless, Databricks runs the compute in its own account. Customer data is processed in the compute plane and stays in customer storage.' },
        { q: 'Workspace vs account vs metastore?', a: 'The account is the top-level entity for identities, billing and metastores. A workspace is a deployed environment for users to work in. A Unity Catalog metastore holds the catalog metadata and is attached to one or more workspaces in the same region, so governance is shared across workspaces.' },
        { q: 'How is Databricks different from a data warehouse like Synapse or Snowflake?', a: 'Databricks uses open table formats on storage you own, supports Python, SQL, Scala and ML on the same data, and gives you control of the compute engine (Spark and Photon). Warehouses were built around SQL and managed proprietary storage, although they are converging with lakehouse features. The practical differences are openness, language support and ML integration. Databricks SQL also offers a warehouse experience.' },
        { q: 'What is DBFS and why is it discouraged?', a: 'DBFS is a file system abstraction over cloud storage; the DBFS root is a workspace-level bucket accessible to everyone in the workspace, and mounts hide credentials in a shared way. It bypasses Unity Catalog governance. Prefer Unity Catalog volumes for files and external locations for existing storage.' }
      ]
    },
    {
      id: 'compute', name: 'Compute: clusters, jobs and serverless', priority: 'must', short: 'Cluster types, access modes, autoscaling, pools, policies and cost.',
      overview: 'Choosing and configuring compute is a core data engineer task. Databricks offers all-purpose and job clusters, serverless compute for notebooks and jobs, and SQL warehouses.',
      whenToUse: ['Setting up compute for development vs production.', 'Controlling cost and start-up time.'],
      concepts: ['All-purpose cluster: interactive, shared, higher DBU rate. Job cluster: created for a job run and terminated, lower DBU rate.', 'Serverless compute: no cluster management, fast start, billed for usage.', 'SQL warehouse types: classic, pro, serverless; sizes from 2X-Small upward.', 'Access modes: dedicated (single user) and standard (shared, with isolation) work with Unity Catalog.', 'Autoscaling (min and max workers), auto-termination, spot instances with on-demand fallback, instance pools for faster start.', 'Cluster policies enforce limits, tags and settings.', 'Init scripts and libraries; use compute-scoped libraries or wheel files in volumes.', 'Worker types: general purpose, memory-optimized (shuffle, caching), compute-optimized, storage-optimized (disk cache).'],
      useCases: ['Production nightly ETL on a job cluster with spot workers', 'Shared exploration on a policy-controlled cluster'],
      examples: [
        { title: 'Job cluster definition in a job (JSON fragment)', lang: 'json', code: `{
  "job_cluster_key": "etl",
  "new_cluster": {
    "spark_version": "15.4.x-scala2.12",
    "node_type_id": "Standard_E8ds_v5",
    "autoscale": {"min_workers": 2, "max_workers": 8},
    "azure_attributes": {"availability": "SPOT_WITH_FALLBACK_AZURE"},
    "custom_tags": {"team": "data-eng", "env": "prod"}
  }
}` }
      ],
      pricing: 'DBUs per hour depend on workload (jobs, all-purpose, SQL, serverless) and tier, plus VM cost. Job compute is cheaper per DBU than all-purpose compute.',
      tips: ['Production jobs use job clusters or serverless, never a shared all-purpose cluster.', 'Always set auto-termination on interactive clusters.', 'Use spot for workers (not the driver) with fallback.', 'Tag compute for cost attribution and enforce it with cluster policies.'],
      related: ['workflows', 'cost-monitoring', 'spark-tuning', 'unity-catalog'],
      interview: [
        { q: 'All-purpose cluster vs job cluster vs serverless?', a: 'All-purpose clusters are for interactive development and are shared; they bill at a higher rate and stay up until terminated. Job clusters are created for a scheduled run and end afterwards, billed at the cheaper jobs rate, and are isolated per run. Serverless compute removes cluster configuration and starts quickly, billed per use. In production I run jobs on job clusters or serverless.' },
        { q: 'How do you reduce cluster cost?', a: 'Use job compute rather than all-purpose, set auto-termination, enable autoscaling with a sensible maximum, use spot workers with fallback, pick instance types that match the workload (memory-optimized for shuffle-heavy jobs), use cluster policies and tags, pools for frequent short jobs, and fix inefficient code so it needs fewer resources. Monitor with system billing tables.' },
        { q: 'How do you choose the number of workers and instance type?', a: 'Start from data volume and the memory needed for shuffles and caching, run a representative test, then watch the Spark UI and cluster metrics: CPU utilization, spill, GC, and task parallelism. Memory-optimized instances suit joins and aggregations; compute-optimized for CPU-bound transformations; storage-optimized when the disk cache matters. Autoscale to handle variability.' },
        { q: 'What are instance pools?', a: 'A pool keeps idle, ready VMs so clusters start in seconds instead of minutes and can share capacity. You pay the cloud VM cost for idle instances (no DBUs while idle), so pools suit frequent short jobs but cost money if oversized.' },
        { q: 'What are cluster policies?', a: 'Rules that restrict or fix cluster settings (allowed instance types, max workers, auto-termination, required tags, runtime version). They let admins give teams self-service while enforcing cost and security standards.' },
        { q: 'What are the access modes?', a: 'Dedicated mode assigns a cluster to one user or group and supports all languages. Standard mode lets multiple users share a cluster with isolation enforced under Unity Catalog. Legacy no-isolation shared mode lacks governance enforcement and should be avoided.' }
      ]
    },
    {
      id: 'unity-catalog', name: 'Unity Catalog and governance', priority: 'must', short: 'Metastore, three-level namespace, grants, volumes, lineage and sharing.',
      overview: 'Unity Catalog (UC) is Databricks unified governance layer. It provides a single metastore per region with a `catalog.schema.object` namespace, centralized permissions, auditing, lineage and secure access to cloud storage.',
      whenToUse: ['Controlling who can see which data across workspaces.', 'Governing tables, files (volumes), ML models and functions.', 'Sharing data inside and outside the organization.'],
      concepts: ['Hierarchy: metastore → catalog → schema → tables, views, volumes, functions, models.', 'Privileges: `USE CATALOG`, `USE SCHEMA`, `SELECT`, `MODIFY`, `CREATE TABLE`, `READ VOLUME`. Access needs the privilege on the object plus `USE` on its parents.', 'Groups and service principals are defined at the account level.', 'Storage credential (identity to access storage) and external location (path + credential).', 'Managed tables (UC controls storage) vs external tables; volumes for non-tabular files.', 'Row filters, column masks and dynamic views for fine-grained access.', 'Lineage down to column level; audit and billing in `system` tables.', 'Delta Sharing: open protocol to share live data with other platforms; Lakehouse Federation queries external databases through UC.', 'Metastore is regional; catalogs can be bound to specific workspaces.'],
      useCases: ['Masking PII for analysts', 'Giving one team read-only access to a gold schema', 'Sharing a table with a partner without copying'],
      examples: [
        { title: 'Grants for an analyst group', lang: 'sql', code: `GRANT USE CATALOG ON CATALOG main TO \`analysts\`;
GRANT USE SCHEMA ON SCHEMA main.gold TO \`analysts\`;
GRANT SELECT ON TABLE main.gold.daily_sales TO \`analysts\`;
SHOW GRANTS ON TABLE main.gold.daily_sales;` },
        { title: 'Column mask for PII', lang: 'sql', code: `CREATE FUNCTION main.gov.mask_email(email STRING)
RETURNS STRING
RETURN CASE WHEN is_account_group_member('pii_readers') THEN email ELSE '*** masked ***' END;

ALTER TABLE main.silver.customers ALTER COLUMN email SET MASK main.gov.mask_email;` },
        { title: 'Row filter by region', lang: 'sql', code: `CREATE FUNCTION main.gov.region_filter(region STRING)
RETURNS BOOLEAN
RETURN is_account_group_member('global_admins') OR region = 'EU';

ALTER TABLE main.silver.orders SET ROW FILTER main.gov.region_filter ON (region);` },
        { title: 'Who read this table recently? (system tables)', lang: 'sql', code: `SELECT event_time, user_identity.email, action_name
FROM system.access.audit
WHERE request_params.full_name_arg = 'main.gold.daily_sales'
ORDER BY event_time DESC LIMIT 50;` }
      ],
      pricing: 'Unity Catalog is included with the platform. Serverless features such as predictive optimization are billed as compute.',
      tips: ['Grant to groups, not individuals.', 'Use one metastore per region and many catalogs (per environment or domain).', 'Never hand out storage keys; use storage credentials and external locations.', 'Use managed tables unless you need external ownership of files.'],
      related: ['delta-lake', 'security-network', 'architecture', 'dlt'],
      interview: [
        { q: 'What is Unity Catalog and what problems does it solve?', a: 'It is the central governance layer. Before it, each workspace had its own Hive metastore, permissions and storage credentials, which made governance inconsistent. UC gives one metastore shared across workspaces, a single permission model with ANSI SQL grants, audit logs, lineage, and managed access to storage without exposing credentials to users.' },
        { q: 'Explain the UC object hierarchy and the permissions needed to query a table.', a: 'Metastore contains catalogs, catalogs contain schemas, schemas contain tables, views, volumes and functions. To `SELECT` from `main.gold.sales` a principal needs `USE CATALOG` on `main`, `USE SCHEMA` on `main.gold`, and `SELECT` on the table. A missing parent `USE` privilege is a common cause of confusing permission errors.' },
        { q: 'Managed vs external tables and volumes?', a: 'Managed tables keep data in UC-managed storage and are cleaned up automatically on drop, and UC can optimize them. External tables point to storage you control through an external location; dropping them leaves files. Volumes govern non-tabular files (CSV drops, images, libraries) the same way, also as managed or external.' },
        { q: 'How do storage credentials and external locations work?', a: 'A storage credential wraps a cloud identity (an IAM role on AWS, a managed identity or access connector on Azure) with access to storage. An external location ties a credential to a specific path. Admins grant users privileges on the location or on tables inside it, so users get data access through UC without ever seeing keys.' },
        { q: 'How do you implement row-level and column-level security?', a: 'Define SQL functions and attach them: a row filter returns a boolean per row (for example based on the user group or a region column) and a column mask returns the real or a masked value. Alternatives are dynamic views. Both use `is_account_group_member()` or `current_user()` to decide.' },
        { q: 'What is Delta Sharing?', a: 'An open protocol for sharing live Delta tables with other organizations or platforms without copying data. A provider creates a share and recipients read it with the Databricks connector or open-source clients (Spark, pandas, Power BI). Access is governed and revocable. Databricks-to-Databricks sharing adds extra features.' },
        { q: 'How would you migrate from the Hive metastore to Unity Catalog?', a: 'Inventory tables and dependencies, create catalogs, schemas, storage credentials and external locations, then upgrade tables: `SYNC` for external tables (keeps data in place), `DEEP CLONE` or `CREATE TABLE AS SELECT` for managed ones, and the upgrade tooling for bulk work. Then update code to three-level names, replace mounts with volumes or locations, move permissions to UC grants and validate lineage and jobs.' },
        { q: 'How do you find out who accessed a table?', a: 'Query the `system.access.audit` table (and lineage tables) for events on the table name, or use the table lineage and history views in Catalog Explorer. This supports security reviews and impact analysis.' }
      ]
    },
    {
      id: 'databricks-sql', name: 'Databricks SQL and warehouses', priority: 'imp', short: 'SQL warehouses, query tuning, dashboards and materialized views.',
      overview: 'Databricks SQL is the warehouse-style experience on the lakehouse: SQL warehouses (compute), a SQL editor, query history and profile, dashboards, alerts, and connectors for BI tools such as Power BI and Tableau.',
      whenToUse: ['BI and ad-hoc SQL on gold tables.', 'Serving dashboards with predictable concurrency.'],
      concepts: ['Warehouse types: classic, pro, serverless; serverless starts in seconds and is usually the best choice.', 'Sizes (T-shirt) and scaling clusters for concurrency; auto-stop.', 'Photon is used on warehouses.', 'Query profile shows operators, spill and time spent.', 'Materialized views and streaming tables for incremental SQL pipelines.', '`read_files()` and `COPY INTO` for file ingestion; query federation for external databases.', 'Result cache and disk cache speed up repeated queries.'],
      useCases: ['Dashboards for the business', 'SQL-first transformations by analysts'],
      examples: [
        { title: 'Materialized view over a silver table', lang: 'sql', code: `CREATE MATERIALIZED VIEW main.gold.daily_sales AS
SELECT date(order_ts) AS order_date, sum(amount) AS revenue, count(*) AS orders
FROM main.silver.orders
GROUP BY date(order_ts);` },
        { title: 'Load files with COPY INTO (idempotent)', lang: 'sql', code: `COPY INTO main.bronze.orders_raw
FROM 'abfss://landing@acct.dfs.core.windows.net/orders/'
FILEFORMAT = JSON
COPY_OPTIONS ('mergeSchema' = 'true');` }
      ],
      pricing: 'Warehouses bill DBUs per hour while running (serverless bundles VM cost). Set auto-stop to avoid idle charges.',
      tips: ['Size a warehouse for the slowest important query, scale clusters for concurrency.', 'Set auto-stop to a few minutes.', 'Use query profile to find bad joins or scans.'],
      related: ['unity-catalog', 'delta-optimize', 'compute'],
      interview: [
        { q: 'When would you use a SQL warehouse instead of a cluster?', a: 'For SQL and BI workloads: it is tuned for concurrency, has fast start (serverless), integrates with BI tools and bills separately from engineering clusters. Clusters are for notebooks, Python and Scala code, and heavy ETL.' },
        { q: 'How do you scale a SQL warehouse?', a: 'Increase the size for a single heavy query (more compute per query) and raise the maximum number of clusters for many concurrent queries. Check the query profile first to ensure the slowness is not caused by a bad plan or missing clustering.' },
        { q: 'A dashboard is slow. What do you check?', a: 'The query profile for scans, spill and shuffles; whether the table has the right clustering and compaction; whether a gold aggregate or materialized view would avoid recomputing; warehouse size and queueing; and whether caching applies. Often a pre-aggregated gold table fixes it.' },
        { q: 'What is a materialized view in Databricks?', a: 'A governed, precomputed query result stored as a table that is refreshed (often incrementally) on a schedule or by a pipeline. It speeds up repeated aggregations and is created and managed through DLT pipelines or SQL warehouses.' }
      ]
    }
  ]
});

GUIDE.add({
  id: 'ops', title: 'Operations & Delivery', order: 4,
  services: [
    {
      id: 'cicd', name: 'CI/CD, Git and Asset Bundles', priority: 'imp', short: 'Deploying jobs and pipelines as code across environments.',
      overview: 'Production Databricks work should live in Git and deploy through CI/CD. Databricks Asset Bundles (DABs) define jobs, pipelines, clusters and permissions in YAML and deploy them to dev, staging and prod targets with the CLI.',
      whenToUse: ['Moving from notebooks in a workspace to repeatable, reviewed deployments.', 'Promoting code across environments.'],
      concepts: ['Git folders (formerly Repos) sync a repo into the workspace.', 'Asset Bundles: `databricks.yml` with resources and targets; commands `bundle validate`, `deploy`, `run`, `destroy`.', 'Separate workspaces or catalogs per environment; service principals run production jobs.', 'Testing: pytest unit tests for transformation functions, Databricks Connect for local development, integration tests on a dev workspace.', 'Package shared code as a Python wheel or import from the repo.', 'Terraform provider for workspace and infrastructure resources.'],
      useCases: ['Merge to main triggers deployment of the prod job', 'Running unit tests on every pull request'],
      examples: [
        { title: 'databricks.yml for a job with dev and prod targets', lang: 'yaml', code: `bundle:
  name: orders_pipeline

resources:
  jobs:
    nightly_orders:
      name: nightly-orders-\${bundle.target}
      schedule:
        quartz_cron_expression: "0 0 2 * * ?"
        timezone_id: UTC
      tasks:
        - task_key: bronze_to_silver
          notebook_task:
            notebook_path: ./src/bronze_to_silver.py
            base_parameters:
              catalog: \${var.catalog}
          job_cluster_key: etl
      job_clusters:
        - job_cluster_key: etl
          new_cluster:
            spark_version: 15.4.x-scala2.12
            node_type_id: Standard_E8ds_v5
            num_workers: 4

variables:
  catalog:
    default: dev

targets:
  dev:
    mode: development
    default: true
  prod:
    mode: production
    variables:
      catalog: prod
    run_as:
      service_principal_name: "<app-id>"` },
        { title: 'CI commands', lang: 'bash', code: `pytest tests/                       # unit tests
databricks bundle validate -t prod
databricks bundle deploy -t prod
databricks bundle run nightly_orders -t prod` }
      ],
      pricing: 'Bundles and the CLI are free. Pipelines cost whatever your CI system charges, plus the compute used by tests.',
      tips: ['Run production as a service principal, not a person.', 'Keep notebooks thin; put logic in importable, tested modules.', 'Use the same bundle for all environments and vary only variables.'],
      related: ['workflows', 'unity-catalog', 'security-network'],
      interview: [
        { q: 'How do you deploy Databricks code to production?', a: 'Code lives in Git. A pull request runs linting and unit tests. After merge, the pipeline runs `databricks bundle validate` and `deploy` to the target environment using a service principal, then optionally runs a smoke test. Jobs run as a service principal with permissions managed in the bundle, and each environment has its own workspace or catalog.' },
        { q: 'What are Databricks Asset Bundles?', a: 'A declarative way to define Databricks resources (jobs, DLT pipelines, clusters, dashboards, permissions) and the code they run in a YAML project, with per-environment targets. They replace manual UI changes and hand-written REST scripts, make deployments repeatable and fit in CI/CD.' },
        { q: 'How do you test PySpark code?', a: 'Structure code as functions that take and return DataFrames. Unit test them with pytest and a small local or Databricks Connect Spark session using tiny inputs and `assertDataFrameEqual`. Add integration tests that run the real job on a dev workspace with sample data, plus data quality checks in the pipeline itself.' },
        { q: 'Notebooks vs Python packages in production?', a: 'Notebooks are great for exploration but hard to test and review. For production I keep transformation logic in versioned Python modules or wheels, and use thin notebooks or Python script tasks as entry points that read parameters and call the code.' }
      ]
    },
    {
      id: 'security-network', name: 'Security and networking', priority: 'imp', short: 'Identity, secrets, network isolation and encryption.',
      overview: 'Enterprises expect Databricks to run without public exposure, with least-privilege access and no secrets in code. Security spans identity, data access, secrets, network and encryption.',
      whenToUse: ['Security reviews and platform design interviews.'],
      concepts: ['Identity: SSO with SCIM provisioning, account-level groups, service principals for automation.', 'Data access through Unity Catalog grants, row filters and column masks.', 'Secrets: secret scopes (Databricks-backed or backed by Azure Key Vault) accessed with `dbutils.secrets.get`; values are redacted in output.', 'Network: VNet or VPC injection, secure cluster connectivity (no public IPs on nodes), Private Link, IP access lists, firewall egress control.', 'Encryption: at rest with platform or customer-managed keys, in transit with TLS.', 'Audit logs and system tables; compliance features for regulated workloads.'],
      useCases: ['Passing a database password to a job safely', 'Locking a workspace to the corporate network'],
      examples: [
        { title: 'Read a secret in a notebook', lang: 'python', code: `password = dbutils.secrets.get(scope="kv-prod", key="sql-password")
jdbc_url = "jdbc:sqlserver://srv.database.windows.net:1433;database=sales"
df = (spark.read.format("jdbc")
        .option("url", jdbc_url).option("dbtable", "dbo.orders")
        .option("user", "etl_user").option("password", password).load())` }
      ],
      pricing: 'Private Link, firewalls and NAT incur cloud networking costs. Enhanced security tiers can carry a DBU premium.',
      tips: ['Never put secrets in notebooks, job parameters or Git.', 'Use service principals with narrow grants for jobs.', 'Prefer managed identities and storage credentials to keys.'],
      related: ['unity-catalog', 'architecture', 'cicd'],
      interview: [
        { q: 'How do you handle secrets in Databricks?', a: 'Store them in a secret scope, ideally backed by Azure Key Vault or a cloud secrets service, grant read access only to the identities that need it, and read them with `dbutils.secrets.get`. Databricks redacts the values if printed. Prefer managed identities and Unity Catalog storage credentials so there are fewer secrets to manage.' },
        { q: 'How do you secure the network for a workspace?', a: 'Deploy with VNet or VPC injection, enable secure cluster connectivity so nodes have no public IPs, use Private Link for front-end and back-end connectivity, restrict access with IP access lists, control egress through a firewall, and use private endpoints for storage.' },
        { q: 'How do you prevent users from reading data they should not?', a: 'Use Unity Catalog permissions with groups, row filters and column masks, bind catalogs to specific workspaces, use standard or dedicated access modes that enforce UC, and disable DBFS root, mounts and direct storage keys. Audit regularly with system tables.' },
        { q: 'Why run jobs as a service principal?', a: 'Jobs should not depend on a person who may leave or whose personal permissions are broader than the job needs. A service principal has its own narrowly granted access, appears clearly in audit logs and works with CI/CD.' }
      ]
    },
    {
      id: 'cost-monitoring', name: 'Cost control and monitoring', priority: 'imp', short: 'Billing system tables, tags, budgets, job monitoring and data quality.',
      overview: 'Data engineers are expected to keep platforms affordable and observable. Databricks exposes usage in system tables, job run history, query history and the Spark UI, and integrates with cloud monitoring.',
      whenToUse: ['A cost spike investigation.', 'Setting up alerts for pipeline health.'],
      concepts: ['System tables: `system.billing.usage`, `system.compute.clusters`, `system.lakeflow` job tables, `system.access.audit`.', 'Tags on clusters, jobs and warehouses flow to usage records and the cloud bill.', 'Budgets and alerts at account level.', 'Job notifications on failure, duration thresholds and retries; webhooks to Slack or PagerDuty.', 'Data quality: DLT expectations, constraints, custom checks and freshness monitors; Lakehouse Monitoring for table metrics.', 'Spark UI, cluster metrics and query profile for performance.'],
      useCases: ['Finding the most expensive jobs this month', 'Alerting when a table is stale'],
      examples: [
        { title: 'DBU usage by job and day', lang: 'sql', code: `SELECT usage_date, usage_metadata.job_id, sum(usage_quantity) AS dbus
FROM system.billing.usage
WHERE usage_date >= date_sub(current_date(), 30)
  AND usage_metadata.job_id IS NOT NULL
GROUP BY usage_date, usage_metadata.job_id
ORDER BY dbus DESC
LIMIT 50;` },
        { title: 'Freshness check at the end of a pipeline', lang: 'python', code: `from pyspark.sql import functions as F
lag_min = (spark.table("main.gold.daily_sales")
             .agg(((F.unix_timestamp(F.current_timestamp()) - F.unix_timestamp(F.max("loaded_at"))) / 60).alias("lag"))
             .first()["lag"])
if lag_min is None or lag_min > 90:
    raise Exception(f"Data stale: {lag_min} minutes")` }
      ],
      pricing: 'Monitoring features use system tables (free to query on compute you pay for). Cost savings come from compute choices and code efficiency.',
      tips: ['Tag everything and make tags mandatory with policies.', 'Alert on missing runs and stale data as well as failures.', 'Review top costs weekly.'],
      related: ['compute', 'spark-tuning', 'workflows', 'dlt'],
      interview: [
        { q: 'Your Databricks bill doubled this month. How do you investigate?', a: 'Query `system.billing.usage` grouped by SKU, workspace, tags, job and cluster to see what grew. Typical causes are an all-purpose cluster left running, a job that retries or scales to the maximum, a new streaming job running continuously, or an inefficient query. Then fix the root cause (termination, job compute, tuning) and add budgets, policies and alerts.' },
        { q: 'How do you monitor pipelines in production?', a: 'Job notifications on failure and long duration, retries with alerts when exhausted, freshness and volume checks on key tables, DLT expectation metrics, dashboards over job run history and system tables, and structured logging with run ids. Alert on missing runs, not only failures.' },
        { q: 'How do you ensure data quality?', a: 'Constraints (`NOT NULL`, `CHECK`) on Delta tables, DLT expectations that warn, drop or fail, assertions in notebooks or a framework like Great Expectations or Deequ, reconciliation of row counts and totals against the source, and monitoring of freshness and null rates. Quarantine bad records instead of silently dropping them.' }
      ]
    }
  ]
});
