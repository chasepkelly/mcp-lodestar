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
import axios, { AxiosInstance } from 'axios';

import { CONSTANTS } from './constants.js';
import { Logger, LogLevel } from './logger.js';
import { ConfigManager } from './config.js';
import { SessionManager } from './session-manager.js';
import { ToolHandlers } from './tool-handlers.js';

class LodeStarMCPServer {
  private server: Server;
  private axiosInstance: AxiosInstance;
  private sessionManager: SessionManager;
  private toolHandlers: ToolHandlers;

  constructor() {
    Logger.setLogLevel(LogLevel.INFO);
    const configManager = ConfigManager.getInstance();

    this.server = new Server(
      { name: 'LodeStar MCP Server', version: '2.0.0' },
      { capabilities: { resources: {}, tools: {}, prompts: {} } }
    );

    this.axiosInstance = axios.create({
      baseURL: configManager.getApiBaseUrl(),
      timeout: CONSTANTS.REQUEST_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
    });

    this.sessionManager = SessionManager.getInstance(this.axiosInstance);
    this.toolHandlers = new ToolHandlers(
      this.axiosInstance,
      this.sessionManager
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () =>
      this.toolHandlers.getToolDefinitions()
    );
    this.server.setRequestHandler(CallToolRequestSchema, async (request) =>
      this.toolHandlers.handleToolCall(
        request.params.name,
        request.params.arguments
      )
    );
    this.server.setRequestHandler(ListResourcesRequestSchema, async () =>
      this.toolHandlers.getResources()
    );
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) =>
      this.toolHandlers.readResource(request.params.uri)
    );
    this.server.setRequestHandler(ListPromptsRequestSchema, async () =>
      this.toolHandlers.getPrompts()
    );
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) =>
      this.toolHandlers.getPrompt(request.params.name)
    );
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => Logger.error('MCP Error', error);
    process.on('SIGINT', async () => {
      Logger.info('Shutting down...');
      this.sessionManager.clearSession();
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    Logger.info('LodeStar MCP Server started');
  }
}

// ES Module compatible main execution check
if (import.meta.url === `file://${process.argv[1]}`) {
  new LodeStarMCPServer().run().catch((error) => {
    Logger.error('Fatal error', error);
    process.exit(1);
  });
}

export { LodeStarMCPServer };
