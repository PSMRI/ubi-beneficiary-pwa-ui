import { useState } from 'react';
import { DocumentService } from '../services/documentService';
import { DocumentUploadResponse } from '../types/document.types';

export const useDocumentUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedDocument, setUploadedDocument] =
        useState<DocumentUploadResponse | null>(null);

    const uploadDocument = async (
        file: File,
        docType: string,
        docSubtype: string
    ) => {
        setIsUploading(true);
        setUploadError(null);

        try {
            const result = await DocumentService.uploadDocument(
                file,
                docType,
                docSubtype
            );
            setUploadedDocument(result);
            return result;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Upload failed';
            setUploadError(errorMessage);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const resetUpload = () => {
        setUploadedDocument(null);
        setUploadError(null);
    };

    return {
        uploadDocument,
        isUploading,
        uploadError,
        uploadedDocument,
        resetUpload,
    };
};

