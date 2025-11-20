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
