import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

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
		console.log('=== VC Form Submission ===');
		console.log('Form Data:', formData);
		console.log('Uploaded File:', uploadedFile);
		console.log('Document Type:', docType);
		console.log('Document Subtype:', docSubtype);
		console.log('Document Name:', docName);
		console.log('=========================');

		// Return success for now - backend will handle VC creation
		return {
			success: true,
			message:
				'Form data logged. VC creation will be handled by backend.',
			formData,
		};
	}

	static async getVCById(vcId: string) {
		const token = localStorage.getItem('authToken');
		try {
			const response = await axios.get(`${apiBaseUrl}/vc/${vcId}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			return response.data.data;
		} catch (error) {
			console.error('Failed to fetch VC:', error);
			throw new Error('Failed to fetch verifiable credential.');
		}
	}
}
