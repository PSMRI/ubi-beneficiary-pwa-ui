import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// =============================================
// Dhiway API Configuration
// =============================================

const DHIWAY_BASE_URL = import.meta.env.VITE_DHIWAY_API_URL;
const DHIWAY_TOKEN = import.meta.env.VITE_DHIWAY_TOKEN;

/**
 * Extract error message from Dhiway API error response
 */
const extractErrorMessage = (error: any): string => {
	if (error.response?.data?.message) {
		return error.response.data.message;
	}

	if (error.response?.data?.error) {
		return error.response.data.error;
	}

	if (error.response?.statusText) {
		return error.response.statusText;
	}

	return error.message || 'An unexpected error occurred';
};

// =============================================
// Dhiway Axios Instance Creation
// =============================================

/**
 * Create a configured axios instance for Dhiway API
 * This is separate from the main API client because:
 * - Different base URL
 * - Different authentication (static token from env)
 * - External third-party API
 */
const createDhiwayClient = (): AxiosInstance => {
	const instance = axios.create({
		baseURL: DHIWAY_BASE_URL,
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
	});

	// =============================================
	// REQUEST INTERCEPTOR
	// =============================================
	instance.interceptors.request.use(
		(config: InternalAxiosRequestConfig) => {
			// Add static Dhiway token from environment
			if (DHIWAY_TOKEN) {
				config.headers.Authorization = `Bearer ${DHIWAY_TOKEN}`;
			}

			return config;
		},
		(error: AxiosError) => {
			return Promise.reject(error);
		}
	);

	// =============================================
	// RESPONSE INTERCEPTOR
	// =============================================
	instance.interceptors.response.use(
		(response: AxiosResponse) => {
			return response;
		},
		(error: AxiosError) => {
			// Handle errors
			if (error.response) {
				const status = error.response.status;
				const enhancedError = new Error(`Dhiway API Error ${status}: ` + extractErrorMessage(error));
				(enhancedError as any).response = error.response;
				(enhancedError as any).status = status;
				return Promise.reject(enhancedError);
			}

			// Network error
			if (error.request) {
				const networkError = new Error('Network Error - Could not reach Dhiway API. Please check your connection.');
				(networkError as any).isNetworkError = true;
				return Promise.reject(networkError);
			}

			return Promise.reject(error);
		}
	);

	return instance;
};

// =============================================
// Export Configured Instance
// =============================================

/**
 * Configured axios instance for Dhiway API calls
 * - Uses VITE_DHIWAY_API_URL as base URL
 * - Automatically adds Dhiway token from VITE_DHIWAY_TOKEN
 * - Separate from main API client
 */
const dhiwayClient = createDhiwayClient();

export default dhiwayClient;



