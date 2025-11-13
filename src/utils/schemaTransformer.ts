import { VCConfiguration } from '../types/vc.types';

export const transformToRJSFSchema = (vcConfig: VCConfiguration) => {
    const { vc_fields } = vcConfig;

    const properties: Record<string, any> = {};
    const required: string[] = [];

    console.log('Transforming vc_fields to RJSF schema:', vc_fields);

    for (const [fieldName, fieldConfig] of Object.entries(vc_fields)) {
        // Skip object type fields without properties (they render as section headers)
        if (fieldConfig.type === 'object') {
            console.log(`Skipping object field without properties: ${fieldName}`);
            continue;
        }

        properties[fieldName] = {
            type: fieldConfig.type,
            title: fieldConfig.label,
            ...(fieldConfig.format && { format: fieldConfig.format }),
            ...(fieldConfig.validation && {
                ...(fieldConfig.validation.pattern && {
                    pattern: fieldConfig.validation.pattern,
                }),
                ...(fieldConfig.validation.minLength && {
                    minLength: fieldConfig.validation.minLength,
                }),
                ...(fieldConfig.validation.maxLength && {
                    maxLength: fieldConfig.validation.maxLength,
                }),
                ...(fieldConfig.validation.minimum && {
                    minimum: fieldConfig.validation.minimum,
                }),
                ...(fieldConfig.validation.maximum && {
                    maximum: fieldConfig.validation.maximum,
                }),
            }),
        };

        if (fieldConfig.required) {
            required.push(fieldName);
        }
    }

    console.log('Final RJSF schema properties:', properties);

    return {
        type: 'object',
        properties,
        required,
    };
};

export const mergeUISchema = (
    vcConfig: VCConfiguration,
    customUISchema?: Record<string, any>
) => {
    const baseUISchema = vcConfig.ui_schema || {};
    return {
        ...baseUISchema,
        ...customUISchema,
    };
};

