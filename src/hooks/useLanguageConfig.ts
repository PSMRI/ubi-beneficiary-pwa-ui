import { useState, useEffect, useCallback } from 'react';
import { getMapping } from '../services/admin/admin';

export interface LanguageConfig {
	defaultLanguage: string;
	supportedLanguages: { code: string; label: string; nativeLabel: string }[];
}

// Simple module-level cache to prevent duplicate API calls
// Works for both admin and non-admin users
let cachedConfig: LanguageConfig | null = null;
let fetchPromise: Promise<LanguageConfig> | null = null;

/**
 * Custom hook to fetch and manage language configuration from the API
 * Uses simple caching to prevent repetitive API calls
 * Works for both admin and non-admin users
 * NO HARDCODED VALUES - Only uses API response
 * @returns { languageConfig, isLanguagesLoaded, error, refetch }
 */
export const useLanguageConfig = () => {
	const [languageConfig, setLanguageConfig] = useState<LanguageConfig | null>(null);
	const [isLanguagesLoaded, setIsLanguagesLoaded] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		const fetchLanguages = async (forceRefresh = false) => {
			// Clear cache if forcing refresh
			if (forceRefresh) {
				cachedConfig = null;
				fetchPromise = null;
			}

			try {
				// If already cached, use it immediately (synchronous - no unmount check needed)
				if (cachedConfig !== null) {
					setLanguageConfig(cachedConfig);
					setIsLanguagesLoaded(true);
					setError(null); // Clear any previous errors
					return;
				}

				// If already fetching, wait for existing promise (prevents duplicate calls)
				const existingPromise = fetchPromise;
				if (existingPromise !== null) {
					const config = await existingPromise;
					if (!isMounted) return; // Check after async operation
					setLanguageConfig(config);
					setIsLanguagesLoaded(true);
					setError(null);
					return;
				}

				// Create new fetch promise
				fetchPromise = (async () => {
					const res = await getMapping('languageConfig');
					
					// API response structure: { statusCode, message, data: { id, key, value: { defaultLanguage, supportedLanguages } } }
					if (res?.data?.value) {
						const config = res.data.value;
						
						if (
							config.supportedLanguages &&
							Array.isArray(config.supportedLanguages) &&
							config.supportedLanguages.length > 0 &&
							config.defaultLanguage
						) {
							cachedConfig = config; // Cache it
							return config;
						} else {
							throw new Error('Invalid language config format');
						}
					} else {
						throw new Error('Language config data not found in response');
					}
				})();

				const config = await fetchPromise;
				fetchPromise = null; // Clear promise after completion

				if (!isMounted) return; // Check after async operation

				setLanguageConfig(config);
				setError(null);
			} catch (err) {
				fetchPromise = null; // Clear promise on error
				
				if (!isMounted) return; // Check after async operation
				
				setError(err instanceof Error ? err.message : 'Failed to fetch language config');
			} finally {
				if (isMounted) {
					setIsLanguagesLoaded(true);
				}
			}
		};

		fetchLanguages();

		return () => {
			isMounted = false;
		};
	}, []);

	// Refetch function to force refresh cache
	const refetch = useCallback(async () => {
		cachedConfig = null;
		fetchPromise = null;
		
		// Trigger re-fetch by updating a dependency or calling directly
		// Since we can't easily re-trigger the effect, we'll manually fetch
		const res = await getMapping('languageConfig');
		if (res?.data?.value) {
			const config = res.data.value;
			if (
				config.supportedLanguages &&
				Array.isArray(config.supportedLanguages) &&
				config.supportedLanguages.length > 0 &&
				config.defaultLanguage
			) {
				cachedConfig = config;
				setLanguageConfig(config);
				setError(null);
			}
		}
	}, []);

	return { 
		languageConfig, 
		isLanguagesLoaded, 
		error,
		refetch
	};
};
