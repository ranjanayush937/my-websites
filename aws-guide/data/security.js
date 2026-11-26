AWSGUIDE.add({
  id: 'security', title: 'Security & Identity', order: 6,
  services: [
    {
      id: 'iam', name: 'AWS IAM', short: 'Control who can do what in your AWS account.',
      overview: 'IAM manages identities (users, groups, roles) and the policies that allow or deny API actions on resources. Access is denied by default.',
      whenToUse: ['Always. Every API call is evaluated by IAM.'],
      concepts: ['User, group, role: a role is assumed temporarily and has no long-term keys.', 'Policy: JSON document with Effect, Action, Resource, Condition.', 'Identity-based vs resource-based policies (for example an S3 bucket policy).', 'Explicit deny always wins.', 'Permission boundaries and SCPs (Organizations) cap maximum permissions.', 'IAM Identity Center for human SSO access.'],
      useCases: ['Give a Lambda function read access to one bucket', 'Cross-account access with role assumption', 'Federated employee login'],
      examples: [
        { title: 'Least-privilege policy for one S3 prefix', lang: 'json', code: '{\n  "Version": "2012-10-17",\n  "Statement": [{\n    "Effect": "Allow",\n    "Action": ["s3:GetObject", "s3:PutObject"],\n    "Resource": "arn:aws:s3:::my-bucket/uploads/*"\n  }]\n}' },
        { title: 'Create a role Lambda can assume', code: 'cat > trust.json <<\'EOF\'\n{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}\nEOF\n\naws iam create-role --role-name lambda-basic --assume-role-policy-document file://trust.json\naws iam attach-role-policy --role-name lambda-basic \\\n  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole' },
        { title: 'Check who you are', code: 'aws sts get-caller-identity' }
      ],
      pricing: 'IAM is free.',
      tips: ['Do not use the root user for daily work; enable MFA on it.', 'Prefer roles and short-lived credentials over access keys.', 'Start narrow, then use IAM Access Analyzer to refine.', 'Avoid "Action": "*" with "Resource": "*".'],
      related: ['kms', 'lambda', 's3', 'cloudtrail']
    },
    {
      id: 'kms', name: 'AWS KMS', short: 'Create and control encryption keys.',
      overview: 'KMS manages cryptographic keys and integrates with most AWS services for encryption at rest. Key material never leaves KMS unencrypted.',
      whenToUse: ['You need control over who can use encryption keys, key rotation and audit of key use.'],
      concepts: ['KMS key (formerly CMK): AWS managed, customer managed.', 'Key policy: primary access control for the key.', 'Envelope encryption: a data key encrypts data, the KMS key encrypts the data key.', 'Automatic annual rotation.', 'Aliases, such as alias/app-data.'],
      useCases: ['Encrypt S3, EBS, RDS and DynamoDB with your own key', 'Encrypt small secrets directly (up to 4 KB)'],
      examples: [
        { title: 'Create a key and alias, then encrypt', code: 'KEY=$(aws kms create-key --description "app data" --query KeyMetadata.KeyId --output text)\naws kms create-alias --alias-name alias/app-data --target-key-id $KEY\naws kms enable-key-rotation --key-id $KEY\n\naws kms encrypt --key-id alias/app-data --plaintext fileb://secret.txt \\\n  --query CiphertextBlob --output text | base64 --decode > secret.enc' },
        { title: 'Schedule deletion (minimum 7 days)', code: 'aws kms schedule-key-deletion --key-id $KEY --pending-window-in-days 7' }
      ],
      pricing: 'Per customer managed key per month plus per 10,000 API requests. AWS managed keys have no monthly fee.',
      tips: ['Use separate keys per application or data classification.', 'Enable rotation.', 'Deleting a key makes the data it protects unrecoverable.'],
      related: ['s3', 'ebs', 'rds', 'secrets-manager', 'iam']
    },
    {
      id: 'secrets-manager', name: 'AWS Secrets Manager', short: 'Store and rotate passwords and API keys.',
      overview: 'Secrets Manager stores secrets encrypted with KMS, controls access with IAM, and can rotate credentials automatically, with built-in support for RDS.',
      whenToUse: ['Database credentials, API tokens and other secrets that applications fetch at runtime.', 'For plain configuration values, SSM Parameter Store is cheaper.'],
      concepts: ['Secret and version stages (AWSCURRENT, AWSPREVIOUS).', 'Rotation with a Lambda function.', 'Resource policies and cross-account access.'],
      useCases: ['Database password for an app on ECS or Lambda', 'Third-party API keys'],
      examples: [
        { title: 'Create and read a secret', code: 'aws secretsmanager create-secret --name prod/app/db \\\n  --secret-string \'{"username":"app","password":"change-me"}\'\n\naws secretsmanager get-secret-value --secret-id prod/app/db --query SecretString --output text' },
        { title: 'Read it from Python', lang: 'python', code: 'import boto3, json\n\nclient = boto3.client("secretsmanager")\nsecret = json.loads(client.get_secret_value(SecretId="prod/app/db")["SecretString"])\nprint(secret["username"])' }
      ],
      pricing: 'Per secret per month plus per 10,000 API calls.',
      tips: ['Never put secrets in code, environment files or logs.', 'Cache the value in your app instead of fetching on every request.', 'Turn on rotation for database credentials.'],
      related: ['kms', 'iam', 'rds', 'lambda']
    }
  ]
});
