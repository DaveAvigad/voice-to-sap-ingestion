from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    aws_events as events,
    aws_events_targets as targets,
    aws_iam as iam,
    Duration,
    RemovalPolicy
)
from constructs import Construct

class VoiceToSapStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 Buckets
        voice_input_bucket = s3.Bucket(
            self, "VoiceInputBucket",
            bucket_name="voice-to-sap-input",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        summary_output_bucket = s3.Bucket(
            self, "SummaryOutputBucket", 
            bucket_name="voice-to-sap-summaries",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Lambda function for severity assignment
        severity_lambda = _lambda.Function(
            self, "SeverityAssignmentFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.lambda_handler",
            code=_lambda.Code.from_asset("../lambda/severity-assignment"),
            timeout=Duration.minutes(5)
        )

        # IAM role for Step Functions
        step_functions_role = iam.Role(
            self, "StepFunctionsRole",
            assumed_by=iam.ServicePrincipal("states.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonTranscribeFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonBedrockFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonS3FullAccess")
            ]
        )

        # Grant Lambda invoke permission to Step Functions
        severity_lambda.grant_invoke(step_functions_role)

        # Step Functions tasks
        transcribe_task = tasks.CallAwsService(
            self, "TranscribeVoice",
            service="transcribe",
            action="startTranscriptionJob",
            parameters={
                "TranscriptionJobName": sfn.JsonPath.string_at("$.jobName"),
                "Media": {
                    "MediaFileUri": sfn.JsonPath.string_at("$.s3Uri")
                },
                "MediaFormat": "wav",
                "LanguageCode": "en-US"
            },
            iam_resources=["*"]
        )

        wait_task = sfn.Wait(
            self, "WaitForTranscription",
            time=sfn.WaitTime.duration(Duration.seconds(30))
        )

        check_status_task = tasks.CallAwsService(
            self, "CheckTranscriptionStatus",
            service="transcribe", 
            action="getTranscriptionJob",
            parameters={
                "TranscriptionJobName": sfn.JsonPath.string_at("$.TranscriptionJobName")
            },
            iam_resources=["*"]
        )

        sentiment_task = tasks.BedrockInvokeModel(
            self, "AnalyzeSentiment",
            model=tasks.BedrockInvokeModelProps(
                model_id="anthropic.claude-3-sonnet-20240229-v1:0",
                body=sfn.TaskInput.from_object({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 1000,
                    "messages": [{
                        "role": "user",
                        "content": sfn.JsonPath.format(
                            "Analyze sentiment of this transcript and provide sentiment (positive/negative/neutral) and intensity (1-10): {}",
                            sfn.JsonPath.string_at("$.transcript")
                        )
                    }]
                })
            )
        )

        severity_task = tasks.LambdaInvoke(
            self, "AssignSeverity",
            lambda_function=severity_lambda
        )

        summary_task = tasks.BedrockInvokeModel(
            self, "GenerateSummary",
            model=tasks.BedrockInvokeModelProps(
                model_id="anthropic.claude-3-sonnet-20240229-v1:0",
                body=sfn.TaskInput.from_object({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 500,
                    "messages": [{
                        "role": "user",
                        "content": sfn.JsonPath.format(
                            "Create a concise summary for SAP ingestion with key issues, sentiment, and severity: {}",
                            sfn.JsonPath.string_at("$.transcript")
                        )
                    }]
                })
            )
        )

        save_s3_task = tasks.CallAwsService(
            self, "SaveSummaryToS3",
            service="s3",
            action="putObject",
            parameters={
                "Bucket": summary_output_bucket.bucket_name,
                "Key": sfn.JsonPath.format("summaries/{}.json", sfn.JsonPath.string_at("$.jobName")),
                "Body": sfn.JsonPath.string_at("$.summary")
            },
            iam_resources=[summary_output_bucket.bucket_arn + "/*"]
        )

        # Choice state for transcription completion
        is_complete = sfn.Choice(self, "IsTranscriptionComplete")
        
        # Define the workflow
        definition = transcribe_task.next(wait_task).next(check_status_task).next(
            is_complete
            .when(
                sfn.Condition.string_equals("$.TranscriptionJob.TranscriptionJobStatus", "COMPLETED"),
                sentiment_task.next(severity_task).next(summary_task).next(save_s3_task)
            )
            .when(
                sfn.Condition.string_equals("$.TranscriptionJob.TranscriptionJobStatus", "FAILED"),
                sfn.Fail(self, "TranscriptionFailed", cause="Transcription job failed")
            )
            .otherwise(wait_task)
        )

        # Create Step Functions state machine
        state_machine = sfn.StateMachine(
            self, "VoiceToSapStateMachine",
            definition=definition,
            role=step_functions_role,
            timeout=Duration.minutes(30)
        )

        # EventBridge rule to trigger on S3 uploads
        s3_rule = events.Rule(
            self, "S3UploadRule",
            event_pattern=events.EventPattern(
                source=["aws.s3"],
                detail_type=["Object Created"],
                detail={
                    "bucket": {"name": [voice_input_bucket.bucket_name]}
                }
            )
        )

        s3_rule.add_target(targets.SfnStateMachine(state_machine))

        # Enable S3 event notifications to EventBridge
        voice_input_bucket.enable_event_bridge_notification()
