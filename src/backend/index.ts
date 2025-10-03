// Simple backend switcher - use Mastra for now
export type BackendType = 'mastra' | 'n8n';

export const BACKEND_TYPE: BackendType = (process.env.BACKEND_TYPE as BackendType) || 'mastra';

// For now, just use Mastra backend
export { mastra } from '../mastra';
export * from '../mastra/tools';
export * from '../mastra/agents';
