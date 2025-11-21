/**
 * Utility functions for environment variable checks
 */

/**
 * Check if wallet upload feature is enabled via environment variable
 * @returns boolean indicating if wallet upload is enabled
 */
export const isWalletUploadEnabled = (): boolean => {
	const enableWalletUpload = import.meta.env.VITE_ENABLE_WALLET_UPLOAD;

	// Default to true if environment variable is not set
	// Only disable if explicitly set to 'false' (string) or false (boolean)
	if (enableWalletUpload === 'false' || enableWalletUpload === false) {
		return false;
	}

	return true;
};

/**
 * Get the maximum file size in megabytes from environment variable
 * @returns number representing max file size in MB (defaults to 2 if not set)
 */
export const getMaxFileSizeMB = (): number => {
	const maxFileSizeMB = import.meta.env.VITE_DOCUMENT_MAX_FILE_SIZE_MB;

	// Parse the value and default to 5 MB if not set or invalid
	const parsed = Number.parseFloat(maxFileSizeMB);
	return Number.isNaN(parsed) ? 5 : parsed;
};

/**
 * Get the maximum profile picture size in megabytes from environment variable
 * @returns number representing max profile picture size in MB (defaults to 10 if not set)
 */
export const getProfilePictureMaxSizeMB = (): number => {
	const maxFileSizeMB = import.meta.env.VITE_PROFILE_PICTURE_MAX_SIZE_MB;

	// Parse the value and default to 10 MB if not set or invalid
	const parsed = Number.parseFloat(maxFileSizeMB);
	return Number.isNaN(parsed) ? 10 : parsed;
};
