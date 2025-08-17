// src/session-manager.ts
import { AxiosInstance } from 'axios';
import { SessionData } from './types.js';
import { CONSTANTS } from './constants.js';
import { ConfigManager } from './config.js';
import { DemoMode } from './demo-mode.js';

export class SessionManager {
  private static instance: SessionManager;
  private session: SessionData | null = null;
  private axiosInstance: AxiosInstance;
  private isDemoMode: boolean;

  private constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
    this.isDemoMode = DemoMode.isEnabled();
  }

  static getInstance(axiosInstance: AxiosInstance): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(axiosInstance);
    }
    return SessionManager.instance;
  }

  async ensureSession(): Promise<string> {
    if (this.isDemoMode) {
      if (!this.session) {
        this.session = {
          sessionId: DemoMode.getMockSession(),
          timestamp: Date.now(),
        };
      }
      return this.session.sessionId;
    }

    if (
      this.session &&
      Date.now() - this.session.timestamp < CONSTANTS.SESSION_TIMEOUT_MS
    ) {
      return this.session.sessionId;
    }

    return await this.refreshSession();
  }

  private async refreshSession(): Promise<string> {
    if (this.isDemoMode) {
      this.session = {
        sessionId: DemoMode.getMockSession(),
        timestamp: Date.now(),
      };
      return this.session.sessionId;
    }

    const config = ConfigManager.getInstance().getConfig();

    try {
      const response = await this.axiosInstance.post(
        '/Login/login.php',
        new URLSearchParams({
          username: config.username,
          password: config.password,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.data.session_id) {
        this.session = {
          sessionId: response.data.session_id,
          timestamp: Date.now(),
        };
        return this.session.sessionId;
      }
      throw new Error('No session_id in response');
    } catch (error: any) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  clearSession(): void {
    this.session = null;
  }

  getSessionInfo(): { isActive: boolean; isDemoMode: boolean } {
    return { isActive: !!this.session, isDemoMode: this.isDemoMode };
  }
}
