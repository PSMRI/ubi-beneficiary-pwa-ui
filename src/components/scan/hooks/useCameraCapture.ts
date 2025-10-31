import { useState, useRef, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { compressImage } from '../../../utils/imageCompression';
import { isMobile } from '../../../utils/deviceUtils';
import {
	COMPRESSION_SETTINGS,
	MAX_FILE_SIZE,
	MAX_FILE_SIZE_MB,
	CAMERA_CONSTRAINTS,
} from '../scanConfig';

interface UseCameraCaptureReturn {
	isCapturing: boolean;
	capturedImage: string | null;
	capturedFile: File | null;
	isCompressing: boolean;
	originalFileSize: number;
	compressedFileSize: number;
	showCompressionInfo: boolean;
	cameraError: string | null;
	videoRef: React.RefObject<HTMLVideoElement>;
	startCaptureCamera: () => Promise<void>;
	stopCaptureCamera: () => void;
	capturePhoto: () => Promise<void>;
	handleRetakePhoto: () => void;
	handleCancelCapture: () => void;
	setCameraError: (error: string | null) => void;
}

export const useCameraCapture = (): UseCameraCaptureReturn => {
	const { t } = useTranslation();
	const toast = useToast();
	const [isCapturing, setIsCapturing] = useState(false);
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [capturedFile, setCapturedFile] = useState<File | null>(null);
	const [isCompressing, setIsCompressing] = useState(false);
	const [originalFileSize, setOriginalFileSize] = useState<number>(0);
	const [compressedFileSize, setCompressedFileSize] = useState<number>(0);
	const [showCompressionInfo, setShowCompressionInfo] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const startCaptureCamera = useCallback(async () => {
		setCameraError(null);
		setIsCapturing(true);
		setCapturedImage(null);
		setCapturedFile(null);

		try {
			const constraints = {
				video: {
					facingMode: { ideal: isMobile() ? 'environment' : 'user' },
					...CAMERA_CONSTRAINTS,
				},
			};

			const stream =
				await navigator.mediaDevices.getUserMedia(constraints);
			streamRef.current = stream;

			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				videoRef.current.play();
			}
		} catch (err) {
			console.error('Camera access error:', err);
			setCameraError(t('SCAN_CAMERA_PERMISSION_ERROR'));
			setIsCapturing(false);
		}
	}, [t]);

	const stopCaptureCamera = useCallback(() => {
		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) {
				track.stop();
			}
			streamRef.current = null;
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
		setIsCapturing(false);
	}, []);

	const capturePhoto = useCallback(async () => {
		if (!videoRef.current) return;

		const canvas = document.createElement('canvas');
		canvas.width = videoRef.current.videoWidth;
		canvas.height = videoRef.current.videoHeight;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		ctx.drawImage(videoRef.current, 0, 0);

		canvas.toBlob(
			async (blob) => {
				if (!blob) return;

				const tempFile = new File([blob], `temp-${Date.now()}.jpg`, {
					type: 'image/jpeg',
				});

				setOriginalFileSize(tempFile.size);

				// Create preview from original file first
				const reader = new FileReader();
				reader.onload = (e) => {
					const imageUrl = e.target?.result as string;
					setCapturedImage(imageUrl);
					stopCaptureCamera();
				};
				reader.readAsDataURL(tempFile);

				// Only compress if image is above MAX_FILE_SIZE
				if (tempFile.size > MAX_FILE_SIZE) {
					setIsCompressing(true);

					try {
						await new Promise((resolve) =>
							setTimeout(resolve, 500)
						);

						const originalSizeMB = (
							tempFile.size /
							(1024 * 1024)
						).toFixed(2);

						toast({
							title: t('SCAN_OPTIMIZING'),
							description: t('SCAN_IMAGE_EXCEEDS_SIZE')
								.replaceAll('{size}', originalSizeMB)
								.replaceAll(
									'{maxSize}',
									MAX_FILE_SIZE_MB.toString()
								),
							status: 'info',
							duration: 2000,
							isClosable: true,
						});

						const compressedFile = await compressImage(
							tempFile,
							COMPRESSION_SETTINGS
						);

						const fileSizeMB = compressedFile.size / (1024 * 1024);
						setCompressedFileSize(compressedFile.size);

						if (compressedFile.size > MAX_FILE_SIZE) {
							const errorMessage = t(
								'SCAN_IMAGE_EXCEEDS_AFTER_COMPRESSION'
							)
								.replaceAll('{size}', fileSizeMB.toFixed(2))
								.replaceAll(
									'{maxSize}',
									MAX_FILE_SIZE_MB.toString()
								);

							setCameraError(errorMessage);
							setIsCompressing(false);
							setCapturedImage(null);
							setCapturedFile(null);
							return;
						}

						const compressedReader = new FileReader();
						compressedReader.onload = (e) => {
							const imageUrl = e.target?.result as string;
							setCapturedImage(imageUrl);
							setCapturedFile(compressedFile);
							setIsCompressing(false);
							setShowCompressionInfo(true);
						};
						compressedReader.readAsDataURL(compressedFile);
					} catch (error) {
						console.error('Error compressing image:', error);
						setCameraError(t('SCAN_COMPRESSION_ERROR'));
						setIsCompressing(false);
						setCapturedImage(null);
						setCapturedFile(null);
					}
				} else {
					setCapturedFile(tempFile);
					setCompressedFileSize(tempFile.size);
					setIsCompressing(false);
					setShowCompressionInfo(true);
				}
			},
			'image/jpeg',
			0.92
		);
	}, [stopCaptureCamera, toast, t]);

	const handleRetakePhoto = useCallback(() => {
		setCapturedImage(null);
		setCapturedFile(null);
		startCaptureCamera();
	}, [startCaptureCamera]);

	const handleCancelCapture = useCallback(() => {
		setCapturedImage(null);
		setCapturedFile(null);
		setCameraError(null);
	}, []);

	return {
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
		setCameraError,
	};
};
