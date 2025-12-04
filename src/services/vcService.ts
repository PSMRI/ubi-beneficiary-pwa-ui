import apiClient from '../config/apiClient';

/**
 * VC (Verifiable Credential) Service
 * 
 * Handles VC creation and retrieval operations
 * Uses centralized apiClient with automatic token handling and error management
 */

export class VCService {
	/**
	 * Handle VC form submission (currently just logs data)
	 * Backend will handle actual VC creation
	 *
	 * @param formData - Form data from the VC form
	 * @param uploadedFile - The uploaded document file
	 * @param docType - Document type
	 * @param docSubtype - Document subtype
	 * @param docName - Document name
	 */
	static async createVC(
		formData: Record<string, any>,
		uploadedFile?: File,
		docType?: string,
		docSubtype?: string,
		docName?: string
	) {
		// Return success for now - backend will handle VC creation
		return {
			success: true,
			message:
				'Form data logged. VC creation will be handled by backend.',
			formData,
		};
	}

	/**
	 * Get VC (Verifiable Credential) by ID
	 * @param vcId - VC ID
	 * @returns VC data
	 */
	static async getVCById(vcId: string) {
		try {
			const response = await apiClient.get(`/vc/${vcId}`);
			return response.data.data;
		} catch (error) {
			console.error('Failed to fetch VC:', error);
			throw new Error('Failed to fetch verifiable credential.');
		}
	}
}
