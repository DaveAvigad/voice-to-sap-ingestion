import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import { Construct } from 'constructs';

export class VoiceToSapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Buckets
    const voiceInputBucket = new s3.Bucket(this, 'VoiceInputBucket', {
      bucketName: `voice-to-sap-input-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      eventBridgeEnabled: true,
    });

    const summaryOutputBucket = new s3.Bucket(this, 'SummaryOutputBucket', {
      bucketName: `voice-to-sap-summaries-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Lambda function for severity assignment
    const severityLambda = new lambda.Function(this, 'SeverityAssignmentFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/severity-assignment'),
      timeout: cdk.Duration.minutes(5),
    });

    // IAM role for Step Functions
    const stepFunctionsRole = new iam.Role(this, 'StepFunctionsRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonTranscribeFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
      ],
    });

    severityLambda.grantInvoke(stepFunctionsRole);

    // Step Functions Tasks
    const transcribeTask = new tasks.CallAwsService(this, 'StartTranscription', {
      service: 'transcribe',
      action: 'startTranscriptionJob',
      parameters: {
        'TranscriptionJobName.$': '$.jobName',
        'Media': {
          'MediaFileUri.$': '$.s3Uri'
        },
        'MediaFormat': 'wav',
        'LanguageCode': 'en-US',
        'OutputBucketName': summaryOutputBucket.bucketName,
        'OutputKey.$': 'States.Format(\'transcripts/{}.json\', $.jobName)'
      },
      iamResources: ['*'],
      resultPath: '$.transcriptionJob',
    });

    const waitForTranscription = new stepfunctions.Wait(this, 'WaitForTranscription', {
      time: stepfunctions.WaitTime.duration(cdk.Duration.seconds(30)),
    });

    const checkTranscriptionStatus = new tasks.CallAwsService(this, 'CheckTranscriptionStatus', {
      service: 'transcribe',
      action: 'getTranscriptionJob',
      parameters: {
        'TranscriptionJobName.$': '$.transcriptionJob.TranscriptionJob.TranscriptionJobName',
      },
      iamResources: ['*'],
      resultPath: '$.transcriptionResult',
    });

    // Get transcript from S3
    const getTranscriptTask = new tasks.CallAwsService(this, 'GetTranscript', {
      service: 's3',
      action: 'getObject',
      parameters: {
        'Bucket': summaryOutputBucket.bucketName,
        'Key.$': 'States.Format(\'transcripts/{}.json\', $.jobName)'
      },
      iamResources: [summaryOutputBucket.arnForObjects('*')],
      resultPath: '$.transcriptFile',
    });

    // Parse transcript content
    const parseTranscriptTask = new stepfunctions.Pass(this, 'ParseTranscript', {
      parameters: {
        'transcript.$': 'States.StringToJson($.transcriptFile.Body).results.transcripts[0].transcript'
      },
      resultPath: '$.parsedTranscript',
    });

    // Bedrock sentiment analysis for testing flow
    const testSentimentAnalysisTask = new tasks.BedrockInvokeModel(this, 'TestAnalyzeSentiment', {
      model: bedrock.FoundationModel.fromFoundationModelId(this, 'TestClaudeModel', 
        bedrock.FoundationModelIdentifier.ANTHROPIC_CLAUDE_3_SONNET_20240229_V1_0),
      body: stepfunctions.TaskInput.fromObject({
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 1000,
        'messages': [{
          'role': 'user',
          'content.$': 'States.Format(\'Analyze the sentiment of this customer service call transcript. Provide: 1) Sentiment (positive/negative/neutral), 2) Intensity (1-10 scale). Transcript: {}\', $.parsedTranscript.transcript)'
        }]
      }),
      resultPath: '$.sentimentAnalysis',
    });

    // Bedrock sentiment analysis for production flow
    const prodSentimentAnalysisTask = new tasks.BedrockInvokeModel(this, 'ProdAnalyzeSentiment', {
      model: bedrock.FoundationModel.fromFoundationModelId(this, 'ProdClaudeModel', 
        bedrock.FoundationModelIdentifier.ANTHROPIC_CLAUDE_3_SONNET_20240229_V1_0),
      body: stepfunctions.TaskInput.fromObject({
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 1000,
        'messages': [{
          'role': 'user',
          'content.$': 'States.Format(\'Analyze the sentiment of this customer service call transcript. Provide: 1) Sentiment (positive/negative/neutral), 2) Intensity (1-10 scale). Transcript: {}\', $.parsedTranscript.transcript)'
        }]
      }),
      resultPath: '$.sentimentAnalysis',
    });

    // Lambda task for severity assignment - testing
    const testSeverityTask = new tasks.LambdaInvoke(this, 'TestAssignSeverity', {
      lambdaFunction: severityLambda,
      resultPath: '$.severityResult',
    });

    // Lambda task for severity assignment - production
    const prodSeverityTask = new tasks.LambdaInvoke(this, 'ProdAssignSeverity', {
      lambdaFunction: severityLambda,
      resultPath: '$.severityResult',
    });

    // Bedrock summarization - testing
    const testSummarizationTask = new tasks.BedrockInvokeModel(this, 'TestGenerateSummary', {
      model: bedrock.FoundationModel.fromFoundationModelId(this, 'TestClaudeModelSummary', 
        bedrock.FoundationModelIdentifier.ANTHROPIC_CLAUDE_3_SONNET_20240229_V1_0),
      body: stepfunctions.TaskInput.fromObject({
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 500,
        'messages': [{
          'role': 'user',
          'content.$': 'States.Format(\'Create a concise summary of this customer service call for SAP ingestion. Include: customer issue, sentiment ({}), severity ({}), and recommended actions. Transcript: {}\', $.severityResult.Payload.sentiment, $.severityResult.Payload.severity, $.severityResult.Payload.transcript)'
        }]
      }),
      resultPath: '$.summary',
    });

    // Bedrock summarization - production
    const prodSummarizationTask = new tasks.BedrockInvokeModel(this, 'ProdGenerateSummary', {
      model: bedrock.FoundationModel.fromFoundationModelId(this, 'ProdClaudeModelSummary', 
        bedrock.FoundationModelIdentifier.ANTHROPIC_CLAUDE_3_SONNET_20240229_V1_0),
      body: stepfunctions.TaskInput.fromObject({
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 500,
        'messages': [{
          'role': 'user',
          'content.$': 'States.Format(\'Create a concise summary of this customer service call for SAP ingestion. Include: customer issue, sentiment ({}), severity ({}), and recommended actions. Transcript: {}\', $.severityResult.Payload.sentiment, $.severityResult.Payload.severity, $.severityResult.Payload.transcript)'
        }]
      }),
      resultPath: '$.summary',
    });

    // Save final result to S3 - testing
    const testSaveResultTask = new tasks.CallAwsService(this, 'TestSaveResult', {
      service: 's3',
      action: 'putObject',
      parameters: {
        'Bucket': summaryOutputBucket.bucketName,
        'Key.$': 'States.Format(\'processed/{}.json\', $.jobName)',
        'Body.$': 'States.JsonToString($)'
      },
      iamResources: [summaryOutputBucket.arnForObjects('*')],
    });

    // Save final result to S3 - production
    const prodSaveResultTask = new tasks.CallAwsService(this, 'ProdSaveResult', {
      service: 's3',
      action: 'putObject',
      parameters: {
        'Bucket': summaryOutputBucket.bucketName,
        'Key.$': 'States.Format(\'processed/{}.json\', $.jobName)',
        'Body.$': 'States.JsonToString($)'
      },
      iamResources: [summaryOutputBucket.arnForObjects('*')],
    });

    // Bedrock Agent for SAP integration (placeholder) - testing
    const testSapIntegrationTask = new stepfunctions.Pass(this, 'TestSAPIntegration', {
      comment: 'Placeholder for Bedrock Agent SAP MCP integration',
      parameters: {
        'message': 'Ready for SAP MCP integration',
        'data.$': '$'
      }
    });

    // Bedrock Agent for SAP integration (placeholder) - production
    const prodSapIntegrationTask = new stepfunctions.Pass(this, 'ProdSAPIntegration', {
      comment: 'Placeholder for Bedrock Agent SAP MCP integration',
      parameters: {
        'message': 'Ready for SAP MCP integration',
        'data.$': '$'
      }
    });

    // Choice state for testing vs production flow
    const isTestingChoice = new stepfunctions.Choice(this, 'IsTestingFlow');
    
    // Choice state for transcription completion
    const transcriptionChoice = new stepfunctions.Choice(this, 'IsTranscriptionComplete');
    
    // Testing flow - skip transcription
    const testingFlow = testSentimentAnalysisTask
      .next(testSeverityTask)
      .next(testSummarizationTask)
      .next(testSaveResultTask)
      .next(testSapIntegrationTask);

    // Production flow - full transcription pipeline
    const transcriptionCompleteFlow = getTranscriptTask
      .next(parseTranscriptTask)
      .next(prodSentimentAnalysisTask)
      .next(prodSeverityTask)
      .next(prodSummarizationTask)
      .next(prodSaveResultTask)
      .next(prodSapIntegrationTask);

    const transcriptionFailedFlow = new stepfunctions.Fail(this, 'TranscriptionFailed', {
      cause: 'Transcription job failed'
    });

    const waitAndCheckFlow = waitForTranscription
      .next(checkTranscriptionStatus)
      .next(transcriptionChoice);

    transcriptionChoice
      .when(
        stepfunctions.Condition.stringEquals('$.transcriptionResult.TranscriptionJob.TranscriptionJobStatus', 'COMPLETED'),
        transcriptionCompleteFlow
      )
      .when(
        stepfunctions.Condition.stringEquals('$.transcriptionResult.TranscriptionJob.TranscriptionJobStatus', 'FAILED'),
        transcriptionFailedFlow
      )
      .otherwise(waitAndCheckFlow);

    // Main choice: testing vs production
    isTestingChoice
      .when(
        stepfunctions.Condition.booleanEquals('$.skipTranscription', true),
        testingFlow
      )
      .otherwise(transcribeTask.next(waitAndCheckFlow));

    // Define the main workflow
    const definition = isTestingChoice;

    // Create Step Functions state machine
    const stateMachine = new stepfunctions.StateMachine(this, 'VoiceToSapStateMachine', {
      definition,
      role: stepFunctionsRole,
      timeout: cdk.Duration.minutes(30),
    });

    // EventBridge rule for S3 uploads
    const s3Rule = new events.Rule(this, 'S3UploadRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [voiceInputBucket.bucketName]
          }
        }
      }
    });

    s3Rule.addTarget(new targets.SfnStateMachine(stateMachine, {
      input: events.RuleTargetInput.fromObject({
        jobName: events.EventField.fromPath('$.detail.object.key').replace('.wav', '').replace('.mp3', '').replace('.json', ''),
        s3Uri: `s3://${voiceInputBucket.bucketName}/`.concat(events.EventField.fromPath('$.detail.object.key')),
      })
    }));

    // Outputs
    new cdk.CfnOutput(this, 'VoiceInputBucketName', {
      value: voiceInputBucket.bucketName,
      description: 'Name of the voice input S3 bucket'
    });

    new cdk.CfnOutput(this, 'SummaryOutputBucketName', {
      value: summaryOutputBucket.bucketName,
      description: 'Name of the summary output S3 bucket'
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'ARN of the Step Functions state machine'
    });
  }
}
