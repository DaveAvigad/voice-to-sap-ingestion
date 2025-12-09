# AWS Account Allowlist Request for Bifrost MCP Server

## Request Details

**Date**: December 6, 2025
**AWS Account ID**: 392191936983
**Region**: us-east-1

## Resources Requiring Access

### 1. S3 Bucket Access
- **Bucket**: `s3://bifrost-mcp-setup/bifrost-launch-kit-v2/`
- **Purpose**: Download MCP server setup scripts and configuration
- **Required Permissions**: `s3:GetObject`, `s3:ListBucket`

### 2. ECR Image Access
- **Repository**: `083011581315.dkr.ecr.us-east-1.amazonaws.com/aws-sap-mcp`
- **Image Tag**: `1.0.0-135` (or latest)
- **Purpose**: Deploy SAP MCP server container on AgentCore Runtime
- **Required Permissions**: `ecr:GetAuthorizationToken`, `ecr:BatchGetImage`, `ecr:GetDownloadUrlForLayer`

## Project Context

**Project**: Voice-to-SAP Notification System
**Use Case**: Integrate voice call processing system with SAP via MCP (Model Context Protocol)
**SAP System**: dielom-sb2.demos.sap.aws.dev

## Ticket Template

Please create a ticket using this template:
https://t.corp.amazon.com/create/templates/3910f5df-cfd6-4c79-9b2f-01c05aa86747

**Account to Allowlist**: 392191936983

---

## Next Steps After Allowlisting

1. Download bifrost-launch-kit from S3
2. Configure SAP authentication (Basic Auth with existing credentials)
3. Deploy MCP server to AgentCore Runtime
4. Integrate with existing Voice-to-SAP pipeline
