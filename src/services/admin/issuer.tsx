import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Interface definitions for type safety
export interface Issuer {
	id: string; // Issuer ID like "passport_seva", "digilocker"
	name: string; // Display name like "Passport Seva", "DigiLocker"
}

export interface IssuerMapping {
	documentConfigId: number;
	documentSubType: string;
	issuerId: string;
	issuerName: string;
	issuerUrl: string;
}

/**
 * Fetch all available issuers from the API
 * @returns Promise<Issuer[]>
 */
export const getIssuers = async (): Promise<Issuer[]> => {
	try {
		const token = localStorage.getItem('authToken');
		const response = await axios.get(`${BASE_URL}/admin/issuers`, {
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token}`,
			},
		});
		console.log('---------------', response.data.data.data);

		return response.data.data.data;
	} catch (error) {
		console.error('Error fetching issuers:', error);
		throw new Error('Failed to fetch issuers');
	}
};

/**
 * Get a single issuer by ID
 * @param issuerId - The ID of the issuer to fetch
 * @returns Promise<Issuer | null>
 */
export const getIssuerById = async (
	issuerId: string
): Promise<Issuer | null> => {
	try {
		const issuers = await getIssuers();
		const issuer = issuers.find((issuer) => issuer.id === issuerId);
		return issuer || null;
	} catch (error) {
		console.error(`Error fetching issuer with ID ${issuerId}:`, error);
		throw new Error(`Failed to fetch issuer: ${issuerId}`);
	}
};

/**
 * Search issuers by display name
 * @param searchTerm - The search term to filter issuers
 * @returns Promise<Issuer[]>
 */
export const searchIssuers = async (searchTerm: string): Promise<Issuer[]> => {
	try {
		const issuers = await getIssuers();
		const lowerSearchTerm = searchTerm.toLowerCase();
		const filteredIssuers = issuers.filter((issuer) =>
			issuer.name.toLowerCase().includes(lowerSearchTerm)
		);
		return filteredIssuers;
	} catch (error) {
		console.error(
			`Error searching issuers with term ${searchTerm}:`,
			error
		);
		throw new Error(`Failed to search issuers: ${searchTerm}`);
	}
};
