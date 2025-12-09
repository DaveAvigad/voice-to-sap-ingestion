#!/bin/bash
set -e

echo "=========================================="
echo "Integrating MCP Server with Voice-to-SAP"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if MCP server is deployed
MCP_ENV="../bifrost-launch-kit/.env"
if [ ! -f "$MCP_ENV" ]; then
    echo -e "${RED}Error: MCP server not deployed${NC}"
    echo "Please run: cd ../bifrost-launch-kit && ./setup-mcp.sh"
    exit 1
fi

# Extract MCP configuration
echo -e "${YELLOW}Step 1: Reading MCP configuration...${NC}"
source "$MCP_ENV"

if [ -z "$MCP_URL" ]; then
    echo -e "${RED}Error: MCP_URL not found in .env${NC}"
    echo "Please deploy MCP server first"
    exit 1
fi

echo -e "${GREEN}✓ MCP Server URL: $MCP_URL${NC}"
echo ""

# Update project env file
echo -e "${YELLOW}Step 2: Updating project configuration...${NC}"
cat >> env << EOF

# =============================================================================
# MCP SERVER CONFIGURATION (Auto-generated: $(date))
# =============================================================================

# MCP Server Endpoint
MCP_URL=$MCP_URL
AGENT_ID=$AGENT_ID
RUNTIME_ROLE=$RUNTIME_ROLE

# Cognito Authentication
COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
COGNITO_CLIENT_SECRET=$COGNITO_CLIENT_SECRET
COGNITO_TOKEN_ENDPOINT=$COGNITO_TOKEN_ENDPOINT

# SAP Configuration
SAP_BASE_URL=$SAP_BASE_URL
SAP_AUTH_FLOW=$SAP_AUTH_FLOW
EOF

echo -e "${GREEN}✓ Configuration updated in env file${NC}"
echo ""

# Create MCP client module
echo -e "${YELLOW}Step 3: Creating MCP client module...${NC}"
cat > infrastructure/lib/mcp-client.ts << 'EOF'
import * as https from 'https';

export interface MCPConfig {
  mcpUrl: string;
  clientId: string;
  clientSecret: string;
  tokenEndpoint: string;
}

export class MCPClient {
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(private config: MCPConfig) {}

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    const tokenUrl = new URL(this.config.tokenEndpoint);
    
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: tokenUrl.hostname,
        path: tokenUrl.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const response = JSON.parse(data);
          this.accessToken = response.access_token;
          this.tokenExpiry = Date.now() + (response.expires_in * 1000);
          resolve(this.accessToken!);
        });
      });
      
      req.on('error', reject);
      req.write('grant_type=client_credentials');
      req.end();
    });
  }

  async createSAPIncident(data: {
    title: string;
    description: string;
    severity: string;
    customerInfo?: any;
  }): Promise<any> {
    const token = await this.getAccessToken();
    const mcpUrl = new URL(this.config.mcpUrl);

    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        tool: 'create_sap_entity',
        parameters: {
          service_name: 'API_INCIDENT_SRV',
          entity_set: 'Incidents',
          data: {
            Title: data.title,
            Description: data.description,
            Priority: data.severity,
            ...data.customerInfo
          }
        }
      });

      const req = https.request({
        hostname: mcpUrl.hostname,
        path: mcpUrl.pathname + mcpUrl.search,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }
}
EOF

echo -e "${GREEN}✓ MCP client module created${NC}"
echo ""

echo -e "${GREEN}=========================================="
echo "✓ Integration Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update Step Functions to use MCP client"
echo "2. Deploy updated infrastructure: cd infrastructure && npx cdk deploy"
echo "3. Test end-to-end: npm run test:upload"
echo ""
