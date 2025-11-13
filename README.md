# Voice-to-SAP Ingestion System

An automated system that processes voice call recordings, performs sentiment analysis, and ingests structured data into SAP using AWS services and Bedrock Agent Core.

## Architecture

The system processes voice files through the following pipeline:

1. **Voice File Ingestion** - Voice files uploaded to S3 trigger the processing pipeline
2. **Transcription** - AWS Transcribe converts voice to text
3. **Sentiment Analysis** - Amazon Bedrock analyzes sentiment and emotional tone
4. **Severity Assignment** - Lambda function assigns severity levels based on sentiment
5. **Summarization** - Bedrock generates concise summaries
6. **SAP Integration** - Bedrock Agent with SAP MCP connector ingests data into SAP

## Components

- **S3 Buckets**: Input (voice files) and output (summaries)
- **AWS Transcribe**: Voice-to-text conversion
- **Amazon Bedrock**: Sentiment analysis and summarization
- **AWS Lambda**: Severity assignment logic
- **Step Functions**: Orchestrates the entire pipeline
- **EventBridge**: Event-driven triggers
- **Bedrock Agent Core**: SAP integration with MCP connector

## Setup

1. Deploy infrastructure using AWS CDK/CloudFormation
2. Configure Bedrock models and agents
3. Set up SAP MCP connector
4. Deploy Lambda functions
5. Configure Step Functions workflow

## Usage

Upload voice files to the input S3 bucket. The system will automatically:
- Transcribe the audio
- Analyze sentiment
- Assign severity
- Generate summary
- Ingest into SAP

## Architecture Diagram

![Architecture](generated-diagrams/voice-to-sap-architecture.png)
