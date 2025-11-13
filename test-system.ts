import { StepFunctionsClient, StartExecutionCommand, DescribeExecutionCommand } from '@aws-sdk/client-sfn';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const stepFunctionsClient = new StepFunctionsClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });

interface TestCase {
  name: string;
  transcript: string;
  expectedSeverity: string;
}

const testCases: TestCase[] = [
  {
    name: 'High Severity - Critical Outage',
    transcript: 'This is a critical emergency! Our entire production system has been down for 2 hours. We are losing thousands of dollars per minute and need immediate assistance!',
    expectedSeverity: 'HIGH'
  },
  {
    name: 'Medium Severity - Frustrated Customer',
    transcript: 'I am very frustrated with your service. My internet has been slow for days and I have called multiple times. This is disappointing and needs to be resolved.',
    expectedSeverity: 'MEDIUM'
  },
  {
    name: 'Low Severity - General Inquiry',
    transcript: 'Hello, I would like to inquire about upgrading my current plan. Could you please provide information about your premium packages?',
    expectedSeverity: 'LOW'
  }
];

async function testStepFunctions(stateMachineArn: string): Promise<void> {
  console.log('🧪 Testing Step Functions with real Transcribe + Bedrock integration...\n');

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    
    const input = {
      jobName: \`test-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,
      s3Uri: 's3://voice-to-sap-input-183631346754/test-audio.wav',
      transcript: testCase.transcript
    };

    try {
      // Start execution
      const startCommand = new StartExecutionCommand({
        stateMachineArn,
        name: \`test-execution-\${Date.now()}\`,
        input: JSON.stringify(input)
      });

      const startResponse = await stepFunctionsClient.send(startCommand);
      console.log(\`✅ Started execution: \${startResponse.executionArn}\`);

      // Wait and check status
      await new Promise(resolve => setTimeout(resolve, 5000));

      const describeCommand = new DescribeExecutionCommand({
        executionArn: startResponse.executionArn!
      });

      const describeResponse = await stepFunctionsClient.send(describeCommand);
      console.log(\`Status: \${describeResponse.status}\`);

      if (describeResponse.status === 'SUCCEEDED') {
        console.log(\`✅ Expected: \${testCase.expectedSeverity}\`);
        console.log(\`📄 Output: \${describeResponse.output}\`);
      } else if (describeResponse.status === 'FAILED') {
        console.log(\`❌ Execution failed: \${describeResponse.error}\`);
      } else {
        console.log(\`⏳ Still running: \${describeResponse.status}\`);
      }

    } catch (error) {
      console.error(\`❌ Error testing \${testCase.name}:\`, error);
    }

    console.log('---\n');
  }
}

async function uploadTestFile(): Promise<void> {
  console.log('📁 Uploading test voice file to trigger pipeline...\n');

  const testData = {
    metadata: {
      uploadedAt: new Date().toISOString(),
      testFile: true
    },
    transcript: 'This is urgent! Our system is completely broken and not working. We need immediate help!'
  };

  try {
    const command = new PutObjectCommand({
      Bucket: 'voice-to-sap-input-183631346754',
      Key: \`test-voice-\${Date.now()}.json\`,
      Body: JSON.stringify(testData),
      ContentType: 'application/json'
    });

    await s3Client.send(command);
    console.log('✅ Test file uploaded successfully!');
    console.log('🔄 Pipeline should start automatically via EventBridge...');

  } catch (error) {
    console.error('❌ Error uploading test file:', error);
  }
}

async function main(): Promise<void> {
  const stateMachineArn = 'arn:aws:states:us-east-1:183631346754:stateMachine:VoiceToSapStateMachine';

  console.log('🚀 Voice-to-SAP System Test Suite');
  console.log('==================================\n');

  const choice = process.argv[2];

  switch (choice) {
    case 'stepfunctions':
      await testStepFunctions(stateMachineArn);
      break;
    case 'upload':
      await uploadTestFile();
      break;
    default:
      console.log('Usage:');
      console.log('  npm run test:stepfunctions  - Test Step Functions directly');
      console.log('  npm run test:upload         - Upload file to trigger pipeline');
      break;
  }
}

main().catch(console.error);
