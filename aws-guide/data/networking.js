AWSGUIDE.add({
  id: 'networking', title: 'Networking', order: 5,
  services: [
    {
      id: 'vpc', name: 'Amazon VPC', short: 'Your private network inside AWS.',
      overview: 'A VPC is an isolated virtual network where you define the IP range, subnets, route tables and gateways. Almost every other service runs inside or attaches to one.',
      whenToUse: ['Always. Every account has a default VPC, but production workloads should use a purpose-built one.'],
      concepts: ['CIDR block, such as 10.0.0.0/16.', 'Public subnet: route to an internet gateway. Private subnet: no direct internet route.', 'NAT gateway: outbound internet for private subnets.', 'Security group (stateful, instance level) vs network ACL (stateless, subnet level).', 'VPC endpoints: reach S3, DynamoDB and other services without the internet.', 'Peering and Transit Gateway: connect VPCs.'],
      useCases: ['Three-tier web app: public ALB, private app and database subnets', 'Hybrid connectivity with VPN or Direct Connect'],
      examples: [
        { title: 'Create a VPC with a public subnet', code: 'VPC=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query Vpc.VpcId --output text)\nSUBNET=$(aws ec2 create-subnet --vpc-id $VPC --cidr-block 10.0.1.0/24 \\\n  --availability-zone us-east-1a --query Subnet.SubnetId --output text)\nIGW=$(aws ec2 create-internet-gateway --query InternetGateway.InternetGatewayId --output text)\naws ec2 attach-internet-gateway --internet-gateway-id $IGW --vpc-id $VPC\n\nRT=$(aws ec2 create-route-table --vpc-id $VPC --query RouteTable.RouteTableId --output text)\naws ec2 create-route --route-table-id $RT --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW\naws ec2 associate-route-table --route-table-id $RT --subnet-id $SUBNET' },
        { title: 'Free S3 gateway endpoint', code: 'aws ec2 create-vpc-endpoint --vpc-id $VPC --service-name com.amazonaws.us-east-1.s3 \\\n  --route-table-ids $RT' }
      ],
      pricing: 'The VPC itself is free. NAT gateways (hourly plus per GB), public IPv4 addresses, interface endpoints, VPN and cross-AZ or internet data transfer are billed.',
      tips: ['Spread subnets across at least two AZs.', 'Keep databases in private subnets.', 'Use gateway endpoints for S3 and DynamoDB to cut NAT cost.', 'Turn on VPC Flow Logs for troubleshooting.'],
      related: ['ec2', 'elb', 'route53', 'rds']
    },
    {
      id: 'route53', name: 'Amazon Route 53', short: 'DNS, domain registration and health-check routing.',
      overview: 'Route 53 answers DNS queries for your domains and can route traffic based on health, latency, geography or weighted rules.',
      whenToUse: ['Pointing a domain at AWS resources.', 'Failover or latency-based routing across Regions.'],
      concepts: ['Hosted zone: container for a domain\'s records.', 'Alias record: points a name at an AWS resource (ALB, CloudFront, S3) with no extra query charge.', 'Routing policies: simple, weighted, latency, failover, geolocation.', 'Health checks.'],
      useCases: ['app.example.com to an ALB', 'Blue/green weighted rollout', 'Private DNS inside a VPC'],
      examples: [
        { title: 'Alias record to a load balancer', lang: 'json', code: '{\n  "Changes": [{\n    "Action": "UPSERT",\n    "ResourceRecordSet": {\n      "Name": "app.example.com",\n      "Type": "A",\n      "AliasTarget": {\n        "HostedZoneId": "Z35SXDOTRQ7X7K",\n        "DNSName": "my-alb-123.us-east-1.elb.amazonaws.com",\n        "EvaluateTargetHealth": true\n      }\n    }\n  }]\n}' },
        { title: 'Apply it', code: 'aws route53 change-resource-record-sets --hosted-zone-id ZXXXXXXXXXXXX --change-batch file://alias.json' }
      ],
      pricing: 'Per hosted zone per month, plus per million queries and per health check. Domain registration is billed yearly.',
      tips: ['Use alias records instead of CNAMEs for the zone apex.', 'Keep TTLs low before a planned migration.'],
      related: ['elb', 'cloudfront', 'vpc']
    },
    {
      id: 'cloudfront', name: 'Amazon CloudFront', short: 'Global content delivery network (CDN).',
      overview: 'CloudFront caches content at edge locations close to users and forwards cache misses to an origin such as S3 or an ALB. It also terminates TLS and can run lightweight code at the edge.',
      whenToUse: ['Speeding up websites and APIs for a global audience.', 'Serving a private S3 bucket publicly without making the bucket public.'],
      concepts: ['Distribution, origin, behavior (path-based rules).', 'Cache policy and TTL.', 'Origin Access Control (OAC) for private S3 origins.', 'Invalidations.', 'CloudFront Functions and Lambda@Edge.', 'AWS WAF integration.'],
      useCases: ['Static site hosting with S3', 'Video and large file delivery', 'DDoS-resistant API front door'],
      examples: [
        { title: 'Invalidate cached files after a deploy', code: 'aws cloudfront create-invalidation --distribution-id E1ABCDEF12345 --paths "/index.html" "/assets/*"' },
        { title: 'List distributions', code: 'aws cloudfront list-distributions --query \'DistributionList.Items[].[Id,DomainName]\' --output table' }
      ],
      pricing: 'Per GB transferred out and per 10,000 requests, by region. A monthly free tier applies. Transfer from AWS origins to CloudFront is free.',
      tips: ['Use OAC and keep the S3 bucket private.', 'Use hashed filenames for assets and long TTLs instead of frequent invalidations.', 'ACM certificates for CloudFront must be created in us-east-1.'],
      related: ['s3', 'route53', 'elb']
    },
    {
      id: 'elb', name: 'Elastic Load Balancing', short: 'Spread traffic across targets in multiple AZs.',
      overview: 'ELB distributes incoming traffic across healthy targets such as EC2 instances, containers or Lambda functions.',
      whenToUse: ['Any service with more than one instance.', 'HTTP routing by path or host (ALB), or extreme-performance TCP/UDP (NLB).'],
      concepts: ['Application Load Balancer (ALB): layer 7, path and host rules, WebSockets.', 'Network Load Balancer (NLB): layer 4, static IPs, very low latency.', 'Gateway Load Balancer: inline appliances.', 'Target group and health check.', 'Listener and rules.'],
      useCases: ['Web app across an Auto Scaling group', 'Path-based routing to microservices', 'TLS termination with ACM certificates'],
      examples: [
        { title: 'Create an ALB, target group and listener', code: 'ALB=$(aws elbv2 create-load-balancer --name demo-alb --subnets subnet-0a subnet-0b \\\n  --security-groups sg-0abc --query LoadBalancers[0].LoadBalancerArn --output text)\n\nTG=$(aws elbv2 create-target-group --name demo-tg --protocol HTTP --port 80 \\\n  --vpc-id vpc-0abc --health-check-path /health --query TargetGroups[0].TargetGroupArn --output text)\n\naws elbv2 create-listener --load-balancer-arn $ALB --protocol HTTP --port 80 \\\n  --default-actions Type=forward,TargetGroupArn=$TG' }
      ],
      pricing: 'Per load balancer-hour plus Load Balancer Capacity Units (LCUs) based on connections, bytes and rules.',
      tips: ['Use at least two AZs.', 'Redirect HTTP to HTTPS.', 'Make health checks reflect real app health.'],
      related: ['ec2', 'ecs', 'vpc', 'route53']
    }
  ]
});
