#!/bin/bash

# LodeStar MCP Server Setup Script
# This script creates all necessary files for the mcp-lodestar project

echo "🚀 Setting up mcp-lodestar project..."

# Create directory structure
mkdir -p src
mkdir -p .github/workflows

# Create src/index.ts
cat > src/index.ts << 'EOF'
#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios, { AxiosInstance, AxiosError } from 'axios';

// Configuration interface
interface LodeStarConfig {
  clientName: string;
  username: string;
  password: string;
  baseUrl?: string;
}

// Session management
interface SessionData {
  sessionId: string;
  timestamp: number;
}

class LodeStarMCPServer {
  private server: McpServer;
  private transport: StdioServerTransport;
  private config: LodeStarConfig;
  private axiosInstance: AxiosInstance;
  private session: SessionData | null = null;
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Load configuration from environment variables
    this.config = {
      clientName: process.env.LODESTAR_CLIENT_NAME || 'LodeStar_Demo',
      username: process.env.LODESTAR_USERNAME || '',
      password: process.env.LODESTAR_PASSWORD || '',
      baseUrl: process.env.LODESTAR_BASE_URL || 'https://www.lodestarss.com'
    };

    // Validate required configuration
    if (!this.config.username || !this.config.password) {
      console.error('Error: LODESTAR_USERNAME and LODESTAR_PASSWORD environment variables are required');
      process.exit(1);
    }

    // Initialize MCP server
    this.server = new McpServer({
      name: 'LodeStar MCP Server',
      version: '1.0.0',
    });

    this.transport = new StdioServerTransport();

