import React, { useEffect } from 'react';
import { Box, VStack, Text, Button, HStack } from '@chakra-ui/react';
import Layout from './common/layout/Layout';
import { useTranslation } from 'react-i18next';
import { isMobile } from '../utils/deviceUtils';

import { useQRScanner } from './scan/hooks/useQRScanner';
import { useCameraCapture } from './scan/hooks/useCameraCapture';
import { useFileUpload } from './scan/hooks/useFileUpload';
import { CapturedImagePreview } from './scan/CapturedImagePreview';
import { MAX_FILE_SIZE_MB, SCANNER_CONTAINER_ID } from './scan/scanConfig';

interface ScanVCProps {
	onScanResult?: (result: string) => void;
	showHeader?: boolean;
	documentConfig?: {
		docType: string;
		documentSubType: string;
		label: string;
		name: string;
		docHasORCode?: string;
	};
	onUploadSuccess?: (response?: any, uploadedFile?: File) => void;
	onQRScanSuccess?: (qrContent: string) => void;
}

const ScanVC: React.FC<ScanVCProps> = ({
	onScanResult,
	showHeader = true,
	documentConfig,
	onUploadSuccess,
	onQRScanSuccess,
}) => {
	const { t } = useTranslation();

	// QR Scanner hook for legacy VC flow (uses fetch-vc-json)
	const {
		scanning,
		isCameraStarting,
		cameraError: qrCameraError,
		startCamera,
		stopCamera,
	} = useQRScanner({ onScanResult });

	// QR Scanner hook for new direct upload flow (uses upload-document-qr)
	const {
		scanning: scanningForUpload,
		isCameraStarting: isCameraStartingForUpload,
		cameraError: qrCameraErrorForUpload,
		startCamera: startCameraForUpload,
		stopCamera: stopCameraForUpload,
	} = useQRScanner({ 
		onScanResult: (result) => {
			if (onQRScanSuccess) {
				onQRScanSuccess(result);
			}
		}
	});

	// Camera capture hook
	const {
		isCapturing,
		capturedImage,
		capturedFile,
		isCompressing,
		originalFileSize,
		compressedFileSize,
		showCompressionInfo,
		cameraError: captureCameraError,
		videoRef,
		startCaptureCamera,
		stopCaptureCamera,
		capturePhoto,
		handleRetakePhoto,
		handleCancelCapture,
		setCameraError: setCaptureCameraError,
	} = useCameraCapture();

	// File upload hook
	const { isUploading, isConverting, uploadDocumentFile, handleFileSelect } =
		useFileUpload({
			documentConfig,
			onUploadSuccess: (response, file) => {
				if (capturedFile) {
					handleCancelCapture();
				}
				onUploadSuccess?.(response, file);
			},
			onUploadStart: () => {
				setCaptureCameraError(null);
			},
		});

	// Combined camera error from all hooks
	const cameraError = qrCameraError || qrCameraErrorForUpload || captureCameraError;

	// Stop cameras on unmount
	useEffect(() => {
		return () => {
			stopCamera();
			stopCameraForUpload();
			stopCaptureCamera();
		};
	}, [stopCamera, stopCameraForUpload, stopCaptureCamera]);

	// Handle camera coordination
	const handleStartQRScannerForUpload = async () => {
		stopCaptureCamera();
		stopCamera();
		await startCameraForUpload();
	};

	const handleStartCaptureCamera = async () => {
		stopCamera();
		stopCameraForUpload();
		await startCaptureCamera();
	};

	const handleUploadCapturedImage = async () => {
		if (!capturedFile) return;
		await uploadDocumentFile(capturedFile, 'Camera Capture');
	};

	const scannerContent = (
		<Box px={3} py={1} height="100%">
			<VStack spacing={2} align="stretch" width="100%" height="100%">
				{/* Show buttons when not scanning or capturing */}
				{!scanning && !scanningForUpload && !isCapturing && !capturedImage && (
					<Box textAlign="center" py={1}>
						{/* LEGACY: Scan VC QR Code button (uses fetch-vc-json) - COMMENTED OUT */}
						{/* <Button
							colorScheme="blue"
							size="md"
							width="full"
							onClick={handleStartQRScanner}
							isLoading={isCameraStarting}
							loadingText={t('SCAN_STARTING_CAMERA_LOADING')}
							mb={3}
						>
							{t('SCAN_START_CAMERA_BUTTON') || 'Scan VC QR Code'}
						</Button>

						<Text
							textAlign="center"
							fontWeight="semibold"
							color="gray.500"
							my={3}
						>
							{t('OR')}
						</Text> */}

						{/* Show only QR Code scanner if docHasORCode is "yes" */}
						{documentConfig?.docHasORCode === 'yes' ? (
							<Button
								colorScheme="purple"
								size="md"
								width="full"
								onClick={handleStartQRScannerForUpload}
								isLoading={isCameraStartingForUpload}
								loadingText={t('SCAN_STARTING_CAMERA_LOADING')}
								mb={3}
							>
								{t('SCAN_QR_CODE_UPLOAD_BUTTON') || 'Scan QR Code'}
							</Button>
						) : (
							<>
								<Button
									as="label"
									colorScheme="teal"
									size="md"
									width="full"
									isLoading={isUploading || isConverting}
									loadingText={t('SCAN_UPLOADING') || 'Uploading...'}
									isDisabled={isUploading || isConverting}
									cursor={
										isUploading || isConverting
											? 'not-allowed'
											: 'pointer'
									}
								>
									{!isUploading && !isConverting && (
										<span>
											{t('UPLOAD_DOCUMENT_FOR_VC') || 'Upload Document'} ({'<'}{' '}
											{MAX_FILE_SIZE_MB}MB)
										</span>
									)}
									<input
										type="file"
										accept="image/*,application/pdf"
										onChange={handleFileSelect}
										hidden
										disabled={isUploading || isConverting}
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
									colorScheme="green"
									size="md"
									width="full"
									onClick={handleStartCaptureCamera}
									mb={3}
									isDisabled={isUploading || isConverting}
								>
									{t('SCAN_CAPTURE_PHOTO_CAMERA')}
								</Button>
							</>
						)}
					</Box>
				)}

				{/* QR Scanner controls for legacy flow */}
				{scanning && (
					<Box textAlign="center" pb={1}>
						<Button
							colorScheme="red"
							size="sm"
							onClick={stopCamera}
						>
							{t('SCAN_STOP_SCANNING_BUTTON')}
						</Button>
					</Box>
				)}

				{/* QR Scanner controls for new upload flow */}
				{scanningForUpload && (
					<Box textAlign="center" pb={1}>
						<Button
							colorScheme="red"
							size="sm"
							onClick={stopCameraForUpload}
						>
							{t('SCAN_STOP_SCANNING_BUTTON')}
						</Button>
					</Box>
				)}

				{/* Camera capture view */}
				{isCapturing && (
					<Box textAlign="center">
						<Box
							position="relative"
							width="100%"
							height={isMobile() ? '350px' : '400px'}
							bg="black"
							borderRadius="md"
							overflow="hidden"
							display="flex"
							justifyContent="center"
							alignItems="center"
						>
							<video
								ref={videoRef}
								autoPlay
								playsInline
								muted
								aria-label="Camera preview for capturing document"
								style={{
									width: '100%',
									height: '100%',
									objectFit: 'cover',
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
								width="120px"
							>
								{t('SCAN_CAPTURE_PHOTO')}
							</Button>
							<Button
								colorScheme="gray"
								size="md"
								onClick={stopCaptureCamera}
								width="120px"
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
						isUploading={isUploading}
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

				{/* QR Scanner will mount here - always keep in DOM */}
				<Box
					id={SCANNER_CONTAINER_ID}
					width="100%"
					flex={scanning || scanningForUpload ? '1' : 'initial'}
					minHeight={scanning || scanningForUpload ? '0' : 'initial'}
				/>
			</VStack>

			{/* Add compression loader animation */}
			<style>{`
				@keyframes compress {
					0% {
						transform: translateX(-100%);
					}
					50% {
						transform: translateX(100%);
					}
					100% {
						transform: translateX(-100%);
					}
				}
				.compress-loader {
					animation: compress 2s ease-in-out infinite;
				}
			`}</style>
		</Box>
	);

	if (!showHeader) {
		return scannerContent;
	}

	return (
		<Layout
			_heading={{
				heading: t('SCAN_DOCUMENTS_TITLE'),
				handleBack: () => globalThis.history.back(),
			}}
		>
			{scannerContent}
		</Layout>
	);
};

export default ScanVC;
