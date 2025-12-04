import dhiwayClient from '../../config/dhiwayClient';
import { uploadUserDocuments } from '../user/User';

/**
 * Dhiway Service
 * 
 * Handles integration with Dhiway API for DigiLocker and Aadhaar operations
 * Uses separate dhiwayClient with Dhiway-specific authentication
 */

// =============================================
// DigiLocker APIs
// =============================================

/**
 * Get DigiLocker request URL
 * @returns DigiLocker request data
 */
export const getDigiLockerRequest = async () => {
	try {
		const response = await dhiwayClient.get('/digilocker-request');
		return response.data;
	} catch (error: any) {
		console.error(
			'Error fetching DigiLocker request:',
			error.response?.data || error.message
		);
		throw error;
	}
};

/**
 * Authenticate with DigiLocker and fetch Aadhaar data
 * @param code - Authorization code from DigiLocker
 * @param userId - User ID to associate the document with
 * @returns Uploaded document data
 */
export const getAadhar = async (code: string, userId: string) => {
	try {
		const response = await dhiwayClient.post(
			'/digilocker-auth',
			{
				code,
				doctype: 'aadhaar',
			}
		);

		const payload = generatePayload(
			response.data.data,
			{
				doc_name: 'Aadhaar Card',
				doc_type: 'idProof',
				doc_subtype: 'aadhaar',
			},
			userId
		);

		const uploadToApp = await uploadUserDocuments(payload);
		return uploadToApp.data;
	} catch (error) {
		console.error('Error sending code to DigiLocker API:', error);
		throw error;
	}
};

// =============================================
// Helper Functions
// =============================================

/**
 * Generate payload for document upload
 * @param data - Document data from Dhiway
 * @param options - Document metadata options
 * @param userId - User ID
 * @returns Formatted payload for upload
 */
export const generatePayload = (
	data: any,
	options?: Partial<{
		doc_name: string;
		doc_type: string;
		doc_subtype: string;
	}>,
	userId?: string
) => {
	const {
		doc_name = 'Aadhaar Card',
		doc_type = 'idProof',
		doc_subtype = 'aadhaar',
	} = options || {};

	const payload = [
		{
			doc_data: data,
			doc_datatype: 'Application/JSON',
			doc_name,
			doc_subtype,
			doc_type,
			imported_from: 'dhiway',
			uploaded_at: new Date().toISOString(), // current timestamp
			user_id: userId,
		},
	];

	return payload;
};
