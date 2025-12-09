# MCP Integration Deployment Guide
## Voice-to-SAP Notification System

**Created**: December 6, 2025  
**Status**: Ready for Deployment

---

## 🎯 Overview

This guide walks you through integrating the SAP MCP Server with your Voice-to-SAP notification system.

### What You'll Deploy
1. **MCP Server** on AWS AgentCore Runtime
2. **Cognito Authentication** for secure MCP access
3. **SAP Integration Lambda** for incident creation
4. **Updated Step Functions** with MCP integration

---

## 📋 Prerequisites Checklist

- [ ] AWS Account allowlisted (Account: 392191936983)
- [ ] AWS CLI configured with valid credentials
- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] SAP credentials verified (bifrost/Welcome1)
- [ ] Bedrock Claude 3.7 Sonnet enabled

---

## 🚀 Deployment Steps

### Phase 1: Request Allowlisting (If Not Done)

**⏱️ Time**: 1-2 business days

1. **Submit Allowlist Request**
   ```bash
   # See ALLOWLIST_REQUEST.md for details
   # Submit ticket at: https://t.corp.amazon.com/create/templates/3910f5df-cfd6-4c79-9b2f-01c05aa86747
   ```

2. **Verify Access**
   ```bash
   aws s3 ls s3://bifrost-mcp-setup/bifrost-launch-kit-v2/ --region us-east-1
   ```

---

### Phase 2: Deploy MCP Server

**⏱️ Time**: 10-15 minutes

1. **Navigate to Setup Directory**
   ```bash
   cd /Users/davigad/dev/bifrost-launch-kit
   ```

2. **Review Configuration**
   ```bash
   cat .env
   # Verify SAP credentials and settings
   ```

3. **Run Automated Setup**
   ```bash
   ./setup-mcp.sh
   ```

   This script will:
   - ✅ Download setup files from S3
   - ✅ Create Python virtual environment
   - ✅ Deploy Cognito User Pool
   - ✅ Setup SAP authentication
   - ✅ Deploy MCP server to AgentCore Runtime
   - ✅ Generate MCP_URL and credentials

4. **Verify Deployment**
   ```bash
   # Check .env file for generated values
   grep "MCP_URL=" .env
   grep "COGNITO_CLIENT_ID=" .env
   ```

5. **Test MCP Server**
   ```bash
   source venv/bin/activate
   python client/strands_multi_auth_client.py
   
   # Try: "find sap services"
   # Try: "list available entities"
   ```

---

### Phase 3: Integrate with Voice-to-SAP Project

**⏱️ Time**: 5 minutes

1. **Navigate to Project**
   ```bash
   cd /Users/davigad/dev/SAP-Notification-Demo
   ```

2. **Run Integration Script**
   ```bash
   ./integrate-mcp.sh
   ```

   This will:
   - ✅ Copy MCP configuration to project
   - ✅ Create MCP client module
   - ✅ Update environment variables

3. **Verify Integration**
   ```bash
   grep "MCP_URL=" env
   ls infrastructure/lambda/sap-integration.ts
   ```

---

### Phase 4: Update Infrastructure

**⏱️ Time**: 10 minutes

1. **Update CDK Stack**
   
   Edit `infrastructure/lib/voice-to-sap-stack.ts` to add SAP integration Lambda:

   ```typescript
   // Add after other Lambda functions
   const sapIntegrationFunction = new lambda.Function(this, 'SAPIntegrationFunction', {
     runtime: lambda.Runtime.NODEJS_18_X,
     handler: 'sap-integration.handler',
     code: lambda.Code.fromAsset('lambda'),
     timeout: cdk.Duration.seconds(30),
     environment: {
       MCP_URL: process.env.MCP_URL || '',
       COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || '',
       COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET || '',
       COGNITO_TOKEN_ENDPOINT: process.env.COGNITO_TOKEN_ENDPOINT || ''
     }
   });
   ```

