// src/validation.ts
// Input validation and sanitization utilities
import { CONSTANTS } from './constants';
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
export class Validator {
    static validateState(state) {
        if (!state || !/^[A-Z]{2}$/.test(state)) {
            throw new ValidationError('State must be a 2-letter uppercase abbreviation (e.g., CA, NY)');
        }
    }
    static validatePurpose(purpose) {
        const validPurposes = Object.values(CONSTANTS.PURPOSE_TYPES);
        if (!validPurposes.includes(purpose)) {
            throw new ValidationError(`Purpose must be one of: ${validPurposes.join(', ')} ` +
                `(00=Refinance, 04=Refinance w/Reissue, 11=Purchase)`);
        }
    }
    static validateSearchType(searchType) {
        const validTypes = Object.values(CONSTANTS.SEARCH_TYPES);
        if (!validTypes.includes(searchType)) {
            throw new ValidationError(`Search type must be either CFPB or Title`);
        }
    }
    static validateRequired(value, fieldName) {
        if (value === undefined || value === null || value === '') {
            throw new ValidationError(`${fieldName} is required`);
        }
    }
    static validatePositiveNumber(value, fieldName) {
        if (value <= 0) {
            throw new ValidationError(`${fieldName} must be greater than 0`);
        }
    }
    static validateDateFormat(date, fieldName) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            throw new ValidationError(`${fieldName} must be in YYYY-MM-DD format`);
        }
    }
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ValidationError('Invalid email format');
        }
    }
    static sanitizeString(input) {
        // Remove any potential SQL injection or XSS attempts
        return input.replace(/[<>'"]/g, '').trim();
    }
}
//# sourceMappingURL=validation.js.map