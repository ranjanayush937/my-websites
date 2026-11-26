AWSGUIDE.add({
  id: 'management', title: 'Management & DevOps', order: 8,
  services: [
    {
      id: 'cloudwatch', name: 'Amazon CloudWatch', short: 'Metrics, logs, alarms and dashboards.',
      overview: 'CloudWatch collects metrics and logs from AWS services and your apps, lets you alarm on thresholds and visualize everything on dashboards.',
      whenToUse: ['Monitoring any AWS workload.', 'Triggering notifications or scaling actions from metrics.'],
      concepts: ['Metric: time series, such as CPUUtilization.', 'Log group and log stream.', 'Alarm: evaluates a metric and changes state (OK, ALARM).', 'Logs Insights: query language for logs.', 'Dashboards.'],
      useCases: ['CPU alarm that emails the on-call team', 'Searching Lambda errors', 'Custom business metrics'],
      examples: [
        { title: 'Alarm on high CPU, notify an SNS topic', code: 'aws cloudwatch put-metric-alarm \\\n  --alarm-name ec2-high-cpu \\\n  --namespace AWS/EC2 --metric-name CPUUtilization \\\n  --dimensions Name=InstanceId,Value=i-0abc \\\n  --statistic Average --period 300 --evaluation-periods 2 \\\n  --threshold 80 --comparison-operator GreaterThanThreshold \\\n  --alarm-actions arn:aws:sns:us-east-1:123456789012:alerts' },
        { title: 'Logs Insights: count errors per 5 minutes', lang: 'sql', code: 'fields @timestamp, @message\n| filter @message like /ERROR/\n| stats count() by bin(5m)' },
        { title: 'Tail a log group', code: 'aws logs tail /aws/lambda/hello --follow' }
      ],
      pricing: 'Per custom metric, alarm, GB of logs ingested and stored, and Logs Insights GB scanned. Basic metrics from AWS services are free.',
      tips: ['Set a retention period on every log group; the default is never expire.', 'Alarm on symptoms users feel, such as error rate and latency.'],
      related: ['sns', 'lambda', 'ec2', 'cloudformation']
    },
    {
      id: 'cloudtrail', name: 'AWS CloudTrail', short: 'Audit log of API calls in your account.',
      overview: 'CloudTrail records who called which API, from where and when. Event history keeps 90 days of management events; a trail delivers them to S3 for long-term retention.',
      whenToUse: ['Security investigations and compliance audits.', 'Finding out who changed a resource.'],
      concepts: ['Management events vs data events (S3 object-level, Lambda invokes).', 'Trail: delivers logs to S3 and optionally CloudWatch Logs.', 'Organization trail covers all accounts.'],
      useCases: ['Who deleted this security group?', 'Alert on root user sign-in'],
      examples: [
        { title: 'Find recent delete calls', code: 'aws cloudtrail lookup-events \\\n  --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteSecurityGroup \\\n  --max-results 5' },
        { title: 'Create a multi-Region trail', code: 'aws cloudtrail create-trail --name org-trail --s3-bucket-name my-trail-bucket --is-multi-region-trail\naws cloudtrail start-logging --name org-trail' }
      ],
      pricing: 'One copy of management events per Region is free in event history. Additional trails and data events are billed per event.',
      tips: ['Enable log file validation.', 'Send trails to a separate, locked-down account.'],
      related: ['iam', 's3', 'cloudwatch']
    },
    {
      id: 'cloudformation', name: 'AWS CloudFormation', short: 'Infrastructure as code with templates.',
      overview: 'CloudFormation creates and updates a group of resources (a stack) from a YAML or JSON template, in the right order, and can roll back on failure.',
      whenToUse: ['Repeatable environments.', 'Reviewing infrastructure changes in version control.'],
      concepts: ['Template, stack, parameters, outputs.', 'Change sets: preview changes before applying.', 'Drift detection.', 'StackSets for multiple accounts and Regions.', 'AWS CDK synthesizes CloudFormation from code.'],
      useCases: ['Dev, test and prod from the same template', 'Standard baseline for every new account'],
      examples: [
        { title: 'Template: a versioned, private bucket', lang: 'yaml', code: 'AWSTemplateFormatVersion: "2010-09-09"\nParameters:\n  BucketName:\n    Type: String\nResources:\n  Bucket:\n    Type: AWS::S3::Bucket\n    Properties:\n      BucketName: !Ref BucketName\n      VersioningConfiguration:\n        Status: Enabled\n      PublicAccessBlockConfiguration:\n        BlockPublicAcls: true\n        BlockPublicPolicy: true\n        IgnorePublicAcls: true\n        RestrictPublicBuckets: true\nOutputs:\n  Arn:\n    Value: !GetAtt Bucket.Arn' },
        { title: 'Deploy and delete', code: 'aws cloudformation deploy --template-file bucket.yaml --stack-name demo-bucket \\\n  --parameter-overrides BucketName=my-unique-demo-bucket-123\n\naws cloudformation delete-stack --stack-name demo-bucket' }
      ],
      pricing: 'CloudFormation is free for AWS resource types. You pay for the resources it creates.',
      tips: ['Review a change set before updating production.', 'Use stack policies or termination protection for critical stacks.', 'Never edit stack resources by hand; it causes drift.'],
      related: ['iam', 's3', 'cloudwatch']
    }
  ]
});
