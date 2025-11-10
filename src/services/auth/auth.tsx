import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
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
function handleClientError(error): never {
	const errorMessage =
		error.response.data?.message ||
		error.response.data?.error ||
		`Client Error: ${error.message}`;

	switch (error.response.status) {
		case 400:
			throw new Error(`Bad Request: ${errorMessage}`, { cause: error });
		case 401:
			localStorage.removeItem('authToken');
			localStorage.removeItem('refreshToken');
			window.location.href = '/';
			throw new Error(`Unauthorized: ${errorMessage}`, { cause: error });
		case 403:
			throw new Error(`Forbidden: ${errorMessage}`, { cause: error });
		case 404:
			throw new Error(`Not Found: ${errorMessage}`, { cause: error });
		default:
			throw new Error(
				`Client Error (${error.response.status}): ${errorMessage}`,
				{
					cause: error,
				}
			);
	}
}

function handleServerError(error): never {
	const errorMessage =
		error.response.data?.message ||
		`Server Error: ${error.response.statusText}`;

	switch (error.response.status) {
		case 500:
			throw new Error(`Internal Server Error: ${errorMessage}`, {
				cause: error,
			});
		case 502:
			throw new Error(`Bad Gateway: ${errorMessage}`, { cause: error });
		case 503:
			throw new Error(`Service Unavailable: ${errorMessage}`, {
				cause: error,
			});
		case 504:
			throw new Error(`Gateway Timeout: ${errorMessage}`, {
				cause: error,
			});
		default:
			throw new Error(
				`Server Error (${error.response.status}): ${errorMessage}`,
				{
					cause: error,
				}
			);
	}
}

function handleError(error: unknown): never {
	if (axios.isAxiosError(error)) {
		if (error.response) {
			if (error.response.status >= 400 && error.response.status < 500) {
				handleClientError(error);
			} else if (
				error.response.status >= 500 &&
				error.response.status < 600
			) {
				handleServerError(error);
			}
		} else if (error.request) {
			throw new Error('Network Error - No response received', {
				cause: error,
			});
		}
	}

	// Fallback for non-Axios errors or unexpected error types
	throw error instanceof Error
		? error
		: new Error('An unexpected error occurred', { cause: error });
}

export const loginUser = async (loginData: object) => {
	try {
		const response = await axios.post(
			`${apiBaseUrl}/auth/login`,
			loginData,
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);

		return response.data;
	} catch (error) {
		if (error.response) {
			// Re-throw the whole Axios error so frontend can inspect status and data
			throw error;
		}

		// ❌ If no server response (network failure, timeout, etc.)
		throw new Error('Network error, please try again later.');
	}
};

export const updatePassword = async (data: { username: string; oldPassword: string; newPassword: string }) => {
	try {
		const response = await axios.post(`${apiBaseUrl}/auth/update-password`, data, {
			headers: { 'Content-Type': 'application/json' },
		});
		return response.data;
	} catch (error) {
		if (error.response) throw error.response.data;
		throw new Error('Network error');
	}
};

export const logoutUser = async () => {
	const accessToken = localStorage.getItem('authToken');
	const refreshToken = localStorage.getItem('refreshToken');

	if (!accessToken || !refreshToken) {
		throw new Error('No active session found');
	}
	try {
		const response = await axios.post(
			`${apiBaseUrl}/auth/logout`,
			{
				access_token: accessToken,
				refresh_token: refreshToken,
			},
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
		if (response) {
			localStorage.clear();
		}

		return response.data as { success: boolean; message: string };
	} catch (error) {
		handleError(error);
	}
};

export const getUser = async () => {
	const token = localStorage.getItem('authToken');
	try {
		const response = await axios.get(
			`${apiBaseUrl}/users/get_one/?decryptData=true`,
			{
				headers: {
					Accept: 'application/json', // 'application/json' is more specific and commonly used for APIs
					Authorization: `Bearer ${token}`,
				},
			}
		);

		return response.data;
	} catch (error) {
		handleError(error);
	}
};
export const getUserConsents = async () => {
	try {
		const token = localStorage.getItem('authToken');
		const response = await axios.get(
			`${apiBaseUrl}/users/get_my_consents`,
			{
				headers: {
					Accept: '*/*',
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			}
		);
		return response.data;
	} catch (error) {
		handleError(error);
	}
};
export const sendConsent = async (
	user_id: string | number,
	purpose?: string,
	purpose_text?: string
) => {
	const token = localStorage.getItem('authToken');
	const data = {
		user_id: user_id,
		purpose: purpose,
		purpose_text: purpose_text,
		accepted: true,
	};
	const headers = {
		Accept: '*/*',
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`,
	};

	try {
		const response = await axios.post(`${apiBaseUrl}/users/consent`, data, {
			headers,
		});
		return response.data;
	} catch (error) {
		handleError(error);
	}
};
export const getDocumentsList = async () => {
	try {
		const token = localStorage.getItem('authToken');
		const response = await axios.get(
			`${apiBaseUrl}/admin/config/vcConfiguration`,
			{
				headers: {
					Accept: '*/*',
					Authorization: `Bearer ${token}`,
				},
			}
		);

		// Return the documents list data
		return response.data;
	} catch (error) {
		handleError(error);
	}
};
export const getApplicationList = async (
	searchText: string,
	user_id: string | number
) => {
	try {
		const requestBody =
			searchText !== ''
				? {
					filters: {
						user_id: user_id, // Correct: 3 tabs
					},
					search: searchText,
				}
				: {
					filters: {
						user_id: user_id, // Correct: 3 tabs
					},
				};

		// Send the dynamically created requestBody in the axios post request
		const token = localStorage.getItem('authToken');
		const response = await axios.post(
			`${apiBaseUrl}/users/user_applications_list`,
			requestBody, // Use the dynamically created requestBody
			{
				headers: {
					Accept: '*/*',
					Authorization: `Bearer ${token}`,
				},
			}
		);

		return response.data;
	} catch (error) {
		handleError(error);
	}
};

export const getApplicationDetails = async (applicationId: string | number) => {
	try {
		const token = localStorage.getItem('authToken');
		if (token) {
			const response = await axios.get(
				`${apiBaseUrl}/users/user_application/${applicationId}`,
				{
					headers: {
						Accept: '*/*',
						Authorization: `Bearer ${token}`,
					},
				}
			);
			return response.data;
		} else {
			console.error('Token not found');
		}
	} catch (error) {
		handleError(error);
	}
};
export const sendOTP = async (mobileNumber: string) => {
	try {
		const payload = {
			phoneNumber: mobileNumber,
		};
		const response = await axios.post(
			`${apiBaseUrl}/otp/send_otp`,
			payload
		);
		return response?.data?.data;
	} catch (error) {
		handleError(error);
	}
};
export const verifyOTP = async (payload: MobileData) => {
	try {
		const response = await axios.post(
			`${apiBaseUrl}/otp/verify_otp`,
			payload
		);
		console.log(response);
		return response?.data;
	} catch (error) {
		handleError(error);
	}
};
export const registerUser = async (userData: UserData) => {
	try {
		const response = await axios.post(
			`${apiBaseUrl}/auth/register_with_password`,
			userData
		);

		return response?.data;
	} catch (error) {
		handleError(error);
	}
};
export const registerWithPassword = async (userData) => {
	try {
		const response = await axios.post(
			`${apiBaseUrl}/auth/register_with_password`,
			userData
		);

		return response.data; // Handle the response data
	} catch (error) {
		console.error(
			'Error during registration:',
			error.response?.data?.message?.[0] || ''
		);
		throw error.response;
	}
};
