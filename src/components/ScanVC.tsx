import React, { useState, useEffect, useRef } from 'react';
import { Box, VStack, Text, Button } from '@chakra-ui/react';
import Layout from './common/layout/Layout';

import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';

interface ScanVCProps {
	onScanResult?: (result: string) => void;
	showHeader?: boolean;
}
const ScanVC: React.FC<ScanVCProps> = ({ onScanResult, showHeader = true }) => {
	const { t } = useTranslation();
	const [scanning, setScanning] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [isCameraStarting, setIsCameraStarting] = useState(false);
	const hasScanned = useRef(false);
	const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
	const scannerContainerId = 'html5qr-code-full-region';

	useEffect(() => {
		return () => {
			stopCamera();
		};
	}, []);

	const isMobile = () => {
		return /Mobi|Android/i.test(navigator.userAgent);
	};

	const startCamera = async () => {
		setIsCameraStarting(true);
		setCameraError(null);
		hasScanned.current = false;

		try {
			const config = {
				fps: 10,
				qrbox: 250,
			};

			const html5QrCode = new Html5Qrcode(scannerContainerId);
			html5QrCodeRef.current = html5QrCode;

			await html5QrCode.start(
				isMobile()
					? { facingMode: 'environment' }
					: { facingMode: 'user' }, // back camera on mobile
				config,
				(decodedText: string) => {
					if (!hasScanned.current) {
						hasScanned.current = true;
						/* toast({
							title: 'Scan Success',
							description: decodedText,
							status: 'success',
							duration: 2000,
							isClosable: true,
						});
 						*/ // NOSONAR
						if (onScanResult) onScanResult(decodedText.trim());
						stopCamera();
					}
				},
				(errorMessage: string) => {
					console.warn('QR Scan Error:', errorMessage);
				}
			);

			setScanning(true);
			/* 	toast({
				title: 'Camera Started',
				description: 'QR code scanner is ready',
				status: 'success',
				duration: 2000,
				isClosable: true,
			}); */ // NOSONAR
		} catch (err) {
			console.error('Camera error:', err);
			setCameraError(
				'Failed to start camera. Please allow access and try again.'
			);
		} finally {
			setIsCameraStarting(false);
		}
	};

	const stopCamera = () => {
		setScanning(false);
		setCameraError(null);
		if (html5QrCodeRef.current) {
			html5QrCodeRef.current
				.stop()
				.then(() => html5QrCodeRef.current?.clear())
				.catch((err) => {
					console.warn('Error stopping camera:', err);
				});
			html5QrCodeRef.current = null;
		}
	};

	/* 	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file || !file.type.startsWith('image/')) {
			toast({
				title: 'Invalid file',
				description: 'Please select a valid image file',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext('2d');
				if (!ctx) return;
				ctx.drawImage(img, 0, 0);

				const imageData = ctx.getImageData(
					0,
					0,
					canvas.width,
					canvas.height
				);
				const code = jsQR(
					imageData.data,
					imageData.width,
					imageData.height
				);

				if (code) {
					toast({
						title: 'QR Code Found',
						description: code.data,
						status: 'success',
						duration: 2000,
						isClosable: true,
					});
					if (onScanResult) onScanResult(code.data.trim());
				} else {
					toast({
						title: 'No QR Code',
						description: 'No QR code found in the image',
						status: 'warning',
						duration: 3000,
						isClosable: true,
					});
				}
			};
			if (e.target?.result) img.src = e.target.result as string;
		};
		reader.readAsDataURL(file);
	}; */ // NOSONAR

	const scannerContent = (
		<Box px={3} py={1} height="100%">
			<VStack spacing={2} align="stretch" width="100%" height="100%">
				{!scanning && (
					<Box textAlign="center" py={1}>
						<Button
							colorScheme="blue"
							size="md"
							width="full"
							onClick={startCamera}
							isLoading={isCameraStarting}
							loadingText={t('SCAN_STARTING_CAMERA_LOADING')}
						>
							{t('SCAN_START_CAMERA_BUTTON')}
						</Button>

						{/* <Button
							as="label"
							colorScheme="teal"
							size="md"
							width="full"
						>
							<span>Upload Image OR PDF</span>
							<input
								type="file"
								accept="image/*,application/pdf"
								onChange={handleFileSelect}
								hidden
							/>
						</Button> */}
					</Box>
				)}

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

				{cameraError && (
					<Box bg="red.50" p={2} borderRadius="md">
						<Text color="red.600" fontSize="sm">
							{cameraError}
						</Text>
					</Box>
				)}

				{/* QR Scanner will mount here */}
				<Box
					id={scannerContainerId}
					width="100%"
					flex="1"
					minHeight="0"
				/>
			</VStack>
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
