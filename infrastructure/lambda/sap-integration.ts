import axios from 'axios';

interface MCPConfig {
  mcpUrl: string;
  clientId: string;
  clientSecret: string;
  tokenEndpoint: string;
}

interface SAPIncidentData {
  title: string;
  description: string;
  severity: string;
  sentiment?: string;
  emotionalIntensity?: number;
  transcription?: string;
  callerId?: string;
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(config: MCPConfig): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  
  const response = await axios.post(
    config.tokenEndpoint,
    'grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  cachedToken = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
  return cachedToken!;
}

async function callMCPTool(config: MCPConfig, toolName: string, parameters: any): Promise<any> {
  const token = await getAccessToken(config);

  const response = await axios.post(
    config.mcpUrl,
    {
      tool: toolName,
      parameters: parameters
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}

export const handler = async (event: any) => {
  console.log('SAP Integration Lambda triggered', JSON.stringify(event, null, 2));

  const config: MCPConfig = {
    mcpUrl: process.env.MCP_URL!,
    clientId: process.env.COGNITO_CLIENT_ID!,
    clientSecret: process.env.COGNITO_CLIENT_SECRET!,
    tokenEndpoint: process.env.COGNITO_TOKEN_ENDPOINT!
  };

  const incidentData: SAPIncidentData = event;

  try {
    // Create SAP incident using MCP
    const result = await callMCPTool(config, 'create_sap_entity', {
      service_name: 'API_INCIDENT_SRV',
      entity_set: 'Incidents',
      data: {
        Title: incidentData.title,
        Description: incidentData.description,
        Priority: incidentData.severity,
        Category: 'VOICE_CALL',
        Sentiment: incidentData.sentiment,
        EmotionalIntensity: incidentData.emotionalIntensity?.toString(),
        CallerId: incidentData.callerId
      }
    });

    console.log('SAP incident created successfully', result);

    return {
      statusCode: 200,
      body: {
        success: true,
        incidentId: result.id,
        message: 'SAP incident created successfully',
        details: result
      }
    };
  } catch (error) {
    console.error('Error creating SAP incident:', error);
    
    return {
      statusCode: 500,
      body: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create SAP incident'
      }
    };
  }
};
