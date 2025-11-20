import axios from 'axios';
import { DocumentUploadResponse } from '../types/document.types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export class DocumentService {
	static async uploadDocument(
		file: File,
		docType: string,
		docSubtype: string,
		issuer?: string
	): Promise<DocumentUploadResponse> {
		const token = localStorage.getItem('authToken');
		const formData = new FormData();
		formData.append('file', file);
		formData.append('docType', docType);
		formData.append('docSubtype', docSubtype);
		if (issuer) {
			formData.append('issuer', issuer);
		}

		try {
			const response = await axios.post(
				`${apiBaseUrl}/users/upload-document`,
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
						Authorization: `Bearer ${token}`,
					},
				}
			);

			return response.data.data;
		} catch (error: any) {
			console.error('Document upload failed:', error);

			// Extract error message from API response
			let errorMessage = 'Failed to upload document. Please try again.';

			if (error.response?.data?.message) {
				// API returned a specific error message
				errorMessage = error.response.data.message;
			} else if (error.response?.data?.error) {
				// Alternative error field
				errorMessage = error.response.data.error;
			} else if (error.message) {
				// Use axios error message
				errorMessage = error.message;
			}

			throw new Error(errorMessage);
		}
	}

	static async getDocumentById(docId: string) {
		const token = localStorage.getItem('authToken');
		try {
			const response = await axios.get(
				`${apiBaseUrl}/users/documents/${docId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
			return response.data.data;
		} catch (error: any) {
			console.error('Failed to fetch document:', error);

			// Extract error message from API response
			let errorMessage = 'Failed to fetch document details.';

			if (error.response?.data?.message) {
				// API returned a specific error message
				errorMessage = error.response.data.message;
			} else if (error.response?.data?.error) {
				// Alternative error field
				errorMessage = error.response.data.error;
			} else if (error.message) {
				// Use axios error message
				errorMessage = error.message;
			}

			throw new Error(errorMessage);
		}
	}
}
