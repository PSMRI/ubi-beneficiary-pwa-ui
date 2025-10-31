import { useState, useRef, useCallback, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import { isMobile } from '../../../utils/deviceUtils';
import { QR_SCANNER_CONFIG, SCANNER_CONTAINER_ID } from '../scanConfig';

interface UseQRScannerOptions {
	onScanResult?: (result: string) => void;
}

interface UseQRScannerReturn {
	scanning: boolean;
	isCameraStarting: boolean;
	cameraError: string | null;
	startCamera: () => Promise<void>;
	stopCamera: () => void;
}

export const useQRScanner = ({
	onScanResult,
}: UseQRScannerOptions): UseQRScannerReturn => {
	const { t } = useTranslation();
	const [scanning, setScanning] = useState(false);
	const [isCameraStarting, setIsCameraStarting] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const hasScanned = useRef(false);
	const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

	const stopCamera = useCallback(() => {
		setScanning(false);
		setCameraError(null);
		const qrInstance = html5QrCodeRef.current;
		if (qrInstance) {
			qrInstance
				.stop()
				.then(() => qrInstance.clear())
				.catch((err) => {
					console.warn('Error stopping camera:', err);
				});
			html5QrCodeRef.current = null;
		}
	}, []);

	// Cleanup camera on unmount
	useEffect(() => {
		return () => {
			stopCamera();
		};
	}, [stopCamera]);

	const startCamera = useCallback(async () => {
		setIsCameraStarting(true);
		setCameraError(null);
		hasScanned.current = false;

		try {
			const html5QrCode = new Html5Qrcode(SCANNER_CONTAINER_ID);
			html5QrCodeRef.current = html5QrCode;

			await html5QrCode.start(
				isMobile()
					? { facingMode: 'environment' }
					: { facingMode: 'user' },
				QR_SCANNER_CONFIG,
				(decodedText: string) => {
					if (!hasScanned.current) {
						hasScanned.current = true;
						console.log('Scanned QR code URL:', decodedText.trim());

						// Use setTimeout to ensure the callback runs in the next tick
						// This prevents React render cycle conflicts
						setTimeout(() => {
							try {
								if (onScanResult) {
									onScanResult(decodedText.trim());
								}
							} catch (error) {
								console.error(
									'Error in onScanResult callback:',
									error
								);
							}
						}, 0);

						// Stop the camera after a brief delay
						setTimeout(() => {
							const qrInstance = html5QrCodeRef.current;
							if (qrInstance) {
								qrInstance.stop().catch(console.warn);
								setScanning(false);
							}
						}, 100);
					}
				},
				(errorMessage: string) => {
					console.warn('QR Scan Error:', errorMessage);
				}
			);

			setScanning(true);
		} catch (err) {
			console.error('Camera error:', err);
			setCameraError(t('SCAN_QR_CAMERA_ERROR'));
		} finally {
			setIsCameraStarting(false);
		}
	}, [onScanResult, t]);

	return {
		scanning,
		isCameraStarting,
		cameraError,
		startCamera,
		stopCamera,
	};
};
