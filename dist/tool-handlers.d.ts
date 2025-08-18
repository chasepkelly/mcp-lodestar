import { AxiosInstance } from 'axios';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SessionManager } from './session-manager.js';
export declare class ToolHandlers {
    private axiosInstance;
    private sessionManager;
    constructor(axiosInstance: AxiosInstance, sessionManager: SessionManager);
    getToolDefinitions(): Promise<{
        tools: ({
            name: string;
            description: string;
            inputSchema: {
                type: string;
                properties: {
                    username: {
                        type: string;
                        description: string;
                    };
                    password: {
                        type: string;
                        description: string;
                    };
                    state?: undefined;
                    county?: undefined;
                    township?: undefined;
                    search_type?: undefined;
                    purpose?: undefined;
                    filename?: undefined;
                    loan_amount?: undefined;
                    purchase_price?: undefined;
                    prior_insurance?: undefined;
                    exdebt?: undefined;
                    request_endos?: undefined;
                    close_date?: undefined;
                    address?: undefined;
                    include_pdf?: undefined;
                    include_property_tax?: undefined;
                    include_section?: undefined;
                    include_payee_info?: undefined;
                    city?: undefined;
                    file_name?: undefined;
                    sub_agent_id?: undefined;
                    sub_agent_office_id?: undefined;
                    get_contact_info?: undefined;
                    prop_type?: undefined;
                    amort_type?: undefined;
                    loan_type?: undefined;
                };
                required?: undefined;
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                required: string[];
                properties: {
                    state: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        description: string;
                    };
                    county: {
                        type: string;
                        description: string;
                    };
                    township: {
                        type: string;
                        description: string;
                    };
                    search_type: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    purpose: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    filename: {
                        type: string;
                        description: string;
                    };
                    loan_amount: {
                        type: string;
                        description: string;
                    };
                    purchase_price: {
                        type: string;
                        description: string;
                    };
                    prior_insurance: {
                        type: string;
                        description: string;
                    };
                    exdebt: {
                        type: string;
                        description: string;
                    };
                    request_endos: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                    };
                    close_date: {
                        type: string;
                        description: string;
                    };
                    address: {
                        type: string;
                        description: string;
                    };
                    include_pdf: {
                        type: string;
                        description: string;
                    };
                    include_property_tax: {
                        type: string;
                        description: string;
                    };
                    include_section: {
                        type: string;
                        description: string;
                    };
                    include_payee_info: {
                        type: string;
                        description: string;
                    };
                    username?: undefined;
                    password?: undefined;
                    city?: undefined;
                    file_name?: undefined;
                    sub_agent_id?: undefined;
                    sub_agent_office_id?: undefined;
                    get_contact_info?: undefined;
                    prop_type?: undefined;
                    amort_type?: undefined;
                    loan_type?: undefined;
                };
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                required: string[];
                properties: {
                    state: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        description: string;
                    };
                    county: {
                        type: string;
                        description: string;
                    };
                    city: {
                        type: string;
                        description: string;
                    };
                    address: {
                        type: string;
                        description: string;
                    };
                    close_date: {
                        type: string;
                        description: string;
                    };
                    file_name: {
                        type: string;
                        description: string;
                    };
                    purchase_price: {
                        type: string;
                        description: string;
                    };
                    username?: undefined;
                    password?: undefined;
                    township?: undefined;
                    search_type?: undefined;
                    purpose?: undefined;
                    filename?: undefined;
                    loan_amount?: undefined;
                    prior_insurance?: undefined;
                    exdebt?: undefined;
                    request_endos?: undefined;
                    include_pdf?: undefined;
                    include_property_tax?: undefined;
                    include_section?: undefined;
                    include_payee_info?: undefined;
                    sub_agent_id?: undefined;
                    sub_agent_office_id?: undefined;
                    get_contact_info?: undefined;
                    prop_type?: undefined;
                    amort_type?: undefined;
                    loan_type?: undefined;
                };
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                required: string[];
                properties: {
                    state: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        description: string;
                    };
                    county: {
                        type: string;
                        description: string;
                    };
                    purpose: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    sub_agent_id: {
                        type: string;
                        description: string;
                    };
                    sub_agent_office_id: {
                        type: string;
                        description: string;
                    };
                    username?: undefined;
                    password?: undefined;
                    township?: undefined;
                    search_type?: undefined;
                    filename?: undefined;
                    loan_amount?: undefined;
                    purchase_price?: undefined;
                    prior_insurance?: undefined;
                    exdebt?: undefined;
                    request_endos?: undefined;
                    close_date?: undefined;
                    address?: undefined;
                    include_pdf?: undefined;
                    include_property_tax?: undefined;
                    include_section?: undefined;
                    include_payee_info?: undefined;
                    city?: undefined;
                    file_name?: undefined;
                    get_contact_info?: undefined;
                    prop_type?: undefined;
                    amort_type?: undefined;
                    loan_type?: undefined;
                };
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                required: string[];
                properties: {
                    state: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        description: string;
                    };
                    county: {
                        type: string;
                        description: string;
                    };
                    purpose: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    township: {
                        type: string;
                        description: string;
                    };
                    address: {
                        type: string;
                        description: string;
                    };
                    get_contact_info: {
                        type: string;
                        description: string;
                    };
                    username?: undefined;
                    password?: undefined;
                    search_type?: undefined;
                    filename?: undefined;
                    loan_amount?: undefined;
                    purchase_price?: undefined;
                    prior_insurance?: undefined;
                    exdebt?: undefined;
                    request_endos?: undefined;
                    close_date?: undefined;
                    include_pdf?: undefined;
                    include_property_tax?: undefined;
                    include_section?: undefined;
                    include_payee_info?: undefined;
                    city?: undefined;
                    file_name?: undefined;
                    sub_agent_id?: undefined;
                    sub_agent_office_id?: undefined;
                    prop_type?: undefined;
                    amort_type?: undefined;
                    loan_type?: undefined;
                };
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                required: string[];
                properties: {
                    state: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        description: string;
                    };
                    username?: undefined;
                    password?: undefined;
                    county?: undefined;
                    township?: undefined;
                    search_type?: undefined;
                    purpose?: undefined;
                    filename?: undefined;
                    loan_amount?: undefined;
                    purchase_price?: undefined;
                    prior_insurance?: undefined;
                    exdebt?: undefined;
                    request_endos?: undefined;
                    close_date?: undefined;
                    address?: undefined;
                    include_pdf?: undefined;
                    include_property_tax?: undefined;
                    include_section?: undefined;
                    include_payee_info?: undefined;
                    city?: undefined;
                    file_name?: undefined;
                    sub_agent_id?: undefined;
                    sub_agent_office_id?: undefined;
                    get_contact_info?: undefined;
                    prop_type?: undefined;
                    amort_type?: undefined;
                    loan_type?: undefined;
                };
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                required: string[];
                properties: {
                    state: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        description: string;
                    };
                    county: {
                        type: string;
                        description: string;
                    };
                    username?: undefined;
                    password?: undefined;
                    township?: undefined;
                    search_type?: undefined;
                    purpose?: undefined;
                    filename?: undefined;
                    loan_amount?: undefined;
                    purchase_price?: undefined;
                    prior_insurance?: undefined;
                    exdebt?: undefined;
                    request_endos?: undefined;
                    close_date?: undefined;
                    address?: undefined;
                    include_pdf?: undefined;
                    include_property_tax?: undefined;
                    include_section?: undefined;
                    include_payee_info?: undefined;
                    city?: undefined;
                    file_name?: undefined;
                    sub_agent_id?: undefined;
                    sub_agent_office_id?: undefined;
                    get_contact_info?: undefined;
                    prop_type?: undefined;
                    amort_type?: undefined;
                    loan_type?: undefined;
                };
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                required: string[];
                properties: {
                    state: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        description: string;
                    };
                    purpose: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    username?: undefined;
                    password?: undefined;
                    county?: undefined;
                    township?: undefined;
                    search_type?: undefined;
                    filename?: undefined;
                    loan_amount?: undefined;
                    purchase_price?: undefined;
                    prior_insurance?: undefined;
                    exdebt?: undefined;
                    request_endos?: undefined;
                    close_date?: undefined;
                    address?: undefined;
                    include_pdf?: undefined;
                    include_property_tax?: undefined;
                    include_section?: undefined;
                    include_payee_info?: undefined;
                    city?: undefined;
                    file_name?: undefined;
                    sub_agent_id?: undefined;
                    sub_agent_office_id?: undefined;
                    get_contact_info?: undefined;
                    prop_type?: undefined;
                    amort_type?: undefined;
                    loan_type?: undefined;
                };
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                required: string[];
                properties: {
                    state: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        description: string;
                    };
                    county: {
                        type: string;
                        description: string;
                    };
                    township: {
                        type: string;
                        description: string;
                    };
                    address: {
                        type: string;
                        description: string;
                    };
                    username?: undefined;
                    password?: undefined;
                    search_type?: undefined;
                    purpose?: undefined;
                    filename?: undefined;
                    loan_amount?: undefined;
                    purchase_price?: undefined;
                    prior_insurance?: undefined;
                    exdebt?: undefined;
                    request_endos?: undefined;
                    close_date?: undefined;
                    include_pdf?: undefined;
                    include_property_tax?: undefined;
                    include_section?: undefined;
                    include_payee_info?: undefined;
                    city?: undefined;
                    file_name?: undefined;
                    sub_agent_id?: undefined;
                    sub_agent_office_id?: undefined;
                    get_contact_info?: undefined;
                    prop_type?: undefined;
                    amort_type?: undefined;
                    loan_type?: undefined;
                };
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                required: string[];
                properties: {
                    state: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        description: string;
                    };
                    county: {
                        type: string;
                        description: string;
                    };
                    purpose: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    prop_type: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        description: string;
                    };
                    amort_type: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        description: string;
                    };
                    loan_type: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        description: string;
                    };
                    username?: undefined;
                    password?: undefined;
                    township?: undefined;
                    search_type?: undefined;
                    filename?: undefined;
                    loan_amount?: undefined;
                    purchase_price?: undefined;
                    prior_insurance?: undefined;
                    exdebt?: undefined;
                    request_endos?: undefined;
                    close_date?: undefined;
                    address?: undefined;
                    include_pdf?: undefined;
                    include_property_tax?: undefined;
                    include_section?: undefined;
                    include_payee_info?: undefined;
                    city?: undefined;
                    file_name?: undefined;
                    sub_agent_id?: undefined;
                    sub_agent_office_id?: undefined;
                    get_contact_info?: undefined;
                };
            };
        })[];
    }>;
    handleToolCall(name: string, args: any): Promise<CallToolResult>;
    private handleLogin;
    private handleClosingCostCalculations;
    private handlePropertyTax;
    private handleGetEndorsements;
    private handleGetSubAgents;
    private handleGetCounties;
    private handleGetTownships;
    private handleGetQuestions;
    private handleGeocodeCheck;
    private handleGetAppraisalModifiers;
    private createSuccessResponse;
    private createErrorResponse;
    getResources(): Promise<{
        resources: {
            uri: string;
            name: string;
            description: string;
            mimeType: string;
        }[];
    }>;
    readResource(uri: string): Promise<{
        contents: {
            uri: string;
            mimeType: string;
            text: string;
        }[];
    }>;
    getPrompts(): Promise<{
        prompts: {
            name: string;
            description: string;
            arguments: never[];
        }[];
    }>;
    getPrompt(name: string): Promise<{
        messages: {
            role: "user";
            content: {
                type: "text";
                text: string;
            };
        }[];
    }>;
}
