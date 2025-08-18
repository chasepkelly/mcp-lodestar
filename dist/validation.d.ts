export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare class Validator {
    static validateState(state: string): void;
    static validatePurpose(purpose: string): void;
    static validateSearchType(searchType: string): void;
    static validateRequired<T>(value: T | undefined | null, fieldName: string): asserts value is T;
    static validatePositiveNumber(value: number, fieldName: string): void;
    static validateDateFormat(date: string, fieldName: string): void;
    static validateEmail(email: string): void;
    static sanitizeString(input: string): string;
}
