/* Priorities for every service, plus interview questions for the supporting services. */
AWSGUIDE.extra({
  s3: { priority: 'must' }, glue: { priority: 'must' }, athena: { priority: 'must' },
  redshift: { priority: 'must' }, kinesis: { priority: 'must' }, emr: { priority: 'must' },
  lambda: { priority: 'must' }, iam: { priority: 'must' }, 'step-functions': { priority: 'must' },
  dynamodb: { priority: 'must' },
  msk: { priority: 'imp' }, dms: { priority: 'imp' }, 'lake-formation': { priority: 'imp' }, mwaa: { priority: 'imp' },
  rds: { priority: 'imp' }, sqs: { priority: 'imp' }, sns: { priority: 'imp' }, eventbridge: { priority: 'imp' },
  cloudwatch: { priority: 'imp' }, kms: { priority: 'imp' }, vpc: { priority: 'imp' }, cloudformation: { priority: 'imp' },
  'secrets-manager': { priority: 'imp' }, ec2: { priority: 'imp' },
  ebs: { priority: 'good' }, efs: { priority: 'good' }, route53: { priority: 'good' }, cloudfront: { priority: 'good' },
  elb: { priority: 'good' }, ecs: { priority: 'good' }, cloudtrail: { priority: 'good' }, bedrock: { priority: 'good' }
});

AWSGUIDE.extra({
  iam: { interview: [
    { q: 'IAM user vs role? Which do pipelines use?', a: 'A user has long-term credentials. A role has no permanent credentials and is assumed to get temporary ones. Pipelines (Glue, Lambda, EMR, ECS) always use roles. Humans should use federated SSO (IAM Identity Center) rather than IAM users with keys.' },
    { q: 'How does IAM evaluate a request?', a: 'Everything is denied by default. An explicit `Deny` in any applicable policy wins. Otherwise the request needs an `Allow`. Organization SCPs and permission boundaries limit the maximum, and resource policies (S3 bucket policy) can grant access too. For cross-account access, both the identity policy and the resource policy must allow.' },
    { q: 'What permissions does a Glue job role typically need?', a: 'The Glue service trust relationship, read and write on the specific S3 prefixes, Glue Data Catalog actions on the used databases and tables, CloudWatch Logs write, `kms:Decrypt` and `kms:GenerateDataKey` on the data keys, and `secretsmanager:GetSecretValue` if it reads credentials. The person who creates the job needs `iam:PassRole` for that role.' },
    { q: 'How do you give another AWS account access to a bucket?', a: 'Either add a bucket policy that allows the other account\'s role, plus an identity policy in that account allowing the actions, or have the other account assume a role in your account. Add KMS key policy access if the data is SSE-KMS encrypted.' },
    { q: 'How do you debug AccessDenied?', a: 'Read the error for the action and resource, then check the identity policy, resource policy, SCPs, permission boundaries, KMS key policy, VPC endpoint policy and any explicit denies. CloudTrail shows the denied call and caller. IAM Policy Simulator and Access Analyzer help.' }
  ] },
  kms: { interview: [
    { q: 'What goes wrong when S3 data is encrypted with SSE-KMS?', a: 'Readers need `kms:Decrypt` on the key as well as S3 access, and writers need `kms:GenerateDataKey`. Jobs reading millions of small objects can hit KMS request quotas; S3 Bucket Keys reduce the number of KMS calls. Cross-account readers need access in the key policy.' },
    { q: 'SSE-S3 vs SSE-KMS vs client-side encryption?', a: 'SSE-S3 is managed by S3 with no key control. SSE-KMS adds key-level access control, rotation and audit trails. Client-side encryption encrypts before upload so AWS never sees plaintext. SSE-KMS is the common choice for governed data.' }
  ] },
  vpc: { interview: [
    { q: 'How do private resources reach S3 without the internet?', a: 'Create a gateway VPC endpoint for S3 (free) and add it to the route tables. Traffic stays on the AWS network and avoids NAT gateway data charges. Interface endpoints (PrivateLink) do the same for most other services.' },
    { q: 'Security group vs network ACL?', a: 'A security group is stateful, attached to a resource, and allow-only. A network ACL is stateless, applies to a subnet, and supports allow and deny rules. Most access control is done with security groups.' }
  ] },
  'secrets-manager': { interview: [
    { q: 'Secrets Manager vs SSM Parameter Store?', a: 'Secrets Manager adds automatic rotation (built in for RDS and others), cross-account sharing and per-secret pricing. Parameter Store is cheaper and fine for configuration and simple secrets without rotation. Use Secrets Manager for database credentials.' },
    { q: 'How do jobs get database credentials safely?', a: 'Store them in Secrets Manager, grant the job role `secretsmanager:GetSecretValue` on that secret, and fetch at runtime (or reference the secret in a Glue connection). Never hard-code credentials or pass them as plain job arguments.' }
  ] },
  cloudwatch: { interview: [
    { q: 'How do you monitor a data pipeline?', a: 'Track job status and duration (Glue, EMR and Step Functions emit events and metrics), data freshness (age of the latest partition), volume (row counts versus expectation), and quality check results, published as custom metrics. Alarm on failures, SLA risk and anomalies and notify through SNS. Logs Insights helps find errors quickly.' },
    { q: 'How do you get alerted when a Glue job fails?', a: 'Create an EventBridge rule for Glue job state change events with state `FAILED` or `TIMEOUT` and target an SNS topic or Lambda. A CloudWatch alarm on job metrics is the alternative.' }
  ] },
  cloudformation: { interview: [
    { q: 'Why define pipelines as code?', a: 'It makes environments repeatable and reviewable, enables CI/CD, and prevents console drift. I deploy Glue jobs, IAM roles, buckets and state machines through CloudFormation, CDK or Terraform, with separate stacks or accounts for dev, test and prod.' },
    { q: 'What is a change set and drift detection?', a: 'A change set previews what an update will create, modify or replace before you apply it. Drift detection reports resources that were changed outside CloudFormation so you can reconcile them.' }
  ] },
  sns: { interview: [
    { q: 'What is the SNS plus SQS fan-out pattern?', a: 'Publish an event once to an SNS topic and subscribe several SQS queues, each feeding a different consumer. Every consumer gets its own durable copy and processes at its own pace, and you can add filter policies so each queue receives only relevant messages.' }
  ] },
  eventbridge: { interview: [
    { q: 'How would you trigger a pipeline when a file arrives or on a schedule?', a: 'For files, enable S3 event delivery to EventBridge and create a rule that matches the prefix and starts a Step Functions execution or Glue workflow. For schedules, use EventBridge Scheduler with a cron expression. Add a dead-letter queue to the target for failed invocations.' }
  ] },
  ec2: { interview: [
    { q: 'Where do you meet EC2 in data engineering?', a: 'Mostly indirectly: EMR clusters, self-managed tools (Kafka, Airflow), bastion or ETL hosts, and Spot capacity for cheap batch work. Know instance families (compute, memory, storage optimized), Spot behavior and EBS vs instance store.' }
  ] },
  cloudtrail: { interview: [
    { q: 'How do you audit who accessed sensitive data?', a: 'Enable CloudTrail data events for the S3 bucket (object-level reads and writes) and send them to a protected log bucket, query them with Athena, and combine with Lake Formation audit logs for table access.' }
  ] }
});
