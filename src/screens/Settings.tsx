import React, { useState } from 'react';
import {
	Box,
	VStack,
	Text,
	useToast,
	Spinner,
	Center,
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
				heading: t('SETTINGS_LANGUAGE_PREFERENCE_TITLE') || 'Choose Language',
				handleBack,
			}}
			isBottombar={false}
		>
			<Box px={4} py={3}>
				<VStack spacing={3} align="stretch">
					{/* Language Selection Cards - Compact horizontal cards */}
					{isLanguagesLoaded && languageConfig ? (
						<VStack spacing={2.5} align="stretch">
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
										bg={isSelected ? '#F5F7FF' : 'white'}
										borderWidth="1px"
										borderColor={isSelected ? '#3c5fdd' : '#E2E8F0'}
										borderRadius="10px"
										p={3}
										minH="64px"
										display="flex"
										flexDirection="row"
										alignItems="center"
										justifyContent="space-between"
										transition="all 0.2s"
										sx={{
											'&:hover:not(:disabled)': {
												borderColor: isSelected ? '#3c5fdd' : '#CBD5E0',
												transform: 'translateY(-1px)',
												boxShadow: 'sm',
											},
											'&:active:not(:disabled)': {
												transform: 'none',
											},
										}}
										opacity={isChangingLanguage && !isSelected ? 0.5 : 1}
										w="100%"
									>
										<Box flex={1} display="flex" flexDirection="column" justifyContent="center">
											<Text
												fontSize="15px"
												fontWeight="500"
												color={isSelected ? '#3c5fdd' : '#433E3F'}
												textAlign="left"
												lineHeight="1.4"
											>
												{lang.nativeLabel || lang.label}
											</Text>
											{lang.label !== lang.nativeLabel && (
												<Text
													fontSize="13px"
													color="#767680"
													textAlign="left"
													mt={0.5}
													lineHeight="1.3"
												>
													{lang.label}
												</Text>
											)}
										</Box>
										{isSelected && (
											<Icon
												as={CheckIcon}
												boxSize={5}
												color="#3c5fdd"
												ml={2}
											/>
										)}
									</Box>
								);
							})}
						</VStack>
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
