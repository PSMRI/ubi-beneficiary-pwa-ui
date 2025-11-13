import axios from 'axios';
import { VCFormData } from '../types/vc.types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export class VCService {
    static async createVC(formData: VCFormData) {
        const token = localStorage.getItem('authToken');
        try {
            const response = await axios.post(
                `${apiBaseUrl}/vc/create`,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            return response.data.data;
        } catch (error) {
            console.error('VC creation failed:', error);
            throw new Error('Failed to create verifiable credential.');
        }
    }

    static async getVCById(vcId: string) {
        const token = localStorage.getItem('authToken');
        try {
            const response = await axios.get(`${apiBaseUrl}/vc/${vcId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data.data;
        } catch (error) {
            console.error('Failed to fetch VC:', error);
            throw new Error('Failed to fetch verifiable credential.');
        }
    }
}

