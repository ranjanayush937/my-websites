AWSGUIDE.add({
  id: 'compute', title: 'Compute', order: 2,
  services: [
    {
      id: 'ec2', name: 'Amazon EC2', short: 'Resizable virtual servers in the cloud.',
      overview: 'EC2 gives you virtual machines (instances) with a choice of CPU, memory, storage and networking. You control the operating system and everything installed on it.',
      whenToUse: ['You need full control of the OS or must run software that does not fit containers or functions.', 'Long-running, steady workloads where Reserved Instances or Savings Plans cut cost.', 'Lift-and-shift of existing servers.'],
      concepts: ['AMI: the image an instance boots from.', 'Instance type: size and family, such as t3.micro (burstable) or c7g.large (compute, Graviton).', 'Security group: stateful firewall attached to the instance.', 'Key pair or SSM Session Manager: how you log in.', 'Auto Scaling group: keeps a fleet at the desired size.', 'Purchase options: On-Demand, Spot, Reserved, Savings Plans.'],
      useCases: ['Web and application servers', 'Self-managed databases', 'Batch and HPC jobs on Spot capacity', 'Game servers'],
      examples: [
        { title: 'Launch a t3.micro instance', desc: 'Looks up the latest Amazon Linux 2023 AMI from the public SSM parameter, then launches it.', code: 'AMI=$(aws ssm get-parameter \\\n  --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \\\n  --query Parameter.Value --output text)\n\naws ec2 run-instances \\\n  --image-id "$AMI" \\\n  --instance-type t3.micro \\\n  --count 1 \\\n  --tag-specifications \'ResourceType=instance,Tags=[{Key=Name,Value=demo}]\'' },
        { title: 'List running instances', code: 'aws ec2 describe-instances \\\n  --filters Name=instance-state-name,Values=running \\\n  --query \'Reservations[].Instances[].[InstanceId,InstanceType,PublicIpAddress]\' \\\n  --output table' },
        { title: 'Clean up', code: 'aws ec2 terminate-instances --instance-ids i-0123456789abcdef0' }
      ],
      pricing: 'Billed per second (Linux, 60-second minimum) by instance type while running. EBS volumes, public IPv4 addresses and data transfer out are billed separately. Stopped instances do not incur compute charges.',
      tips: ['Use IAM roles (instance profiles), not access keys on the instance.', 'Prefer SSM Session Manager over opening port 22.', 'Use Auto Scaling and at least two Availability Zones for availability.', 'Tag everything for cost tracking.'],
      related: ['ebs', 'vpc', 'elb', 'iam', 'cloudwatch']
    },
    {
      id: 'lambda', name: 'AWS Lambda', short: 'Run code without managing servers.',
      overview: 'Lambda runs your function in response to events and bills per millisecond of execution. AWS handles provisioning, patching and scaling.',
      whenToUse: ['Event-driven work: S3 uploads, queue messages, schedules, API calls.', 'Spiky or low-volume workloads where idle servers would waste money.', 'Jobs that finish in under 15 minutes.'],
      concepts: ['Function: your code plus configuration (memory 128 MB to 10 GB, timeout up to 15 min).', 'Trigger (event source): S3, SQS, EventBridge, API Gateway, and others.', 'Execution role: IAM role the function assumes.', 'Layers: shared libraries.', 'Cold start: extra latency when a new execution environment starts.', 'Concurrency: reserved and provisioned.'],
      useCases: ['Thumbnail generation on S3 upload', 'REST backends behind API Gateway or a function URL', 'Scheduled clean-up jobs', 'Stream and queue processing'],
      examples: [
        { title: 'Python handler', lang: 'python', code: 'import json\n\ndef handler(event, context):\n    name = event.get("name", "world")\n    return {"statusCode": 200, "body": json.dumps({"message": f"hello {name}"})}' },
        { title: 'Deploy and invoke', desc: 'Assumes an execution role already exists.', code: 'zip function.zip lambda_function.py\n\naws lambda create-function \\\n  --function-name hello \\\n  --runtime python3.12 \\\n  --handler lambda_function.handler \\\n  --role arn:aws:iam::123456789012:role/lambda-basic \\\n  --zip-file fileb://function.zip\n\naws lambda invoke --function-name hello \\\n  --cli-binary-format raw-in-base64-out \\\n  --payload \'{"name":"AWS"}\' out.json && cat out.json' },
        { title: 'Clean up', code: 'aws lambda delete-function --function-name hello' }
      ],
      pricing: 'Per request plus per GB-second of execution. A monthly free tier covers 1M requests and 400,000 GB-seconds. Provisioned concurrency adds a separate charge.',
      tips: ['Give each function its own least-privilege role.', 'Set a timeout and memory that match the work; more memory also means more CPU.', 'Use a dead-letter queue or on-failure destination for async invokes.', 'Keep packages small to reduce cold starts.'],
      related: ['sqs', 'eventbridge', 'step-functions', 's3', 'dynamodb']
    },
    {
      id: 'ecs', name: 'Amazon ECS', short: 'Run Docker containers on AWS, optionally with Fargate.',
      overview: 'ECS is AWS\'s container orchestrator. With the Fargate launch type you define CPU and memory per task and AWS runs it, with no servers to manage. With the EC2 launch type you manage the container hosts.',
      whenToUse: ['You have containerized apps and want a simpler option than Kubernetes.', 'You want tight integration with ALB, IAM and CloudWatch.'],
      concepts: ['Cluster: logical grouping of tasks and services.', 'Task definition: blueprint with image, CPU, memory, ports, env vars.', 'Task: a running instance of a task definition.', 'Service: keeps N tasks running and registers them with a load balancer.', 'Fargate vs EC2 launch type.'],
      useCases: ['Microservices behind an Application Load Balancer', 'Background workers pulling from SQS', 'Scheduled container jobs'],
      examples: [
        { title: 'Create a cluster and run a Fargate task', desc: 'Replace subnet and security group IDs with your own. The task definition must be registered first.', code: 'aws ecs create-cluster --cluster-name demo\n\naws ecs run-task \\\n  --cluster demo \\\n  --launch-type FARGATE \\\n  --task-definition web:1 \\\n  --network-configuration \'awsvpcConfiguration={subnets=[subnet-0abc],securityGroups=[sg-0abc],assignPublicIp=ENABLED}\'' }
      ],
      pricing: 'ECS itself is free. You pay for Fargate vCPU and memory per second, or for the EC2 instances in your cluster.',
      tips: ['Use a task role for app permissions and a separate execution role for pulling images and writing logs.', 'Send logs to CloudWatch with the awslogs driver.', 'Run tasks in private subnets behind a load balancer.'],
      related: ['ec2', 'elb', 'vpc', 'cloudwatch', 'iam']
    }
  ]
});
