/**
 * Configuration constants for document scanning
 */
import { getMaxFileSizeMB } from '../../utils/envUtils';

// File size limits
export const MAX_FILE_SIZE_MB = getMaxFileSizeMB(); // Maximum file size in megabytes from env
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes

// Compression settings for captured images
export const COMPRESSION_SETTINGS = {
	maxWidth: 1920,
	maxHeight: 1920,
	quality: 0.85,
	maxSizeMB: MAX_FILE_SIZE_MB,
};

// QR Scanner configuration
export const QR_SCANNER_CONFIG = {
	fps: 10,
	qrbox: 250,
};

// Camera capture configuration
export const CAMERA_CONSTRAINTS = {
	width: { ideal: 1920 },
	height: { ideal: 1080 },
};

// Scanner container ID
export const SCANNER_CONTAINER_ID = 'html5qr-code-full-region';
