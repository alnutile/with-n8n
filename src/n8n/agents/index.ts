import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { weatherTool, fileUploadTool, createPageTool, processFileTool } from "../tools";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";
import { Memory } from "@mastra/memory";

export const AgentState = z.object({
  proverbs: z.array(z.string()).default([]),
});

export const weatherAgent = new Agent({
  name: "Weather Agent",
  tools: { weatherTool, fileUploadTool, createPageTool, processFileTool },
  model: openai("gpt-4o"),
  instructions: `You are a helpful assistant. You can help with weather information, file uploads, page creation, and file processing. 

IMPORTANT CAPABILITIES:
1. When a user says they want to upload a file, use the fileUploadTool to show the file upload interface.
2. When a user says they want to "make a page" or "create a page", use the createPageTool to create a new page for file processing.
3. When a user uploads a file and provides a processing prompt (like "make a TLDR" or "create charts"), use the processFileTool to process the file with AI.

PAGE CREATION: When users want to create a page, ask them what type of page they want and what they'd like to call it. Then use createPageTool.

FILE PROCESSING: When users upload files and want them processed, use processFileTool with their specific prompt.

NOTE: All tools now use n8n workflows for execution.`,
  memory: new Memory({
    storage: new LibSQLStore({ url: "file::memory:" }),
    options: {
      workingMemory: {
        enabled: true,
        schema: AgentState,
      },
    },
  }),
});