    // Initialize axios instance
    this.axiosInstance = axios.create({
      baseURL: `${this.config.baseUrl}/Live/${this.config.clientName}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Register all tools
    this.registerTools();
    
    // Register resources
    this.registerResources();
    
    // Register prompts
    this.registerPrompts();
  }

  private async ensureSession(): Promise<string> {
    // Check if session exists and is still valid
    if (this.session) {
      const now = Date.now();
      if (now - this.session.timestamp < this.sessionTimeout) {
        return this.session.sessionId;
      }
    }

    // Login to get new session
    try {
      const response = await this.axiosInstance.post('/Login/login.php', 
        new URLSearchParams({
          username: this.config.username,
          password: this.config.password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data.session_id) {
        this.session = {
          sessionId: response.data.session_id,
          timestamp: Date.now(),
        };
        return this.session.sessionId;
      } else {
        throw new Error('Failed to obtain session ID');
      }
    } catch (error: any) {
      throw new Error(`Login failed: ${error.response?.data?.error || error.message}`);
    }
  }

  private registerTools() {
    // Login tool
    this.server.tool(
      'login',
      'Log into LodeStar system',
      z.object({
        username: z.string().optional().describe('Username (email) - uses environment variable if not provided'),
        password: z.string().optional().describe('Password - uses environment variable if not provided'),
      }),
      async (args) => {
        const username = args.username || this.config.username;
        const password = args.password || this.config.password;
        
        try {
          const response = await this.axiosInstance.post('/Login/login.php',
            new URLSearchParams({ username, password }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          );
          
          if (response.data.session_id) {
            this.session = {
              sessionId: response.data.session_id,
              timestamp: Date.now(),
            };
            return {
              success: true,
              message: response.data.success,
              session_id: response.data.session_id,
            };
          }
          
          return {
            success: false,
            error: 'Failed to obtain session ID',
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.response?.data?.error || error.message,
          };
        }
      }
    );

    // Closing Cost Calculations tool
    this.server.tool(
      'closing_cost_calculations',
      'Calculate transfer tax, recording fees, title fees, and title premiums',
      z.object({
        state: z.string().length(2).describe('2 letter state abbreviation'),
        county: z.string().describe('County name'),
        township: z.string().describe('Township or city name'),
        search_type: z.enum(['CFPB', 'Title']).describe('CFPB returns all fees, Title returns only title fees'),
        purpose: z.enum(['00', '04', '11']).describe('00=Refinance, 04=Refinance(Reissue), 11=Purchase'),
        filename: z.string().optional().describe('Unique file/loan name for tracking'),
        loan_amount: z.number().optional().describe('Loan amount'),
        purchase_price: z.number().optional().describe('Purchase price'),
        prior_insurance: z.number().optional().describe('Prior insurance amount (refinance only)'),
        exdebt: z.number().optional().describe('Existing debt (refinance only)'),
        request_endos: z.array(z.string()).optional().describe('Array of endorsement IDs'),
        close_date: z.string().optional().describe('Closing date (YYYY-MM-DD)'),
        address: z.string().optional().describe('Property address'),
        include_pdf: z.number().optional().describe('1 to include PDF'),
        include_property_tax: z.number().optional().describe('1 to include property tax (additional charge)'),
        include_section: z.number().optional().describe('1 to include LE/CD section info'),
        include_payee_info: z.number().optional().describe('1 to include payee info'),
      }),
      async (args) => {
        try {
          const sessionId = await this.ensureSession();
          
          const requestBody = {
            session_id: sessionId,
            ...args,
          };
          
          const response = await this.axiosInstance.post('/closing_cost_calculations.php', requestBody);
          
          return response.data;
        } catch (error: any) {
          return {
            success: false,
            error: error.response?.data?.error || error.message,
          };
        }
      }
    );

    // Property Tax tool
    this.server.tool(
      'property_tax',
      'Get property tax information for a specific property',
      z.object({
        state: z.string().length(2).describe('2 letter state abbreviation'),
        county: z.string().describe('County name'),
        city: z.string().describe('City name'),
        address: z.string().describe('Property address'),
        close_date: z.string().describe('Closing date (YYYY-MM-DD)'),
        file_name: z.string().describe('File name for tracking'),
        purchase_price: z.number().describe('Purchase price or market value'),
      }),
      async (args) => {
        try {
          const sessionId = await this.ensureSession();
          
          const params = new URLSearchParams({
            session_id: sessionId,
            state: args.state,
            county: args.county,
            city: args.city,
            address: args.address,
            close_date: args.close_date,
            file_name: args.file_name,
            purchase_price: args.purchase_price.toString(),
          });
          
          const response = await this.axiosInstance.get(`/property_tax.php?${params}`);
          
          return response.data;
        } catch (error: any) {
          return {
            success: false,
            error: error.response?.data?.error || error.message,
          };
        }
      }
    );

    // Get Endorsements tool
    this.server.tool(
      'get_endorsements',
      'Get available endorsements for a location and transaction type',
      z.object({
        state: z.string().length(2).describe('2 letter state abbreviation'),
        county: z.string().describe('County name'),
        purpose: z.enum(['00', '04', '11']).describe('00=Refinance, 04=Refinance(Reissue), 11=Purchase'),
        sub_agent_id: z.number().optional().describe('Sub agent ID (lenders only)'),
        sub_agent_office_id: z.number().optional().describe('Sub agent office ID (defaults to 1)'),
      }),
      async (args) => {
        try {
          const sessionId = await this.ensureSession();
          
          const params = new URLSearchParams({
            session_id: sessionId,
            state: args.state,
            county: args.county,
            purpose: args.purpose,
          });
          
          if (args.sub_agent_id !== undefined) {
            params.append('sub_agent_id', args.sub_agent_id.toString());
          }
          if (args.sub_agent_office_id !== undefined) {
            params.append('sub_agent_office_id', args.sub_agent_office_id.toString());
          }
          
          const response = await this.axiosInstance.get(`/endorsements.php?${params}`);
          
          return response.data;
        } catch (error: any) {
          return {
            success: false,
            error: error.response?.data?.error || error.message,
          };
        }
      }
    );

    // Get Sub Agents tool
    this.server.tool(
      'get_sub_agents',
      'Get available sub agents for a specific transaction',
      z.object({
        state: z.string().length(2).describe('2 letter state abbreviation'),
        county: z.string().describe('County name'),
        township: z.string().optional().describe('Township name'),
        address: z.string().optional().describe('Property address'),
        purpose: z.enum(['00', '04', '11']).describe('00=Refinance, 04=Refinance(Reissue), 11=Purchase'),
        get_contact_info: z.number().optional().describe('1 to include contact info'),
      }),
      async (args) => {
        try {
          const sessionId = await this.ensureSession();
          
          const params = new URLSearchParams({
            session_id: sessionId,
            state: args.state,
            county: args.county,
            purpose: args.purpose,
          });
          
          if (args.township) params.append('township', args.township);
          if (args.address) params.append('address', args.address);
          if (args.get_contact_info !== undefined) {
            params.append('get_contact_info', args.get_contact_info.toString());
          }
          
          const response = await this.axiosInstance.get(`/sub_agents.php?${params}`);
          
          return response.data;
        } catch (error: any) {
          return {
            success: false,
            error: error.response?.data?.error || error.message,
          };
        }
      }
    );

    // Get Counties tool
    this.server.tool(
      'get_counties',
      'Get available counties for a state',
      z.object({
        state: z.string().length(2).describe('2 letter state abbreviation'),
      }),
      async (args) => {
        try {
          const sessionId = await this.ensureSession();
          
          const params = new URLSearchParams({
            session_id: sessionId,
            state: args.state,
          });
          
          const response = await this.axiosInstance.get(`/counties.php?${params}`);
          
          return response.data;
        } catch (error: any) {
          return {
            success: false,
            error: error.response?.data?.error || error.message,
          };
        }
      }
    );

    // Get Townships tool
    this.server.tool(
      'get_townships',
      'Get available townships in a county',
      z.object({
        state: z.string().length(2).describe('2 letter state abbreviation'),
        county: z.string().describe('County name'),
      }),
      async (args) => {
        try {
          const sessionId = await this.ensureSession();
          
          const params = new URLSearchParams({
            session_id: sessionId,
            state: args.state,
            county: args.county,
          });
          
          const response = await this.axiosInstance.get(`/townships.php?${params}`);
          
          return response.data;
        } catch (error: any) {
          return {
            success: false,
            error: error.response?.data?.error || error.message,
          };
        }
      }
    );

    // Get Questions tool
    this.server.tool(
      'get_questions',
      'Get questions for accurate calculation results',
      z.object({
        state: z.string().length(2).describe('2 letter state abbreviation'),
        purpose: z.enum(['00', '04', '11']).describe('00=Refinance, 04=Refinance(Reissue), 11=Purchase'),
      }),
      async (args) => {
        try {
          const sessionId = await this.ensureSession();
          
          const requestBody = {
            session_id: sessionId,
            state: args.state,
            purpose: args.purpose,
          };
          
          const response = await this.axiosInstance.post('/questions.php', requestBody);
          
          return response.data;
        } catch (error: any) {
          return {
            success: false,
            error: error.response?.data?.error || error.message,
          };
        }
      }
    );

    // Geocode Check tool
    this.server.tool(
      'geocode_check',
      'Check if an address is in a township with additional taxes/fees',
      z.object({
        state: z.string().length(2).describe('2 letter state abbreviation'),
        county: z.string().describe('County name'),
        township: z.string().describe('Township or city name'),
        address: z.string().describe('Property address'),
      }),
      async (args) => {
        try {
          const sessionId = await this.ensureSession();
          
          const params = new URLSearchParams({
            session_id: sessionId,
            state: args.state,
            county: args.county,
            township: args.township,
            address: args.address,
          });
          
          const response = await this.axiosInstance.get(`/geocode_check.php?${params}`);
          
          return response.data;
        } catch (error: any) {
          return {
            success: false,
            error: error.response?.data?.error || error.message,
          };
        }
      }
    );

    // Get Appraisal Modifiers tool
    this.server.tool(
      'get_appraisal_modifiers',
      'Get available appraisal modifiers',
      z.object({
        state: z.string().length(2).describe('2 letter state abbreviation'),
        county: z.string().describe('County name'),
        purpose: z.enum(['00', '04', '11']).describe('00=Refinance, 04=Refinance(Reissue), 11=Purchase'),
        prop_type: z.number().min(1).max(7).optional().describe('1=Single Family, 2=Multi Family, 3=Condo, 4=Coop, 5=PUD, 6=Manufactured, 7=Land'),
        amort_type: z.number().min(1).max(2).optional().describe('1=Fixed Rate, 2=Adjustable Rate'),
        loan_type: z.number().min(1).max(4).optional().describe('1=Conventional, 2=FHA, 3=VA, 4=USDA'),
      }),
      async (args) => {
        try {
          const sessionId = await this.ensureSession();
          
          const params = new URLSearchParams({
            session_id: sessionId,
            state: args.state,
            county: args.county,
            purpose: args.purpose,
          });
          
          if (args.prop_type !== undefined) {
            params.append('loan_info[prop_type]', args.prop_type.toString());
          }
          if (args.amort_type !== undefined) {
            params.append('loan_info[amort_type]', args.amort_type.toString());
          }
          if (args.loan_type !== undefined) {
            params.append('loan_info[loan_type]', args.loan_type.toString());
          }
          
          const response = await this.axiosInstance.get(`/appraisal_modifiers.php?${params}`);
          
          return response.data;
        } catch (error: any) {
          return {
            success: false,
            error: error.response?.data?.error || error.message,
          };
        }
      }
    );
  }

  private registerResources() {
    // API Info resource
    this.server.resource(
      'lodestar://api-info',
      'LodeStar API Information',
      async () => ({
        text: `# LodeStar API Information

## Current Configuration
- Client Name: ${this.config.clientName}
- Base URL: ${this.config.baseUrl}/Live/${this.config.clientName}
- Session Status: ${this.session ? 'Active' : 'Not logged in'}

## Available Workflows

### Mortgage Originator Simplified
1. login
2. closing_cost_calculations
3. property_tax (if required)

### Mortgage Originator Full
1. login
2. sub_agents
3. endorsements
4. questions
5. closing_cost_calculations
6. property_tax (if required)

### Title Agent Simplified
1. login
2. closing_cost_calculations
3. property_tax (if required)

### Title Agent Full
1. login
2. endorsements
3. questions
4. closing_cost_calculations
5. property_tax (if required)

## Purpose Types
- 00: Refinance
- 04: Refinance (Reissue)
- 11: Purchase

## Search Types
- CFPB: Returns tax, recording fees, title fees and title premiums
- Title: Title fees and title premiums only`,
        mimeType: 'text/markdown',
      })
    );

    // Fee Names resource
    this.server.resource(
      'lodestar://fee-names',
      'Standard Title Fee Names Reference',
      async () => ({
        text: `# Standard Title Fee Names

Common fee names used in LodeStar calculations:
- Settlement Fee
- Closing Fee
- Title Search
- Title Examination
- Title Insurance Binder
- Document Preparation
- Notary Fees
- Attorney Fees
- Title Insurance
- Lender's Title Policy
- Owner's Title Policy
- Recording Fees
- Transfer Taxes

For a complete list, visit: https://www.lodestarss.com/API/Standard_Title_FeeNames.csv`,
        mimeType: 'text/markdown',
      })
    );
  }

  private registerPrompts() {
    // Purchase calculation prompt
    this.server.prompt(
      'purchase_calculation',
      'Calculate closing costs for a home purchase',
      async (args: { state?: string; county?: string; township?: string; purchase_price?: number; loan_amount?: number }) => ({
        messages: [
          {
            role: 'user',
            content: `Calculate closing costs for a home purchase with these details:
State: ${args.state || '[Required]'}
County: ${args.county || '[Required]'}
Township: ${args.township || '[Required]'}
Purchase Price: ${args.purchase_price || '[Required]'}
Loan Amount: ${args.loan_amount || '[Required]'}

Please use the closing_cost_calculations tool with purpose '11' (Purchase) and search_type 'CFPB' to get complete fee breakdown.`
          }
        ]
      })
    );

    // Refinance calculation prompt
    this.server.prompt(
      'refinance_calculation',
      'Calculate closing costs for a refinance',
      async (args: { state?: string; county?: string; township?: string; loan_amount?: number; with_reissue?: boolean }) => ({
        messages: [
          {
            role: 'user',
            content: `Calculate closing costs for a refinance with these details:
State: ${args.state || '[Required]'}
County: ${args.county || '[Required]'}  
Township: ${args.township || '[Required]'}
Loan Amount: ${args.loan_amount || '[Required]'}
Reissue Credit: ${args.with_reissue ? 'Yes (use purpose 04)' : 'No (use purpose 00)'}

Please use the closing_cost_calculations tool with the appropriate refinance purpose and search_type 'CFPB'.`
          }
        ]
      })
    );

    // Full workflow prompt
    this.server.prompt(
      'full_workflow',
      'Complete workflow for getting a quote',
      async (args: { workflow_type?: string }) => ({
        messages: [
          {
            role: 'user',
            content: `Guide me through the ${args.workflow_type || 'Mortgage Originator Simplified'} workflow:

Available workflows:
1. Mortgage Originator Simplified: login → closing_cost_calculations → property_tax
2. Mortgage Originator Full: login → sub_agents → endorsements → questions → closing_cost_calculations → property_tax
3. Title Agent Simplified: login → closing_cost_calculations → property_tax
4. Title Agent Full: login → endorsements → questions → closing_cost_calculations → property_tax

Please help me gather the required information and execute each step.`
          }
        ]
      })
    );
  }

  async start() {
    await this.server.connect(this.transport);
    console.error('LodeStar MCP Server started successfully');
    console.error(`Client: ${this.config.clientName}`);
    console.error(`Base URL: ${this.config.baseUrl}`);
  }
}

