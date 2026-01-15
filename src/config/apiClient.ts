import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// =============================================
// Configuration Constants
// =============================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


/**
 * List of endpoints that should NOT include authentication token
 * These are public endpoints accessible without login
 */
const PUBLIC_ENDPOINTS = [
    '/auth/login',
    '/auth/register_with_password',
    '/auth/register_with_document',
    '/auth/update-password',
    '/auth/set-required-action',
    '/otp/send_otp',
    '/otp/verify_otp',
    '/content/search', // Can be public or authenticated based on sendToken flag
];

/**
 * Language code mapping from i18next codes to Accept-Language header values
 */
const LANGUAGE_CODE_MAP: Record<string, string> = {
    'en': 'en',
    'hi': 'hi'
};

// =============================================
// Helper Functions
// =============================================

/**
 * Check if the request URL is a public endpoint
 */
const isPublicEndpoint = (url: string | undefined): boolean => {
    if (!url) return false;
    return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

/**
 * Get language preference from localStorage and map to Accept-Language format
 * Priority: i18nextLng > language > browser navigator.language > 'en-US'
 */
const getAcceptLanguage = (): string => {
    try {
        // Try to get from i18nextLng (primary source)
        let language = localStorage.getItem('i18nextLng');

        // Fallback to 'language' key
        if (!language || language.trim() === '') {
            language = localStorage.getItem('language');
        }

        // Fallback to browser language
        if (!language || language.trim() === '') {
            language = navigator.language || 'en';
        }

        // Clean the language code (remove any whitespace)
        language = language.trim();

        // Map to Accept-Language format
        const mappedLanguage = LANGUAGE_CODE_MAP[language];
        if (mappedLanguage) {
            return mappedLanguage;
        }

        // If no mapping found, try to extract base language (e.g., 'en-GB' -> 'en')
        const baseLanguage = language.split('-')[0];
        return LANGUAGE_CODE_MAP[baseLanguage] || 'en-US';
    } catch (error) {
        console.warn('Error reading language preference:', error);
        return 'en-US';
    }
};

/**
 * Extract error message from various error response formats
 */
const extractErrorMessage = (error: any): string => {
    // Check for array of error messages (NestJS validation errors)
    if (error.response?.data?.message && Array.isArray(error.response.data.message)) {
        return error.response.data.message.join(', ');
    }

    // Check for single error message string
    if (error.response?.data?.message && typeof error.response.data.message === 'string') {
        return error.response.data.message;
    }

    // Check for errors array (alternative format)
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        return error.response.data.errors.map((err: any) => err.message || err).join(', ');
    }

    // Check for error description field
    if (error.response?.data?.error_description) {
        return error.response.data.error_description;
    }

    // Check for error field (fallback - usually just error type like "Bad Request")
    if (error.response?.data?.error && typeof error.response.data.error === 'string') {
        return error.response.data.error;
    }

    // Fallback to statusText
    if (error.response?.statusText) {
        return error.response.statusText;
    }

    // Generic fallback
    return error.message || 'An unexpected error occurred';
};

// =============================================
// Axios Instance Creation
// =============================================

/**
 * Create a configured axios instance for the main API
 */
