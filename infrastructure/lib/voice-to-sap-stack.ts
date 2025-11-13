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

    // Lambda function for severity assignment (TypeScript)
    const severityLambda = new lambda.Function(this, 'SeverityAssignmentFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Processing event:', JSON.stringify(event, null, 2));
          
          try {
            const { transcript, sentimentAnalysis } = event;
            
            // Parse Bedrock sentiment response
            let sentiment = 'neutral';
            let intensity = 5;
            
            if (sentimentAnalysis && sentimentAnalysis.content) {
              const content = sentimentAnalysis.content[0]?.text || '';
              const sentimentMatch = content.match(/sentiment[:\\s]*(positive|negative|neutral)/i);
              const intensityMatch = content.match(/intensity[:\\s]*(\\d+)/i);
              
              sentiment = sentimentMatch ? sentimentMatch[1].toLowerCase() : 'neutral';
              intensity = intensityMatch ? parseInt(intensityMatch[1]) : 5;
            }
            
            // Calculate severity based on sentiment, intensity, and keywords
            const severity = calculateSeverity(sentiment, intensity, transcript);
            
            return {
              ...event,
              severity,
              sentiment,
              intensity,
              processedAt: new Date().toISOString()
            };
            
          } catch (error) {
            console.error('Error processing:', error);
            return {
              ...event,
              severity: 'MEDIUM',
              sentiment: 'neutral',
              intensity: 5,
              error: error.message,
              processedAt: new Date().toISOString()
            };
          }
        };
        
        function calculateSeverity(sentiment, intensity, transcript) {
          const urgentKeywords = ['urgent', 'critical', 'emergency', 'broken', 'down', 'not working', 'outage'];
          const complaintKeywords = ['complaint', 'angry', 'frustrated', 'disappointed', 'terrible', 'awful'];
          
          const transcriptLower = (transcript || '').toLowerCase();
          const hasUrgent = urgentKeywords.some(keyword => transcriptLower.includes(keyword));
          const hasComplaint = complaintKeywords.some(keyword => transcriptLower.includes(keyword));
          
          if (sentiment === 'negative') {
            if (intensity >= 8 || hasUrgent) return 'HIGH';
            if (intensity >= 6 || hasComplaint) return 'MEDIUM';
            return 'LOW';
          } else if (sentiment === 'neutral') {
            return hasUrgent ? 'MEDIUM' : 'LOW';
          } else {
            return 'LOW';
          }
        }
      `),
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
        'TranscriptionJobName': stepfunctions.JsonPath.stringAt('$.jobName'),
        'Media': {
          'MediaFileUri': stepfunctions.JsonPath.stringAt('$.s3Uri')
        },
        'MediaFormat': 'wav',
        'LanguageCode': 'en-US',
        'OutputBucketName': summaryOutputBucket.bucketName,
        'OutputKey': stepfunctions.JsonPath.format('transcripts/{}.json', stepfunctions.JsonPath.stringAt('$.jobName'))
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
        'TranscriptionJobName': stepfunctions.JsonPath.stringAt('$.transcriptionJob.TranscriptionJobName'),
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
        'Key': stepfunctions.JsonPath.format('transcripts/{}.json', stepfunctions.JsonPath.stringAt('$.jobName'))
      },
      iamResources: [summaryOutputBucket.arnForObjects('*')],
      resultPath: '$.transcriptFile',
    });

    // Bedrock sentiment analysis
    const sentimentAnalysisTask = new tasks.BedrockInvokeModel(this, 'AnalyzeSentiment', {
      model: bedrock.FoundationModel.fromFoundationModelId(this, 'ClaudeModel', 
        bedrock.FoundationModelIdentifier.ANTHROPIC_CLAUDE_3_SONNET_20240229_V1_0),
      body: stepfunctions.TaskInput.fromObject({
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 1000,
        'messages': [{
          'role': 'user',
          'content': stepfunctions.JsonPath.format(
            'Analyze the sentiment of this customer service call transcript. Provide: 1) Sentiment (positive/negative/neutral), 2) Intensity (1-10 scale). Transcript: {}',
            stepfunctions.JsonPath.stringAt('$.transcript')
          )
        }]
      }),
      resultPath: '$.sentimentAnalysis',
    });

    // Lambda task for severity assignment
    const severityTask = new tasks.LambdaInvoke(this, 'AssignSeverity', {
      lambdaFunction: severityLambda,
      resultPath: '$.severityResult',
    });

    // Bedrock summarization
    const summarizationTask = new tasks.BedrockInvokeModel(this, 'GenerateSummary', {
      model: bedrock.FoundationModel.fromFoundationModelId(this, 'ClaudeModelSummary', 
        bedrock.FoundationModelIdentifier.ANTHROPIC_CLAUDE_3_SONNET_20240229_V1_0),
      body: stepfunctions.TaskInput.fromObject({
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 500,
        'messages': [{
          'role': 'user',
          'content': stepfunctions.JsonPath.format(
            'Create a concise summary of this customer service call for SAP ingestion. Include: customer issue, sentiment ({}), severity ({}), and recommended actions. Transcript: {}',
            stepfunctions.JsonPath.stringAt('$.severityResult.Payload.sentiment'),
            stepfunctions.JsonPath.stringAt('$.severityResult.Payload.severity'),
            stepfunctions.JsonPath.stringAt('$.transcript')
          )
        }]
      }),
      resultPath: '$.summary',
    });

    // Save final result to S3
    const saveResultTask = new tasks.CallAwsService(this, 'SaveResult', {
      service: 's3',
      action: 'putObject',
      parameters: {
        'Bucket': summaryOutputBucket.bucketName,
        'Key': stepfunctions.JsonPath.format('processed/{}.json', stepfunctions.JsonPath.stringAt('$.jobName')),
        'Body': stepfunctions.JsonPath.stringAt('States.JsonToString($)')
      },
      iamResources: [summaryOutputBucket.arnForObjects('*')],
    });

    // Bedrock Agent for SAP integration (placeholder)
    const sapIntegrationTask = new stepfunctions.Pass(this, 'SAPIntegration', {
      comment: 'Placeholder for Bedrock Agent SAP MCP integration',
      parameters: {
        'message': 'Ready for SAP MCP integration',
        'data.$': '$'
      }
    });

    // Choice state for transcription completion
    const transcriptionChoice = new stepfunctions.Choice(this, 'IsTranscriptionComplete');
    
    // Define the workflow with proper chaining
    const transcriptionCompleteFlow = getTranscriptTask
      .next(sentimentAnalysisTask)
      .next(severityTask)
      .next(summarizationTask)
      .next(saveResultTask)
      .next(sapIntegrationTask);

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

    // Define the main workflow
    const definition = transcribeTask.next(waitAndCheckFlow);

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
        jobName: events.EventField.fromPath('$.detail.object.key'),
        s3Uri: events.EventField.fromPath('$.detail.object.key').concat(voiceInputBucket.bucketName, 's3://', '/'),
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
