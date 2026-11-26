AWSGUIDE.add({
  id: 'integration', title: 'Application Integration', order: 7,
  services: [
    {
      id: 'sqs', name: 'Amazon SQS', short: 'Managed message queues.',
      overview: 'SQS decouples producers from consumers. Producers send messages to a queue and consumers pull them at their own pace, so spikes do not overwhelm downstream systems.',
      whenToUse: ['Buffering work between services.', 'Retrying failed work without losing it.'],
      concepts: ['Standard queue: at-least-once delivery, best-effort ordering, near unlimited throughput.', 'FIFO queue: ordering and exactly-once processing within a message group.', 'Visibility timeout: hides a message while it is being processed.', 'Dead-letter queue (DLQ) for messages that keep failing.', 'Long polling reduces empty receives.'],
      useCases: ['Order processing workers', 'Lambda batch processing', 'Load leveling in front of a database'],
      examples: [
        { title: 'Send and receive', code: 'URL=$(aws sqs create-queue --queue-name jobs --query QueueUrl --output text)\naws sqs send-message --queue-url $URL --message-body \'{"job":42}\'\naws sqs receive-message --queue-url $URL --wait-time-seconds 10\naws sqs delete-message --queue-url $URL --receipt-handle "<handle-from-receive>"' },
        { title: 'Worker loop in Python', lang: 'python', code: 'import boto3\nsqs = boto3.client("sqs")\nurl = "https://sqs.us-east-1.amazonaws.com/123456789012/jobs"\n\nwhile True:\n    r = sqs.receive_message(QueueUrl=url, WaitTimeSeconds=20, MaxNumberOfMessages=10)\n    for m in r.get("Messages", []):\n        print("processing", m["Body"])\n        sqs.delete_message(QueueUrl=url, ReceiptHandle=m["ReceiptHandle"])' }
      ],
      pricing: 'Per million requests, with a monthly free tier. FIFO costs slightly more.',
      tips: ['Make consumers idempotent; standard queues can deliver twice.', 'Set the visibility timeout above your processing time.', 'Always attach a DLQ.'],
      related: ['sns', 'lambda', 'eventbridge']
    },
    {
      id: 'sns', name: 'Amazon SNS', short: 'Pub/sub messaging and notifications.',
      overview: 'SNS delivers one published message to many subscribers: SQS queues, Lambda functions, HTTPS endpoints, email and SMS.',
      whenToUse: ['One event, several independent consumers (fan-out).', 'Alerts to people.'],
      concepts: ['Topic, publisher, subscription.', 'Filter policies so subscribers receive only matching messages.', 'FIFO topics for ordered fan-out.'],
      useCases: ['Fan-out an order event to billing, shipping and analytics queues', 'CloudWatch alarm email notifications'],
      examples: [
        { title: 'Topic with an email subscriber', code: 'ARN=$(aws sns create-topic --name alerts --query TopicArn --output text)\naws sns subscribe --topic-arn $ARN --protocol email --notification-endpoint you@example.com\naws sns publish --topic-arn $ARN --subject "Test" --message "Hello from SNS"' }
      ],
      pricing: 'Per million publishes, plus delivery charges that vary by protocol (SMS is the most expensive). The first 1M requests per month are free.',
      tips: ['Pair SNS with SQS for durable fan-out.', 'Use filter policies instead of filtering in consumer code.'],
      related: ['sqs', 'lambda', 'eventbridge', 'cloudwatch']
    },
    {
      id: 'eventbridge', name: 'Amazon EventBridge', short: 'Serverless event bus and scheduler.',
      overview: 'EventBridge routes events from AWS services, your apps and SaaS partners to targets using pattern-matching rules. EventBridge Scheduler runs one-off and recurring jobs.',
      whenToUse: ['React to AWS events such as an EC2 state change.', 'Cron-style schedules.', 'Loosely coupled microservices.'],
      concepts: ['Event bus: default, custom or partner.', 'Rule with an event pattern and one or more targets.', 'Schema registry.', 'Archive and replay.'],
      useCases: ['Run a Lambda every night', 'Notify on failed CodeBuild builds', 'Route custom order events between services'],
      examples: [
        { title: 'Schedule a Lambda every day at 02:00 UTC', code: 'aws events put-rule --name nightly --schedule-expression "cron(0 2 * * ? *)"\naws lambda add-permission --function-name hello --statement-id eb --action lambda:InvokeFunction \\\n  --principal events.amazonaws.com\naws events put-targets --rule nightly --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:123456789012:function:hello"' },
        { title: 'Pattern: EC2 instance stopped', lang: 'json', code: '{\n  "source": ["aws.ec2"],\n  "detail-type": ["EC2 Instance State-change Notification"],\n  "detail": {"state": ["stopped"]}\n}' }
      ],
      pricing: 'Per million custom events published; AWS service events on the default bus are free. Scheduler is billed per invocation.',
      tips: ['Configure a DLQ on targets.', 'Keep event schemas versioned.'],
      related: ['lambda', 'sqs', 'sns', 'step-functions']
    },
    {
      id: 'step-functions', name: 'AWS Step Functions', short: 'Orchestrate multi-step workflows visually.',
      overview: 'Step Functions runs state machines that coordinate Lambda functions and over 200 AWS services with built-in retries, branching, parallelism and error handling.',
      whenToUse: ['Multi-step processes with retries and conditions.', 'Long-running workflows with human approval or waits.'],
      concepts: ['State machine defined in Amazon States Language (JSON).', 'State types: Task, Choice, Parallel, Map, Wait, Succeed, Fail.', 'Standard (up to one year, exactly-once) vs Express (high volume, up to 5 minutes).'],
      useCases: ['Order fulfilment pipeline', 'ETL orchestration', 'Approval workflows'],
      examples: [
        { title: 'Two-step workflow with retry', lang: 'json', code: '{\n  "StartAt": "Validate",\n  "States": {\n    "Validate": {\n      "Type": "Task",\n      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:validate",\n      "Retry": [{"ErrorEquals": ["States.TaskFailed"], "MaxAttempts": 3, "BackoffRate": 2}],\n      "Next": "Charge"\n    },\n    "Charge": {\n      "Type": "Task",\n      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:charge",\n      "End": true\n    }\n  }\n}' },
        { title: 'Start an execution', code: 'aws stepfunctions start-execution \\\n  --state-machine-arn arn:aws:states:us-east-1:123456789012:stateMachine:orders \\\n  --input \'{"orderId":"o-100"}\'' }
      ],
      pricing: 'Standard: per state transition. Express: per request and duration.',
      tips: ['Put retries and catches in the state machine, not in function code.', 'Pass small payloads; store large data in S3 and pass the key.'],
      related: ['lambda', 'eventbridge', 'sqs']
    }
  ]
});
