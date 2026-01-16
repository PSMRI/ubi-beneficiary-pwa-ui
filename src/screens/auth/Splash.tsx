import React, { ChangeEvent, useMemo } from 'react';
import {
	Flex,
	FormControl,
	FormHelperText,
	FormLabel,
	Image,
	Stack,
	Box,
	Spinner,
	Center,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/App.css';
import CommonButton from '../../components/common/button/Button';
import frameImage from '../../assets/images/frame.png';
import { changeLanguage } from 'i18next';
import FloatingSelect from '../../components/common/input/FloatingSelect';
import { useAuth } from '../../utils/context/checkToken';
import { useLanguageConfig } from '../../hooks/useLanguageConfig';

const Splash: React.FC = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();

	const { language, selectLanguage } = useAuth();
	const { languageConfig, isLanguagesLoaded } = useLanguageConfig();

	// Generate options from languageConfig API or fallback to hardcoded
	const options = useMemo(() => {
		if (isLanguagesLoaded && languageConfig && languageConfig.supportedLanguages.length > 0) {
			return languageConfig.supportedLanguages.map((lang) => ({
				label: lang.nativeLabel || lang.label,
				value: lang.code,
			}));
		}
		// Fallback to hardcoded options if API not loaded yet
		return [
			{ label: t('LOGIN_ENGLISH'), value: 'en' },
			{ label: t('LOGIN_HINDI'), value: 'hi' },
		];
	}, [isLanguagesLoaded, languageConfig, t]);

	const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
		const { value } = e.target;
		selectLanguage(e.target.value);
		changeLanguage(value);
	};

	const handleRedirect = () => {
		navigate('/SignUp');
	};
	return (
		<Box
			display="flex"
			justifyContent="center"
			alignItems="center"
			height="100vh"
			className="main-bg"
		>
			<Box
				height="100%"
				width="550px"
				bg="white"
				boxShadow="0px 0px 15px 0px #e1e1e1"
				alignItems="center"
				borderRadius="md"
			>
				<Flex
					height="50%"
					justifyContent="center"
					alignItems="center"
					className="purple-bg"
				>
					<Image
						src={frameImage}
						alt={t('SPLASH_LOGIN_IMAGE_ALT')}
						objectFit="contain"
						width="60%"
						height="400px"
					/>
				</Flex>
				<Stack p={4} mt={4} pt={12} className="login-form" shadow="lg">
					<form>
						<FormControl>
							<FormLabel color={'#45464F'}>
								{t('LOGIN_SELECT_PREFERRED_LANGUAGE')}
							</FormLabel>
							{isLanguagesLoaded ? (
								<FloatingSelect
									label={t('LOGIN_SELECT_LANGUAGE')}
									name="name"
									value={language.name}
									onChange={handleChange}
									options={options}
								/>
							) : (
								<Center py={4}>
									<Spinner size="md" color="#3c5fdd" />
								</Center>
							)}
							<FormHelperText marginTop={'-15px'}>
								{t('LOGIN_CHANGE_LATER')}
							</FormHelperText>
						</FormControl>
					</form>
					<CommonButton
						onClick={handleRedirect}
						label={t('LOGIN_REGISTER_BUTTON')}
						mt={8}
					/>
					<CommonButton
						onClick={() => {
							navigate('/Signin');
						}}
						label={t('LOGIN_BUTTON')}
						mt={8}
						variant="outline"
					/>
				</Stack>
			</Box>
		</Box>
	);
};

export default Splash;
