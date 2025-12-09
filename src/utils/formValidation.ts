const validateRequiredFields = (
    formData: Record<string, any>,
    required: string[],
    errors: string[]
): void => {
    for (const field of required) {
        if (!formData[field] || formData[field] === '') {
            errors.push(`${field} is required`);
        }
    }
};

const validateStringPattern = (
    fieldName: string,
    value: string,
    pattern: string,
    errors: string[]
): void => {
    const regex = new RegExp(pattern);
    if (!regex.test(value)) {
        errors.push(`${fieldName} format is invalid`);
    }
};

const validateStringLength = (
    fieldName: string,
    value: string,
    fieldSchema: any,
    errors: string[]
): void => {
    if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
        errors.push(
            `${fieldName} must be at least ${fieldSchema.minLength} characters`
        );
    }
    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
        errors.push(
            `${fieldName} must not exceed ${fieldSchema.maxLength} characters`
        );
    }
};

const validateNumberRange = (
    fieldName: string,
    value: number,
    fieldSchema: any,
    errors: string[]
): void => {
    if (fieldSchema.minimum && value < fieldSchema.minimum) {
        errors.push(`${fieldName} must be at least ${fieldSchema.minimum}`);
    }
    if (fieldSchema.maximum && value > fieldSchema.maximum) {
        errors.push(`${fieldName} must not exceed ${fieldSchema.maximum}`);
    }
};

const validateFieldValue = (
    fieldName: string,
    value: any,
    fieldSchema: any,
    errors: string[]
): void => {
    if (value === undefined || value === null || value === '') {
        return;
    }

    // Pattern validation
    if (fieldSchema.pattern && typeof value === 'string') {
        validateStringPattern(fieldName, value, fieldSchema.pattern, errors);
    }

    // Length validation
    if (typeof value === 'string') {
        validateStringLength(fieldName, value, fieldSchema, errors);
    }

    // Number validation
    if (typeof value === 'number') {
        validateNumberRange(fieldName, value, fieldSchema, errors);
    }
};

export const validateFormData = (
    formData: Record<string, any>,
    schema: any
): string[] => {
    const errors: string[] = [];

    // Check required fields
    if (schema.required) {
        validateRequiredFields(formData, schema.required, errors);
    }

    // Validate field formats and constraints
    if (schema.properties) {
        for (const [fieldName, fieldSchema] of Object.entries(
            schema.properties
        )) {
            const value = formData[fieldName];
            validateFieldValue(fieldName, value, fieldSchema, errors);
        }
    }

    return errors;
};

/**
 * Simplified and efficient mobile number validation
 * @param phoneNumber - The phone number to validate
 * @returns Object with isValid boolean and error key
 */
export const validateMobileNumber = (phoneNumber: string): {
    isValid: boolean;
    errorKey: string;
} => {
    // Allow empty (optional field)
    const trimmedNumber = phoneNumber.trim();
    if (!trimmedNumber) {
        return { isValid: true, errorKey: '' };
    }

    // 1. Basic format: exactly 10 digits
    if (!/^\d{10}$/.test(trimmedNumber)) {
        return { isValid: false, errorKey: 'EDITPROFILE_MOBILE_INVALID_FORMAT' };
    }

    // 2. Indian mobile pattern: must start with 6-9
    if (!/^[6-9]/.test(trimmedNumber)) {
        return { isValid: false, errorKey: 'EDITPROFILE_MOBILE_INVALID_PATTERN' };
    }

    // 3. Block obvious invalid patterns
    if (isObviouslyInvalid(trimmedNumber)) {
        return { isValid: false, errorKey: 'EDITPROFILE_MOBILE_INVALID_PATTERN' };
    }

    return { isValid: true, errorKey: '' };
};

/**
 * Check for obviously invalid mobile number patterns
 * Focuses only on the most common and problematic patterns
 */
const isObviouslyInvalid = (phone: string): boolean => {
    // 1. All zeros
    if (phone === '0000000000') return true;
    
    // 2. All same digits (1111111111, 2222222222, etc.)
    if (/^(\d)\1{9}$/.test(phone)) return true;
    
    // 3. Simple sequential patterns
    const sequences = [
        '1234567890', '0123456789', '9876543210', 
        '0987654321', '1234512345'
    ];
    if (sequences.includes(phone)) return true;
    
    // 4. Simple alternating patterns (only the most obvious)
    if (/^(\d)(\d)\1\2\1\2\1\2\1\2$/.test(phone)) return true; // 1212121212
    
    // 5. Too many consecutive identical digits (more than 4 in a row)
    if (/(\d)\1{4,}/.test(phone)) return true; // 11111, 222222, etc.
    
    return false;
};


