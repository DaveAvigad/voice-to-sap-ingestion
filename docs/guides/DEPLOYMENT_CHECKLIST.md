# 📋 MCP Integration Deployment Checklist

**Project**: Voice-to-SAP Notification System  
**Date**: December 6, 2025  
**Account**: 392191936983

---

## Pre-Deployment Checklist

### Prerequisites
- [ ] AWS CLI configured and working
- [ ] Python 3.11+ installed (`python3 --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] AWS account has Bedrock access
- [ ] Claude 3.7 Sonnet model enabled in Bedrock
- [ ] SAP system accessible (https://dielom-sb2.demos.sap.aws.dev)
- [ ] SAP credentials verified (bifrost/Welcome1)

### Account Allowlisting
- [ ] Allowlist ticket submitted for account 392191936983
- [ ] S3 bucket access confirmed: `aws s3 ls s3://bifrost-mcp-setup/bifrost-launch-kit-v2/`
- [ ] ECR image access confirmed

---

## Phase 1: MCP Server Deployment

### Setup
- [ ] Navigate to: `cd /Users/davigad/dev/bifrost-launch-kit`
- [ ] Review configuration: `cat .env`
- [ ] Verify SAP credentials are correct
- [ ] Run setup script: `./setup-mcp.sh`

### Verification
- [ ] Script completed without errors
- [ ] MCP_URL generated in .env file
- [ ] COGNITO_CLIENT_ID generated
- [ ] COGNITO_CLIENT_SECRET generated
- [ ] COGNITO_TOKEN_ENDPOINT generated
- [ ] AGENT_ID generated

### Testing
- [ ] Activate venv: `source venv/bin/activate`
- [ ] Run test client: `python client/strands_multi_auth_client.py`
- [ ] Test query: "find sap services" - returns list of services
- [ ] Test query: "list entities" - returns entity sets
- [ ] MCP server responds within 5 seconds

---

## Phase 2: Project Integration

### Integration Script
- [ ] Navigate to: `cd /Users/davigad/dev/SAP-Notification-Demo`
- [ ] Run integration: `./integrate-mcp.sh`
- [ ] Script completed successfully

### Verification
- [ ] MCP configuration added to `env` file
- [ ] Lambda function exists: `infrastructure/lambda/sap-integration.ts`
- [ ] MCP client module created (if applicable)

---

## Phase 3: Infrastructure Deployment

### Build
- [ ] Navigate to: `cd infrastructure`
- [ ] Install dependencies: `npm install`
- [ ] Build TypeScript: `npm run build`
- [ ] No build errors

### CDK Deployment
- [ ] Review changes: `npx cdk diff`
- [ ] Deploy stack: `npx cdk deploy`
- [ ] Deployment successful
- [ ] Note Stack outputs (S3 buckets, Step Functions ARN)

### Post-Deployment Verification
- [ ] Lambda function deployed: VoiceToSapStack-SAPIntegrationFunction
- [ ] Step Functions state machine created
- [ ] S3 buckets created (input and output)
- [ ] EventBridge rule created
- [ ] IAM roles created with correct permissions

---

## Phase 4: Testing

### Unit Tests
- [ ] Test MCP server independently
- [ ] Test Lambda function locally (if possible)
- [ ] Test Step Functions definition

### Integration Tests
- [ ] Upload test voice file: `npm run test:upload`
- [ ] Step Functions execution starts
- [ ] Transcription completes
- [ ] Sentiment analysis completes
- [ ] Severity assignment completes
- [ ] Summary generation completes
- [ ] SAP integration Lambda invoked
- [ ] SAP incident created successfully

### Verification
- [ ] Check CloudWatch logs for errors
- [ ] Verify Step Functions execution succeeded
- [ ] Confirm SAP incident exists in SAP system
- [ ] Review incident data accuracy

---

## Phase 5: Monitoring Setup

### CloudWatch
- [ ] Lambda logs accessible
- [ ] Step Functions logs accessible
- [ ] No error patterns in logs
- [ ] Set up log insights queries (optional)

### Alarms (Optional for Production)
- [ ] Lambda error rate alarm
- [ ] Step Functions failure alarm
- [ ] MCP server timeout alarm
- [ ] SAP connection failure alarm

---

## Production Readiness Checklist

### Security
- [ ] Consider switching to OAuth 2LO (from Basic Auth)
- [ ] Review IAM permissions (least privilege)
- [ ] Enable encryption at rest for S3
- [ ] Review VPC configuration (if needed)
- [ ] Secrets stored in AWS Secrets Manager (optional)

### Reliability
- [ ] Error handling tested
- [ ] Retry logic configured
- [ ] Timeout values appropriate
- [ ] Dead letter queue configured (optional)
- [ ] Circuit breaker pattern (optional)

### Monitoring
- [ ] CloudWatch dashboard created
- [ ] Key metrics identified
- [ ] Alert thresholds defined
- [ ] On-call rotation defined
- [ ] Runbook documented

### Documentation
- [ ] Architecture diagram updated
- [ ] API documentation complete
- [ ] Troubleshooting guide available
- [ ] Operational procedures documented
- [ ] Team trained on system

---

## Post-Deployment Tasks

### Day 1
- [ ] Monitor first 10 executions closely
- [ ] Review all CloudWatch logs
- [ ] Verify SAP incidents created correctly
- [ ] Document any issues encountered

### Week 1
- [ ] Review performance metrics
- [ ] Optimize Lambda memory/timeout if needed
- [ ] Fine-tune error handling
- [ ] Gather user feedback

### Month 1
- [ ] Review cost optimization opportunities
- [ ] Analyze usage patterns
- [ ] Plan enhancements
- [ ] Update documentation based on learnings

---

## Rollback Plan

If deployment fails:

1. **Rollback CDK Stack**
   ```bash
   cd infrastructure
   npx cdk destroy
   ```

2. **Cleanup MCP Server**
   ```bash
   cd /Users/davigad/dev/bifrost-launch-kit
   source venv/bin/activate
   python cleanup/agentcore_cleanup.py
   python cleanup/cognito_cleanup.py
   ```

3. **Restore Previous Version**
   - Redeploy previous working version
   - Verify functionality

---

## Success Criteria

Deployment is successful when:

✅ All checklist items completed  
✅ MCP server responds to queries  
✅ Voice file processing works end-to-end  
✅ SAP incidents created correctly  
✅ No errors in CloudWatch logs  
✅ Performance meets requirements  
✅ Team can operate and troubleshoot system  

---

## Sign-Off

**Deployed By**: ________________  
**Date**: ________________  
**Time**: ________________  

**Verified By**: ________________  
**Date**: ________________  

**Production Approved**: ☐ Yes ☐ No  
**Approval By**: ________________  
**Date**: ________________  

---

## Notes

_Use this space to document any issues, workarounds, or important observations during deployment:_

```
[Add notes here]
```

---

**Next Review Date**: ________________
