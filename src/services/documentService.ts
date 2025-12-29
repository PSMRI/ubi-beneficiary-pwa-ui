import apiClient from '../config/apiClient';
import { DocumentUploadResponse } from '../types/document.types';

/**
 * Document Service
 * 
 * Handles document upload and retrieval operations
 * Uses centralized apiClient with automatic token handling and error management
 */

export class DocumentService {
	/**
	 * Upload a document to the server
	 * @param file - The file to upload
	 * @param docType - Type of document (e.g., 'idProof', 'marksProof')
	 * @param docSubtype - Sub-type of document (e.g., 'aadhaar', 'marksheet')
	 * @param issuer - Optional issuer identifier
	 * @returns Upload response with document data
	 */
	static async uploadDocument(
		file: File,
		docType: string,
		docSubtype: string,
		issuer?: string
	): Promise<DocumentUploadResponse> {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('docType', docType);
		formData.append('docSubtype', docSubtype);
		if (issuer) {
			formData.append('issuer', issuer);
		}

		try {
			const response = await apiClient.post(
				'/users/upload-document',
				formData
				// Note: Content-Type is automatically handled by interceptor for FormData
			);

			return response.data.data;
		} catch (error: any) {
			console.error('Document upload failed:', error);

			// Extract error message from API response
			let errorMessage = 'Failed to upload document. Please try again.';

			if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else if (error.response?.data?.error) {
				errorMessage = error.response.data.error;
			} else if (error.message) {
				errorMessage = error.message;
			}

			throw new Error(errorMessage);
		}
	}

	/**
	 * Get document details by ID
	 * @param docId - Document ID
	 * @returns Document data
	 */
	static async getDocumentById(docId: string) {
		try {
			const response = await apiClient.get(
				`/users/documents/${docId}`
			);

			return response.data.data;
		} catch (error: any) {
			console.error('Failed to fetch document:', error);

			// Extract error message from API response
			let errorMessage = 'Failed to fetch document details.';

			if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else if (error.response?.data?.error) {
				errorMessage = error.response.data.error;
			} else if (error.message) {
				errorMessage = error.message;
			}

			throw new Error(errorMessage);
		}
	}
}
