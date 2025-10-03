import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { n8nClient } from '../index';

// Re-export types from our existing tools for compatibility
export type WeatherToolResult = z.infer<typeof WeatherToolResultSchema>;
export type FileUploadResult = z.infer<typeof FileUploadResultSchema>;
export type PageCreationResult = z.infer<typeof PageCreationResultSchema>;
export type FileProcessingResult = z.infer<typeof FileProcessingResultSchema>;

const WeatherToolResultSchema = z.object({
  temperature: z.number(),
  feelsLike: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  windGust: z.number(),
  conditions: z.string(),
  location: z.string(),
});

const FileUploadResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
});

const PageCreationResultSchema = z.object({
  pageId: z.string(),
  title: z.string(),
  description: z.string(),
  pageType: z.string(),
  success: z.boolean(),
});

const FileProcessingResultSchema = z.object({
  success: z.boolean(),
  pageId: z.string(),
  fileName: z.string(),
  prompt: z.string(),
  result: z.string(),
  processedContent: z.string(),
  message: z.string(),
});

// n8n-powered weather tool
export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  outputSchema: WeatherToolResultSchema,
  execute: async ({ context }) => {
    try {
      console.log('🌤️ Calling n8n weather webhook for location:', context.location);
      
      // Call n8n webhook directly
      const response = await fetch(process.env.N8N_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
        },
        body: JSON.stringify({
          tool: 'weather',
          location: context.location,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🌤️ n8n weather response:', result);
      
      // For now, return a mock response structure that matches our schema
      // In production, your n8n workflow should return data in this format
      return {
        temperature: result.temperature || 22,
        feelsLike: result.feelsLike || 24,
        humidity: result.humidity || 65,
        windSpeed: result.windSpeed || 10,
        windGust: result.windGust || 15,
        conditions: result.conditions || 'Partly cloudy',
        location: result.location || context.location,
      };
    } catch (error) {
      console.error('Weather tool error:', error);
      throw new Error(`Failed to get weather: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// n8n-powered file upload tool
export const fileUploadTool = createTool({
  id: 'upload-file',
  description: 'Show file upload interface to the user',
  inputSchema: z.object({}),
  outputSchema: z.object({
    message: z.string(),
  }),
  execute: async () => {
    return {
      message: "File upload interface is now available. Please select a file to upload.",
    };
  },
});

// n8n-powered page creation tool
export const createPageTool = createTool({
  id: 'create-page',
  description: 'Create a new page for file processing and content generation',
  inputSchema: z.object({
    pageType: z.string().describe('Type of page to create (e.g., "file-processor", "document-analyzer")'),
    title: z.string().describe('Title for the new page'),
    description: z.string().optional().describe('Optional description of the page purpose'),
  }),
  outputSchema: PageCreationResultSchema,
  execute: async ({ context }) => {
    try {
      // Call n8n workflow for page creation
      const result = await n8nClient.executeWorkflow('create-page-workflow', {
        pageType: context.pageType,
        title: context.title,
        description: context.description,
      });
      
      return result.data;
    } catch (error) {
      console.error('Page creation tool error:', error);
      throw new Error(`Failed to create page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// n8n-powered file processing tool
export const processFileTool = createTool({
  id: 'process-file',
  description: 'Process an uploaded file with a user prompt using AI',
  inputSchema: z.object({
    fileContent: z.string().describe('Base64 encoded file content'),
    fileName: z.string().describe('Name of the file'),
    fileType: z.string().describe('MIME type of the file'),
    prompt: z.string().describe('How to process the file (e.g., "make a TLDR", "create charts", "summarize")'),
    pageId: z.string().describe('ID of the page where results should be displayed'),
  }),
  outputSchema: FileProcessingResultSchema,
  execute: async ({ context }) => {
    try {
      // Call n8n workflow for file processing
      const result = await n8nClient.executeWorkflow('process-file-workflow', {
        fileContent: context.fileContent,
        fileName: context.fileName,
        fileType: context.fileType,
        prompt: context.prompt,
        pageId: context.pageId,
      });
      
      return result.data;
    } catch (error) {
      console.error('File processing tool error:', error);
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
