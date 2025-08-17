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
