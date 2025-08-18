import { AxiosInstance } from 'axios';
export declare class SessionManager {
    private static instance;
    private session;
    private refreshTimer;
    private axiosInstance;
    private isDemoMode;
    private constructor();
    static getInstance(axiosInstance: AxiosInstance): SessionManager;
    ensureSession(): Promise<string>;
    private isSessionValid;
    private refreshSession;
    private scheduleRefresh;
    getSessionInfo(): {
        isActive: boolean;
        ageMinutes?: number;
        isDemoMode: boolean;
    };
    clearSession(): void;
    isDemoSession(): boolean;
}
