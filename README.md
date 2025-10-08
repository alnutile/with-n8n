# CopilotKit with n8n Integration

This is a starter template for building AI agents using CopilotKit with n8n as the backend. It provides a modern Next.js application with integrated AI capabilities and a beautiful UI.

## Features

- **CopilotKit Integration**: Full CopilotKit frontend with chat interface
- **n8n Backend**: Uses n8n workflows for AI agent tools
- **Dynamic Page Creation**: Create pages on the fly with AI
- **File Processing**: Upload and process files with AI
- **Weather Tool**: Example n8n-powered weather tool
- **Flexible Response Format**: Handles any n8n response format

## Prerequisites

- Node.js 18+
- n8n instance with webhook endpoints
- OpenAI API key
- CopilotKit public key

## Getting Started

1. **Add your API keys**

```bash
# Add your OpenAI API key
echo "OPENAI_API_KEY=your-key-here" >> .env

# Add your CopilotKit public key
echo "COPILOTKIT_PUBLIC_KEY=your-copilotkit-key" >> .env

# Configure n8n
echo "N8N_API_URL=https://your-n8n-instance.com/webhook/copilotkit" >> .env
echo "N8N_API_KEY=your-n8n-api-key" >> .env
echo "BACKEND_TYPE=mastra" >> .env
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Start the development server**

```bash
pnpm dev
```

## n8n Integration

### How it works

The system uses n8n webhooks to execute AI agent tools. Each tool calls your n8n webhook with:

```json
{
  "tool": "weather",
  "location": "San Francisco",
  "timestamp": "2025-01-03T..."
}
```

### Expected n8n Response Format

Your n8n workflow should return data in an `"output"` field as a JSON string:

```json
{
  "output": "{\"temperature\": 22, \"feelsLike\": 24, \"humidity\": 65, \"windSpeed\": 10, \"windGust\": 15, \"conditions\": \"Partly cloudy\", \"location\": \"San Francisco\"}"
}
```

### Available Tools

- **weatherTool**: Get weather information for any location
- **fileUploadTool**: Upload files for processing
- **createPageTool**: Create dynamic pages
- **processFileTool**: Process uploaded files with AI

### Adding New Tools

1. Create the tool in `src/mastra/tools/index.ts`
2. Add it to the agent in `src/mastra/agents/index.ts`
3. Create the corresponding n8n workflow
4. Update the frontend actions in `src/app/page.tsx`

## Architecture

```
User Input → CopilotKit → Mastra Agent → n8n Webhook → n8n Workflow → Response
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `COPILOTKIT_PUBLIC_KEY`: Your CopilotKit public key
- `N8N_API_URL`: Your n8n webhook URL
- `N8N_API_KEY`: Your n8n API key
- `BACKEND_TYPE`: Set to "mastra" (uses Mastra with n8n tools)

## Testing

1. Open http://localhost:3000
2. Click the chat button
3. Try: "Get the weather in San Francisco"
4. Watch the server logs for n8n API calls

## Customization

- **Tools**: Modify `src/mastra/tools/index.ts`
- **Agents**: Update `src/mastra/agents/index.ts`
- **Frontend**: Customize `src/app/page.tsx`
- **n8n Workflows**: Create workflows that match tool interfaces

## License

MIT License

...,