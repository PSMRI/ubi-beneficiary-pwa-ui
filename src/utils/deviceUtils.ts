/**
 * Device detection utilities
 */

/**
 * Checks if the current device is a mobile device
 * @returns {boolean} True if device is mobile
 */
export const isMobile = (): boolean => {
	return /Mobi|Android/i.test(navigator.userAgent);
};

