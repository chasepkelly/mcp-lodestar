import { LodeStarConfig } from './types.js';
export declare class ConfigManager {
    private static instance;
    private config;
    private isDemoMode;
    private constructor();
    static getInstance(): ConfigManager;
    getConfig(): Readonly<LodeStarConfig>;
    getApiBaseUrl(): string;
    isDemoModeEnabled(): boolean;
}
