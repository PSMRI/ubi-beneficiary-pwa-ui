import { AxiosError } from 'axios';
import apiClient from '../../config/apiClient';
import { generateUUID } from '../../utils/jsHelper/helper';

/**
 * Benefits Service
 * 
 * All API calls related to benefits search, application, and management
 * Uses centralized apiClient with automatic token handling and error management
 */

// =============================================
// Constants
// =============================================

const bap_id = import.meta.env.VITE_API_BASE_ID;
const bap_uri = import.meta.env.VITE_BAP_URL;
const DOMAIN_FINANCIAL_SUPPORT = 'ubi:financial-support';

// =============================================
// Type Definitions
// =============================================

interface GetOneParams {
	id: string | undefined;
	bpp_id: string | undefined;
}

interface ApplyApplicationParams {
	id: string | undefined;
	context: {
		bpp_id?: string;
		bap_uri?: string;
	};
}

interface ConfirmApplicationParams {
	item_id: string | undefined;
	rawContext: any;
}

interface CreateApplicationParams {
	user_id?: string;
	benefit_id?: string;
	benefit_provider_id?: string;
	benefit_provider_uri?: string;
	bpp_application_id?: string;
	application_name?: string;
	status: string;
	application_data: unknown;
	order_id?: string;
	transaction_id?: string;
}

interface Filters {
	user_id: string | undefined;
	benefit_id: string | undefined;
}

type SubmitContext = {
	bap_id?: string;
	bap_uri?: string;
	bpp_id?: string;
	bpp_uri?: string;
	transaction_id?: string;
	message_id?: string;
	location?: unknown;
	[key: string]: unknown;
};

type SubmitFormData = {
	benefitId: string;
	providerId?: string;
	isResubmission?: boolean;
	applicationId?: string;
	[key: string]: unknown;
};

type OrderItem = {
	id: string;
	applicationId?: string;
};

// =============================================
// Helper Functions
// =============================================

/**
 * Generic error handler
 */
function handleError(error: any): never {
	throw error.response?.data || error || new Error('Network Error');
}

// =============================================
// Benefit Search & Discovery APIs
// =============================================

/**
 * Search for benefits with filters
 * @param userData - Search filters and pagination
 * @param sendToken - Whether to send auth token (default: false for public search)
 * @returns Search results
 */
export const getAll = async (
	userData: {
		filters?: {
			annualIncome: string;
			caste?: string;
			gender?: string;
		};
		search: string;
		page: number;
		limit: number;
		strictCheck?: boolean;
	},
	sendToken: boolean = false
) => {
	try {
		const finalPayload = {
			...userData,
			strictCheck: userData.strictCheck ?? false,
		};

		// Note: For public searches (sendToken=false), the interceptor will skip auth
		// For authenticated searches, token will be added automatically
		const response = await apiClient.post(
			'/content/search',
			finalPayload
		);

		return response.data;
	} catch (error) {
		handleError(error);
	}
};

/**
 * Get detailed information about a specific benefit
 * @param id - Benefit ID
 * @param bpp_id - Benefit Provider ID
 * @returns Benefit details
 */
export const getOne = async ({ id, bpp_id }: GetOneParams) => {
	const loginData = {
		context: {
			domain: DOMAIN_FINANCIAL_SUPPORT,
			action: 'select',
			timestamp: '2023-08-02T07:21:58.448Z',
			ttl: 'PT10M',
			version: '1.1.0',
			bap_id,
			bap_uri,
			bpp_id,
			transaction_id: generateUUID(),
			message_id: generateUUID(),
			location: {
				country: {
					name: 'India',
					code: 'IND',
				},
				city: {
					name: 'Bangalore',
					code: 'std:080',
				},
			},
		},
		message: {
			order: {
				items: [
					{
						id: id,
					},
				],
				provider: {
					id: bpp_id,
				},
			},
		},
	};

	try {
		const response = await apiClient.post('/select', loginData);
		return response || {};
	} catch (error) {
		handleError(error);
	}
};

/**
 * Check eligibility of user for a specific benefit
 * @param id - Benefit ID
 * @returns Eligibility result
 */
export const checkEligibilityOfUser = async (id: string) => {
	try {
		if (!id) {
			throw new Error('Benefit id is required for eligibility check');
		}

		const response = await apiClient.get(
			`/content/eligibility-check/${id}`
		);

		return response.data;
	} catch (error: unknown) {
		handleError(error as AxiosError);
	}
};

// =============================================
// Application APIs
// =============================================

/**
 * Apply for a benefit (init application)
 * @param id - Benefit ID
 * @param context - Application context
 * @returns Application response
 */
export const applyApplication = async ({
	id,
	context,
}: ApplyApplicationParams) => {
	const loginData = {
		context: {
			...context,
			action: 'init',
		},
		message: {
			order: {
				items: [
					{
						id,
					},
				],
			},
		},
	};

	const response = await apiClient.post('/init', loginData);
	return response || {};
};

