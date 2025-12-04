import React, { useEffect, useState } from 'react';
import {
	Box,
	FormControl,
	Text,
	VStack,
	Center,
	useToast,
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import CommonButton from '../../components/common/button/Button';
import Layout from '../../components/common/layout/Layout';
import FloatingInput from '../../components/common/input/Input';
import FloatingPasswordInput from '../../components/common/input/PasswordInput';
import { loginUser } from '../../services/auth/auth';
import { useTranslation } from 'react-i18next';

const SignIn: React.FC = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const toast = useToast();

	const [username, setUsername] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [loading, setLoading] = useState(false);
	const [isFormValid, setIsFormValid] = useState<boolean>(false);

	// Check for prefilled credentials from registration or password update
	useEffect(() => {
		const storedUsername = sessionStorage.getItem('prefill_username');
		const storedPassword = sessionStorage.getItem('prefill_password');

		if (storedUsername) {
			setUsername(storedUsername);
		}
		if (storedPassword) {
			setPassword(storedPassword);
		}
	}, []);

	useEffect(() => {
		// Check for empty fields after trimming spaces
		const isValid = username.trim() !== '' && password.trim() !== '';

		// Set form validity
		setIsFormValid(isValid);
	}, [username, password]);

	const handleLogin = async () => {
		try {
			setLoading(true);

			const trimmedUsername = username.trim();

			const response = await loginUser({
				username: trimmedUsername,
				password,
			});

			// ✅ Success case
			if (response?.data?.access_token) {
				localStorage.setItem('authToken', response.data.access_token);
				localStorage.setItem('refreshToken', response.data.refresh_token);

				if (response.data.walletToken) {
					localStorage.setItem('walletToken', response.data.walletToken);
				}

				const userData = {
					accountId: response.data.username,
					firstName: response.data.firstName ?? '',
					lastName: response.data.lastName ?? '',
					email: response.data.email ?? '',
					phone: response.data.phone ?? '',
					username: response.data.username,
				};
				localStorage.setItem('user', JSON.stringify(userData));

				toast({
					title: t('SIGNIN_SUCCESSFULL'),
					status: 'success',
					duration: 3000,
					isClosable: true,
				});

				// Check if this is a first-time login after password update
				const isFirstTimeLogin = sessionStorage.getItem('isFirstTimeLogin');
				if (isFirstTimeLogin === 'true') {
					// Redirect to edit-user-profile page for first-time login
					navigate('/edit-user-profile');
					return;
				}

				navigate(0);
				return;
			}

			throw new Error(t('SIGNIN_INVALID_RESPONSE_ERROR'));
		} catch (error: any) {
			// 👇 Handle password update required case
			console.log("in catch", error);

			if (
				error?.response?.status === 403 &&
				error?.response?.data?.error === 'PASSWORD_UPDATE_REQUIRED'
			) {
				toast({
					title: t('SIGNIN_PASSWORD_UPDATE_REQUIRED_TITLE') || 'Password Update Required',
					description: error?.response?.data?.message ||
						t('SIGNIN_PASSWORD_UPDATE_REQUIRED_DESC'),
					status: 'warning',
					duration: 3000,
					isClosable: true,
				});

				// Store username for update password flow
				localStorage.setItem('pendingUser', username.trim());
				navigate('/update-password');
				return;
			}

			// Handle invalid credentials
			if (error?.response?.status === 401) {
				toast({
					title: t('SIGNIN_FAILED'),
					description: t('SIGNIN_INVALID_CREDENTIALS') || 'Invalid username or password',
					status: 'error',
					duration: 3000,
					isClosable: true,
				});
				return;
			}

			// Other unknown errors
			toast({
				title: t('SIGNIN_FAILED'),
				description: error?.message ?? t('SIGNIN_UNKNOWN_ERROR'),
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
		} finally {
			setLoading(false);
		}
	};



	const handleBack = () => {
		navigate('/');
	};
	return (
		<Layout
			isMenu={false}
			_heading={{
				heading: t('LOGIN_BUTTON'),
				handleBack,
			}}
			isBottombar={false}
		>
			<Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
				<VStack align="stretch">
					<FormControl>
						<FloatingInput
							label={t('SIGNIN_ENTER_USERNAME')}
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							isInvalid={username.trim() === ''}
							errorMessage={t('SIGNIN_USER_NAME_IS_REQUIRED')}
						/>
						<FloatingPasswordInput
							label={t('SIGNIN_ENTER_PASSWORD')}
							value={password}
							onChange={(
								e: React.ChangeEvent<HTMLInputElement>
							) => setPassword(e.target.value)}
							isInvalid={password.trim() === ''}
							errorMessage={t('SIGNIN_PASSWORD_IS_REQUIRED')}
						/>
					</FormControl>
					<CommonButton
						isDisabled={!isFormValid}
						loading={loading}
						loadingLabel="Signing in..."
						onClick={() => handleLogin()}
						label={t('LOGIN_BUTTON')}
					/>
				</VStack>

				<Center>
					<Text mt={6}>
						{t('SIGNIN_DONT_HAVE_AN_ACCOUNT')}
						<Box as="span" ml={2}>
							<Link
								to="/signup"
								className="text-color text-decoration-underline"
							>
								{t('LOGIN_REGISTER_BUTTON')}
							</Link>
						</Box>
					</Text>
				</Center>
			</Box>
		</Layout>
	);
};

export default SignIn;
