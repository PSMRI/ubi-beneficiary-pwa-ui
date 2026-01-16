import React, { useState } from 'react';
import {
	Box,
	VStack,
	Text,
	useToast,
	Spinner,
	Center,
	SimpleGrid,
	Icon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from 'i18next';
import { CheckIcon } from '@chakra-ui/icons';
import Layout from '../components/common/layout/Layout';
import { useAuth } from '../utils/context/checkToken';
import { useLanguageConfig } from '../hooks/useLanguageConfig';
import { getDocumentsList, getUser } from '../services/auth/auth';
import { ConfigService } from '../services/configService';

const Settings: React.FC = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const toast = useToast();
	const { language, selectLanguage, updateUserData } = useAuth();
	const { languageConfig, isLanguagesLoaded } = useLanguageConfig();
	const [isChangingLanguage, setIsChangingLanguage] = useState(false);

	const handleLanguageChange = async (langCode: string) => {
		// Don't do anything if same language is selected
		if (language.name === langCode) {
			return;
		}

		setIsChangingLanguage(true);
		try {
			// Update language in context and localStorage
			selectLanguage(langCode);
			changeLanguage(langCode);

			// Clear ConfigService cache to force fresh data fetch with new language
			ConfigService.clearCache();

			// Call APIs to get fresh data with new language
			const [userResult, documentsResult] = await Promise.all([
				getUser(),
				getDocumentsList(),
			]);

			// Update context with fresh data
			updateUserData(userResult?.data, documentsResult?.data?.value);

			// Dispatch custom event to trigger refresh in other components
			globalThis.dispatchEvent(new CustomEvent('languageChanged', { 
				detail: { language: langCode } 
			}));

			// Show success message
			toast({
				title: t('SETTINGS_LANGUAGE_CHANGED_TITLE') || 'Language Changed',
				description:
					t('SETTINGS_LANGUAGE_CHANGED_DESCRIPTION') ||
					'Language has been updated successfully',
				status: 'success',
				duration: 1500,
				isClosable: true,
			});

			// Automatically navigate back after a brief delay
			setTimeout(() => {
				navigate(-1);
			}, 500);
		} catch (error) {
			console.error('Error changing language:', error);
			toast({
				title: t('SETTINGS_LANGUAGE_CHANGE_ERROR_TITLE') || 'Error',
				description:
					t('SETTINGS_LANGUAGE_CHANGE_ERROR_DESCRIPTION') ||
					'Failed to change language. Please try again.',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
		} finally {
			setIsChangingLanguage(false);
		}
	};

	const handleBack = () => {
		navigate(-1);
	};

	return (
		<Layout
			isMenu={false}
			_heading={{
				heading: t('SETTINGS_LANGUAGE_PREFERENCE_TITLE') || 'Language Preference',
				handleBack,
			}}
			isBottombar={false}
		>
			<Box shadow="md" borderWidth="1px" borderRadius="md" p={2}>
				<VStack spacing={4} align="stretch">
					{/* Language Selection Cards - Simple square boxes, 2 per row */}
					{isLanguagesLoaded && languageConfig ? (
						<SimpleGrid columns={2} spacing={3} p={3}>
							{languageConfig.supportedLanguages.map((lang) => {
								const isSelected = language.name === lang.code;
								const isDisabled = isChangingLanguage || isSelected;
								return (
									<Box
										key={lang.code}
										as="button"
										onClick={() => handleLanguageChange(lang.code)}
										disabled={isDisabled}
										cursor={isDisabled ? 'not-allowed' : 'pointer'}
										bg="white"
										borderWidth="1px"
										borderColor={isSelected ? '#3c5fdd' : '#E2E8F0'}
										borderRadius="md"
										p={4}
										aspectRatio="1"
										display="flex"
										flexDirection="column"
										alignItems="center"
										justifyContent="center"
										minH="100px"
										opacity={isChangingLanguage && !isSelected ? 0.5 : 1}
									>
										<VStack spacing={1} align="center">
											<Text
												fontSize="16px"
												fontWeight="500"
												color="#433E3F"
												textAlign="center"
											>
												{lang.nativeLabel || lang.label}
											</Text>
											{lang.label !== lang.nativeLabel && (
												<Text
													fontSize="12px"
													color="#767680"
													textAlign="center"
												>
													{lang.label}
												</Text>
											)}
											{isSelected && (
												<Icon
													as={CheckIcon}
													boxSize={5}
													color="#3c5fdd"
													mt={1}
												/>
											)}
										</VStack>
									</Box>
								);
							})}
						</SimpleGrid>
					) : (
						<Center py={8}>
							<Spinner size="lg" color="#3c5fdd" />
						</Center>
					)}

					{isChangingLanguage && (
						<Box
							textAlign="center"
							py={3}
							px={4}
						>
							<Spinner size="sm" color="#3c5fdd" mr={2} />
							<Text
								as="span"
								fontSize="14px"
								color="#433E3F"
								fontWeight="400"
							>
								{t('SETTINGS_UPDATING_LANGUAGE') ||
									'Updating language...'}
							</Text>
						</Box>
					)}
				</VStack>
			</Box>
		</Layout>
	);
};

export default Settings;
