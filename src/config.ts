// src/config.ts
import { LodeStarConfig } from './types.js';
import { CONSTANTS } from './constants.js';
import { Logger } from './logger.js';
import { DemoMode } from './demo-mode.js';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: LodeStarConfig;
  private isDemoMode: boolean = false;

  private constructor() {
    this.isDemoMode = DemoMode.isEnabled();

    this.config = {
      clientName:
        process.env.LODESTAR_CLIENT_NAME || CONSTANTS.DEFAULT_CLIENT_NAME,
      username:
        process.env.LODESTAR_USERNAME ||
        (this.isDemoMode ? 'demo@example.com' : ''),
      password:
        process.env.LODESTAR_PASSWORD || (this.isDemoMode ? 'demo123' : ''),
      baseUrl: process.env.LODESTAR_BASE_URL || CONSTANTS.DEFAULT_BASE_URL,
    };

    if (this.isDemoMode) {
      Logger.info('🎮 DEMO MODE ENABLED - No credentials required');
    } else if (!this.config.username || !this.config.password) {
      Logger.warn('No credentials provided - switching to DEMO MODE');
      this.isDemoMode = true;
    }
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  getConfig(): Readonly<LodeStarConfig> {
    return Object.freeze({ ...this.config });
  }

  getApiBaseUrl(): string {
    return `${this.config.baseUrl}/Live/${this.config.clientName}`;
  }

  isDemoModeEnabled(): boolean {
    return this.isDemoMode;
  }
}
