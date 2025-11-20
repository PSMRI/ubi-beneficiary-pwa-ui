import React, { useState, useEffect, useContext } from 'react';
import {
	Box,
	VStack,
	FormControl,
	useToast,
	Text,
	Image,
	IconButton,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { CloseIcon } from '@chakra-ui/icons';
import Layout from '../../components/common/layout/Layout';
import CommonButton from '../../components/common/button/Button';
import FloatingInput from '../../components/common/input/Input';
import FloatingSelect from '../../components/common/input/FloatingSelect';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../utils/context/checkToken';
import { updateUserProfile } from '../../services/user/User';
import { getUser, getDocumentsList } from '../../services/auth/auth';

const EditUserProfile: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const toast = useToast();
	const authContext = useContext(AuthContext);
	const userData = authContext?.userData;
	const updateUserData = authContext?.updateUserData;

	const [phoneNumber, setPhoneNumber] = useState<string>('');
	const [profilePicture, setProfilePicture] = useState<File | null>(null);
	const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
	const [contactNumber, setContactNumber] = useState<string>('');
	const [loading, setLoading] = useState(false);

	const contactNumberOptions = [
		{ value: 'self', label: t('SELF') },
		{ value: 'father', label: t('FATHER') },
		{ value: 'mother', label: t('MOTHER') },
		{ value: 'guardian', label: t('GUARDIAN') },
		{ value: 'Relative', label: t('RELATIVE') },
		{ value: 'Other', label: t('OTHER') },
	];

	// Prefill phone number and contact number from userData
	useEffect(() => {
		if (userData?.phoneNumber) {
			// Remove +91 prefix if present
			const phone = userData.phoneNumber.replace(/^\+91[- ]?/, '');
			setPhoneNumber(phone);
		}
		if (userData?.whosePhoneNumber) {
			setContactNumber(userData.whosePhoneNumber);
		}
		if (userData?.picture) {
			setProfilePicturePreview(userData.picture);
		}
	}, [userData]);

	const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				toast({
					title: 'Invalid File Type',
					description: 'Please upload an image file.',
					status: 'error',
					duration: 3000,
					isClosable: true,
				});
				return;
			}

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				toast({
					title: 'File Too Large',
					description: 'Please upload an image smaller than 5MB.',
					status: 'error',
					duration: 3000,
					isClosable: true,
				});
				return;
			}

			setProfilePicture(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setProfilePicturePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemoveProfilePicture = () => {
		setProfilePicture(null);
		setProfilePicturePreview(null);
	};

	const handleSubmit = async () => {
		// Validate phone number if provided
		if (phoneNumber.trim() && !/^\d{10}$/.test(phoneNumber.trim())) {
			toast({
				title: 'Validation Error',
				description: 'Phone number must be exactly 10 digits.',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}

		try {
			setLoading(true);

			// Call API to update user profile (all fields are optional)
			await updateUserProfile(phoneNumber, contactNumber, profilePicture);

			// Refresh user data after successful update
			if (updateUserData) {
				const result = await getUser();
				const data = await getDocumentsList();
				updateUserData(result?.data, data?.data?.value);
			}

			// Set isFirstTimeLogin to false in sessionStorage
			sessionStorage.setItem('isFirstTimeLogin', 'false');

			toast({
				title: 'Profile Updated',
				description: 'Your profile has been updated successfully.',
				status: 'success',
				duration: 3000,
				isClosable: true,
			});

			// Navigate back or to home
			navigate(-1);
		} catch (error: any) {
			toast({
				title: 'Update Failed',
				description: error?.response?.data?.message || error?.message || 'Failed to update profile. Please try again.',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
		} finally {
			setLoading(false);
		}
	};

	const handleBack = () => {
		navigate(-1);
	};

	return (
		<Layout
			isMenu={false}
			_heading={{
				heading: t('EDIT_USER_PROFILE_TITLE'),
				handleBack,
			}}
			isBottombar={false}
		>
			<Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
				<VStack spacing={4} align="stretch">
					<FormControl>
						<FloatingInput
							label={t('EDIT_USER_PROFILE_PHONE_NUMBER') || 'Enter Mobile Number'}
							value={phoneNumber}
							onChange={(e) => {
								const value = e.target.value.replaceAll(/\D/g, ''); // Remove non-digits
								if (value.length <= 10) {
									setPhoneNumber(value);
								}
							}}
							name="phoneNumber"
							isInvalid={phoneNumber.trim() !== '' && !/^\d{10}$/.test(phoneNumber.trim())}
							errorMessage={phoneNumber.trim() !== '' && !/^\d{10}$/.test(phoneNumber.trim()) ? 'Phone number must be exactly 10 digits' : ''}
						/>
					</FormControl>
						<FormControl>
						<FloatingSelect
							label={t('EDIT_USER_PROFILE_CONTACT_NUMBER_LABEL')}
							value={contactNumber}
							onChange={(e) => setContactNumber(e.target.value)}
							name="contactNumber"
							options={contactNumberOptions}
						/>
					</FormControl>
					<FormControl>
						<Box>
							<Text
								fontSize="sm"
								color="gray.600"
								mb={2}
								position="absolute"
								top="-10px"
								left="12px"
								bg="white"
								px={1}
								zIndex={100}
							>
								{t('EDIT_USER_PROFILE_UPLOAD_PICTURE')}
							</Text>
							<Box
								mt={4}
								border="2px dashed"
								borderColor="var(--input-color)"
								borderRadius="md"
								p={4}
								textAlign="center"
								position="relative"
							>
								{profilePicturePreview ? (
									<Box position="relative">
										<Image
											src={profilePicturePreview}
											alt="Profile Preview"
											maxH="200px"
											maxW="200px"
											mx="auto"
											borderRadius="md"
										/>
										<IconButton
											aria-label="Remove image"
											icon={<CloseIcon />}
											size="sm"
											position="absolute"
											top={0}
											right={0}
											onClick={handleRemoveProfilePicture}
											colorScheme="red"
											variant="solid"
										/>
									</Box>
								) : (
									<>
										<input
											type="file"
											id="profilePictureInput"
											accept="image/*"
											onChange={handleProfilePictureChange}
											style={{ display: 'none' }}
										/>
										<Box onClick={() => document.getElementById('profilePictureInput')?.click()}>
											<CommonButton
												variant="outline"
												label={t('EDIT_USER_PROFILE_UPLOAD_PICTURE')}
											/>
										</Box>
									</>
								)}
							</Box>
						</Box>
					</FormControl>
					<CommonButton
						loading={loading}
						loadingLabel="Saving..."
						onClick={handleSubmit}
						label={t('COMMON_BUTTON_SUBMIT_LABEL')}
						isDisabled={false}
					/>
				</VStack>
			</Box>
		</Layout>
	);
};

export default EditUserProfile;

