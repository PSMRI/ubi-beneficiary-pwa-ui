import React, { useState, useEffect, useRef } from 'react';
import {
	Box,
	VStack,
	Text,
	useTheme,
	Button,
	HStack,
} from '@chakra-ui/react';
import Layout from './common/layout/Layout';

import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';

interface ScanVCProps {
	onScanResult?: (result: string) => void;
}			

const ScanVC: React.FC<ScanVCProps> = ({ onScanResult }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	/* // const toast = useToast(); */ // NO SONAR
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
						//NOSONAR_BEGIN
						/* toast({
							title: 'Scan Success',
							description: decodedText,
							status: 'success',
							duration: 2000,
							isClosable: true,
						});
 						*/	//NOSONAR_END
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

	return (
		<Layout
			_heading={{
				heading: t('SCAN_DOCUMENTS_TITLE'),
				handleBack: () => window.history.back(),
			}}
		>
			<Box shadow="md" borderWidth="1px" borderRadius="md" p={4}>
				<VStack spacing={4} align="stretch">
					<Text
						fontSize="lg"
						fontWeight="medium"
						color={theme.colors.text}
					>
						{t('SCAN_QR_CODE_SCANNER_TITLE')}
					</Text>

					<HStack spacing={4}>
						<Button
							colorScheme="blue"
							onClick={scanning ? stopCamera : startCamera}
							isLoading={isCameraStarting}
							loadingText={t('SCAN_STARTING_CAMERA_LOADING')}
						>
							{scanning ? t('SCAN_STOP_SCANNING_BUTTON') : t('SCAN_START_CAMERA_BUTTON')}
						</Button>

						{/* <Button as="label" colorScheme="teal">
							Upload QR Image
							<input
								type="file"
								accept="image/*"
								onChange={handleFileSelect}
								hidden
							/>
						</Button> */}
					</HStack>

					{cameraError && <Text color="red.500">{cameraError}</Text>}

					{/* QR Scanner will mount here */}
					<Box id={scannerContainerId} width="100%" />
				</VStack>
			</Box>
		</Layout>
	);
};

export default ScanVC;