// Main execution
async function main() {
  const server = new LodeStarMCPServer();
  await server.start();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Shutting down LodeStar MCP server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Shutting down LodeStar MCP server...');
  process.exit(0);
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the server
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "@chasepkelly/mcp-lodestar",
  "version": "1.0.0",
  "description": "MCP Server for LodeStar API - Calculate closing costs, title fees, and property taxes",
  "main": "build/index.js",
  "type": "module",
  "bin": {
    "mcp-lodestar": "./build/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node build/index.js",
    "test": "tsx src/test.ts",
    "prepare": "npm run build"
  },
  "keywords": [
    "mcp",
    "mcp-server",
    "lodestar",
    "closing-costs",
    "title-insurance",
    "property-tax",
    "real-estate",
    "mortgage"
  ],
  "author": "LodeStar Software Solutions",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/chasepkelly/mcp-lodestar.git"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "axios": "^1.7.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  },
  "files": [
    "build",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "build",
    "dist"
  ]
}
EOF

# Create Dockerfile
cat > Dockerfile << 'EOF'
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript files and configuration
COPY tsconfig.json ./
COPY src ./src

# Install dev dependencies for building
RUN npm install --save-dev typescript @types/node

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S mcp && \
    adduser -S mcp -u 1001 -G mcp

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# Copy any additional files needed at runtime
COPY LICENSE ./
COPY README.md ./

