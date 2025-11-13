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

