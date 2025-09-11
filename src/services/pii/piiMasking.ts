import { fetchFields } from '../admin/admin';

/**
 * PII Masking Service
 * Handles identification and masking of Personally Identifiable Information (PII) fields
 */

// Normalize field keys across sources (API names, UI labels, etc.)
const normalizeFieldKey = (name: unknown): string => {
	if (name === null || name === undefined) {
		return '';
	}

	// Only convert strings and numbers to avoid '[object Object]'
	if (typeof name === 'string' || typeof name === 'number') {
		return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
	}

	// For objects or other types, return empty string
	return '';
};

// Simple singleton to manage encrypted field names
class PIIMaskingService {
	private readonly encryptedFields: Set<string> = new Set();
	private isLoaded = false;
	private isLoading = false;

	/**
	 * Load encrypted field definitions from the API
	 * Should be called once at application startup
	 */
	async loadEncryptedFields(): Promise<void> {
		if (this.isLoaded || this.isLoading) return;
		
		this.isLoading = true;
		try {
			const fields = await fetchFields('USERS', 'User');
			this.encryptedFields.clear();
			
			fields.forEach((field) => {
				const key = normalizeFieldKey(field.name);
				if (field.isEncrypted && key) {
					this.encryptedFields.add(key);
				}
			});
			
			this.isLoaded = true;
			console.log('PII fields loaded:', Array.from(this.encryptedFields));
		} catch (error) {
			console.error('Failed to load PII field definitions:', error);
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Check if a field should be masked based on its name
	 * @param fieldName - The field name to check
	 * @returns true if the field should be masked, false otherwise
	 */
	shouldMaskField(fieldName: string): boolean {
		const key = normalizeFieldKey(fieldName);
		if (!key) return false;
		// Only mask fields explicitly marked as encrypted in the API
		if (!this.isLoaded) {
			return false;
		}
		return this.encryptedFields.has(key);
	}

	/**
	 * Get all encrypted field names (for debugging purposes)
	 */
	getEncryptedFields(): Set<string> {
		return new Set(this.encryptedFields);
	}

	/**
	 * Check if PII data has been loaded
	 */
	isDataLoaded(): boolean {
		return this.isLoaded;
	}

	/**
	 * Mask a PII value based on field type
	 * @param fieldName - The name of the field
	 * @param value - The value to mask
	 * @returns Masked value string
	 */
	maskPIIValue(fieldName: string, value: string | number | null): string {
		if (value === null || value === undefined) return '-';
		const raw = String(value);
		if (!raw) return '-';

		const normalizedFieldName = normalizeFieldKey(fieldName);
		
		// Special handling for Aadhaar - format as XXXX-XXXX-1234
		if (normalizedFieldName === 'aadhaar' || normalizedFieldName === 'aadhar') {
			const onlyDigits = raw.replace(/\D/g, '');
			if (onlyDigits.length >= 4) {
				const last4 = onlyDigits.slice(-4);
				return `XXXX-XXXX-${last4}`;
			}
		}
		
		// For all other fields: show ****last4 pattern
		return this.maskKeepLastN(raw, 4);
	}

	/**
	 * Mask a string keeping only the last N alphanumeric characters visible
	 * @param value - The string to mask
	 * @param visibleCount - Number of characters to keep visible from the end
	 * @returns Masked string
	 */
	private maskKeepLastN(value: string, visibleCount = 4): string {
		if (!value) return '';
		let remainingVisible = visibleCount;
		const chars = Array.from(value);
		for (let i = chars.length - 1; i >= 0; i--) {
			const ch = chars[i];
			const isAlphaNum = /[A-Za-z0-9]/.test(ch);
			if (isAlphaNum) {
				if (remainingVisible > 0) {
					remainingVisible--;
				} else {
					chars[i] = '*';
				}
			}
		}
		return chars.join('');
	}
}

// Export singleton instance
export const piiMaskingService = new PIIMaskingService();

// Export convenience functions for easier usage
export const loadPIIFields = () => piiMaskingService.loadEncryptedFields();
export const shouldMaskField = (fieldName: string) => piiMaskingService.shouldMaskField(fieldName);
export const maskPIIValue = (fieldName: string, value: string | number | null) => 
	piiMaskingService.maskPIIValue(fieldName, value); 