/**
 * Confirm application submission
 * @param item_id - Item/Benefit ID
 * @param rawContext - Raw context from previous step
 * @returns Confirmation response
 */
export const confirmApplication = async ({
	item_id,
	rawContext,
}: ConfirmApplicationParams) => {
	const data = {
		context: {
			domain: DOMAIN_FINANCIAL_SUPPORT,
			location: {
				country: {
					name: 'India',
					code: 'IND',
				},
				city: {
					name: 'Bangalore',
					code: 'std:080',
				},
			},
			action: 'confirm',
			timestamp: rawContext.timestamp,
			ttl: rawContext.ttl,
			version: rawContext.version,
			bap_id: rawContext.bap_id,
			bap_uri: rawContext.bap_uri,
			bpp_id: rawContext.bpp_id,
			bpp_uri: rawContext.bpp_uri,
			message_id: generateUUID(),
			transaction_id: rawContext.transaction_id,
		},
		message: {
			order: {
				provider: {
					id: '',
				},
				items: [
					{
						id: `${item_id}`,
					},
				],
				billing: {
					name: 'Manjunath',
					organization: {},
					address: 'No 27, XYZ Lane, etc',
					phone: '+91-9999999999',
				},
				fulfillments: [
					{
						customer: {},
						tags: [
							{
								descriptor: {},
								value: 'PNB',
							},
						],
					},
				],
				payment: [
					{
						params: {},
					},
				],
			},
		},
	};

	try {
		const response = await apiClient.post('/confirm', data);
		return response || {};
	} catch (error) {
		handleError(error);
	}
};

/**
 * Create a new application record
 * @param data - Application data
 * @returns Created application
 */
export const createApplication = async (data: CreateApplicationParams) => {
	try {
		console.log('CreateApplication API call with data:', data);

		const response = await apiClient.post(
			'/users/user_application',
			data
		);

		console.log('CreateApplication API response:', response.data);
		return response.data;
	} catch (error) {
		handleError(error);
	}
};

/**
 * Get applications with filters
 * @param filters - Filter criteria
 * @returns List of applications
 */
export const getApplication = async (filters: Filters) => {
	try {
		const response = await apiClient.post(
			'/users/user_applications_list',
			{ filters }
		);

		return response.data;
	} catch (error) {
		handleError(error as AxiosError);
	}
};

/**
 * Submit benefit application form (supports new submissions and resubmissions)
 * @param applicationData - Form data including benefitId, providerId, etc.
 * @param context - Application context
 * @returns Submission response
 */
export const submitForm = async (
	applicationData: SubmitFormData,
	context: SubmitContext
) => {
	const { benefitId, providerId, isResubmission, applicationId, ...rest } =
		applicationData as {
			benefitId: string;
			providerId?: string;
			isResubmission?: boolean;
			applicationId?: string;
			[key: string]: unknown;
		};

	// Determine whether to use create or update API based on resubmission flag
	const resolvedProviderId = providerId ?? context?.bpp_id;
	if (!resolvedProviderId) {
		throw new Error(
			'Missing providerId (pass applicationData.providerId or context.bpp_id)'
		);
	}

	// Use update API for resubmission, init API for new
	let action = 'init';
	let endpoint = 'init';
	let items: OrderItem[] = [{ id: benefitId }];

	// If resubmission, use update API and include applicationId if available
	if (isResubmission) {
		action = 'update';
		endpoint = 'update';
		if (applicationId) {
			items = [{ id: benefitId, applicationId }];
		}
	}

	const payload = {
		context: {
			...context,
			action,
			timestamp: new Date().toISOString(),
			ttl: 'PT10M',
			version: '1.1.0',
			bap_id: context?.bap_id || bap_id,
			bap_uri: context?.bap_uri || bap_uri,
			bpp_id: context?.bpp_id,
			bpp_uri: context?.bpp_uri,
			transaction_id: context?.transaction_id || generateUUID(),
			message_id: context?.message_id || generateUUID(),
			location: context?.location || {
				country: {
					name: 'India',
					code: 'IND',
				},
				city: {
					name: 'Bangalore',
					code: 'std:080',
				},
			},
		},
		message: {
			...(action === 'update' && { update_target: 'fulfillments' }),
			order: {
				provider: { id: resolvedProviderId },
				items,
				fulfillments: [
					{
						customer: { applicationData: rest },
					},
				],
			},
		},
	};

	try {
		const response = await apiClient.post(`/${endpoint}`, payload);
		return response?.data;
	} catch (error) {
		console.error(`Error in ${action}:`, error);
		handleError(error as AxiosError);
		throw error;
	}
};

// =============================================
// VC & Document APIs
// =============================================

/**
 * Fetch VC JSON from URL
 * @param url - URL to fetch VC from
 * @returns VC JSON data
 */
export const fetchVCJson = async (url: string) => {
	try {
		const response = await apiClient.post(
			'/users/fetch-vc-json',
			{ url }
		);

		return response.data;
	} catch (error: any) {
		throw error.response ? error.response.data : new Error('Network Error');
	}
};
