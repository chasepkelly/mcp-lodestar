// src/logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static logLevel: LogLevel = LogLevel.INFO;

  static setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  static debug(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.error(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        data || ''
      );
    }
  }

  static info(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.error(
        `[INFO] ${new Date().toISOString()} - ${message}`,
        data || ''
      );
    }
  }

  static warn(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.error(
        `[WARN] ${new Date().toISOString()} - ${message}`,
        data || ''
      );
    }
  }

  static error(message: string, error?: any): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(
        `[ERROR] ${new Date().toISOString()} - ${message}`,
        error || ''
      );
    }
  }
}
