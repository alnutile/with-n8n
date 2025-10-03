// n8n integration layer
// This will replace the Mastra backend with n8n API calls

export interface N8nConfig {
  apiUrl: string;
  apiKey?: string;
  timeout?: number;
}

export class N8nClient {
  private config: N8nConfig;

  constructor(config: N8nConfig) {
    this.config = config;
  }

  async executeWorkflow(workflowId: string, data: Record<string, unknown>) {
    const response = await fetch(`${this.config.apiUrl}/api/v1/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`n8n workflow execution failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getWorkflow(workflowId: string) {
    const response = await fetch(`${this.config.apiUrl}/api/v1/workflows/${workflowId}`, {
      headers: {
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get n8n workflow: ${response.statusText}`);
    }

    return response.json();
  }
}

// Default n8n configuration
export const n8nConfig: N8nConfig = {
  apiUrl: process.env.N8N_API_URL || 'http://localhost:5678',
  apiKey: process.env.N8N_API_KEY,
  timeout: 30000,
};

export const n8nClient = new N8nClient(n8nConfig);
