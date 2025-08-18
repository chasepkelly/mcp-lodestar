// src/session-manager.ts
// Enhanced session management with demo mode support
import { CONSTANTS } from './constants.js';
import { Logger } from './logger.js';
import { ConfigManager } from './config.js';
import { DemoMode } from './demo-mode.js';
export class SessionManager {
    constructor(axiosInstance) {
        this.session = null;
        this.refreshTimer = null;
        this.axiosInstance = axiosInstance;
        this.isDemoMode = DemoMode.isEnabled();
    }
    static getInstance(axiosInstance) {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager(axiosInstance);
        }
        return SessionManager.instance;
    }
    async ensureSession() {
        // In demo mode, always return a valid demo session
        if (this.isDemoMode) {
            if (!this.session) {
                this.session = {
                    sessionId: DemoMode.getMockSession(),
                    timestamp: Date.now(),
                };
                Logger.info('Demo session created');
            }
            return this.session.sessionId;
        }
        // Normal mode - check session validity
        if (this.isSessionValid()) {
            return this.session.sessionId;
        }
        return await this.refreshSession();
    }
    isSessionValid() {
        if (!this.session)
            return false;
        // Demo sessions never expire
        if (this.isDemoMode)
            return true;
        const now = Date.now();
        const age = now - this.session.timestamp;
        const isValid = age < CONSTANTS.SESSION_TIMEOUT_MS;
        if (!isValid) {
            Logger.info('Session expired', {
                age: Math.floor(age / 1000 / 60) + ' minutes',
            });
        }
        return isValid;
    }
    async refreshSession() {
        // Demo mode - return mock session
        if (this.isDemoMode) {
            this.session = {
                sessionId: DemoMode.getMockSession(),
                timestamp: Date.now(),
            };
            Logger.info('Demo session refreshed');
            return this.session.sessionId;
        }
        // Normal mode - actual API call
        const config = ConfigManager.getInstance().getConfig();
        try {
            Logger.info('Refreshing session...');
            const response = await this.axiosInstance.post('/Login/login.php', new URLSearchParams({
                username: config.username,
                password: config.password,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            if (!response.data.session_id) {
                throw new Error('No session_id in login response');
            }
            this.session = {
                sessionId: response.data.session_id,
                timestamp: Date.now(),
            };
            this.scheduleRefresh();
            Logger.info('Session refreshed successfully');
            return this.session.sessionId;
        }
        catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'Unknown login error';
            Logger.error('Session refresh failed', errorMessage);
            throw new Error(`Login failed: ${errorMessage}`);
        }
    }
    scheduleRefresh() {
        // No auto-refresh in demo mode
        if (this.isDemoMode)
            return;
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        // Refresh 5 minutes before expiry
        const refreshIn = CONSTANTS.SESSION_TIMEOUT_MS - 5 * 60 * 1000;
        this.refreshTimer = setTimeout(() => {
            this.refreshSession().catch((error) => {
                Logger.error('Auto-refresh failed', error);
            });
        }, refreshIn);
    }
    getSessionInfo() {
        if (!this.session) {
            return { isActive: false, isDemoMode: this.isDemoMode };
        }
        const ageMinutes = Math.floor((Date.now() - this.session.timestamp) / 1000 / 60);
        return { isActive: true, ageMinutes, isDemoMode: this.isDemoMode };
    }
    clearSession() {
        this.session = null;
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
        Logger.info('Session cleared');
    }
    isDemoSession() {
        return this.isDemoMode;
    }
}
//# sourceMappingURL=enhanced-session-manager.js.map