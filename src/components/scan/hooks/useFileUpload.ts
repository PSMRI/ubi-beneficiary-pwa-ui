import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { uploadDocument } from '../../../services/user/User';
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from '../scanConfig';

interface DocumentConfig {
	docType?: string;
	documentSubType?: string;
	label?: string;
	name?: string;
}

interface UseFileUploadOptions {
	documentConfig?: DocumentConfig;
	onUploadSuccess?: () => void;
	onUploadStart?: () => void;
	onUploadComplete?: () => void;
}

interface UseFileUploadReturn {
	isUploading: boolean;
	uploadDocumentFile: (file: File, importedFrom: string) => Promise<any>;
	handleFileSelect: (
		event: React.ChangeEvent<HTMLInputElement>
	) => Promise<void>;
	validateFile: (file: File) => { valid: boolean; error?: string };
}

export const useFileUpload = ({
	documentConfig,
	onUploadSuccess,
	onUploadStart,
	onUploadComplete,
}: UseFileUploadOptions): UseFileUploadReturn => {
	const { t } = useTranslation();
	const toast = useToast();
	const [isUploading, setIsUploading] = useState(false);

	const validateFile = useCallback(
		(file: File): { valid: boolean; error?: string } => {
			// Validate file type (image or PDF)
			const isValidType =
				file.type.startsWith('image/') || file.type === 'application/pdf';
			if (!isValidType) {
				return {
					valid: false,
					error: t('SCAN_INVALID_FILE_TYPE'),
				};
			}

			// Check file size
			if (file.size > MAX_FILE_SIZE) {
				const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

				// Create error message with manual interpolation
				let errorMessage = t('SCAN_FILE_TOO_LARGE');

				// Manual interpolation - replace placeholders with actual values
				errorMessage = errorMessage
					.replaceAll('{size}', fileSizeMB)
					.replaceAll('{maxSize}', MAX_FILE_SIZE_MB.toString());

				return {
					valid: false,
					error: errorMessage,
				};
			}

			return { valid: true };
		},
		[t]
	);

	const uploadDocumentFile = useCallback(
		async (file: File, importedFrom: string) => {
			setIsUploading(true);
			if (onUploadStart) onUploadStart();

			try {
				const response = await uploadDocument(
					file,
					documentConfig?.docType || '',
					documentConfig?.documentSubType || '',
					documentConfig?.name || '',
					importedFrom
				);

				toast({
					title: t('SCAN_UPLOAD_SUCCESS'),
					status: 'success',
					duration: 3000,
					isClosable: true,
				});

				if (onUploadSuccess) {
					setTimeout(() => {
						onUploadSuccess();
					}, 1000);
				}

				return response;
			} catch (error) {
				console.error('Error during file upload:', error);
				throw error;
			} finally {
				setIsUploading(false);
				if (onUploadComplete) onUploadComplete();
			}
		},
		[documentConfig, onUploadSuccess, onUploadStart, onUploadComplete, toast, t]
	);

	const handleFileSelect = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];

			if (!file) {
				return;
			}

			const validation = validateFile(file);
			if (!validation.valid) {
				toast({
					title: validation.error?.includes('size')
						? t('SCAN_FILE_TOO_LARGE_TITLE')
						: t('SCAN_INVALID_FILE_TYPE_TITLE'),
					description: validation.error,
					status: 'error',
					duration: validation.error?.includes('size') ? 4000 : 3000,
					isClosable: true,
				});
				event.target.value = '';
				return;
			}

			await uploadDocumentFile(file, 'Manual Upload');
			event.target.value = '';
		},
		[validateFile, uploadDocumentFile, toast, t]
	);

	return {
		isUploading,
		uploadDocumentFile,
		handleFileSelect,
		validateFile,
	};
};

