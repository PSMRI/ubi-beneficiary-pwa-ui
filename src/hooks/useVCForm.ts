import { useState } from 'react';
import { VCService } from '../services/vcService';

export const useVCForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [createdVC, setCreatedVC] = useState<any>(null);

    const submitForm = async (
        docId: string | undefined,
        formData: Record<string, any>,
        docType?: string,
        docSubtype?: string,
        uploadedFile?: File,
        docName?: string
    ) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // The formData already contains all the form fields
            // Pass it directly along with the uploaded file and document metadata
            const result = await VCService.createVC(
                formData,
                uploadedFile,
                docType,
                docSubtype,
                docName
            );
            setCreatedVC(result);
            return result;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Form submission failed';
            setSubmitError(errorMessage);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        submitForm,
        isSubmitting,
        submitError,
        createdVC,
    };
};

