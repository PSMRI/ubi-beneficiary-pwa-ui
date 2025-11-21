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
	} catch (error) {
		console.error(
			'Error uploading document:',
			error.response?.data || error.message
		);
		throw error;
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
	} catch (error) {
		console.error(
			'Error uploading documents:',
			error.response || error.message
		);
		throw error; // Rethrow error to handle it in the calling code
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
	} catch (error) {
		console.error(
			'Error updating user:',
			error.response?.data || error.message
		);
		throw error; // Re-throw the error for the caller to handle
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
	const token = localStorage.getItem('authToken');
	try {
		const formData = new FormData();
		formData.append('phoneNumber', phoneNumber);
		formData.append('whosePhoneNumber', whosePhoneNumber);
		if (picture) {
			formData.append('picture', picture);
		}

		const response = await axios.patch(
			`${apiBaseUrl}/users/update`,
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
					Accept: 'application/json',
					Authorization: `Bearer ${token}`,
				},
			}
		);

		console.log('User profile updated successfully:', response.data);
		return response.data;
	} catch (error) {
		console.error(
			'Error updating user profile:',
			error.response?.data || error.message
		);
		throw error;
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
	} catch (error) {
		console.error(
			'Error in Deleteing Document:',
			error.response?.data || error.message
		);
		throw error;
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
	} catch (error) {
		console.error(
			'Error fetching user fields:',
			error.response?.data || error.message
		);
		throw error;
	}
};
