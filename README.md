# Voice-to-SAP Notification System with MCP Integration

An automated system that processes voice call recordings using AWS AI services and integrates with SAP via Model Context Protocol (MCP).

## 🎯 Overview

This system processes voice recordings through an AI pipeline and automatically creates incidents in SAP S/4HANA:

**Voice Call → Transcription → Sentiment Analysis → SAP Incident Creation**

## 🏗️ Architecture

```
Voice File → S3 → EventBridge → Step Functions
                                      ↓
                                 Transcribe
                                      ↓
                              Bedrock (Sentiment)
                                      ↓
                              Lambda (Severity)
                                      ↓
                              Bedrock (Summary)
                                      ↓
                         Lambda (SAP Integration) ← NEW!
                                      ↓
                              Cognito Auth ← NEW!
                                      ↓
                            AgentCore Runtime ← NEW!
                                      ↓
                              MCP Server ← NEW!
                                      ↓
                              SAP System ✨
```

See `docs/diagrams/` for detailed architecture diagrams.

## 🚀 Quick Start

### Prerequisites

- AWS Account with Bedrock access
- Node.js 18+
- Python 3.11+
- AWS CLI configured
- SAP system access

### 1. Clone and Install

```bash
git clone <repository-url>
cd SAP-Notification-Demo
cd infrastructure
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp env.example env

# Edit env file with your configuration:
# - AWS_ACCOUNT_ID
# - SAP_BASE_URL
# - SAP credentials (Basic Auth or OAuth)
```

### 3. Deploy MCP Server

See `docs/guides/MCP_DEPLOYMENT_GUIDE.md` for detailed instructions.

**Quick version:**
```bash
# Request AWS account allowlisting first (see docs/guides/ALLOWLIST_REQUEST.md)

# Then deploy MCP server
cd ../bifrost-launch-kit
./setup-mcp.sh

# Integrate with project
cd ../SAP-Notification-Demo
./docs/scripts/integrate-mcp.sh
```

### 4. Deploy Infrastructure

```bash
cd infrastructure
npx cdk bootstrap  # First time only
npx cdk deploy
```

### 5. Test

```bash
# Upload test voice file
npm run test:upload

# Monitor execution
aws stepfunctions list-executions --state-machine-arn <arn>
```

## 📁 Project Structure

```
SAP-Notification-Demo/
├── docs/
│   ├── guides/              # Deployment and setup guides
│   ├── diagrams/            # Architecture diagrams
│   └── scripts/             # Helper scripts
├── infrastructure/
│   ├── lib/                 # CDK stack definitions
│   └── lambda/              # Lambda function code
├── test-data/               # Sample voice files
├── generated-diagrams/      # Generated architecture diagrams
├── env.example              # Example environment configuration
└── README.md                # This file
```

## 📚 Documentation

