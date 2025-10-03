// Backend switcher - mastra version
export type BackendType = 'mastra' | 'n8n';

export const BACKEND_TYPE: BackendType = (process.env.BACKEND_TYPE as BackendType) || 'mastra';

// Import mastra backend
import { mastra } from '../mastra';

// Re-export mastra tools and agents
export { weatherTool, fileUploadTool, createPageTool, processFileTool } from '../mastra/tools';
export { AgentState, weatherAgent } from '../mastra/agents';

// Export mastra instance
export { mastra };
