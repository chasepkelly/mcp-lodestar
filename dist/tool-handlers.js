// src/tool-handlers.ts
// Complete implementation with all 10 tools
import { AxiosError } from 'axios';
import { Logger } from './logger.js';
import { DemoMode } from './demo-mode.js';
import { ConfigManager } from './config.js';
export class ToolHandlers {
    constructor(axiosInstance, sessionManager) {
        this.axiosInstance = axiosInstance;
        this.sessionManager = sessionManager;
    }
    // ============================================================================
    // Tool Definitions - All 10 Tools
    // ============================================================================
    async getToolDefinitions() {
        return {
            tools: [
                {
                    name: 'login',
                    description: 'Authenticate with LodeStar system',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            username: { type: 'string', description: 'Username (email)' },
                            password: { type: 'string', description: 'Password' },
                        },
                    },
                },
                {
                    name: 'closing_cost_calculations',
                    description: 'Calculate all closing costs, fees, and taxes',
                    inputSchema: {
                        type: 'object',
                        required: ['state', 'county', 'township', 'search_type', 'purpose'],
                        properties: {
                            state: {
                                type: 'string',
                                minLength: 2,
                                maxLength: 2,
                                description: '2 letter state abbreviation',
                            },
                            county: { type: 'string', description: 'County name' },
                            township: {
                                type: 'string',
                                description: 'Township or city name',
                            },
                            search_type: {
                                type: 'string',
                                enum: ['CFPB', 'Title'],
                                description: 'CFPB for all fees, Title for title only',
                            },
                            purpose: {
                                type: 'string',
                                enum: ['00', '04', '11'],
                                description: '00=Refinance, 04=Refi w/Reissue, 11=Purchase',
                            },
                            filename: {
                                type: 'string',
                                description: 'Unique file/loan name',
                            },
                            loan_amount: { type: 'number', description: 'Loan amount' },
                            purchase_price: { type: 'number', description: 'Purchase price' },
                            prior_insurance: {
                                type: 'number',
                                description: 'Prior insurance (refinance)',
                            },
                            exdebt: {
                                type: 'number',
                                description: 'Existing debt (refinance)',
                            },
                            request_endos: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Endorsement IDs',
                            },
                            close_date: {
                                type: 'string',
                                description: 'Closing date (YYYY-MM-DD)',
                            },
                            address: { type: 'string', description: 'Property address' },
                            include_pdf: { type: 'number', description: '1 to include PDF' },
                            include_property_tax: {
                                type: 'number',
                                description: '1 to include property tax',
                            },
                            include_section: {
                                type: 'number',
                                description: '1 to include LE/CD section',
                            },
                            include_payee_info: {
                                type: 'number',
                                description: '1 to include payee info',
                            },
                        },
                    },
                },
                {
                    name: 'property_tax',
                    description: 'Get property tax information',
                    inputSchema: {
                        type: 'object',
                        required: [
                            'state',
                            'county',
                            'city',
                            'address',
                            'close_date',
                            'file_name',
                            'purchase_price',
                        ],
                        properties: {
                            state: {
                                type: 'string',
                                minLength: 2,
                                maxLength: 2,
                                description: '2 letter state abbreviation',
                            },
                            county: { type: 'string', description: 'County name' },
                            city: { type: 'string', description: 'City name' },
                            address: { type: 'string', description: 'Property address' },
                            close_date: {
                                type: 'string',
                                description: 'Closing date (YYYY-MM-DD)',
                            },
                            file_name: {
                                type: 'string',
                                description: 'File name for tracking',
                            },
                            purchase_price: {
                                type: 'number',
                                description: 'Purchase price or market value',
                            },
                        },
                    },
                },
                {
                    name: 'get_endorsements',
                    description: 'Get available title insurance endorsements',
                    inputSchema: {
                        type: 'object',
                        required: ['state', 'county', 'purpose'],
                        properties: {
                            state: {
                                type: 'string',
                                minLength: 2,
                                maxLength: 2,
                                description: '2 letter state abbreviation',
                            },
                            county: { type: 'string', description: 'County name' },
                            purpose: {
                                type: 'string',
                                enum: ['00', '04', '11'],
                                description: 'Transaction purpose',
                            },
                            sub_agent_id: { type: 'number', description: 'Sub agent ID' },
                            sub_agent_office_id: {
                                type: 'number',
                                description: 'Sub agent office ID',
                            },
                        },
                    },
                },
                {
                    name: 'get_sub_agents',
                    description: 'Find available title agents/companies',
                    inputSchema: {
                        type: 'object',
                        required: ['state', 'county', 'purpose'],
                        properties: {
                            state: {
                                type: 'string',
                                minLength: 2,
                                maxLength: 2,
                                description: '2 letter state abbreviation',
                            },
                            county: { type: 'string', description: 'County name' },
                            purpose: {
                                type: 'string',
                                enum: ['00', '04', '11'],
                                description: 'Transaction purpose',
                            },
                            township: { type: 'string', description: 'Township name' },
                            address: { type: 'string', description: 'Property address' },
                            get_contact_info: {
                                type: 'number',
                                description: '1 to include contact info',
                            },
                        },
                    },
                },
                {
                    name: 'get_counties',
                    description: 'List all counties in a state',
                    inputSchema: {
                        type: 'object',
                        required: ['state'],
                        properties: {
                            state: {
                                type: 'string',
                                minLength: 2,
                                maxLength: 2,
                                description: '2 letter state abbreviation',
                            },
                        },
                    },
                },
                {
                    name: 'get_townships',
                    description: 'List all townships/cities in a county',
                    inputSchema: {
                        type: 'object',
                        required: ['state', 'county'],
                        properties: {
                            state: {
                                type: 'string',
                                minLength: 2,
                                maxLength: 2,
                                description: '2 letter state abbreviation',
                            },
                            county: { type: 'string', description: 'County name' },
                        },
                    },
                },
                {
                    name: 'get_questions',
                    description: 'Get state-specific questions for accurate calculations',
                    inputSchema: {
                        type: 'object',
                        required: ['state', 'purpose'],
                        properties: {
                            state: {
                                type: 'string',
                                minLength: 2,
                                maxLength: 2,
                                description: '2 letter state abbreviation',
                            },
                            purpose: {
                                type: 'string',
                                enum: ['00', '04', '11'],
                                description: 'Transaction purpose',
                            },
                        },
                    },
                },
                {
                    name: 'geocode_check',
                    description: 'Verify if address is in township with additional taxes',
                    inputSchema: {
                        type: 'object',
                        required: ['state', 'county', 'township', 'address'],
                        properties: {
                            state: {
                                type: 'string',
                                minLength: 2,
                                maxLength: 2,
                                description: '2 letter state abbreviation',
                            },
                            county: { type: 'string', description: 'County name' },
                            township: {
                                type: 'string',
                                description: 'Township or city name',
                            },
                            address: { type: 'string', description: 'Property address' },
                        },
                    },
                },
                {
                    name: 'get_appraisal_modifiers',
                    description: 'Get appraisal fee modifiers based on property and loan type',
                    inputSchema: {
                        type: 'object',
                        required: ['state', 'county', 'purpose'],
                        properties: {
                            state: {
                                type: 'string',
                                minLength: 2,
                                maxLength: 2,
                                description: '2 letter state abbreviation',
                            },
                            county: { type: 'string', description: 'County name' },
                            purpose: {
                                type: 'string',
                                enum: ['00', '04', '11'],
                                description: 'Transaction purpose',
                            },
                            prop_type: {
                                type: 'number',
                                minimum: 1,
                                maximum: 7,
                                description: '1=Single Family, 2=Multi, 3=Condo, 4=Coop, 5=PUD, 6=Manufactured, 7=Land',
                            },
                            amort_type: {
                                type: 'number',
                                minimum: 1,
                                maximum: 2,
                                description: '1=Fixed Rate, 2=Adjustable',
                            },
                            loan_type: {
                                type: 'number',
                                minimum: 1,
                                maximum: 4,
                                description: '1=Conventional, 2=FHA, 3=VA, 4=USDA',
                            },
                        },
                    },
                },
            ],
        };
    }
    // ============================================================================
    // Main Tool Call Handler
    // ============================================================================
    async handleToolCall(name, args) {
        Logger.debug(`Handling tool: ${name}`, args);
        try {
            switch (name) {
                case 'login':
                    return await this.handleLogin(args);
                case 'closing_cost_calculations':
                    return await this.handleClosingCostCalculations(args);
                case 'property_tax':
                    return await this.handlePropertyTax(args);
                case 'get_endorsements':
                    return await this.handleGetEndorsements(args);
                case 'get_sub_agents':
                    return await this.handleGetSubAgents(args);
                case 'get_counties':
                    return await this.handleGetCounties(args);
                case 'get_townships':
                    return await this.handleGetTownships(args);
                case 'get_questions':
                    return await this.handleGetQuestions(args);
                case 'geocode_check':
                    return await this.handleGeocodeCheck(args);
                case 'get_appraisal_modifiers':
                    return await this.handleGetAppraisalModifiers(args);
                default:
                    return this.createErrorResponse(new Error(`Unknown tool: ${name}`));
            }
        }
        catch (error) {
            return this.createErrorResponse(error);
        }
    }
    // ============================================================================
    // Individual Tool Handlers - All 10 Implemented
    // ============================================================================
    async handleLogin(args) {
        if (DemoMode.isEnabled()) {
            return this.createSuccessResponse({
                success: true,
                message: 'Login successful (DEMO MODE)',
                session_id: 'demo-session-' + Date.now(),
                demo_mode: true,
            });
        }
        const config = ConfigManager.getInstance().getConfig();
        const username = args.username || config.username;
        const password = args.password || config.password;
        if (!username || !password) {
            throw new Error('Username and password are required');
        }
        await this.sessionManager.ensureSession();
        return this.createSuccessResponse({
            success: true,
            message: 'Login successful',
            session_id: await this.sessionManager.ensureSession(),
        });
    }
    async handleClosingCostCalculations(args) {
        if (DemoMode.isEnabled()) {
            const loanAmount = args.loan_amount || 300000;
            const purchasePrice = args.purchase_price || 400000;
            const isPurchase = args.purpose === '11';
            return this.createSuccessResponse({
                success: true,
                demo_mode: true,
                transaction_type: isPurchase ? 'Purchase' : 'Refinance',
                location: {
                    state: args.state,
                    county: args.county,
                    township: args.township,
                },
                title_fees: {
                    'Settlement Fee': 995,
                    'Title Search': 450,
                    'Title Examination': 225,
                    'Document Preparation': 150,
                    'Notary Fees': 50,
                },
                title_insurance: {
                    'Lenders Policy': Math.round(loanAmount * 0.0035),
                    'Owners Policy': isPurchase ? Math.round(purchasePrice * 0.004) : 0,
                },
                recording_fees: {
                    'Deed Recording': isPurchase ? 125 : 0,
                    'Mortgage Recording': 175,
                    'Transfer Tax': isPurchase ? Math.round(purchasePrice * 0.01) : 0,
                },
                total_closing_costs: Math.round(1870 +
                    loanAmount * 0.0035 +
                    (isPurchase ? purchasePrice * 0.014 + 125 : 0)),
                disclaimer: 'DEMO MODE - Sample calculations',
            });
        }
        const sessionId = await this.sessionManager.ensureSession();
        const response = await this.axiosInstance.post('/closing_cost_calculations.php', {
            session_id: sessionId,
            ...args,
        });
        return this.createSuccessResponse(response.data);
    }
    async handlePropertyTax(args) {
        if (DemoMode.isEnabled()) {
            const annualTax = args.purchase_price * 0.012;
            return this.createSuccessResponse({
                success: true,
                demo_mode: true,
                property_address: args.address,
                annual_taxes: {
                    county_tax: annualTax * 0.6,
                    city_tax: annualTax * 0.25,
                    school_tax: annualTax * 0.15,
                    total_annual: annualTax,
                },
                monthly_escrow: annualTax / 12,
                proration_amount: (annualTax / 365) * 180,
                disclaimer: 'DEMO MODE - Sample property tax',
            });
        }
        const sessionId = await this.sessionManager.ensureSession();
        const params = new URLSearchParams({
            session_id: sessionId,
            ...args,
            purchase_price: args.purchase_price.toString(),
        });
        const response = await this.axiosInstance.get(`/property_tax.php?${params}`);
        return this.createSuccessResponse(response.data);
    }
    async handleGetEndorsements(args) {
        if (DemoMode.isEnabled()) {
            return this.createSuccessResponse({
                success: true,
                demo_mode: true,
                available_endorsements: [
                    { id: 'ALTA-4', name: 'Condominium', premium: 50 },
                    { id: 'ALTA-5', name: 'Planned Unit Development', premium: 50 },
                    { id: 'ALTA-8.1', name: 'Environmental Protection', premium: 100 },
                    { id: 'ALTA-9', name: 'Restrictions, Encroachments', premium: 150 },
                ],
                total_if_all_selected: 350,
            });
        }
        const sessionId = await this.sessionManager.ensureSession();
        const params = new URLSearchParams({
            session_id: sessionId,
            state: args.state,
            county: args.county,
            purpose: args.purpose,
            ...(args.sub_agent_id && { sub_agent_id: args.sub_agent_id.toString() }),
            ...(args.sub_agent_office_id && {
                sub_agent_office_id: args.sub_agent_office_id.toString(),
            }),
        });
        const response = await this.axiosInstance.get(`/endorsements.php?${params}`);
        return this.createSuccessResponse(response.data);
    }
    async handleGetSubAgents(args) {
        if (DemoMode.isEnabled()) {
            return this.createSuccessResponse({
                success: true,
                demo_mode: true,
                sub_agents: [
                    {
                        id: 1,
                        name: 'Demo Title Company',
                        address: '123 Demo St, ' + args.state,
                        phone: '555-0100',
                        email: 'demo@titleco.com',
                    },
                    {
                        id: 2,
                        name: 'Sample Title Services',
                        address: '456 Sample Ave, ' + args.state,
                        phone: '555-0200',
                        email: 'info@sampletitle.com',
                    },
                ],
                total_agents: 2,
            });
        }
        const sessionId = await this.sessionManager.ensureSession();
        const params = new URLSearchParams({
            session_id: sessionId,
            state: args.state,
            county: args.county,
            purpose: args.purpose,
            ...(args.township && { township: args.township }),
            ...(args.address && { address: args.address }),
            ...(args.get_contact_info && {
                get_contact_info: args.get_contact_info.toString(),
            }),
        });
        const response = await this.axiosInstance.get(`/sub_agents.php?${params}`);
        return this.createSuccessResponse(response.data);
    }
    async handleGetCounties(args) {
        if (DemoMode.isEnabled()) {
            const counties = {
                CA: ['Los Angeles', 'San Francisco', 'San Diego', 'Orange'],
                TX: ['Harris', 'Dallas', 'Travis', 'Bexar'],
                FL: ['Miami-Dade', 'Broward', 'Palm Beach', 'Orange'],
                NY: ['New York', 'Kings', 'Queens', 'Bronx'],
            };
            return this.createSuccessResponse({
                success: true,
                demo_mode: true,
                state: args.state,
                counties: counties[args.state] || [
                    'Demo County',
                    'Sample County',
                ],
                total_counties: 4,
            });
        }
        const sessionId = await this.sessionManager.ensureSession();
        const params = new URLSearchParams({
            session_id: sessionId,
            state: args.state,
        });
        const response = await this.axiosInstance.get(`/counties.php?${params}`);
        return this.createSuccessResponse(response.data);
    }
    async handleGetTownships(args) {
        if (DemoMode.isEnabled()) {
            return this.createSuccessResponse({
                success: true,
                demo_mode: true,
                townships: [
                    'Downtown',
                    'Northside',
                    'Southside',
                    'Westside',
                    'Midtown',
                ].map((name) => ({
                    name: name + ' ' + args.county,
                    code: name.toUpperCase(),
                })),
                total_townships: 5,
            });
        }
        const sessionId = await this.sessionManager.ensureSession();
        const params = new URLSearchParams({
            session_id: sessionId,
            ...args,
        });
        const response = await this.axiosInstance.get(`/townships.php?${params}`);
        return this.createSuccessResponse(response.data);
    }
    async handleGetQuestions(args) {
        if (DemoMode.isEnabled()) {
            return this.createSuccessResponse({
                success: true,
                demo_mode: true,
                questions: [
                    {
                        id: 'q1',
                        question: 'Is this a first-time home buyer?',
                        type: 'boolean',
                        required: true,
                    },
                    {
                        id: 'q2',
                        question: 'Will this be your primary residence?',
                        type: 'boolean',
                        required: true,
                    },
                    {
                        id: 'q3',
                        question: 'Property type',
                        type: 'select',
                        options: ['Single Family', 'Condo', 'Townhouse'],
                        required: true,
                    },
                ],
                total_questions: 3,
            });
        }
        const sessionId = await this.sessionManager.ensureSession();
        const response = await this.axiosInstance.post('/questions.php', {
            session_id: sessionId,
            ...args,
        });
        return this.createSuccessResponse(response.data);
    }
    async handleGeocodeCheck(args) {
        if (DemoMode.isEnabled()) {
            const inTownship = Math.random() > 0.3;
            return this.createSuccessResponse({
                success: true,
                demo_mode: true,
                address: args.address,
                geocoding_result: {
                    in_township_limits: inTownship,
                    additional_tax_applies: inTownship,
                    tax_rate: inTownship ? 0.0025 : 0,
                },
            });
        }
        const sessionId = await this.sessionManager.ensureSession();
        const params = new URLSearchParams({
            session_id: sessionId,
            ...args,
        });
        const response = await this.axiosInstance.get(`/geocode_check.php?${params}`);
        return this.createSuccessResponse(response.data);
    }
    async handleGetAppraisalModifiers(args) {
        if (DemoMode.isEnabled()) {
            const baseAppraisal = 500;
            const modifiers = [];
            if (args.prop_type === 3)
                modifiers.push({ type: 'Condo', adjustment: -50 });
            if (args.loan_type === 2)
                modifiers.push({ type: 'FHA', adjustment: 75 });
            return this.createSuccessResponse({
                success: true,
                demo_mode: true,
                base_appraisal_fee: baseAppraisal,
                modifiers,
                final_appraisal_fee: baseAppraisal + modifiers.reduce((sum, m) => sum + m.adjustment, 0),
            });
        }
        const sessionId = await this.sessionManager.ensureSession();
        const params = new URLSearchParams({
            session_id: sessionId,
            state: args.state,
            county: args.county,
            purpose: args.purpose,
        });
        if (args.prop_type)
            params.append('loan_info[prop_type]', args.prop_type.toString());
        if (args.amort_type)
            params.append('loan_info[amort_type]', args.amort_type.toString());
        if (args.loan_type)
            params.append('loan_info[loan_type]', args.loan_type.toString());
        const response = await this.axiosInstance.get(`/appraisal_modifiers.php?${params}`);
        return this.createSuccessResponse(response.data);
    }
    // ============================================================================
    // Helper Methods
    // ============================================================================
    createSuccessResponse(data) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    createErrorResponse(error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger.error('Tool error', error);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: errorMessage,
                        details: error instanceof AxiosError ? error.response?.data : undefined,
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
    // ============================================================================
    // Resources and Prompts
    // ============================================================================
    async getResources() {
        return {
            resources: [
                {
                    uri: 'lodestar://info',
                    name: 'LodeStar Server Information',
                    description: 'Server status and configuration',
                    mimeType: 'text/markdown',
                },
                {
                    uri: 'lodestar://tools',
                    name: 'Available Tools Documentation',
                    description: 'Documentation for all 10 tools',
                    mimeType: 'text/markdown',
                },
                {
                    uri: 'lodestar://workflows',
                    name: 'Workflow Guide',
                    description: 'Common workflow patterns',
                    mimeType: 'text/markdown',
                },
            ],
        };
    }
    async readResource(uri) {
        const sessionInfo = this.sessionManager.getSessionInfo();
        const mode = sessionInfo.isDemoMode ? '🎮 DEMO MODE' : '✅ PRODUCTION';
        if (uri === 'lodestar://info') {
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'text/markdown',
                        text: `# LodeStar MCP Server

## Status: ${mode}

${sessionInfo.isDemoMode ? 'All API calls return mock data. No credentials required.' : 'Connected to real LodeStar API.'}

## Session
- Active: ${sessionInfo.isActive ? 'Yes' : 'No'}
- Demo Mode: ${sessionInfo.isDemoMode ? 'Yes' : 'No'}`,
                    },
                ],
            };
        }
        if (uri === 'lodestar://tools') {
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'text/markdown',
                        text: `# Available Tools (All 10 Implemented)

1. **login** - Authenticate with LodeStar
2. **closing_cost_calculations** - Calculate all closing costs
3. **property_tax** - Get property tax information
4. **get_endorsements** - List available endorsements
5. **get_sub_agents** - Find title agents
6. **get_counties** - List counties in a state
7. **get_townships** - List townships in a county
8. **get_questions** - Get state-specific questions
9. **geocode_check** - Verify address location
10. **get_appraisal_modifiers** - Get appraisal fee modifiers

All tools work in both demo and production modes.`,
                    },
                ],
            };
        }
        if (uri === 'lodestar://workflows') {
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'text/markdown',
                        text: `# Workflow Guide

## Quick Purchase Quote
1. login
2. closing_cost_calculations (purpose: '11', search_type: 'CFPB')
3. property_tax (if needed)

## Complete Refinance
1. login
2. get_endorsements
3. get_questions
4. closing_cost_calculations (purpose: '00' or '04')
5. property_tax (if applicable)

## Location Validation
1. get_counties (list all counties)
2. get_townships (list townships in county)
3. geocode_check (verify address)`,
                    },
                ],
            };
        }
        throw new Error(`Unknown resource: ${uri}`);
    }
    async getPrompts() {
        return {
            prompts: [
                {
                    name: 'purchase_demo',
                    description: 'Demo purchase calculation',
                    arguments: [],
                },
                {
                    name: 'refinance_demo',
                    description: 'Demo refinance calculation',
                    arguments: [],
                },
                {
                    name: 'complete_workflow',
                    description: 'Complete workflow example',
                    arguments: [],
                },
            ],
        };
    }
    async getPrompt(name) {
        if (name === 'purchase_demo') {
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Calculate purchase closing costs:
- State: CA
- County: Los Angeles
- Township: Downtown
- Purchase Price: $500,000
- Loan Amount: $400,000
- Purpose: 11 (Purchase)
- Search Type: CFPB`,
                        },
                    },
                ],
            };
        }
        if (name === 'refinance_demo') {
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Calculate refinance closing costs:
- State: TX
- County: Harris
- Township: Houston
- Loan Amount: $350,000
- Purpose: 00 (Refinance)
- Search Type: CFPB`,
                        },
                    },
                ],
            };
        }
        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: 'Please run a complete workflow: login, get counties for CA, get townships for Los Angeles, then calculate closing costs.',
                    },
                },
            ],
        };
    }
}
//# sourceMappingURL=tool-handlers.js.map