### Getting Started
- **[MCP Deployment Guide](docs/guides/MCP_DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Allowlist Request](docs/guides/ALLOWLIST_REQUEST.md)** - AWS account allowlisting
- **[Deployment Checklist](docs/guides/DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist

### Architecture
- **[Architecture Diagrams](docs/diagrams/)** - Visual architecture documentation
- **[Mermaid Diagrams](docs/diagrams/ARCHITECTURE_DIAGRAM.md)** - Interactive diagrams

### Scripts
- **[Integration Script](docs/scripts/integrate-mcp.sh)** - MCP integration automation
- **[Diagram Generator](docs/scripts/generate_architecture_diagram.py)** - Generate diagrams

## 🔧 Configuration

### Environment Variables

Create an `env` file based on `env.example`:

```bash
# AWS Configuration
AWS_ACCOUNT_ID=your-account-id
AWS_REGION=us-east-1

# SAP Configuration
SAP_BASE_URL=https://your-sap-system/sap/opu/odata/sap/
SAP_AUTH_FLOW=BASIC  # or M2M or USER_FEDERATION

# Basic Auth (if using)
USERNAME=your-username
PASSWORD=your-password

# OAuth (if using)
SAP_CLIENT_ID=your-client-id
SAP_CLIENT_SECRET=your-client-secret
SAP_SCOPE=/IWFND/SG_MED_CATALOG_0002

# MCP Configuration (auto-generated after deployment)
MCP_URL=
COGNITO_CLIENT_ID=
COGNITO_CLIENT_SECRET=
COGNITO_TOKEN_ENDPOINT=
```

### MCP Server Operations

Configure which operations are enabled:

```bash
READ_ENABLED=true
WRITE_ENABLED=true
CREATE_ENABLED=true
UPDATE_ENABLED=false
DELETE_ENABLED=false
```

## 🧪 Testing

### Test MCP Server
```bash
cd bifrost-launch-kit
source venv/bin/activate
python client/strands_multi_auth_client.py
```

### Test Voice Processing
```bash
cd infrastructure
npm run test:upload
```

### Monitor Logs
```bash
aws logs tail /aws/lambda/VoiceToSapStack-SAPIntegrationFunction --follow
```

## 🔐 Security

- **Credentials**: Never commit credentials to Git
- **Environment Files**: `env` file is gitignored
- **IAM Roles**: Least privilege access
- **Encryption**: S3 server-side encryption enabled
- **Authentication**: Cognito for MCP, Basic/OAuth for SAP

## 🛠️ Technology Stack

- **Infrastructure**: AWS CDK (TypeScript)
- **Compute**: AWS Lambda (Node.js 18.x)
- **AI Services**: Amazon Bedrock (Claude 3.7 Sonnet), AWS Transcribe
- **Orchestration**: AWS Step Functions
- **Storage**: Amazon S3
- **Events**: Amazon EventBridge
- **Integration**: MCP Server on AgentCore Runtime
- **Authentication**: Amazon Cognito

## 📊 Components

### Existing Components
- S3 Buckets (input/output)
- EventBridge Rule
- Step Functions State Machine
- AWS Transcribe
- Amazon Bedrock (Claude 3.7)
- Lambda (Severity Assignment)

### New MCP Components
- Lambda (SAP Integration)
- Amazon Cognito User Pool
- AgentCore Runtime
- MCP Server Container
- SAP Connection

## 🐛 Troubleshooting

### Common Issues

**Access Denied to S3**
→ Account not allowlisted. See `docs/guides/ALLOWLIST_REQUEST.md`

**MCP_URL not found**
→ Deploy MCP server first: `./setup-mcp.sh`

**Lambda timeout**
→ Increase timeout in CDK stack

**SAP connection failed**
→ Verify SAP system accessibility and credentials

See `docs/guides/MCP_DEPLOYMENT_GUIDE.md` Section 8 for detailed troubleshooting.

## 📈 Monitoring

- **CloudWatch Logs**: All Lambda and Step Functions logs
- **CloudWatch Metrics**: Performance and error metrics
- **AgentCore Runtime**: Runtime status and invocation logs
- **Step Functions Console**: Visual workflow monitoring

## 🚀 Deployment Timeline

1. **Request Allowlisting** (1-2 days) - See `docs/guides/ALLOWLIST_REQUEST.md`
2. **Deploy MCP Server** (15 min) - Run `setup-mcp.sh`
3. **Integrate Project** (5 min) - Run `integrate-mcp.sh`
4. **Deploy Infrastructure** (10 min) - Run `npx cdk deploy`
5. **Test & Verify** (15 min) - Run `npm run test:upload`

**Total**: ~45 minutes (after allowlisting)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📝 License

MIT License

## 👥 Team

- **Project Lead**: [Your Name]
- **Contributors**: Shirli, [Others]

## 📞 Support

- **Documentation**: See `docs/` directory
- **Issues**: Create GitHub issue
- **Questions**: Contact team lead

---

**Status**: Ready for Deployment  
**Last Updated**: December 6, 2025  
**Version**: 1.0
