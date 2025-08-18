export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare class Logger {
    private static logLevel;
    static setLogLevel(level: LogLevel): void;
    static debug(message: string, data?: any): void;
    static info(message: string, data?: any): void;
    static warn(message: string, data?: any): void;
    static error(message: string, error?: any): void;
}
