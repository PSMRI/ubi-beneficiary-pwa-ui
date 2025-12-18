import apiClient from '../../config/apiClient';

/**
 * User Service
 * 
 * All API calls related to user management, document uploads, and profile updates
 * Uses centralized apiClient with automatic token handling and error management
 */

// =============================================
// Document Upload APIs
// =============================================

/**
 * Uploads a document file to the server
 * @param {File} file - The file to upload
 * @param {string} docType - Type of document (e.g., 'marksProof')
 * @param {string} docSubType - Sub-type of document (e.g., 'marksheet')
 * @param {string} docName - Name of the document (e.g., 'Marksheet')
 * @param {string} importedFrom - Source of upload (default: 'Manual Upload')
 * @param {string} issuer - Optional issuer identifier
 * @returns {Promise} - Promise representing the API response
 */
export const uploadDocument = async (
	file: File,
	docType: string,
	docSubType: string,
	docName: string,
	importedFrom: string = 'Manual Upload',
	issuer?: string
) => {
	try {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('docType', docType);
		formData.append('docSubType', docSubType);
		formData.append('docName', docName);
		formData.append('importedFrom', importedFrom);
		if (issuer) {
			formData.append('issuer', issuer);
		}

		const response = await apiClient.post(
			'/users/upload-document',
			formData
			// Note: Content-Type is automatically handled by interceptor for FormData
		);

		console.log('Document uploaded successfully:', response.data);
		return response.data;
	} catch (error: any) {
		console.error(
			'Error uploading document:',
			error.response?.data || error.message
		);

		// Extract error message from API response
		let errorMessage = 'Failed to upload document. Please try again.';

		if (error.response?.data?.message) {
			errorMessage = error.response.data.message;
		} else if (error.response?.data?.error) {
			errorMessage = error.response.data.error;
		} else if (error.message) {
			errorMessage = error.message;
		}

		// Throw error with the extracted message
		const enhancedError = new Error(errorMessage);
		(enhancedError as any).response = error.response;
		throw enhancedError;
	}
};

/**
 * Upload user documents (batch upload)
 * @param documents - Documents data to upload
 * @returns Response data
 */
export const uploadUserDocuments = async (documents: any) => {
	try {
		const response = await apiClient.post(
			'/users/wallet/user_docs',
			documents
		);

		return response.data;
	} catch (error: any) {
		console.error(
			'Error uploading documents:',
			error.response || error.message
		);

		// Extract error message from API response
		let errorMessage = 'Failed to upload documents. Please try again.';

		if (error.response?.data?.message) {
			errorMessage = error.response.data.message;
		} else if (error.response?.data?.error) {
			errorMessage = error.response.data.error;
		} else if (error.message) {
			errorMessage = error.message;
		}

		throw new Error(errorMessage);
	}
};

/**
 * Upload document via QR code scan
 * Uploads document directly using QR content without requiring file upload
 * @param {Object} payload - QR document upload payload
 * @param {string} payload.docType - Type of document (e.g., 'casteProof')
 * @param {string} payload.docSubType - Sub-type of document (e.g., 'casteCertificate')
 * @param {string} payload.docName - Name of the document (e.g., 'Caste Certificate')
 * @param {string} payload.importedFrom - Source of upload (default: 'QR Code')
 * @param {string} payload.qrContent - The QR code content extracted from scan
 * @param {string} [payload.issuer] - Optional issuer identifier
 * @returns {Promise} - Promise representing the API response
 */
export const uploadDocumentQR = async (payload: {
	docType: string;
	docSubType: string;
	docName: string;
	importedFrom: string;
	qrContent: string;
	issuer?: string;
}) => {
	try {
		const formData = new FormData();
		formData.append('docType', payload.docType);
		formData.append('docSubType', payload.docSubType);
		formData.append('docName', payload.docName);
		formData.append('importedFrom', payload.importedFrom);
		formData.append('qrContent', payload.qrContent);
		if (payload.issuer) {
			formData.append('issuer', payload.issuer);
		}

		const response = await apiClient.post(
			'/users/upload-document-qr',
			formData
			// Note: Content-Type is automatically handled by interceptor for FormData
		);

		console.log('QR document uploaded successfully:', response.data);
		return response.data;
	} catch (error: any) {
		console.error(
			'Error uploading QR document:',
			error.response?.data || error.message
		);

		// Extract error message from API response
		let errorMessage = 'Failed to upload document via QR. Please try again.';

		if (error.response?.data?.message) {
			errorMessage = error.response.data.message;
		} else if (error.response?.data?.error) {
			errorMessage = error.response.data.error;
		} else if (error.message) {
			errorMessage = error.message;
		}

		// Throw error with the extracted message and preserve response
		const enhancedError = new Error(errorMessage);
		(enhancedError as any).response = error.response;
		throw enhancedError;
	}
};

