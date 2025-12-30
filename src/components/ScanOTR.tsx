// src/components/ScanOTR.tsx
import React, { useCallback, useState } from 'react';
import { Box, VStack, Text, Button, HStack, useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useCameraCapture } from './scan/hooks/useCameraCapture';
import { CapturedImagePreview } from './scan/CapturedImagePreview';
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from './scan/scanConfig';
import { convertPDFToImage } from '../utils/pdfToImage';

interface ScanOTRProps {
    onOTRProcessed: (extractedData: any, file: File) => void;
    onError?: (error: any) => void;
    isProcessing?: boolean;
}

const ScanOTR: React.FC<ScanOTRProps> = ({ onOTRProcessed, onError, isProcessing = false }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [isConverting, setIsConverting] = useState(false);
    // Camera capture hook (reuse existing)
    const {
        isCapturing,
        capturedImage,
        capturedFile,
        isCompressing,
        originalFileSize,
        compressedFileSize,
        showCompressionInfo,
        cameraError,
        videoRef,
        startCaptureCamera,
        stopCaptureCamera,
        capturePhoto,
        handleRetakePhoto,
        handleCancelCapture,
    } = useCameraCapture();

    // Validate file
    const validateFile = useCallback((file: File) => {
        const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';

        if (!isValidType) {
            return {
                valid: false,
                message: t('SCAN_INVALID_FILE_TYPE'),
            };
        }

        if (file.size > MAX_FILE_SIZE) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            const errorMessage = t('SCAN_FILE_TOO_LARGE')
                .replaceAll('{size}', fileSizeMB)
                .replaceAll('{maxSize}', MAX_FILE_SIZE_MB.toString());

            return {
                valid: false,
                message: errorMessage,
            };
        }

        return { valid: true };
    }, [t]);

    // Handle file selection from input
    // Handle file selection
    const handleFileSelect = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            let fileToUpload = file;

            // Validate original file
            const validation = validateFile(file);
            if (!validation.valid) {
                toast({
                    title: t('Invalid File'),
                    description: validation.message,
                    status: 'error',
                    duration: 4000,
                });
                event.target.value = '';
                return;
            }

            // If PDF → Convert to Image
            if (file.type === 'application/pdf') {
                setIsConverting(true);

                try {
                    fileToUpload = await convertPDFToImage(file, {
                        scale: 2,
                        quality: 0.8,
                        format: 'jpeg',
                    });

                    // Validate converted image size
                    const convertedValidation = validateFile(fileToUpload);
                    if (!convertedValidation.valid) {
                        throw new Error(convertedValidation.message);
                    }

                } catch (error) {
                    console.error('PDF conversion error:', error);
                    toast({
                        title: t('SCAN_PDF_CONVERSION_ERROR'),
                        description: t('SCAN_PDF_CONVERSION_ERROR_DESCRIPTION'),
                        status: 'error',
                        duration: 5000,
                    });
                    onError?.(error);
                    event.target.value = '';
                    setIsConverting(false);
                    return;
                }

                toast.closeAll();
                setIsConverting(false);
            }

            // Send file to parent
            onOTRProcessed(null, fileToUpload);

            event.target.value = '';
        },
        [validateFile, toast, t, onOTRProcessed, onError]
    );
    // Handle upload of captured image
    const handleUploadCapturedImage = () => {
        if (!capturedFile) return;
        // Pass file directly to parent for processing
        onOTRProcessed(null, capturedFile);
        handleCancelCapture();
    };

    return (
        <Box px={3} py={1} height="100%">
            <VStack spacing={2} align="stretch" width="100%" height="100%">
                {/* Show upload buttons when not capturing */}
                {!isCapturing && !capturedImage && (
                    <Box textAlign="center" py={1}>
                        <Button
                            as="label"
                            colorScheme="teal"
                            size="md"
                            width="full"
                            isLoading={isProcessing}
                            loadingText={t('SIGNUP_REGISTERING')}
                            isDisabled={isProcessing}
                            cursor={isProcessing ? 'not-allowed' : 'pointer'}
                        >
                            <span>
                                {t('UPLOAD_DOCUMENT_FOR_VC')} ({'<'} {MAX_FILE_SIZE_MB}MB)
                            </span>
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleFileSelect}
                                hidden
                                disabled={isProcessing}
                            />
                        </Button>

                        <Text
                            textAlign="center"
                            fontWeight="semibold"
                            color="gray.500"
                            my={3}
                        >
                            {t('OR')}
                        </Text>

                        <Button
                            colorScheme="purple"
                            size="md"
                            width="full"
                            onClick={startCaptureCamera}
                            isDisabled={isProcessing}
                        >
                            {t('SCAN_CAPTURE_PHOTO_CAMERA')}
                        </Button>
                    </Box>
                )}

                {/* Camera capture view */}
                {isCapturing && (
                    <Box textAlign="center">
                        <Box
                            position="relative"
                            width="100%"
                            bg="black"
                            borderRadius="md"
                            overflow="hidden"
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                aria-label="Camera preview for capturing OTR certificate"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '60vh',
                                }}
                            >
                                <track kind="captions" />
                            </video>
                        </Box>
                        <HStack spacing={2} mt={3} justifyContent="center">
                            <Button
                                colorScheme="green"
                                size="md"
                                onClick={capturePhoto}
                            >
                                {t('SCAN_CAPTURE_PHOTO')}
                            </Button>
                            <Button
                                colorScheme="gray"
                                size="md"
                                onClick={stopCaptureCamera}
                            >
                                {t('SCAN_CANCEL')}
                            </Button>
                        </HStack>
                    </Box>
                )}

                {/* Preview captured image */}
                {capturedImage && (
                    <CapturedImagePreview
                        capturedImage={capturedImage}
                        isCompressing={isCompressing}
                        originalFileSize={originalFileSize}
                        compressedFileSize={compressedFileSize}
                        showCompressionInfo={showCompressionInfo}
                        isUploading={isProcessing}
                        onUpload={handleUploadCapturedImage}
                        onRetake={handleRetakePhoto}
                        onCancel={handleCancelCapture}
                    />
                )}

                {cameraError && (
                    <Box bg="red.50" p={2} borderRadius="md">
                        <Text color="red.600" fontSize="sm">
                            {cameraError}
                        </Text>
                    </Box>
                )}
            </VStack>
        </Box>
    );
};

export default ScanOTR;