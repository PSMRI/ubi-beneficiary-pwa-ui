// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import your translation files
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

const initI18n = () => {
	return i18n.use(initReactI18next).init({
		resources: {
			en: {
				translation: en,
			},
			hi: {
				translation: hi,
			},
			mr: {
				translation: mr,
			},
		},
		lng: 'en', // default language
		fallbackLng: 'en', // fallback language
		debug: false, // Set to true for debugging
		interpolation: {
			escapeValue: false, // React already escapes content
		},
		react: {
			useSuspense: false, // Disable suspense for better compatibility
		},
	});
};

// Initialize immediately
initI18n();

export { initI18n };
export { default } from 'i18next';
