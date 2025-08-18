#!/usr/bin/env node
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { z } from 'zod';

import { CONSTANTS } from './constants.js';
import { Logger, LogLevel } from './logger.js';
import { SessionManager } from './session-manager.js';
import { ToolHandlers } from './tool-handlers.js';

// Define session configuration schema for Smithery
export const configSchema = z.object({
  apiKey: z.string().optional().describe("LodeStar API key (optional for demo mode)"),
  clientId: z.string().optional().describe("LodeStar client ID (optional for demo mode)"),
  clientSecret: z.string().optional().describe("LodeStar client secret (optional for demo mode)"),
  apiBaseUrl: z.string().optional().describe("LodeStar API base URL (optional, defaults to production)"),
});

export default function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  Logger.setLogLevel(LogLevel.INFO);
  
  const server = new Server(
    {
      name: 'LodeStar MCP Server',
      version: '2.0.0',
    },
    {
      capabilities: {
        resources: {
          mimeTypes: ['text/markdown', 'application/json'],
        },
        tools: {},
        prompts: {},
      },
    }
  );

  // Create axios instance with config
  const apiBaseUrl = config.apiBaseUrl || 'https://api.lodestar.com';
  const axiosInstance = axios.create({
    baseURL: apiBaseUrl,
    timeout: CONSTANTS.REQUEST_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
  });

  // Create session manager and tool handlers
  const sessionManager = SessionManager.getInstance(axiosInstance);
  const toolHandlers = new ToolHandlers(axiosInstance, sessionManager);

  // Set up request handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    Logger.info('Handling ListTools request');
    return toolHandlers.getToolDefinitions();
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    Logger.info(`Handling CallTool request: ${request.params.name}`);
    return toolHandlers.handleToolCall(
      request.params.name,
      request.params.arguments
    );
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    Logger.info('Handling ListResources request');
    return toolHandlers.getResources();
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    Logger.info(`Handling ReadResource request: ${request.params.uri}`);
    return toolHandlers.readResource(request.params.uri);
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    Logger.info('Handling ListPrompts request');
    return toolHandlers.getPrompts();
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    Logger.info(`Handling GetPrompt request: ${request.params.name}`);
    return toolHandlers.getPrompt(request.params.name);
  });

  // Set up error handling
  server.onerror = (error) => Logger.error('MCP Error', error);

  return server;
}

// STDIO compatibility for local development
async function main() {
  try {
    // Use environment variables for local development
    const config = {
      apiKey: process.env.LODESTAR_API_KEY,
      clientId: process.env.LODESTAR_CLIENT_ID,
      clientSecret: process.env.LODESTAR_CLIENT_SECRET,
      apiBaseUrl: process.env.LODESTAR_API_BASE_URL,
    };

    const server = createServer({ config });
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    Logger.info('LodeStar MCP Server started successfully in STDIO mode');
    Logger.info('Server is ready to handle MCP requests');
    
    // Handle shutdown
    process.on('SIGINT', async () => {
      Logger.info('Shutting down...');
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    Logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Only run main() if this file is executed directly
if (typeof import.meta !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    Logger.error('Fatal error', error);
    process.exit(1);
  });
}
