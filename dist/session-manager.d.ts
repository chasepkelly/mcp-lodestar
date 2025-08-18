import { AxiosInstance } from 'axios';
export declare class SessionManager {
    private static instance;
    private session;
    private axiosInstance;
    private isDemoMode;
    private constructor();
    static getInstance(axiosInstance: AxiosInstance): SessionManager;
    ensureSession(): Promise<string>;
    private refreshSession;
    clearSession(): void;
    getSessionInfo(): {
        isActive: boolean;
        isDemoMode: boolean;
    };
}
