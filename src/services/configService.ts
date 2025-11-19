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
	spaceId?: string;
	issuer?: string;
}

export class ConfigService {
	// In-memory cache for VC configurations
	private static configCache: Map<string, VCConfiguration> | null = null;
	private static cachePromise: Promise<void> | null = null;
	private static cacheTimestamp: number | null = null;
	private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

	/**
	 * Checks if a field name matches metadata field patterns
	 */
	private static isMetadataField(fieldName: string): boolean {
		const lowerFieldName = fieldName.toLowerCase();
		return METADATA_FIELD_PATTERNS.some((pattern) =>
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
			if (
				fieldData.type === 'object' &&
				this.isMetadataField(fieldName)
			) {
				console.log(
					`Skipping metadata field: ${fieldName} (type: ${fieldData.type})`
				);
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
			issuer: apiConfig.issuer,
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
		let formatted = fieldName.replaceAll(/([A-Z])/g, ' $1');

		// Capitalize first letter
		formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

		return formatted.trim();
	}

	/**
	 * Checks if cache is still valid
	 */
	private static isCacheValid(): boolean {
		if (!this.configCache || !this.cacheTimestamp) {
			return false;
		}
		return Date.now() - this.cacheTimestamp < this.CACHE_DURATION;
	}

	/**
	 * Loads all configurations into cache (single API call)
	 */
	private static async loadAllConfigurations(): Promise<void> {
		// If cache is valid, no need to reload
		if (this.isCacheValid()) {
			return;
		}

		// If already loading, wait for existing promise
		if (this.cachePromise !== null) {
			return this.cachePromise;
		}

		// Create new promise for loading
		this.cachePromise = (async () => {
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

				// Build cache map
				this.configCache = new Map();
				for (const config of configurations) {
					const key = `${config.docType}-${config.documentSubType}`;
					const transformed =
						this.transformApiConfigToVCConfig(config);
					this.configCache.set(key, transformed);
				}

				this.cacheTimestamp = Date.now();
			} catch (error) {
				console.error('Failed to load VC configurations:', error);
				// Clear cache on error
				this.configCache = null;
				this.cacheTimestamp = null;
				throw error;
			} finally {
				this.cachePromise = null;
			}
		})();

		return this.cachePromise;
	}

	/**
	 * Get VC configuration for specific document type (uses cache)
	 */
	static async getVCConfiguration(
		docType: string,
		docSubtype: string
	): Promise<VCConfiguration> {
		// Ensure cache is loaded
		await this.loadAllConfigurations();

		const key = `${docType}-${docSubtype}`;
		const config = this.configCache?.get(key);

		if (!config) {
			throw new Error(
				`No configuration found for ${docType}/${docSubtype}`
			);
		}

		return config;
	}

	/**
	 * Get all VC configurations (uses cache)
	 */
	static async getAllVCConfigurations(): Promise<VCConfiguration[]> {
		await this.loadAllConfigurations();
		return Array.from(this.configCache?.values() || []);
	}

	/**
	 * Manually clear cache (useful for admin updates)
	 */
	static clearCache(): void {
		this.configCache = null;
		this.cacheTimestamp = null;
		this.cachePromise = null;
	}

	/**
	 * Check if a document requires VC issuance (optimized for bulk checks)
	 */
	static async requiresVCIssuance(
		docType: string,
		docSubtype: string
	): Promise<boolean> {
		try {
			const config = await this.getVCConfiguration(docType, docSubtype);
			return config.issue_vc;
		} catch {
			return false;
		}
	}
}