2. **Update Step Functions**
   
   Add SAP integration step after summarization:

   ```typescript
   const sapIntegrationTask = new tasks.LambdaInvoke(this, 'CreateSAPIncident', {
     lambdaFunction: sapIntegrationFunction,
     outputPath: '$.Payload'
   });

   // Add to workflow
   .next(sapIntegrationTask)
   ```

3. **Build and Deploy**
   ```bash
   cd infrastructure
   npm install
   npm run build
   npx cdk deploy
   ```

---

### Phase 5: Testing

**⏱️ Time**: 15 minutes

#### Test 1: MCP Server Direct Test
```bash
cd /Users/davigad/dev/bifrost-launch-kit
source venv/bin/activate
python client/strands_multi_auth_client.py

# Test queries:
You: find sap services
You: list entities in API_INCIDENT_SRV
You: create an incident with title "Test" and description "Test incident"
```

#### Test 2: End-to-End Voice Processing
```bash
cd /Users/davigad/dev/SAP-Notification-Demo
npm run test:upload

# Monitor Step Functions execution in AWS Console
# Verify SAP incident creation
```

#### Test 3: Manual Step Functions Test
```bash
cd infrastructure
npm run test:stepfunctions
```

---

## 📊 Verification Checklist

After deployment, verify:

- [ ] MCP Server responds to health checks
- [ ] Cognito authentication works
- [ ] SAP connection successful
- [ ] Lambda can call MCP endpoint
- [ ] Step Functions completes successfully
- [ ] SAP incident created in system
- [ ] CloudWatch logs show no errors

---

## 🔍 Monitoring

### CloudWatch Logs
```bash
# MCP Lambda logs
aws logs tail /aws/lambda/VoiceToSapStack-SAPIntegrationFunction --follow

# Step Functions execution
aws stepfunctions list-executions --state-machine-arn <your-state-machine-arn>
```

### AgentCore Runtime
- Console: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/agentcore/runtimes
- Check runtime status and logs

---

## 🐛 Troubleshooting

### Issue: MCP_URL not found
**Solution**: Ensure MCP server deployed successfully
```bash
cd /Users/davigad/dev/bifrost-launch-kit
grep "MCP_URL=" .env
```

### Issue: Authentication failed
**Solution**: Verify Cognito credentials
```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id <pool-id> \
  --client-id <client-id>
```

### Issue: SAP connection timeout
**Solution**: Check SAP system availability
```bash
curl -I https://dielom-sb2.demos.sap.aws.dev/sap/opu/odata/sap/
```

### Issue: Lambda timeout
**Solution**: Increase timeout in CDK stack
```typescript
timeout: cdk.Duration.seconds(60)
```

---

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ MCP server responds to test queries
2. ✅ Voice file upload triggers Step Functions
3. ✅ Transcription completes successfully
4. ✅ Sentiment analysis returns results
5. ✅ SAP incident created with correct data
6. ✅ No errors in CloudWatch logs

---

## 📞 Support

If you encounter issues:

1. Check CloudWatch logs for errors
2. Verify all environment variables are set
3. Test MCP server independently
4. Review Step Functions execution history
5. Check SAP system connectivity

---

## 🚀 Production Readiness

Before going to production:

- [ ] Switch to OAuth 2LO authentication
- [ ] Enable CloudWatch alarms
- [ ] Set up error notifications
- [ ] Configure retry logic
- [ ] Add monitoring dashboard
- [ ] Document runbook procedures
- [ ] Test failure scenarios
- [ ] Set up backup authentication

---

## 📝 Next Steps

After successful deployment:

1. **Monitor** first few production runs
2. **Optimize** Lambda memory/timeout settings
3. **Enhance** error handling and retries
4. **Add** additional SAP operations as needed
5. **Document** operational procedures
6. **Train** team on monitoring and troubleshooting

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Production Ready**: ☐ Yes ☐ No
