#!/bin/bash

# Voice-to-SAP System Test Script
echo "🚀 Voice-to-SAP System Test"
echo "=========================="

STATE_MACHINE_ARN="arn:aws:states:us-east-1:183631346754:stateMachine:VoiceToSapStateMachine-TS"

# Test cases
declare -A test_cases=(
    ["high"]="This is a critical emergency! Our entire production system has been down for 2 hours. We are losing thousands of dollars per minute and need immediate assistance!"
    ["medium"]="I am very frustrated with your service. My internet has been slow for days and I have called multiple times. This is disappointing and needs to be resolved."
    ["low"]="Hello, I would like to inquire about upgrading my current plan. Could you please provide information about your premium packages?"
)

for severity in "${!test_cases[@]}"; do
    echo ""
    echo "Testing ${severity^^} severity case..."
    
    job_name="test-${severity}-$(date +%s)"
    transcript="${test_cases[$severity]}"
    
    # Create input JSON
    input=$(cat <<EOF
{
  "jobName": "$job_name",
  "parsedTranscript": {
    "transcript": "$transcript"
  },
  "skipTranscription": true
}
EOF
)
    
    # Start execution
    echo "Starting execution..."
    execution_arn=$(aws stepfunctions start-execution \
        --state-machine-arn "$STATE_MACHINE_ARN" \
        --name "$job_name" \
        --input "$input" \
        --query 'executionArn' \
        --output text)
    
    if [ $? -eq 0 ]; then
        echo "✅ Execution started: $execution_arn"
        
        # Wait for completion
        echo "Waiting for completion..."
        sleep 10
        
        # Check status
        status=$(aws stepfunctions describe-execution \
            --execution-arn "$execution_arn" \
            --query 'status' \
            --output text)
        
        if [ "$status" = "SUCCEEDED" ]; then
            echo "✅ Execution completed successfully"
            echo "📄 Results saved to S3: s3://voice-to-sap-summaries-183631346754/processed/${job_name}.json"
        else
            echo "❌ Execution status: $status"
        fi
    else
        echo "❌ Failed to start execution"
    fi
done

echo ""
echo "🎉 All tests completed!"
echo ""
echo "To view results:"
echo "aws s3 ls s3://voice-to-sap-summaries-183631346754/processed/"
echo ""
echo "To view a specific result:"
echo "aws s3 cp s3://voice-to-sap-summaries-183631346754/processed/[job-name].json -"