# Change ownership to non-root user
RUN chown -R mcp:mcp /app

# Switch to non-root user
USER mcp

# The actual command will be provided by smithery.yaml
CMD ["node", "build/index.js"]
EOF

# Create smithery.yaml
cat > smithery.yaml << 'EOF'
name: mcp-lodestar
description: Calculate closing costs, title fees, recording fees, transfer taxes, and property taxes for real estate transactions using the LodeStar API
author: Chase P Kelly
homepage: https://github.com/chasepkelly/mcp-lodestar
repository: https://github.com/chasepkelly/mcp-lodestar
license: MIT

startCommand:
  type: stdio
  configSchema:
    type: object
    required:
      - LODESTAR_USERNAME
      - LODESTAR_PASSWORD
    properties:
      LODESTAR_USERNAME:
        type: string
        description: "Your LodeStar account email address"
        format: email
      LODESTAR_PASSWORD:
        type: string
        description: "Your LodeStar account password"
        format: password
      LODESTAR_CLIENT_NAME:
        type: string
        description: "Your LodeStar client name (defaults to LodeStar_Demo)"
        default: "LodeStar_Demo"
      LODESTAR_BASE_URL:
        type: string
        description: "LodeStar API base URL (defaults to production URL)"
        default: "https://www.lodestarss.com"
        format: uri
  commandFunction: |
    (config) => ({
      command: 'node',
      args: ['build/index.js'],
      env: {
        LODESTAR_USERNAME: config.LODESTAR_USERNAME,
        LODESTAR_PASSWORD: config.LODESTAR_PASSWORD,
        LODESTAR_CLIENT_NAME: config.LODESTAR_CLIENT_NAME || 'LodeStar_Demo',
        LODESTAR_BASE_URL: config.LODESTAR_BASE_URL || 'https://www.lodestarss.com'
      }
    })

