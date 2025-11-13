#!/usr/bin/env python3
"""
Generate test data for the Voice-to-SAP system
"""

import json
import boto3
from datetime import datetime
import uuid

def create_sample_transcripts():
    """Create sample transcripts for testing"""
    
    samples = [
        {
            "filename": "urgent_outage.json",
            "transcript": "Hello, this is John Smith calling about a critical system outage. Our entire production environment has been down for the past 2 hours and we're losing money every minute. This is extremely urgent and needs immediate attention. Our customer ID is CUST-12345.",
            "expected_severity": "HIGH",
            "expected_sentiment": "negative"
        },
        {
            "filename": "billing_complaint.json", 
            "transcript": "Hi, I'm calling to complain about my recent bill. I'm very frustrated because I was charged for services I didn't use. This is disappointing and I expect this to be resolved quickly. My account number is ACC-67890.",
            "expected_severity": "MEDIUM",
            "expected_sentiment": "negative"
        },
        {
            "filename": "thank_you_call.json",
            "transcript": "Hello, I just wanted to call and thank your support team for resolving my issue yesterday. The technician was very helpful and professional. Everything is working perfectly now. Great service!",
            "expected_severity": "LOW", 
            "expected_sentiment": "positive"
        },
        {
            "filename": "general_inquiry.json",
            "transcript": "Hi, I have a question about your new service offerings. Could you please send me some information about the pricing plans? I'm considering upgrading my current package.",
            "expected_severity": "LOW",
            "expected_sentiment": "neutral"
        }
    ]
    
    # Create test data directory
    import os
    os.makedirs("test-data", exist_ok=True)
    
    for sample in samples:
        # Create full test payload
        test_payload = {
            "jobName": f"test-{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.now().isoformat(),
            "transcript": sample["transcript"],
            "expected_results": {
                "severity": sample["expected_severity"],
                "sentiment": sample["expected_sentiment"]
            },
            "metadata": {
                "source": "test_generator",
                "filename": sample["filename"]
            }
        }
        
        # Save to file
        with open(f"test-data/{sample['filename']}", 'w') as f:
            json.dump(test_payload, f, indent=2)
    
    print(f"✅ Created {len(samples)} test transcript files in test-data/")
    return samples

def upload_to_s3(bucket_name="voice-to-sap-input"):
    """Upload test files to S3 to trigger the pipeline"""
    
    try:
        s3_client = boto3.client('s3')
        
        # Check if bucket exists
        try:
            s3_client.head_bucket(Bucket=bucket_name)
        except:
            print(f"❌ Bucket {bucket_name} not found. Deploy infrastructure first.")
            return
        
        # Upload test files
        import os
        test_files = [f for f in os.listdir("test-data") if f.endswith('.json')]
        
        for filename in test_files:
            key = f"test-transcripts/{filename}"
            s3_client.upload_file(f"test-data/{filename}", bucket_name, key)
            print(f"✅ Uploaded {filename} to s3://{bucket_name}/{key}")
            
        print(f"\n🚀 Uploaded {len(test_files)} test files to trigger processing pipeline")
        
    except Exception as e:
        print(f"❌ Error uploading to S3: {str(e)}")
        print("Make sure AWS credentials are configured and infrastructure is deployed")

def simulate_step_functions_input():
    """Create Step Functions input format for manual testing"""
    
    samples = create_sample_transcripts()
    
    # Create Step Functions input format
    sf_inputs = []
    for sample in samples:
        sf_input = {
            "jobName": f"manual-test-{uuid.uuid4().hex[:8]}",
            "s3Uri": f"s3://voice-to-sap-input/test-{sample['filename']}",
            "transcript": sample["transcript"]
        }
        sf_inputs.append(sf_input)
    
    # Save Step Functions inputs
    with open("test-data/step-functions-inputs.json", 'w') as f:
        json.dump(sf_inputs, f, indent=2)
    
    print("✅ Created Step Functions input file: test-data/step-functions-inputs.json")
    return sf_inputs

if __name__ == "__main__":
    print("Voice-to-SAP Test Data Generator")
    print("=" * 35)
    
    # Create sample transcripts
    create_sample_transcripts()
    
    # Create Step Functions inputs
    simulate_step_functions_input()
    
    # Ask if user wants to upload to S3
    choice = input("\nUpload test files to S3 to trigger pipeline? (y/n): ")
    if choice.lower() == 'y':
        upload_to_s3()
    
    print("\n📋 Next steps:")
    print("1. Deploy infrastructure: ./deploy.sh")
    print("2. Run this script again to upload test files")
    print("3. Monitor Step Functions in AWS Console")
    print("4. Check results in voice-to-sap-summaries S3 bucket")
