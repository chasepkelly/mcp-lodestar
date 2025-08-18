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
  Logger.info('Creating LodeStar MCP Server...');
  
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

  Logger.info('Server instance created successfully');

  // Create axios instance with config
  const apiBaseUrl = config.apiBaseUrl || 'https://api.lodestar.com';
  Logger.info(`Configuring axios with base URL: ${apiBaseUrl}`);
  
  const axiosInstance = axios.create({
    baseURL: apiBaseUrl,
    timeout: CONSTANTS.REQUEST_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
  });

  // Create session manager and tool handlers
  Logger.info('Creating session manager and tool handlers...');
  const sessionManager = SessionManager.getInstance(axiosInstance);
  const toolHandlers = new ToolHandlers(axiosInstance, sessionManager);
  Logger.info('Session manager and tool handlers created successfully');

  // Set up request handlers
  Logger.info('Setting up MCP request handlers...');
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

  Logger.info('LodeStar MCP Server setup completed successfully');
  return server;
}

// Railway/HTTP transport support with proper MCP Streamable HTTP
async function startHttpServer() {
  try {
    Logger.info('Starting Streamable HTTP server for Railway deployment...');
    
    // Use environment variables for configuration
    const config = {
      apiKey: process.env.LODESTAR_API_KEY,
      clientId: process.env.LODESTAR_CLIENT_ID,
      clientSecret: process.env.LODESTAR_CLIENT_SECRET,
      apiBaseUrl: process.env.LODESTAR_API_BASE_URL,
    };

    const server = createServer({ config });
    
    // Create axios instance and tool handlers for HTTP server
    const apiBaseUrl = config.apiBaseUrl || 'https://api.lodestar.com';
    const axiosInstance = axios.create({
      baseURL: apiBaseUrl,
      timeout: CONSTANTS.REQUEST_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
    });
    const sessionManager = SessionManager.getInstance(axiosInstance);
    const toolHandlers = new ToolHandlers(axiosInstance, sessionManager);
    
    // Create HTTP server to handle requests
    const port = process.env.PORT || 3000;
    const http = await import('http');
    
    // Store active sessions
    const activeSessions = new Map();
    
    const httpServer = http.createServer(async (req, res) => {
      try {
        Logger.info(`Received request: ${req.method} ${req.url}`);
        
        // Handle health check
        if (req.url === '/health') {
          res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          });
          res.end(JSON.stringify({
            status: 'ok',
            service: 'LodeStar MCP Server',
            version: '2.1.7'
          }));
          return;
        }
        
        // Handle CORS preflight requests
        if (req.method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id',
            'Access-Control-Max-Age': '86400'
          });
          res.end();
          return;
        }

        // Handle MCP requests
        if (req.url === '/mcp' || req.url?.startsWith('/mcp/')) {
          // Add CORS headers for MCP requests
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id');
          
          // Parse request body
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const request = JSON.parse(body);
              const sessionId = req.headers['mcp-session-id'] as string;
              
              Logger.info(`Processing MCP request: ${request.method} for session: ${sessionId}`);
              
              // Handle initialize request
              if (request.method === 'initialize') {
                activeSessions.set(sessionId, { initialized: true, timestamp: Date.now() });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                      tools: {},
                      resources: {},
                      prompts: {}
                    },
                    serverInfo: {
                      name: 'LodeStar MCP Server',
                      version: '2.1.7'
                    }
                  }
                }));
                return;
              }
              
              // Check if session is initialized
              if (!activeSessions.has(sessionId)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  jsonrpc: '2.0',
                  error: {
                    code: -32001,
                    message: 'Session not found'
                  },
                  id: request.id
                }));
                return;
              }
              
              // Handle tools/call request
              if (request.method === 'tools/call') {
                const toolName = request.params.name;
                const arguments_ = request.params.arguments;
                
                Logger.info(`Calling tool: ${toolName}`);
                
                try {
                  const result = await toolHandlers.handleToolCall(toolName, arguments_);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    jsonrpc: '2.0',
                    id: request.id,
                    result: result
                  }));
                } catch (error) {
                  Logger.error(`Tool call error: ${error}`);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    jsonrpc: '2.0',
                    id: request.id,
                    error: {
                      code: -32603,
                      message: error instanceof Error ? error.message : 'Internal error'
                    }
                  }));
                }
                return;
              }
              
              // Handle tools/list request
              if (request.method === 'tools/list') {
                const tools = toolHandlers.getToolDefinitions();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  jsonrpc: '2.0',
                  id: request.id,
                  result: tools
                }));
                return;
              }
              
              // Unknown method
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                jsonrpc: '2.0',
                id: request.id,
                error: {
                  code: -32601,
                  message: 'Method not found'
                }
              }));
              
            } catch (error) {
              Logger.error('Error processing MCP request:', error);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                jsonrpc: '2.0',
                error: {
                  code: -32700,
                  message: 'Parse error'
                },
                id: null
              }));
            }
          });
          return;
        }
        
        // Default response
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Not Found',
          message: 'LodeStar MCP Server - use /mcp for MCP requests or /health for health check'
        }));
        
      } catch (error) {
        Logger.error('Error handling request:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
    
        httpServer.listen(port, () => {
      Logger.info(`HTTP server listening on port ${port}`);
      Logger.info('Custom HTTP MCP server ready for Railway deployment');
      Logger.info('LodeStar MCP Server ready for chat app compatibility');
    });

    // Handle shutdown
    process.on('SIGINT', async () => {
      Logger.info('Shutting down HTTP server...');
      httpServer.close();
      await server.close();
      process.exit(0);
    });

  } catch (error) {
    Logger.error('Failed to start Streamable HTTP server', error);
    process.exit(1);
  }
}

// STDIO compatibility for local development
async function main() {
  try {
    // Check if we're in Railway/HTTP mode
    if (process.env.RAILWAY_ENVIRONMENT || process.env.PORT) {
      await startHttpServer();
      return;
    }

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
