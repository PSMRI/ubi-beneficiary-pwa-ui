import apiClient from '../../config/apiClient';

/**
 * Admin Service
 * 
 * All API calls related to admin operations, field management, and document mappings
 * Uses centralized apiClient with automatic token handling and error management
 */

// =============================================
// Type Definitions
// =============================================

export interface DocumentFieldMapping {
	document: string;
	documentField: string;
}

export interface FieldValueNormalization {
	rawValue: string;
	transformedValue: string;
}

export interface Mapping {
	name?: string;
	label?: string;
	documentSubType?: string;
	docType?: string;
	fieldName?: string;
	documentMappings?: DocumentFieldMapping[];
	fieldValueNormalizationMapping?: FieldValueNormalization;
}

export interface Field {
	fieldId: string;
	label: string | Record<string, string>; // Supports any number of languages dynamically
	name: string;
	type: string;
	isRequired: boolean;
	isEditable?: boolean;
	isEncrypted?: boolean;
	ordering?: number;
	fieldParams?: {
		options?: FieldOption[];
	};
}

export interface FieldOption {
	id: string;
	name: string;
	value: string;
}

export interface AddFieldPayload {
	name: string;
	label: string | Record<string, string>; // Supports any number of languages dynamically
	context?: string;
	contextType?: string;
	type: string;
	ordering?: number;
	fieldParams?: { options?: FieldOption[] } | null;
	fieldAttributes?: { 
		isEditable: boolean; 
		isRequired: boolean;
		isEncrypted: boolean;
	};
	sourceDetails?: any;
	dependsOn?: Record<string, any>;
}

// =============================================
// Configuration APIs
// =============================================

/**
 * Update configuration mapping
 * @param value - Array of mapping configurations
 * @param key - Configuration key
 * @returns Response data
 */
export const updateMapping = async (value: Mapping[], key: string) => {
	try {
		const response = await apiClient.post(
			'/admin/config',
			{
				key,
				value,
			}
		);

		return response.data;
	} catch (error) {
		console.error('Error updating document mapping:', error);
		throw error;
	}
};

/**
 * Get configuration mapping by type
 * @param configType - Type of configuration to retrieve
 * @returns Configuration data
 */
export const getMapping = async (configType: string) => {
	try {
		const response = await apiClient.get(
			`/admin/config/${configType}`
		);

		return response.data;
	} catch (error) {
		console.error('Error fetching document field mapping:', error);
		throw error;
	}
};

// =============================================
// Field Management APIs
// =============================================

/**
 * Fetch fields with context and type filters
 * @param context - Context type (default: 'USERS')
 * @param contextType - Context type detail (default: 'User')
 * @returns Array of fields
 */
export const fetchFields = async (
	context = 'USERS',
	contextType = 'User'
): Promise<Field[]> => {
	try {
		const response = await apiClient.get('/fields', {
			params: { context, contextType },
		});

		// Transform response data to Field objects
		return response.data.map((field: unknown) => {
			const fieldObj = field as Record<string, any>;
			return {
				fieldId: fieldObj.fieldId,
				label: fieldObj.label, // Can be string or { en: string, hi: string, ... }
				name: fieldObj.name,
				type: fieldObj.type,
				isRequired: fieldObj.fieldAttributes?.isRequired ?? false,
				isEditable: fieldObj.fieldAttributes?.isEditable ?? true,
				isEncrypted: fieldObj.fieldAttributes?.isEncrypted ?? false,
				ordering: fieldObj.ordering,
				fieldParams: fieldObj.fieldParams ?? undefined,
			};
		});
	} catch (error) {
		console.error('Error fetching fields:', error);
		throw error;
	}
};

/**
 * Add a new field
 * @param payload - Field data to create
 * @returns Created field data
 */
export const addField = async (payload: AddFieldPayload) => {
	try {
		const response = await apiClient.post(
			'/fields',
			{
				name: payload.name,
				label: payload.label,
				context: payload.context || 'USERS',
				contextType: payload.contextType || 'User',
				type: payload.type,
				ordering: payload.ordering,
				fieldParams: payload.fieldParams ?? null,
				fieldAttributes: payload.fieldAttributes,
				sourceDetails: payload.sourceDetails ?? null,
				dependsOn: payload.dependsOn ?? {},
			}
		);

		return response.data;
	} catch (error: any) {
		console.error('Error adding field:', error);
		// Extract the error message from the API response
		const errorMessage = error.response?.data?.message || error.message || 'Failed to add field';
		throw new Error(errorMessage);
	}
};

/**
 * Update an existing field
 * @param fieldId - ID of the field to update
 * @param payload - Updated field data
 * @returns Updated field data
 */
export const updateField = async (
	fieldId: string,
	payload: AddFieldPayload
) => {
	try {
		const response = await apiClient.put(
			`/fields/${fieldId}`,
			{
				name: payload.name,
				label: payload.label,
				type: payload.type,
				ordering: payload.ordering,
				fieldParams: payload.fieldParams ?? null,
				fieldAttributes: payload.fieldAttributes,
				sourceDetails: payload.sourceDetails ?? null,
				dependsOn: payload.dependsOn ?? {},
				isRequired: payload.fieldAttributes?.isRequired,
			}
		);

		return response.data;
	} catch (error: any) {
		console.error('Error updating field:', error);
		// Extract the error message from the API response
		const errorMessage = error.response?.data?.message || error.message || 'Failed to update field';
		throw new Error(errorMessage);
	}
};

/**
 * Delete a field
 * @param fieldId - ID of the field to delete
 * @returns Response data
 */
export const deleteField = async (fieldId: string) => {
	try {
		const response = await apiClient.delete(`/fields/${fieldId}`);
		return response.data;
	} catch (error: unknown) {
		console.error('Error deleting field:', error);
		throw error;
	}
};
