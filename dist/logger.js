// src/logger.ts
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
export class Logger {
    static setLogLevel(level) {
        this.logLevel = level;
    }
    static debug(message, data) {
        if (this.logLevel <= LogLevel.DEBUG) {
            console.error(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
        }
    }
    static info(message, data) {
        if (this.logLevel <= LogLevel.INFO) {
            console.error(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
        }
    }
    static warn(message, data) {
        if (this.logLevel <= LogLevel.WARN) {
            console.error(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
        }
    }
    static error(message, error) {
        if (this.logLevel <= LogLevel.ERROR) {
            console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
        }
    }
}
Logger.logLevel = LogLevel.INFO;
//# sourceMappingURL=logger.js.map