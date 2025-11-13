import axios from 'axios';
import { VCConfiguration, VCField } from '../types/vc.types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Constants for metadata field patterns
const METADATA_FIELD_PATTERNS = ['originalvc', 'original'] as const;

interface ApiVCConfiguration {
    name: string;
    label: string;
    docType: string;
    documentSubType: string;
    issueVC: 'yes' | 'no';
    vcFields: string; // JSON string
    docQRContains?: string;
}

export class ConfigService {
    /**
     * Checks if a field name matches metadata field patterns
     */
    private static isMetadataField(fieldName: string): boolean {
        const lowerFieldName = fieldName.toLowerCase();
        return METADATA_FIELD_PATTERNS.some(pattern =>
            lowerFieldName.includes(pattern)
        );
    }

    /**
     * Transforms API response format to VCConfiguration format
     */
    private static transformApiConfigToVCConfig(
        apiConfig: ApiVCConfiguration
    ): VCConfiguration {
        // Parse vcFields JSON string
        let parsedVcFields: Record<string, { type: string }> = {};
        try {
            parsedVcFields = JSON.parse(apiConfig.vcFields);
            console.log('Parsed vcFields:', parsedVcFields);
        } catch (error) {
            console.error('Failed to parse vcFields:', error);
            throw new Error('Invalid vcFields format in configuration.');
        }

        // Transform parsed fields to VCField format
        // Filter out object type fields that are typically used for metadata
        const vcFields: Record<string, VCField> = {};
        for (const [fieldName, fieldData] of Object.entries(parsedVcFields)) {
            // Skip object type fields that are typically metadata fields
            if (fieldData.type === 'object' && this.isMetadataField(fieldName)) {
                console.log(`Skipping metadata field: ${fieldName} (type: ${fieldData.type})`);
                continue;
            }

            vcFields[fieldName] = {
                type: fieldData.type as VCField['type'],
                label: this.formatFieldLabel(fieldName),
                required: false, // Default to false, can be updated if API provides this info
            };
        }

        console.log('Transformed vcFields:', vcFields);

        return {
            id: `${apiConfig.docType}-${apiConfig.documentSubType}`,
            name: apiConfig.name,
            label: apiConfig.label,
            doc_type: apiConfig.docType,
            doc_subtype: apiConfig.documentSubType,
            issue_vc: apiConfig.issueVC === 'yes',
            vc_fields: vcFields,
        };
    }

    /**
     * Formats field name to a readable label
     * Examples:
     * - "firstname" -> "Firstname"
     * - "studentUniqueId" -> "Student Unique Id"
     * - "issuingauthorityaddress" -> "Issuingauthorityaddress"
     */
    private static formatFieldLabel(fieldName: string): string {
        // Handle camelCase: insert space before capital letters
        let formatted = fieldName.replace(/([A-Z])/g, ' $1');

        // Capitalize first letter
        formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

        return formatted.trim();
    }

    static async getVCConfiguration(
        docType: string,
        docSubtype: string
    ): Promise<VCConfiguration> {
        const token = localStorage.getItem('authToken');
        try {
            // Get all configurations
            const response = await axios.get(
                `${apiBaseUrl}/admin/config/vcConfiguration`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Response structure: { statusCode, message, data: { value: [...] } }
            const configurations: ApiVCConfiguration[] =
                response.data.data.value || [];

            // Find matching configuration
            const matchingConfig = configurations.find(
                (config) =>
                    config.docType === docType &&
                    config.documentSubType === docSubtype
            );

            if (!matchingConfig) {
                throw new Error(
                    `No configuration found for ${docType}/${docSubtype}`
                );
            }

            // Transform API format to VCConfiguration format
            return this.transformApiConfigToVCConfig(matchingConfig);
        } catch (error) {
            console.error('Failed to fetch VC configuration:', error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to load form configuration.';
            throw new Error(errorMessage);
        }
    }

    static async getAllVCConfigurations(): Promise<VCConfiguration[]> {
        const token = localStorage.getItem('authToken');
        try {
            const response = await axios.get(
                `${apiBaseUrl}/admin/config/vcConfiguration`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const configurations: ApiVCConfiguration[] =
                response.data.data.value || [];

            return configurations.map((config) =>
                this.transformApiConfigToVCConfig(config)
            );
        } catch (error) {
            console.error('Failed to fetch VC configurations:', error);
            throw new Error('Failed to load configurations.');
        }
    }
}

