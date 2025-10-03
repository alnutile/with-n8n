// Backend switcher - n8n version
export type BackendType = 'mastra' | 'n8n';

export const BACKEND_TYPE: BackendType = (process.env.BACKEND_TYPE as BackendType) || 'mastra';

// Import n8n backend
import { mastra } from '../n8n';

// Re-export n8n tools and agents
export { weatherTool, fileUploadTool, createPageTool, processFileTool } from '../n8n/tools';
export { AgentState, weatherAgent } from '../n8n/agents';

// Export mastra instance
export { mastra };
