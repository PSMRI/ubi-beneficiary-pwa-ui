import axios from 'axios';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

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
	const token = localStorage.getItem('authToken');

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
			// API returned a specific error message
			errorMessage = error.response.data.message;
		} else if (error.response?.data?.error) {
			// Alternative error field
			errorMessage = error.response.data.error;
		} else if (error.message) {
			// Use axios error message
			errorMessage = error.message;
		}

		// Throw error with the extracted message
		const enhancedError = new Error(errorMessage);
		(enhancedError as any).response = error.response; // Preserve original response for debugging
		throw enhancedError;
	}
};

export const uploadUserDocuments = async (documents) => {
	const token = localStorage.getItem('authToken');
	try {
		const response = await axios.post(
			`${apiBaseUrl}/users/wallet/user_docs`,
			documents,
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			}
		);

		// Return response data
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
 * Updates user details via API call.
 * @param {string} userId - The ID of the user to update.
 * @param {Object} data - The payload containing user details.
 * @param {string} token - The authorization token.
 * @returns {Promise} - Promise representing the API response.
 */
export const updateUserDetails = async (userId, data) => {
	const token = localStorage.getItem('authToken');
	console.log('UserID', userId, data);
	try {
		const response = await axios.put(
			`${apiBaseUrl}/users/update/${userId}`,
			data,
			{
				headers: {
					Accept: '*/*',
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			}
		);

		console.log('User updated successfully:', response.data);
		return response.data; // Return response for further handling
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

export const deleteDocument = async (id) => {
	const token = localStorage.getItem('authToken');

	try {
		const url = `${apiBaseUrl}/users/delete-doc/${id}`;
		const headers = {
			Authorization: `Bearer ${token}`,
		};

		const response = await axios.delete(url, { headers });

		return response.data;
	} catch (error: any) {
		console.error(
			'Error in Deleteing Document:',
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
	const token = localStorage.getItem('authToken');

	try {
		const response = await axios.get(
			`${apiBaseUrl}/fields?context=${context}&filterDataFields=${filterDataFields}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			}
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
