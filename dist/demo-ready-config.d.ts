import { LodeStarConfig } from './types';
export declare class ConfigManager {
    private static instance;
    private config;
    private isDemoMode;
    private constructor();
    static getInstance(): ConfigManager;
    private loadConfig;
    private validateUrl;
    private validateConfig;
    getConfig(): Readonly<LodeStarConfig>;
    getApiBaseUrl(): string;
    isDemoModeEnabled(): boolean;
}
