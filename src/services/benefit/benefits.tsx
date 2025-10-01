import axios, { AxiosError } from 'axios';
import { generateUUID } from '../../utils/jsHelper/helper';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const bap_id = import.meta.env.VITE_API_BASE_ID;
const bap_uri = import.meta.env.VITE_BAP_URL;
const provider_api_url = import.meta.env.VITE_PROVIDER_API_URL;
const DOMAIN_FINANCIAL_SUPPORT = 'ubi:financial-support';
function handleError(error: any) {
	throw error.response ? error.response.data : new Error('Network Error');
}
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
		const headers: { [key: string]: string } = {
			'Content-Type': 'application/json',
		};

		// Add Authorization header only if sendToken is true
		if (sendToken) {
			const token = localStorage.getItem('authToken');
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}
		}

		const finalPayload = {
			...userData,
			strictCheck: userData.strictCheck ?? false,
		};

		const response = await axios.post(
			`${apiBaseUrl}/content/search`,
			finalPayload,
			{ headers }
		);

		return response.data;
	} catch (error) {
		handleError(error);
	}
};

/**
 * Login a user
 * @param {Object} loginData - Contains phoneNumber, password
 */
interface GetOneParams {
	id: string | undefined;
	bpp_id: string | undefined;
}
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
		const response = await axios.post(`${apiBaseUrl}/select`, loginData, {
			headers: {
				'Content-Type': 'application/json',
			},
		});
		return response || {};
	} catch (error) {
		handleError(error);
	}
};
interface ApplyApplicationParams {
	id: string | undefined;
	context: {
		bpp_id?: string;
		bap_uri?: string;
	};
}
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
	// try {

	const token = localStorage.getItem('authToken');
	const response = await axios.post(`${apiBaseUrl}/init`, loginData, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
	});
	return response || {};
	// } catch (error) {
	//   handleError(error);
	// }
};
interface ConfirmApplicationParams {
	item_id: string | undefined;
	rawContext: any;
}
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
			transaction_id: generateUUID(),
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
		const token = localStorage.getItem('authToken');
		const response = await axios.post(`${apiBaseUrl}/confirm`, data, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		});
		return response || {};
	} catch (error) {
		handleError(error);
	}
};
interface CreateApplicationParams {
	user_id: string | undefined;
	benefit_id: string | undefined;
	benefit_provider_id: string | undefined;
	benefit_provider_uri: string | undefined;
	external_application_id: string | undefined;
	application_name: string | undefined;
	status: string;
	application_data: unknown;
}
export const createApplication = async (data: CreateApplicationParams) => {
	try {
		const token = localStorage.getItem('authToken');

		const response = await axios.post(
			`${apiBaseUrl}/users/user_application`,
			data,
			{
				headers: {
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
interface Filters {
	// Define the expected shape of the filters object
	// Example:
	user_id: string | undefined;
	benefit_id: string | undefined;
}
export const getApplication = async (filters: Filters) => {
	try {
		const token = localStorage.getItem('authToken');

		const response = await axios.post(
			`${apiBaseUrl}/users/user_applications_list`,
			{ filters },
			{
				headers: {
					accept: 'application/json',
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			}
		);
		return response.data;
	} catch (error) {
		handleError(error as AxiosError);
	}
};

export const fetchVCJson = async (url: string) => {
	try {
		const token = localStorage.getItem('authToken');
		const response = await axios.post(
			`${apiBaseUrl}/users/fetch-vc-json`,
			{ url },
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			}
		);
		return response.data;
	} catch (error) {
		throw error.response ? error.response.data : new Error('Network Error');
	}
};
export const checkEligibilityOfUser = async (id: string) => {
	try {
		if (!id) {
			throw new Error('Benefit id is required for eligibility check');
		}
		const token = localStorage.getItem('authToken');
		const response = await axios.get(
			`${apiBaseUrl}/content/eligibility-check/${id}`,

			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);
		return response.data;
	} catch (error: unknown) {
		handleError(error as AxiosError);
	}
};


export const submitForm = async (
	applicationData: { benefitId: string; providerId: string; [key: string]: any },
	context: any
) => {
	const { benefitId, providerId, ...rest } = applicationData;
	const payload = {
		context: {
			// Use the provided context
			...context,
			action: "init",
			timestamp: new Date().toISOString(),
			ttl: "PT10M",
			version: "1.1.0",
			bap_id: context?.bap_id || bap_id,
			bap_uri: context?.bap_uri || bap_uri,
			bpp_id: context?.bpp_id,
			bpp_uri: context?.bpp_uri,
			transaction_id: context?.transaction_id || generateUUID(),
			message_id: context?.message_id || generateUUID(),
			location: context?.location || {
				country: {
					name: "India",
					code: "IND",
				},
				city: {
					name: "Bangalore",
					code: "std:080",
				},
			},
		},
		message: {
			order: {
				items: [
					{
						id: benefitId,
					},
				],
				fulfillments: [
					{
						customer: { applicationData: rest }
					}
				]
			},
		},
	};
	try {
		const response = await axios.post(`${provider_api_url}/benefits/dsep/init`, payload);
		return response?.data;
	} catch (error) {
		console.log(error);
	}
};
