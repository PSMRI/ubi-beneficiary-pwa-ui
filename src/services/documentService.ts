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
		} catch (error) {
			console.error('Document upload failed:', error);
			throw new Error('Failed to upload document. Please try again.');
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
		} catch (error) {
			console.error('Failed to fetch document:', error);
			throw new Error('Failed to fetch document details.');
		}
	}
}
