// src/config.ts
// Enhanced configuration management with demo mode support
import { CONSTANTS } from './constants';
import { ValidationError, Validator } from './validation';
import { Logger } from './logger';
export class ConfigManager {
    constructor() {
        this.isDemoMode = false;
        this.config = this.loadConfig();
        this.validateConfig();
    }
    static getInstance() {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }
    loadConfig() {
        // Check if we should run in demo mode
        const demoMode = process.env.DEMO_MODE === 'true';
        const hasCredentials = !!(process.env.LODESTAR_USERNAME && process.env.LODESTAR_PASSWORD);
        this.isDemoMode = demoMode || !hasCredentials;
        const config = {
            clientName: process.env.LODESTAR_CLIENT_NAME || CONSTANTS.DEFAULT_CLIENT_NAME,
            username: process.env.LODESTAR_USERNAME ||
                (this.isDemoMode ? 'demo@example.com' : ''),
            password: process.env.LODESTAR_PASSWORD || (this.isDemoMode ? 'demo123' : ''),
            baseUrl: process.env.LODESTAR_BASE_URL || CONSTANTS.DEFAULT_BASE_URL,
        };
        // Sanitize inputs (except in demo mode)
        if (!this.isDemoMode) {
            config.clientName = Validator.sanitizeString(config.clientName);
            config.username = Validator.sanitizeString(config.username);
            config.baseUrl = this.validateUrl(config.baseUrl);
        }
        return config;
    }
    validateUrl(url) {
        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                throw new ValidationError('URL must use HTTP or HTTPS protocol');
            }
            return parsed.toString().replace(/\/$/, ''); // Remove trailing slash
        }
        catch (error) {
            throw new ValidationError(`Invalid base URL: ${url}`);
        }
    }
    validateConfig() {
        if (this.isDemoMode) {
            Logger.info('🎮 DEMO MODE ENABLED - No credentials required');
            Logger.info('Demo Configuration:', {
                clientName: this.config.clientName,
                baseUrl: this.config.baseUrl,
                mode: 'DEMO',
            });
            return;
        }
        if (!this.config.username || !this.config.password) {
            Logger.warn('No credentials provided - switching to DEMO MODE');
            Logger.info('To use real API, set LODESTAR_USERNAME and LODESTAR_PASSWORD');
            this.isDemoMode = true;
            this.config.username = 'demo@example.com';
            this.config.password = 'demo123';
            return;
        }
        // Validate username is email-like
        if (this.config.username.includes('@')) {
            Validator.validateEmail(this.config.username);
        }
        Logger.info('Configuration loaded successfully', {
            clientName: this.config.clientName,
            baseUrl: this.config.baseUrl,
            username: this.config.username.substring(0, 3) + '***', // Partial masking
            mode: 'PRODUCTION',
        });
    }
    getConfig() {
        return Object.freeze({ ...this.config });
    }
    getApiBaseUrl() {
        return `${this.config.baseUrl}/Live/${this.config.clientName}`;
    }
    isDemoModeEnabled() {
        return this.isDemoMode;
    }
}
//# sourceMappingURL=demo-ready-config.js.map