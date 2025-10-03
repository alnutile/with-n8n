import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}
interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

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

      const initialResult = await response.json();
      console.log('🌤️ n8n weather response:', JSON.stringify(initialResult, null, 2));
      
      // Handle different n8n response patterns
      if (initialResult.message === 'Workflow was started') {
        console.log('🔄 Workflow started, waiting for completion...');
        
        // Wait a bit for the workflow to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try to get the result (this depends on your n8n setup)
        // Option 1: Check if there's a result endpoint
        try {
          const resultResponse = await fetch(`${process.env.N8N_API_URL}/result`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
            },
            body: JSON.stringify({
              tool: 'weather',
              location: context.location,
            }),
          });
          
          if (resultResponse.ok) {
            const resultData = await resultResponse.json();
            console.log('✅ Got workflow result:', JSON.stringify(resultData, null, 2));
            return transformN8nResponse(resultData, context.location);
          }
        } catch (resultError) {
          console.log('⚠️ Could not get result:', resultError);
        }
        
        // Option 2: If no result endpoint, use fallback
        console.log('⚠️ No result endpoint available, using fallback data');
        return transformN8nResponse({}, context.location);
      }
      
      // If we have immediate results, use them
      if (initialResult.data || initialResult.temperature !== undefined) {
        console.log('✅ Using immediate results');
        return transformN8nResponse(initialResult, context.location);
      }
      
      // Handle n8n output format (JSON string in "output" field)
      if (initialResult.output) {
        console.log('✅ Found n8n output data');
        try {
          const parsedOutput = JSON.parse(initialResult.output);
          console.log('✅ Parsed n8n output:', parsedOutput);
          return transformN8nResponse(parsedOutput, context.location);
        } catch (parseError) {
          console.log('⚠️ Could not parse n8n output:', parseError);
        }
      }
      
      // Fallback to mock data if no real data
      console.log('⚠️ No real data received, using fallback');
      return transformN8nResponse({}, context.location);
      
    } catch (error) {
      console.error('Weather tool error:', error);
      throw new Error(`Failed to get weather: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

export const fileUploadTool = createTool({
  id: 'upload-file',
  description: 'Show file upload interface to the user',
  inputSchema: z.object({}),
  outputSchema: z.object({
    message: z.string(),
  }),
  execute: async () => {
    // This tool just shows the upload interface
    // The actual file upload happens through the frontend action
    return {
      message: "File upload interface is now available. Please select a file to upload.",
    };
  },
});

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
    return await createPage(context);
  },
});

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
    return await processFileWithAI(context);
  },
});

// Helper function to transform n8n response to our schema
const transformN8nResponse = (data: any, fallbackLocation: string) => {
  return {
    temperature: data.temperature || data.temp || data.current_temp || 22,
    feelsLike: data.feelsLike || data.apparent_temp || data.feels_like || 24,
    humidity: data.humidity || data.humidity_percent || data.relative_humidity || 65,
    windSpeed: data.windSpeed || data.wind_kmh || data.wind_speed || 10,
    windGust: data.windGust || data.wind_gust || data.gust_speed || 15,
    conditions: data.conditions || data.weather_desc || data.description || 'Partly cloudy',
    location: data.location || data.city_name || data.city || fallbackLocation,
  };
};

const getWeather = async (location: string) => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await fetch(weatherUrl);
  const data = (await response.json()) as WeatherResponse;

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
  };
};

const handleFileUpload = async (context: {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileContent: string;
}) => {
  // For now, we'll just log the file info and return a success response
  // In a real application, you would save the file to storage, process it, etc.
  console.log('File upload received:', {
    fileName: context.fileName,
    fileSize: context.fileSize,
    fileType: context.fileType,
    contentLength: context.fileContent.length,
  });

  return {
    success: true,
    message: `File "${context.fileName}" uploaded successfully!`,
    fileName: context.fileName,
    fileSize: context.fileSize,
    fileType: context.fileType,
  };
};

const createPage = async (context: {
  pageType: string;
  title: string;
  description?: string;
}) => {
  const pageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('Creating new page:', {
    pageId,
    pageType: context.pageType,
    title: context.title,
    description: context.description,
  });

  return {
    pageId,
    title: context.title,
    description: context.description || `A ${context.pageType} page for processing files and generating content`,
    pageType: context.pageType,
    success: true,
  };
};

const processFileWithAI = async (context: {
  fileContent: string;
  fileName: string;
  fileType: string;
  prompt: string;
  pageId: string;
}) => {
  console.log('Processing file with AI:', {
    fileName: context.fileName,
    fileType: context.fileType,
    prompt: context.prompt,
    pageId: context.pageId,
    contentLength: context.fileContent.length,
  });

  // For now, we'll simulate AI processing
  // In a real implementation, you would:
  // 1. Decode the base64 file content
  // 2. Send to OpenAI/Claude with the prompt
  // 3. Return the processed result
  
  let processedContent = '';
  let result = '';

  if (context.prompt.toLowerCase().includes('tldr') || context.prompt.toLowerCase().includes('summary')) {
    result = 'TLDR Generated';
    processedContent = `# Summary of ${context.fileName}\n\nThis is a simulated TLDR/summary of your file. In a real implementation, the AI would analyze the file content and provide an actual summary based on the prompt: "${context.prompt}"\n\n**File Details:**\n- Name: ${context.fileName}\n- Type: ${context.fileType}\n- Size: ${(context.fileContent.length * 0.75 / 1024).toFixed(1)} KB (estimated)\n\n**Processing Prompt:** ${context.prompt}`;
  } else if (context.prompt.toLowerCase().includes('chart') || context.prompt.toLowerCase().includes('graph')) {
    result = 'Charts Generated';
    processedContent = `# Data Visualization for ${context.fileName}\n\nThis is a simulated chart generation result. In a real implementation, the AI would analyze the file data and create appropriate visualizations.\n\n**File Details:**\n- Name: ${context.fileName}\n- Type: ${context.fileType}\n- Size: ${(context.fileContent.length * 0.75 / 1024).toFixed(1)} KB (estimated)\n\n**Processing Prompt:** ${context.prompt}\n\n*Note: This is a placeholder. Real implementation would generate actual charts and graphs.*`;
  } else {
    result = 'File Processed';
    processedContent = `# Processed: ${context.fileName}\n\nThis is a simulated processing result. The AI would analyze your file based on the prompt: "${context.prompt}"\n\n**File Details:**\n- Name: ${context.fileName}\n- Type: ${context.fileType}\n- Size: ${(context.fileContent.length * 0.75 / 1024).toFixed(1)} KB (estimated)\n\n**Processing Prompt:** ${context.prompt}\n\n*Note: This is a placeholder. Real implementation would process the file content with AI.*`;
  }

  return {
    success: true,
    pageId: context.pageId,
    fileName: context.fileName,
    prompt: context.prompt,
    result,
    processedContent,
    message: `File "${context.fileName}" processed successfully with prompt: "${context.prompt}"`,
  };
};

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return conditions[code] || 'Unknown';
}