/**
 * Delete a document by ID
 * @param id - Document ID
 * @returns Response data
 */
export const deleteDocument = async (id: string | number) => {
	try {
		const response = await apiClient.delete(`/users/delete-doc/${id}`);
		return response.data;
	} catch (error: any) {
		console.error(
			'Error in Deleting Document:',
			error.response?.data || error.message
		);

		// Extract error message from API response
		let errorMessage = 'Failed to delete document. Please try again.';

		if (error.response?.data?.message) {
			errorMessage = error.response.data.message;
		} else if (error.response?.data?.error) {
			errorMessage = error.response.data.error;
		} else if (error.message) {
			errorMessage = error.message;
		}

		throw new Error(errorMessage);
	}
};

// =============================================
// User Update APIs
// =============================================

/**
 * Updates user details via API call.
 * @param {string} userId - The ID of the user to update.
 * @param {Object} data - The payload containing user details.
 * @returns {Promise} - Promise representing the API response.
 */
export const updateUserDetails = async (
	userId: string | number, 
	data: any
) => {
	console.log('UserID', userId, data);
	try {
		const response = await apiClient.put(
			`/users/update/${userId}`,
			data
		);

		console.log('User updated successfully:', response.data);
		return response.data;
	} catch (error: any) {
		console.error(
			'Error updating user:',
			error.response?.data || error.message
		);

		// Extract error message from API response
		let errorMessage = 'Failed to update user details. Please try again.';

		if (error.response?.data?.message) {
			errorMessage = error.response.data.message;
		} else if (error.response?.data?.error) {
			errorMessage = error.response.data.error;
		} else if (error.message) {
			errorMessage = error.message;
		}

		throw new Error(errorMessage);
	}
};

/**
 * Updates user profile with phone number, whose phone number, and profile picture
 * @param {string} phoneNumber - The phone number to update
 * @param {string} whosePhoneNumber - Whose phone number is this (e.g., 'father', 'self', etc.)
 * @param {File} picture - The profile picture file to upload
 * @returns {Promise} - Promise representing the API response
 */
export const updateUserProfile = async (
	phoneNumber: string,
	whosePhoneNumber: string,
	picture?: File | null
) => {
	try {
		const formData = new FormData();
		formData.append('phoneNumber', phoneNumber);
		formData.append('whosePhoneNumber', whosePhoneNumber);
		if (picture) {
			formData.append('picture', picture);
		}

		const response = await apiClient.patch(
			'/users/update',
			formData
			// Note: Content-Type is automatically handled by interceptor for FormData
		);

		console.log('User profile updated successfully:', response.data);
		return response.data;
	} catch (error: any) {
		console.error(
			'Error updating user profile:',
			error.response?.data || error.message
		);
		throw error;
	}
};

// =============================================
// User Fields APIs
// =============================================

/**
 * Fetches fields from the API based on context and filter criteria.
 * @param {string} context - The context type for filtering fields (e.g., 'USERS').
 * @param {string} filterDataFields - Comma-separated list of fields to include in response (e.g., 'name,label').
 * @returns {Promise<Array>} - Promise representing the API response with filtered fields.
 */
export const getUserFields = async (
	context = 'USERS',
	filterDataFields = 'name,label'
) => {
	try {
		const response = await apiClient.get(
			`/fields?context=${context}&filterDataFields=${filterDataFields}`
		);

		return response.data;
	} catch (error: any) {
		console.error(
			'Error fetching user fields:',
			error.response?.data || error.message
		);

		// Extract error message from API response
		let errorMessage = 'Failed to fetch user fields. Please try again.';

		if (error.response?.data?.message) {
			errorMessage = error.response.data.message;
		} else if (error.response?.data?.error) {
			errorMessage = error.response.data.error;
		} else if (error.message) {
			errorMessage = error.message;
		}

		throw new Error(errorMessage);
	}
};

/**
 * Fetches user profile fields from the API.
 * @returns {Promise<Array>} - Promise representing the API response.
 */
export const getUserProfileFields = async () => {
	try {
		const response = await apiClient.get(
			'/fields?context=USERS&contextType=User'
		);

		return response.data;
	} catch (error: any) {
		console.error(
			'Error fetching user profile fields:',
			error.response?.data || error.message
		);
		throw error;
	}
};