tags:
  - lodestar
  - closing-costs
  - title-insurance
  - property-tax
  - real-estate
  - mortgage
  - refinance
  - escrow
  - recording-fees
  - transfer-taxes

categories:
  - Real Estate
  - Finance
  - Legal

deployment:
  localOnly: false
  dockerSupported: true
  nodeVersion: "20"
  
metadata:
  icon: "🏠"
  version: "1.0.0"
  minNodeVersion: "18.0.0"
  maxNodeVersion: "22.0.0"
EOF

# Create .env.example
cat > .env.example << 'EOF'
# LodeStar MCP Server Configuration
# Copy this file to .env and fill in your credentials

# Required: Your LodeStar login credentials
LODESTAR_USERNAME=your-email@example.com
LODESTAR_PASSWORD=your-password

# Optional: Your LodeStar client name (defaults to LodeStar_Demo)
# This should be the client name provided by LodeStar
LODESTAR_CLIENT_NAME=Your_Client_Name

# Optional: Base URL for LodeStar API (defaults to production URL)
# Only change this if you have a custom LodeStar instance
LODESTAR_BASE_URL=https://www.lodestarss.com
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build output
build/
dist/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
logs/
*.log

# Testing
coverage/
.nyc_output/

# Temporary files
tmp/
temp/
*.tmp

