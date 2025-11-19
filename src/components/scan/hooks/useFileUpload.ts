import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { uploadDocument } from '../../../services/user/User';
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from '../scanConfig';
import { convertPDFToImage } from '../../../utils/pdfToImage';

interface DocumentConfig {
	docType?: string;
	documentSubType?: string;
	label?: string;
	name?: string;
}

interface UseFileUploadOptions {
	documentConfig?: DocumentConfig;
	onUploadSuccess?: (response?: unknown) => void;
	onUploadStart?: () => void;
	onUploadComplete?: () => void;
	customUploadFn?: (file: File, importedFrom: string) => Promise<unknown>;  // NEW
}

interface UseFileUploadReturn {
	isUploading: boolean;
	isConverting: boolean;
	uploadDocumentFile: (file: File, importedFrom: string) => Promise<unknown>;
	handleFileSelect: (
		event: React.ChangeEvent<HTMLInputElement>
	) => Promise<void>;
	validateFile: (file: File) => {
		valid: boolean;
		code?: string;
		message?: string;
	};
}

export const useFileUpload = ({
	documentConfig,
	onUploadSuccess,
	onUploadStart,
	onUploadComplete,
	customUploadFn,
}: UseFileUploadOptions): UseFileUploadReturn => {
	const { t } = useTranslation();
	const toast = useToast();
	const [isUploading, setIsUploading] = useState(false);
	const [isConverting, setIsConverting] = useState(false);

	const validateFile = useCallback(
		(file: File): { valid: boolean; code?: string; message?: string } => {
			// Validate file type (image or PDF)
			const isValidType =
				file.type.startsWith('image/') ||
				file.type === 'application/pdf';
			if (!isValidType) {
				return {
					valid: false,
					code: 'type',
					message: t('SCAN_INVALID_FILE_TYPE'),
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
					code: 'size',
					message: errorMessage,
				};
			}

			return { valid: true };
		},
		[t]
	);

	const uploadDocumentFile = useCallback(
		async (file: File, importedFrom: string) => {
			let fileToUpload = file;
			const isPDF = file.type === 'application/pdf';

			// Show single processing toast
			const toastId = toast({
				title: isPDF ? t('SCAN_PROCESSING_PDF') : t('SCAN_UPLOADING'),
				status: 'info',
				duration: null,
				isClosable: false,
			});

			// Convert PDF to image (required for QR code extraction)
			if (isPDF) {
				setIsConverting(true);
				try {
					fileToUpload = await convertPDFToImage(file, {
						scale: 2.0,
						quality: 0.8,
						format: 'jpeg'
					});
				} catch (error) {
					console.error('Error converting PDF to image:', error);
					toast.close(toastId);
					toast({
						title: t('SCAN_PDF_CONVERSION_ERROR'),
						description: t('SCAN_PDF_CONVERSION_ERROR_DESCRIPTION'),
						status: 'error',
						duration: 5000,
						isClosable: true,
					});
					throw error;
				} finally {
					setIsConverting(false);
				}
			}

			setIsUploading(true);
			if (onUploadStart) onUploadStart();

			try {
				let response;

				// Use custom upload function if provided
				if (customUploadFn) {
					response = await customUploadFn(file, importedFrom);
				} else {
					// Default authenticated upload
					response = await uploadDocument(
						file,
						documentConfig?.docType || '',
						documentConfig?.documentSubType || '',
						documentConfig?.name || '',
						importedFrom
					);
				}

				// Close processing toast and show success
				toast.close(toastId);
				toast({
					title: t('SCAN_UPLOAD_SUCCESS'),
					status: 'success',
					duration: 3000,
					isClosable: true,
				});

				if (onUploadSuccess) {
					setTimeout(() => {
						onUploadSuccess(response);  // Pass response
					}, 1000);
				}

				return response;
			} catch (error) {
				console.error('Error during file upload:', error);
				toast.close(toastId);
				toast({
					title: t('DOCUMENT_SCANNER_ERROR_TITLE'),
					description: t('SCAN_ERROR_UPLOAD_FILE'),
					status: 'error',
					duration: 4000,
					isClosable: true,
				});
				throw error;
			} finally {
				setIsUploading(false);
				if (onUploadComplete) onUploadComplete();
			}
		},
		[
			documentConfig,
			onUploadSuccess,
			onUploadStart,
			onUploadComplete,
			toast,
			t,
		]
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
					title:
						validation.code === 'size'
							? t('SCAN_FILE_TOO_LARGE_TITLE')
							: t('SCAN_INVALID_FILE_TYPE_TITLE'),
					description: validation.message,
					status: 'error',
					duration: validation.code === 'size' ? 4000 : 3000,
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
		isConverting,
		uploadDocumentFile,
		handleFileSelect,
		validateFile,
	};
};
