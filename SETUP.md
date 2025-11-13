# Voice-to-SAP System Setup Guide

## Prerequisites

1. **AWS CLI configured with appropriate permissions**
2. **AWS CDK installed** (`npm install -g aws-cdk`)
3. **Python 3.9+** installed
4. **Bedrock models enabled** in your AWS account

## Step 1: AWS Authentication

```bash
# Refresh your AWS SSO token
aws sso login

# Verify authentication
aws sts get-caller-identity
```

## Step 2: Enable Bedrock Models

Before deploying, ensure these models are enabled in your AWS account:
- `anthropic.claude-3-sonnet-20240229-v1:0`

Go to AWS Console > Bedrock > Model access and request access to Claude 3 Sonnet.

## Step 3: Deploy Infrastructure

```bash
# Make deploy script executable (if not already)
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

This will:
- Install CDK dependencies
- Bootstrap CDK (if needed)
- Deploy the complete infrastructure

## Step 4: Test the System

### Option A: Local Lambda Test
```bash
python3 test_system.py
# Choose option 1 for local Lambda testing
```

### Option B: Upload Test File
1. Go to AWS Console > S3
2. Find the `voice-to-sap-input` bucket
3. Upload a `.wav` audio file
4. Monitor Step Functions execution in AWS Console

## Step 5: Monitor Execution

1. **Step Functions Console**: Monitor workflow execution
2. **CloudWatch Logs**: Check Lambda function logs
3. **S3 Output Bucket**: Check `voice-to-sap-summaries` for results

## Architecture Components Deployed

- ✅ S3 buckets (input/output)
- ✅ Lambda function (severity assignment)
- ✅ Step Functions workflow
- ✅ EventBridge rules
- ✅ IAM roles and permissions

## Next Steps: SAP Integration

After basic system is working:

1. **Set up SAP MCP Connector** (coordinate with colleague)
2. **Create Bedrock Agent** using `bedrock-agent-config.json`
3. **Connect Agent to MCP Connector**
4. **Add SAP ingestion step** to Step Functions workflow

## Troubleshooting

### Common Issues:

1. **Token expired**: Run `aws sso login`
2. **Bedrock access denied**: Enable models in Bedrock console
3. **CDK bootstrap needed**: Run `cdk bootstrap` in infrastructure directory
4. **Lambda timeout**: Increase timeout in CDK stack if needed

### Useful Commands:

```bash
# Check CDK diff before deploy
cd infrastructure && cdk diff

# View CDK synthesized template
cd infrastructure && cdk synth

# Destroy stack (cleanup)
cd infrastructure && cdk destroy
```
