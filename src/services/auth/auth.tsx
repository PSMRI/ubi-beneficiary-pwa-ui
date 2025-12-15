import apiClient from '../../config/apiClient';

/**
 * Authentication Service
 * 
 * All API calls related to user authentication, registration, and user data
 * Uses centralized apiClient with automatic token handling and error management
 */

// =============================================
// Type Definitions
// =============================================

interface UserData {
	firstName?: string;
	lastName?: string;
	phoneNumber?: string;
}

interface MobileData {
	phoneNumber: string;
	otp: number;
	token: string;
}

// =============================================
// Authentication APIs
// =============================================

/**
 * Login user with credentials
 * @param loginData - Object containing login credentials (username/phoneNumber and password)
 * @returns User data with access and refresh tokens
 */
export const loginUser = async (loginData: object) => {
	try {
		const response = await apiClient.post('/auth/login', loginData);
		return response.data;
	} catch (error: any) {
		// Preserve the full error structure for proper error handling
		throw error;
	}
};

/**
 * Update user password
 * @param data - Object containing username, oldPassword, and newPassword
 * @returns Response data
 */
export const updatePassword = async (data: {
	username: string;
	oldPassword: string;
	newPassword: string;
}) => {
	try {
		const response = await apiClient.post('/auth/update-password', data);
		return response.data;
	} catch (error: any) {
		// Preserve the error structure with proper message
		const errorResponse = error?.response?.data || {};

		throw {
			statusCode: errorResponse.statusCode || error?.status || 500,
			message: errorResponse.message || error?.message || errorResponse.error || 'An error occurred',
			error: errorResponse.error,
			response: error?.response,
			...errorResponse
		};
	}
};


/**
 * Logout user and invalidate tokens
 * @returns Success response
 */
export const logoutUser = async () => {
	const accessToken = localStorage.getItem('authToken');
	const refreshToken = localStorage.getItem('refreshToken');

	if (!accessToken || !refreshToken) {
		throw new Error('No active session found');
	}

	const response = await apiClient.post('/auth/logout', {
		access_token: accessToken,
		refresh_token: refreshToken,
	});

	if (response) {
		localStorage.clear();
	}

	return response.data as { success: boolean; message: string };
};

/**
 * Set required action for a user (e.g., UPDATE_PASSWORD)
 * @param username - Username
 * @param actions - Array of required actions (default: ['UPDATE_PASSWORD'])
 * @returns Response data
 */
export const setUserRequiredAction = async (
	username: string,
	actions: string[] = ['UPDATE_PASSWORD']
) => {
	try {
		const response = await apiClient.post('/auth/set-required-action', {
			username,
			actions,
		});
		return response.data;
	} catch (error: unknown) {
		console.error('Error setting required action:', error);
		throw (
			(error as { response?: { data?: unknown } })?.response?.data || {
				message: 'Failed to set required action',
			}
		);
	}
};

// =============================================
// User Data APIs
// =============================================

/**
 * Get current logged-in user details
 * @returns User data
 */
export const getUser = async () => {
	const response = await apiClient.get('/users/get_one/?decryptData=true');
	return response.data;
};

/**
 * Get user consents
 * @returns User consents data
 */
export const getUserConsents = async () => {
	const response = await apiClient.get('/users/get_my_consents');
	return response.data;
};

/**
 * Send user consent
 * @param user_id - User ID
 * @param purpose - Purpose of consent (optional)
 * @param purpose_text - Purpose text (optional)
 * @returns Response data
 */
export const sendConsent = async (
	user_id: string | number,
	purpose?: string,
	purpose_text?: string
) => {
	const data = {
		user_id: user_id,
		purpose: purpose,
		purpose_text: purpose_text,
		accepted: true,
	};

	const response = await apiClient.post('/users/consent', data);
	return response.data;
};

// =============================================
// Document Configuration APIs
// =============================================

/**
 * Get list of available documents
 * @returns Documents list
 */
export const getDocumentsList = async () => {
	const response = await apiClient.get('/admin/config/vcConfiguration');
	return response.data;
};

// =============================================
// Application APIs
// =============================================

/**
 * Get list of user applications
 * @param searchText - Search query string
 * @param user_id - User ID
 * @returns Application list
 */
export const getApplicationList = async (
	searchText: string,
	user_id: string | number
) => {
	const requestBody =
		searchText !== ''
			? {
				filters: {
					user_id: user_id,
				},
				search: searchText,
			}
			: {
				filters: {
					user_id: user_id,
				},
			};

	const response = await apiClient.post(
		'/users/user_applications_list',
		requestBody
	);

	return response.data;
};

/**
 * Get application details by ID
 * @param applicationId - Application ID
 * @returns Application details
 */
export const getApplicationDetails = async (applicationId: string | number) => {
	const response = await apiClient.get(
		`/users/user_application/${applicationId}`
	);
	return response.data;
};

// =============================================
// OTP APIs (Public - No Auth Required)
// =============================================

/**
 * Send OTP to mobile number
 * @param mobileNumber - Mobile number
 * @returns OTP data
 */
export const sendOTP = async (mobileNumber: string) => {
	const payload = {
		phoneNumber: mobileNumber,
	};
	const response = await apiClient.post('/otp/send_otp', payload);
	return response?.data?.data;
};

/**
 * Verify OTP
 * @param payload - OTP verification data (phoneNumber, otp, token)
 * @returns Verification response
 */
export const verifyOTP = async (payload: MobileData) => {
	const response = await apiClient.post('/otp/verify_otp', payload);
	console.log(response);
	return response?.data;
};

// =============================================
// Registration APIs (Public - No Auth Required)
// =============================================

/**
 * Register user (legacy method)
 * @param userData - User registration data
 * @returns Registration response
 */
export const registerUser = async (userData: UserData) => {
	const response = await apiClient.post(
		'/auth/register_with_password',
		userData
	);
	return response?.data;
};

/**
 * Register user with password
 * @param userData - User registration data
 * @returns Registration response
 */
export const registerWithPassword = async (userData: any) => {
	try {
		const response = await apiClient.post(
			'/auth/register_with_password',
			userData
		);
		return response.data;
	} catch (error) {
		console.error(
			'Error during registration:',
			(error as any).response?.data?.message?.[0] || ''
		);
		throw (error as any).response;
	}
};

/**
 * Register user with document upload
 * @param file - Document file
 * @param docType - Document type
 * @param docSubType - Document sub-type
 * @param docName - Document name
 * @param importedFrom - Source of import
 * @returns Registration response
 */
export const registerWithDocument = async (
	file: File,
	docType: string,
	docSubType: string,
	docName: string,
	importedFrom: string
) => {
	const formData = new FormData();
	formData.append('docType', docType);
	formData.append('docSubType', docSubType);
	formData.append('docName', docName);
	formData.append('importedFrom', importedFrom);
	formData.append('file', file);

	try {
		const response = await apiClient.post(
			'/auth/register_with_document',
			formData
			// Content-Type header is auto-set for FormData
		);

		console.log(response.data, 'response');

		// Store credentials for prefilling login form if available
		if (
			response?.data?.data?.user?.userName &&
			response?.data?.data?.password
		) {
			sessionStorage.setItem(
				'prefill_username',
				response.data.data.user.userName
			);
			sessionStorage.setItem(
				'prefill_password',
				response.data?.data?.password
			);
		}

		return response.data;
	} catch (error: any) {
		// Always throw a normalized error
		throw {
			error: error?.response?.data?.error || error?.error || error?.message || 'Registration failed!',
			statusCode: error?.response?.data?.statusCode || error?.status || 500,
			full: error,
		};
	}
};
