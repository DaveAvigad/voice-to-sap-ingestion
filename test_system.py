#!/usr/bin/env python3
"""
Test script for the Voice-to-SAP ingestion system
"""

import boto3
import json
import time
from datetime import datetime

def test_step_functions():
    """Test the Step Functions workflow with mock data"""
    
    # Initialize AWS clients
    sfn_client = boto3.client('stepfunctions')
    
    # Mock input data
    test_input = {
        "jobName": f"test-job-{int(time.time())}",
        "s3Uri": "s3://voice-to-sap-input/test-voice-file.wav",
        "transcript": "Hello, I'm calling because my internet service has been down for 3 hours. This is urgent as I work from home and need connectivity immediately. I'm very frustrated with this outage."
    }
    
    try:
        # Get the state machine ARN (you'll need to update this after deployment)
        state_machine_arn = "arn:aws:states:us-east-1:123456789012:stateMachine:VoiceToSapStateMachine"
        
        print("Starting Step Functions execution...")
        print(f"Input: {json.dumps(test_input, indent=2)}")
        
        # Start execution
        response = sfn_client.start_execution(
            stateMachineArn=state_machine_arn,
            name=f"test-execution-{int(time.time())}",
            input=json.dumps(test_input)
        )
        
        execution_arn = response['executionArn']
        print(f"Execution started: {execution_arn}")
        
        # Monitor execution
        while True:
            status_response = sfn_client.describe_execution(executionArn=execution_arn)
            status = status_response['status']
            
            print(f"Execution status: {status}")
            
            if status in ['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED']:
                break
                
            time.sleep(10)
        
        if status == 'SUCCEEDED':
            print("✅ Execution completed successfully!")
            print(f"Output: {status_response.get('output', 'No output')}")
        else:
            print(f"❌ Execution failed with status: {status}")
            print(f"Error: {status_response.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"Error testing Step Functions: {str(e)}")

def test_lambda_function():
    """Test the severity assignment Lambda function locally"""
    
    # Import the Lambda function
    import sys
    sys.path.append('./lambda/severity-assignment')
    from index import lambda_handler
    
    # Test cases
    test_cases = [
        {
            "name": "High severity - urgent negative",
            "event": {
                "Body": {
                    "content": [{"text": "Sentiment: negative, Intensity: 9"}]
                },
                "transcript": "This is urgent! My system is completely broken and not working at all!"
            }
        },
        {
            "name": "Medium severity - complaint",
            "event": {
                "Body": {
                    "content": [{"text": "Sentiment: negative, Intensity: 6"}]
                },
                "transcript": "I'm frustrated with this service. It's terrible and disappointing."
            }
        },
        {
            "name": "Low severity - positive",
            "event": {
                "Body": {
                    "content": [{"text": "Sentiment: positive, Intensity: 3"}]
                },
                "transcript": "Thank you for your help. Everything is working fine now."
            }
        }
    ]
    
    print("Testing Lambda function locally...")
    print("=" * 50)
    
    for test_case in test_cases:
        print(f"\nTest: {test_case['name']}")
        result = lambda_handler(test_case['event'], {})
        print(f"Severity: {result.get('severity')}")
        print(f"Sentiment: {result.get('sentiment')}")
        print(f"Intensity: {result.get('intensity')}")

if __name__ == "__main__":
    print("Voice-to-SAP System Test")
    print("=" * 30)
    
    choice = input("Choose test:\n1. Lambda function (local)\n2. Step Functions (AWS)\nEnter choice (1 or 2): ")
    
    if choice == "1":
        test_lambda_function()
    elif choice == "2":
        test_step_functions()
    else:
        print("Invalid choice")
