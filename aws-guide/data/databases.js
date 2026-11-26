AWSGUIDE.add({
  id: 'databases', title: 'Databases', order: 4,
  services: [
    {
      id: 'rds', name: 'Amazon RDS', short: 'Managed relational databases (PostgreSQL, MySQL and more).',
      overview: 'RDS runs engines such as PostgreSQL, MySQL, MariaDB, Oracle and SQL Server and handles backups, patching, failover and monitoring. Aurora is the AWS-built, higher-performance engine in the same family.',
      whenToUse: ['You need SQL, joins and transactions.', 'You want to avoid administering a database server yourself.'],
      concepts: ['DB instance class and storage (gp3, io2).', 'Multi-AZ: synchronous standby in another AZ for failover.', 'Read replicas: scale reads.', 'Automated backups and point-in-time restore.', 'Parameter groups and subnet groups.'],
      useCases: ['OLTP backends for web apps', 'Migrating on-premises databases', 'Reporting from read replicas'],
      examples: [
        { title: 'Create a small PostgreSQL instance', desc: 'Lets RDS store the master password in Secrets Manager.', code: 'aws rds create-db-instance \\\n  --db-instance-identifier demo-pg \\\n  --engine postgres \\\n  --db-instance-class db.t4g.micro \\\n  --allocated-storage 20 \\\n  --master-username appadmin \\\n  --manage-master-user-password \\\n  --no-publicly-accessible' },
        { title: 'Get the endpoint', code: 'aws rds describe-db-instances --db-instance-identifier demo-pg \\\n  --query \'DBInstances[0].Endpoint.Address\' --output text' },
        { title: 'Clean up', code: 'aws rds delete-db-instance --db-instance-identifier demo-pg --skip-final-snapshot' }
      ],
      pricing: 'Per instance-hour by class, plus storage, I/O (for some storage types), backups beyond the DB size, and data transfer. Multi-AZ roughly doubles instance cost.',
      tips: ['Run in private subnets and restrict the security group to app servers.', 'Enable Multi-AZ for production.', 'Enable encryption at creation; it cannot be added later without a snapshot copy.'],
      related: ['vpc', 'secrets-manager', 'kms', 'cloudwatch']
    },
    {
      id: 'dynamodb', name: 'Amazon DynamoDB', short: 'Serverless key-value and document NoSQL database.',
      overview: 'DynamoDB delivers single-digit millisecond reads and writes at any scale with no servers to manage. You design tables around access patterns, not around joins.',
      whenToUse: ['Known access patterns by key.', 'Very high or unpredictable traffic.', 'Not for ad-hoc analytics or complex joins.'],
      concepts: ['Partition key and optional sort key.', 'Capacity modes: on-demand or provisioned.', 'Global secondary index (GSI) for alternate query patterns.', 'TTL to expire items.', 'Streams: change feed that can trigger Lambda.'],
      useCases: ['Session stores and user profiles', 'Shopping carts', 'IoT and event data', 'Serverless app backends'],
      examples: [
        { title: 'Create an on-demand table', code: 'aws dynamodb create-table \\\n  --table-name Orders \\\n  --attribute-definitions AttributeName=customerId,AttributeType=S AttributeName=orderId,AttributeType=S \\\n  --key-schema AttributeName=customerId,KeyType=HASH AttributeName=orderId,KeyType=RANGE \\\n  --billing-mode PAY_PER_REQUEST' },
        { title: 'Write and read an item', code: 'aws dynamodb put-item --table-name Orders \\\n  --item \'{"customerId":{"S":"c-1"},"orderId":{"S":"o-100"},"total":{"N":"42.5"}}\'\n\naws dynamodb query --table-name Orders \\\n  --key-condition-expression "customerId = :c" \\\n  --expression-attribute-values \'{":c":{"S":"c-1"}}\'' },
        { title: 'Clean up', code: 'aws dynamodb delete-table --table-name Orders' }
      ],
      pricing: 'On-demand: per read and write request. Provisioned: per capacity unit-hour. Plus storage per GB-month, and extra for backups, streams and global tables.',
      tips: ['Pick a high-cardinality partition key to avoid hot partitions.', 'Use Query, not Scan.', 'Turn on point-in-time recovery for important tables.'],
      related: ['lambda', 'iam', 'kinesis']
    }
  ]
});
