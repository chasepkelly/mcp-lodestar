export interface LodeStarConfig {
    clientName: string;
    username: string;
    password: string;
    baseUrl: string;
}
export interface SessionData {
    sessionId: string;
    timestamp: number;
}
export interface LoginResponse {
    session_id?: string;
    success?: string;
    error?: string;
}
export interface ClosingCostResponse {
    success: boolean;
    data?: any;
    error?: string;
}
export interface LoginArgs {
    username?: string;
    password?: string;
}
export interface ClosingCostArgs {
    state: string;
    county: string;
    township: string;
    search_type: 'CFPB' | 'Title';
    purpose: '00' | '04' | '11';
    filename?: string;
    loan_amount?: number;
    purchase_price?: number;
    prior_insurance?: number;
    exdebt?: number;
    request_endos?: string[];
    close_date?: string;
    address?: string;
}
