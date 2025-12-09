#!/usr/bin/env python3
"""
Generate Voice-to-SAP MCP Architecture Diagram
"""

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.storage import S3
from diagrams.aws.integration import Eventbridge, SF
from diagrams.aws.ml import Transcribe, Bedrock
from diagrams.aws.compute import Lambda, ECS
from diagrams.aws.security import Cognito
from diagrams.aws.general import General

# Generate main architecture diagram
with Diagram("Voice-to-SAP MCP Integration", 
             filename="generated-diagrams/voice-to-sap-mcp-architecture",
             direction="LR",
             show=False):
    
    # Input
    s3_input = S3("Voice Files")
    
    # Event Processing
    with Cluster("Event Processing"):
        eventbridge = Eventbridge("EventBridge")
        stepfunctions = SF("Step Functions")
    
    # AI Processing
    with Cluster("AI Processing"):
        transcribe = Transcribe("Transcribe")
        bedrock_sentiment = Bedrock("Sentiment")
        bedrock_summary = Bedrock("Summary")
    
    # Business Logic
    with Cluster("Business Logic"):
        lambda_severity = Lambda("Severity")
        lambda_sap = Lambda("SAP Integration")
    
    # MCP Layer (NEW)
    with Cluster("MCP Layer (NEW)"):
        cognito = Cognito("Auth")
        agentcore = ECS("AgentCore")
        mcp_server = ECS("MCP Server")
    
    # Target
    sap = General("SAP S/4HANA")
    s3_output = S3("Results")
    
    # Main Flow
    s3_input >> eventbridge >> stepfunctions
    stepfunctions >> transcribe >> bedrock_sentiment >> lambda_severity
    lambda_severity >> bedrock_summary >> lambda_sap
    
    # MCP Integration Flow (highlighted)
    lambda_sap >> Edge(color="orange", style="bold") >> cognito
    cognito >> Edge(color="orange", style="bold") >> agentcore
    agentcore >> Edge(color="orange", style="bold") >> mcp_server
    mcp_server >> Edge(color="orange", style="bold") >> sap
    
    # Results
    lambda_sap >> s3_output

print("✅ Main diagram generated")

# Generate simplified flow diagram
with Diagram("Voice-to-SAP Simplified",
             filename="generated-diagrams/voice-to-sap-simple",
             direction="TB",
             show=False):
    
    voice = S3("Voice")
    transcribe = Transcribe("Transcribe")
    ai = Bedrock("AI")
    logic = Lambda("Logic")
    auth = Cognito("Auth")
    mcp = ECS("MCP")
    sap = General("SAP")
    
    voice >> transcribe >> ai >> logic >> auth >> mcp >> sap

print("✅ Simple diagram generated")

print("\n🎉 All diagrams generated!")
print("📁 Location: generated-diagrams/")
