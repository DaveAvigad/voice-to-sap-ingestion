#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VoiceToSapStack } from '../lib/voice-to-sap-stack';

const app = new cdk.App();
new VoiceToSapStack(app, 'VoiceToSapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