const createApiClient = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: API_BASE_URL,
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
            // 1. Add Accept-Language header (always, for all requests)
            const acceptLanguage = getAcceptLanguage();
            config.headers['Accept-Language'] = acceptLanguage;

            // 2. Add Authorization token (skip for public endpoints)
            const isPublic = isPublicEndpoint(config.url);
            if (!isPublic) {
                const token = localStorage.getItem('authToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }

            // 3. Handle FormData - let browser set Content-Type automatically
            // This is important for multipart/form-data with proper boundaries
            if (config.data instanceof FormData) {
                delete config.headers['Content-Type'];
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

            // Return the full response (let services handle data extraction)
            return response;
        },
        async (error: AxiosError) => {
            // Handle different error scenarios
            if (error.response) {
                const status = error.response.status;

                // =============================================
                // 401 Unauthorized - Token expired or invalid
                // =============================================
                if (status === 401) {
                    // Check if this is a public endpoint (login, register, update-password)
                    // These endpoints can legitimately return 401 (wrong credentials, wrong old password)
                    // and should be handled by the component, not the interceptor
                    const isPublic = isPublicEndpoint(error.config?.url);

                    if (!isPublic) {
                        // Only clear tokens and redirect for protected endpoints
                        // This means the user's session has expired
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('refreshToken');

                        // Redirect to login page
                        // Use window.location for hard redirect to clear state
                        if (window.location.pathname !== '/') {
                            window.location.href = '/';
                        }
                    }

                    // Create enhanced error (for both public and protected endpoints)
                    const enhancedError = new Error('Unauthorized: ' + extractErrorMessage(error));
                    (enhancedError as any).response = error.response;
                    (enhancedError as any).status = status;
                    return Promise.reject(enhancedError);
                }

                // =============================================
                // 403 Forbidden - Insufficient permissions
                // =============================================
                if (status === 403) {
                    const enhancedError = new Error('Forbidden: ' + extractErrorMessage(error));
                    (enhancedError as any).response = error.response;
                    (enhancedError as any).status = status;
                    return Promise.reject(enhancedError);
                }

                // =============================================
                // 404 Not Found
                // =============================================
                if (status === 404) {
                    const enhancedError = new Error('Not Found: ' + extractErrorMessage(error));
                    (enhancedError as any).response = error.response;
                    (enhancedError as any).status = status;
                    return Promise.reject(enhancedError);
                }

                // =============================================
                // 400 Bad Request
                // =============================================
                if (status === 400) {
                    const enhancedError = new Error('Bad Request: ' + extractErrorMessage(error));
                    (enhancedError as any).response = error.response;
                    (enhancedError as any).status = status;
                    return Promise.reject(enhancedError);
                }

                // =============================================
                // 500+ Server Errors
                // =============================================
                if (status >= 500) {
                    let errorMessage = 'Server Error: ';
                    switch (status) {
                        case 500:
                            errorMessage += 'Internal Server Error - ' + extractErrorMessage(error);
                            break;
                        case 502:
                            errorMessage += 'Bad Gateway - ' + extractErrorMessage(error);
                            break;
                        case 503:
                            errorMessage += 'Service Unavailable - ' + extractErrorMessage(error);
                            break;
                        case 504:
                            errorMessage += 'Gateway Timeout - ' + extractErrorMessage(error);
                            break;
                        default:
                            errorMessage += extractErrorMessage(error);
                    }

                    const enhancedError = new Error(errorMessage);
                    (enhancedError as any).response = error.response;
                    (enhancedError as any).status = status;
                    return Promise.reject(enhancedError);
                }

                // =============================================
                // Other HTTP errors
                // =============================================
                const enhancedError = new Error(`HTTP Error ${status}: ` + extractErrorMessage(error));
                (enhancedError as any).response = error.response;
                (enhancedError as any).status = status;
                return Promise.reject(enhancedError);
            }

            // =============================================
            // Network Error (no response received)
            // =============================================
            if (error.request) {
                const networkError = new Error('Network Error - No response received from server. Please check your connection.');
                (networkError as any).isNetworkError = true;
                return Promise.reject(networkError);
            }

            // =============================================
            // Request Configuration Error
            // =============================================
            return Promise.reject(error);
        }
    );

    return instance;
};

// =============================================
// Export Configured Instance
// =============================================

/**
 * Configured axios instance for main API calls
 * - Automatically adds Authorization header from localStorage
 * - Automatically adds Accept-Language header
 * - Handles errors consistently (401, 403, 404, 500+)
 * - Redirects to login on 401 Unauthorized
 * - Supports FormData uploads
 * - Excludes public endpoints from auth
 */
const apiClient = createApiClient();

export default apiClient;

// =============================================
// TypeScript Type Exports
// =============================================

/**
 * Standard API error structure
 */
export interface ApiError {
    message: string;
    status?: number;
    response?: any;
    isNetworkError?: boolean;
}

/**
 * Standard API response wrapper (if needed)
 */
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success?: boolean;
}

