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
        docSubtype?: string
    ) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Build VC form data - use doc_id if available, otherwise use doc_type and doc_subtype
            const vcFormData: any = {
                form_data: formData,
            };

            if (docId) {
                vcFormData.doc_id = docId;
            } else if (docType && docSubtype) {
                vcFormData.doc_type = docType;
                vcFormData.doc_subtype = docSubtype;
            } else {
                throw new Error('Either doc_id or doc_type/doc_subtype must be provided');
            }

            const result = await VCService.createVC(vcFormData);
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