# Package manager
package-lock.json
yarn.lock
pnpm-lock.yaml
EOF

# Create .dockerignore
cat > .dockerignore << 'EOF'
# Git
.git
.gitignore
.github

# Node modules (will be installed fresh in container)
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment files (sensitive data)
.env
.env.local
.env.*.local

# IDE
.vscode
.idea
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Documentation (not needed in runtime)
*.md
!README.md
docs/

# Testing
coverage/
.nyc_output/
*.test.ts
*.spec.ts

# Build artifacts (will be built in container)
build/
dist/
*.tsbuildinfo

# Development files
.eslintrc*
.prettierrc*
.editorconfig

# Temporary files
tmp/
temp/
*.tmp
*.log

# Package manager files (will be generated in container)
package-lock.json
yarn.lock
pnpm-lock.yaml
EOF

# Create LICENSE
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 LodeStar MCP Server Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# Create .github/workflows/publish.yml
cat > .github/workflows/publish.yml << 'EOF'
name: Publish to npm and Smithery

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Run tests
        run: npm test
        env:
          LODESTAR_USERNAME: ${{ secrets.LODESTAR_TEST_USERNAME }}
          LODESTAR_PASSWORD: ${{ secrets.LODESTAR_TEST_PASSWORD }}
        continue-on-error: true

  publish-npm:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  create-release:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: |
            ## Changes
            - See commit history for changes
            
            ## Installation
            ```bash
            npm install -g @chasepkelly/mcp-lodestar
            ```
            
            ## Configuration
            See README for configuration instructions.
          draft: false
          prerelease: false
EOF

echo "✅ All files created successfully!"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: npm run build"
echo "3. Initialize git: git init"
echo "4. Add files: git add ."
echo "5. Commit: git commit -m 'Initial commit'"
echo "6. Add remote: git remote add origin https://github.com/chasepkelly/mcp-lodestar.git"
echo "7. Push: git push -u origin main"
echo ""
echo "📝 Remember to:"
echo "- Create README.md and other documentation files"
echo "- Update credentials in .env file"
echo "- Test locally before deploying"
EOF

chmod +x setup.sh

echo "✅ Setup script created as 'setup.sh'"
echo ""
echo "To use this script:"
echo "1. Save this file as 'setup.sh'"
echo "2. Make it executable: chmod +x setup.sh"
echo "3. Run it: ./setup.sh"
echo ""
echo "The script will create all necessary files in the current directory."