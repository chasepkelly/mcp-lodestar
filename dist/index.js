#!/usr/bin/env node
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
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
export default function createServer({ config, }) {
    Logger.setLogLevel(LogLevel.INFO);
    Logger.info('Creating LodeStar MCP Server...');
    const server = new Server({
        name: 'LodeStar MCP Server',
        version: '2.0.0',
    }, {
        capabilities: {
            resources: {
                mimeTypes: ['text/markdown', 'application/json'],
            },
            tools: {},
            prompts: {},
        },
    });
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
        return toolHandlers.handleToolCall(request.params.name, request.params.arguments);
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
        // Create Streamable HTTP transport for proper MCP communication
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => `lodestar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        });
        // Connect the server to the transport
        await server.connect(transport);
        // Create HTTP server to handle requests
        const port = process.env.PORT || 3000;
        const http = await import('http');
        const httpServer = http.createServer(async (req, res) => {
            try {
                Logger.info(`Received request: ${req.method} ${req.url}`);
                // Handle health check
                if (req.url === '/health') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'ok',
                        service: 'LodeStar MCP Server',
                        version: '2.1.3'
                    }));
                    return;
                }
                // Handle MCP requests
                if (req.url === '/mcp' || req.url?.startsWith('/mcp/')) {
                    // Ensure proper Accept headers for N8N compatibility
                    const acceptHeader = req.headers.accept || '';
                    if (!acceptHeader.includes('application/json') && !acceptHeader.includes('text/event-stream')) {
                        // Add both content types if neither is present
                        req.headers.accept = 'application/json, text/event-stream';
                    }
                    else if (acceptHeader.includes('text/event-stream') && !acceptHeader.includes('application/json')) {
                        // Add application/json if only text/event-stream is present
                        req.headers.accept = 'application/json, text/event-stream';
                    }
                    // Let the StreamableHTTPServerTransport handle MCP requests
                    await transport.handleRequest(req, res);
                    return;
                }
                // Default response
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Not Found',
                    message: 'LodeStar MCP Server - use /mcp for MCP requests or /health for health check'
                }));
            }
            catch (error) {
                Logger.error('Error handling request:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        });
        httpServer.listen(port, () => {
            Logger.info(`HTTP server listening on port ${port}`);
            Logger.info('Streamable HTTP transport connected successfully');
            Logger.info('LodeStar MCP Server ready for Railway deployment with N8N compatibility');
        });
        // Handle shutdown
        process.on('SIGINT', async () => {
            Logger.info('Shutting down Streamable HTTP server...');
            httpServer.close();
            await server.close();
            process.exit(0);
        });
    }
    catch (error) {
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
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map