export interface BedrockAgentConfig {
  agentName: string;
  description: string;
  foundationModel: string;
  instruction: string;
  actionGroups: ActionGroup[];
  knowledgeBases?: KnowledgeBase[];
}

export interface ActionGroup {
  actionGroupName: string;
  description: string;
  actionGroupExecutor: {
    customControl: 'RETURN_CONTROL';
  };
  apiSchema: {
    payload: OpenAPISchema;
  };
}

export interface KnowledgeBase {
  knowledgeBaseId: string;
  description: string;
}

export interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, any>;
}

export const sapIntegrationAgentConfig: BedrockAgentConfig = {
  agentName: 'voice-to-sap-integration-agent',
  description: 'AI Agent for ingesting processed voice call data into SAP system via MCP connector',
  foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
  instruction: \`You are an AI agent specialized in ingesting customer service call data into SAP systems.

Your responsibilities:
1. Receive processed voice call data including transcript, sentiment analysis, severity level, and summary
2. Format the data appropriately for SAP ingestion
3. Use the SAP MCP connector to create incidents, tickets, or records in SAP
4. Handle errors gracefully and provide meaningful feedback
5. Ensure data integrity and proper categorization

Input format you'll receive:
- jobName: Unique identifier for the call
- transcript: Full call transcript
- sentiment: positive/negative/neutral
- intensity: 1-10 scale
- severity: HIGH/MEDIUM/LOW
- summary: AI-generated summary
- processedAt: Timestamp

Always validate the data before SAP ingestion and provide clear status updates.\`,

  actionGroups: [
    {
      actionGroupName: 'sap-mcp-integration',
      description: 'Actions for integrating with SAP system via MCP connector',
      actionGroupExecutor: {
        customControl: 'RETURN_CONTROL'
      },
      apiSchema: {
        payload: {
          openapi: '3.0.0',
          info: {
            title: 'SAP MCP Integration API',
            version: '1.0.0'
          },
          paths: {
            '/sap/create-incident': {
              post: {
                summary: 'Create a new incident in SAP',
                description: 'Creates a customer service incident in SAP based on voice call analysis',
                requestBody: {
                  required: true,
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          title: {
                            type: 'string',
                            description: 'Brief title of the incident'
                          },
                          description: {
                            type: 'string',
                            description: 'Detailed description from call summary'
                          },
                          severity: {
                            type: 'string',
                            enum: ['HIGH', 'MEDIUM', 'LOW'],
                            description: 'Severity level assigned by AI'
                          },
                          sentiment: {
                            type: 'string',
                            enum: ['positive', 'negative', 'neutral'],
                            description: 'Customer sentiment from call'
                          },
                          category: {
                            type: 'string',
                            description: 'Incident category based on call content'
                          },
                          customerId: {
                            type: 'string',
                            description: 'Customer identifier if available'
                          },
                          callTimestamp: {
                            type: 'string',
                            format: 'date-time',
                            description: 'When the call occurred'
                          },
                          transcript: {
                            type: 'string',
                            description: 'Full call transcript'
                          }
                        },
                        required: ['title', 'description', 'severity', 'sentiment']
                      }
                    }
                  }
                },
                responses: {
                  '200': {
                    description: 'Incident created successfully',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: {
                            incidentId: {
                              type: 'string',
                              description: 'SAP incident ID'
                            },
                            status: {
                              type: 'string',
                              description: 'Creation status'
                            },
                            message: {
                              type: 'string',
                              description: 'Success message'
                            }
                          }
                        }
                      }
                    }
                  },
                  '400': {
                    description: 'Invalid request data'
                  },
                  '500': {
                    description: 'SAP system error'
                  }
                }
              }
            },
            '/sap/update-customer': {
              post: {
                summary: 'Update customer record in SAP',
                description: 'Updates customer information based on call interaction',
                requestBody: {
                  required: true,
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          customerId: {
                            type: 'string',
                            description: 'Customer identifier'
                          },
                          lastInteraction: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Timestamp of last call'
                          },
                          sentimentHistory: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                date: { type: 'string', format: 'date-time' },
                                sentiment: { type: 'string' },
                                intensity: { type: 'number' }
                              }
                            }
                          },
                          notes: {
                            type: 'string',
                            description: 'Additional notes from call'
                          }
                        },
                        required: ['customerId', 'lastInteraction']
                      }
                    }
                  }
                },
                responses: {
                  '200': {
                    description: 'Customer record updated successfully'
                  }
                }
              }
            },
            '/sap/get-customer-history': {
              get: {
                summary: 'Retrieve customer interaction history',
                description: 'Gets previous interactions to provide context',
                parameters: [
                  {
                    name: 'customerId',
                    in: 'query',
                    required: true,
                    schema: {
                      type: 'string'
                    },
                    description: 'Customer identifier'
                  }
                ],
                responses: {
                  '200': {
                    description: 'Customer history retrieved',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: {
                            customerId: { type: 'string' },
                            interactions: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  date: { type: 'string', format: 'date-time' },
                                  type: { type: 'string' },
                                  sentiment: { type: 'string' },
                                  summary: { type: 'string' }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  ],

  knowledgeBases: [
    {
      knowledgeBaseId: 'sap-procedures-kb',
      description: 'Knowledge base containing SAP procedures and best practices for incident management'
    }
  ]
};

// Helper function to create the agent
export async function createBedrockAgent(config: BedrockAgentConfig): Promise<void> {
  console.log(\`Creating Bedrock Agent: \${config.agentName}\`);
  console.log('Configuration:', JSON.stringify(config, null, 2));
  
  // This would be implemented with AWS SDK calls to create the actual agent
  // For now, it's a configuration template
  console.log('✅ Agent configuration ready for deployment');
}
