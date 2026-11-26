AWSGUIDE.add({
  id: 'storage', title: 'Storage', order: 3,
  services: [
    {
      id: 's3', name: 'Amazon S3', short: 'Durable object storage for any amount of data.',
      overview: 'S3 stores objects (files plus metadata) in buckets. It is designed for 99.999999999% durability and is the default storage layer for backups, data lakes and static websites.',
      whenToUse: ['Storing files, backups, logs, media and data-lake files.', 'Hosting static websites (usually behind CloudFront).', 'Not for low-latency block storage or a file system with locking; use EBS or EFS.'],
      concepts: ['Bucket: globally unique name, lives in one Region.', 'Object: key + data + metadata, up to 5 TB.', 'Storage classes: Standard, Intelligent-Tiering, Standard-IA, Glacier Instant/Flexible/Deep Archive.', 'Versioning, lifecycle rules, replication.', 'Block Public Access, bucket policies, presigned URLs.', 'Encryption at rest is on by default (SSE-S3).'],
      useCases: ['Data lake for Athena and Glue', 'Backup and archive', 'Static website assets', 'Event source for Lambda'],
      examples: [
        { title: 'Create a bucket and upload', code: 'aws s3 mb s3://my-unique-guide-bucket-12345 --region us-east-1\naws s3 cp report.pdf s3://my-unique-guide-bucket-12345/reports/\naws s3 ls s3://my-unique-guide-bucket-12345/reports/' },
        { title: 'Sync a folder', code: 'aws s3 sync ./site s3://my-unique-guide-bucket-12345/site --delete' },
        { title: 'Presigned download link (1 hour)', code: 'aws s3 presign s3://my-unique-guide-bucket-12345/reports/report.pdf --expires-in 3600' },
        { title: 'Lifecycle rule: move to Glacier after 90 days', lang: 'json', code: '{\n  "Rules": [{\n    "ID": "archive-logs",\n    "Status": "Enabled",\n    "Filter": {"Prefix": "logs/"},\n    "Transitions": [{"Days": 90, "StorageClass": "GLACIER"}]\n  }]\n}' },
        { title: 'Clean up', code: 'aws s3 rb s3://my-unique-guide-bucket-12345 --force' }
      ],
      pricing: 'Per GB-month by storage class, plus requests and data transfer out. Transfer into S3 is free. Retrieval fees apply to infrequent-access and archive classes.',
      tips: ['Keep Block Public Access on unless you truly need public objects.', 'Enable versioning on buckets with important data.', 'Use lifecycle rules to control cost.', 'Use Intelligent-Tiering when access patterns are unknown.'],
      related: ['cloudfront', 'lambda', 'athena', 'kms', 'iam']
    },
    {
      id: 'ebs', name: 'Amazon EBS', short: 'Block storage volumes for EC2.',
      overview: 'EBS provides network-attached disks that persist independently of the instance. A volume lives in one Availability Zone and attaches to instances in that zone.',
      whenToUse: ['Boot disks and databases on EC2.', 'Workloads that need low-latency random I/O.'],
      concepts: ['Volume types: gp3 (general SSD), io2 (high IOPS), st1 and sc1 (HDD).', 'Snapshots: incremental backups stored in S3, usable across AZs and Regions.', 'Encryption with KMS.'],
      useCases: ['Root volume for EC2', 'Self-managed database storage', 'Snapshot-based backups'],
      examples: [
        { title: 'Create and attach a 20 GiB gp3 volume', code: 'aws ec2 create-volume --availability-zone us-east-1a --size 20 --volume-type gp3 --encrypted\naws ec2 attach-volume --volume-id vol-0abc --instance-id i-0abc --device /dev/sdf' },
        { title: 'Format and mount on the instance', code: 'sudo mkfs -t xfs /dev/sdf\nsudo mkdir /data && sudo mount /dev/sdf /data' },
        { title: 'Snapshot', code: 'aws ec2 create-snapshot --volume-id vol-0abc --description "nightly"' }
      ],
      pricing: 'Per GB-month provisioned, plus optional IOPS and throughput on gp3/io2. Snapshots are billed per GB of changed data stored.',
      tips: ['Choose gp3 over gp2 for lower cost and tunable performance.', 'Automate snapshots with Data Lifecycle Manager or AWS Backup.', 'Delete unattached volumes you no longer need.'],
      related: ['ec2', 'efs', 'kms']
    },
    {
      id: 'efs', name: 'Amazon EFS', short: 'Shared, elastic NFS file system.',
      overview: 'EFS is a managed NFS file system that grows and shrinks automatically and can be mounted by many instances, containers or Lambda functions at once across AZs.',
      whenToUse: ['Multiple servers need to share the same files.', 'Content management, home directories, shared ML data.'],
      concepts: ['Mount targets: one per AZ in your VPC.', 'Performance and throughput modes.', 'Storage classes: Standard and Infrequent Access, with lifecycle management.', 'Linux only (NFS v4).'],
      useCases: ['Shared web content across an Auto Scaling group', 'Persistent storage for ECS or EKS containers'],
      examples: [
        { title: 'Create and mount', code: 'aws efs create-file-system --encrypted --tags Key=Name,Value=shared\n\n# on the instance (needs amazon-efs-utils)\nsudo mkdir /mnt/efs\nsudo mount -t efs -o tls fs-0123456789abcdef0:/ /mnt/efs' }
      ],
      pricing: 'Per GB-month by storage class, plus throughput if provisioned. Costs more per GB than EBS or S3.',
      tips: ['Allow NFS (TCP 2049) only from the clients\' security group.', 'Enable lifecycle management to move cold files to IA.'],
      related: ['ec2', 'ebs', 'ecs', 'lambda']
    }
  ]
});
