import React, { useState, useEffect, useContext } from 'react';
import {
	Box,
	VStack,
	FormControl,
	useToast,
	Text,
	Image,
	IconButton,
	HStack,
	Button,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { CloseIcon } from '@chakra-ui/icons';
import { IoCameraReverse } from 'react-icons/io5';
import Layout from '../../components/common/layout/Layout';
import CommonButton from '../../components/common/button/Button';
import FloatingInput from '../../components/common/input/Input';
import FloatingSelect from '../../components/common/input/FloatingSelect';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../utils/context/checkToken';
import {
	updateUserProfile,
	getUserProfileFields,
} from '../../services/user/User';
import {
	getUser,
	getDocumentsList,
	getUserConsents,
	sendConsent,
	logoutUser,
} from '../../services/auth/auth';
import { getProfilePictureMaxSizeMB } from '../../utils/envUtils';
import { isMobile as isMobileDevice } from '../../utils/deviceUtils';
import CommonDialogue from '../../components/common/Dialogue';
import termsAndConditions from '../../assets/termsAndConditions.json';
import { useCameraCapture } from '../../components/scan/hooks/useCameraCapture';
import { CapturedImagePreview } from '../../components/scan/CapturedImagePreview';
import { validateMobileNumber } from '../../utils/formValidation';

const EditUserProfile: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const toast = useToast();
	const authContext = useContext(AuthContext);
	const userData = authContext?.userData;
	const updateUserData = authContext?.updateUserData;

	const [phoneNumber, setPhoneNumber] = useState<string>('');
	const [phoneNumberError, setPhoneNumberError] = useState<string>('');
	const [profilePicture, setProfilePicture] = useState<File | null>(null);
	const [profilePicturePreview, setProfilePicturePreview] = useState<
		string | null
	>(null);
	const [contactNumber, setContactNumber] = useState<string>('');
	const [loading, setLoading] = useState(false);
	const isMobile = isMobileDevice();

	// Get profile picture max size from environment
	const maxProfilePictureSize = getProfilePictureMaxSizeMB();
	const [consentSaved, setConsentSaved] = useState(false);
	const [consentChecked, setConsentChecked] = useState(false);

	// Camera capture hook for profile picture
	const {
		isCapturing,
		capturedImage,
		capturedFile,
		isCompressing,
		originalFileSize,
		compressedFileSize,
		showCompressionInfo,
		cameraError,
		videoRef,
		startCaptureCamera,
		stopCaptureCamera,
		capturePhoto,
		handleRetakePhoto,
		handleCancelCapture,
		switchCamera,
	} = useCameraCapture();

	const purpose = 'sign_up_tnc';
	const purpose_text = 'sign_up_tnc';

	// Initialize user data (like Home.tsx)
	const init = async () => {
		try {
			const result = await getUser();
			const data = await getDocumentsList();
			updateUserData?.(result?.data, data?.data?.value);
		} catch (error) {
			console.error('Error fetching user data or documents:', error);
		}
	};

	const [contactNumberOptions, setContactNumberOptions] = useState([
		{ value: 'self', label: t('SELF') },
		{ value: 'father', label: t('FATHER') },
		{ value: 'mother', label: t('MOTHER') },
		{ value: 'guardian', label: t('GUARDIAN') },
		{ value: 'relative', label: t('RELATIVE') },
		{ value: 'other', label: t('OTHER') },
	]);

	// Fetch dynamic fields options
	useEffect(() => {
		const fetchFields = async () => {
			try {
				const fields = await getUserProfileFields();
				const whosePhoneField = fields.find(
					(f: any) => f.name === 'whosePhoneNumber'
				);
				if (whosePhoneField?.fieldParams?.options) {
					const options = whosePhoneField.fieldParams.options.map(
						(opt: any) => ({
							value: opt.value,
							label: opt.name,
						})
					);
					setContactNumberOptions(options);
				}
			} catch (e) {
				console.error('Failed to fetch user profile fields options', e);
			}
		};
		fetchFields();
	}, []);

	// Initialize userData and check consent (like Home page)
	useEffect(() => {
		if (!userData?.user_id) {
			init();
		}
	}, [userData]);

	// Check consent after userData is available (only once)
	useEffect(() => {
		if (userData?.user_id && !consentChecked) {
			setConsentChecked(true);
			getConsent();
		}
	}, [userData?.user_id, consentChecked]);

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

	const handleProfilePictureChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
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

			// Validate file size (max configurable MB)
			if (file.size > maxProfilePictureSize * 1024 * 1024) {
				const errorMessage = t(
					'EDIT_USER_PROFILE_FILE_TOO_LARGE'
				).replaceAll('{maxSize}', maxProfilePictureSize.toString());
				toast({
					title: 'File Too Large',
					description: errorMessage,
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
		// Also clear any captured image
		handleCancelCapture();
	};

	// Handle camera capture for profile picture
	const handleStartCameraCapture = async () => {
		// Clear any existing profile picture
		setProfilePicture(null);
		setProfilePicturePreview(null);
		// Start camera
		await startCaptureCamera();
	};

	// Handle using captured image as profile picture
	const handleUseCapturedImage = () => {
		if (capturedFile && capturedImage) {
			setProfilePicture(capturedFile);
			setProfilePicturePreview(capturedImage);
			// Clear camera capture state
			handleCancelCapture();
			toast({
				title: 'Photo Captured',
				description: 'Photo has been set as your profile picture.',
				status: 'success',
				duration: 3000,
				isClosable: true,
			});
		}
	};

	// Real-time phone number validation
	const handlePhoneNumberChange = (value: string) => {
		setPhoneNumber(value);

		// Validate phone number in real-time
		const mobileValidation = validateMobileNumber(value);
		if (!mobileValidation.isValid && value.trim() !== '') {
			setPhoneNumberError(t(mobileValidation.errorKey) || 'Please enter a valid mobile number.');
		} else {
			setPhoneNumberError('');
		}
	};

	const handleSubmit = async () => {
		try {
			setLoading(true);

			// Call API to update user profile (all fields are optional)
			await updateUserProfile(phoneNumber, contactNumber, profilePicture);

			toast({
				title: t('EDITPROFILE_PROFILE_UPDATED_TITLE') || 'Profile Updated',
				description: t('EDITPROFILE_PROFILE_UPDATED_DESCRIPTION') || 'Your profile has been updated successfully.',
				status: 'success',
				duration: 3000,
				isClosable: true,
			});

			// Check if this was a first-time login flow
			const isFirstTimeLogin = sessionStorage.getItem('isFirstTimeLogin');
			if (isFirstTimeLogin === 'true') {
				// Set isFirstTimeLogin to false first
				sessionStorage.setItem('isFirstTimeLogin', 'false');
			}

			// Redirect to userprofile page after profile update (for both first-time and regular updates)

			// Refresh user data before specific navigation
			await init();

			// Notify App.tsx to update routes (if we were in guest mode)
			window.dispatchEvent(new Event('authTokenUpdated'));

			navigate('/userprofile');
		} catch (error: any) {
			toast({
				title: t('EDITPROFILE_UPDATE_FAILED_TITLE') || 'Update Failed',
				description:
					error?.response?.data?.message ||
					error?.message ||
					t('EDITPROFILE_UPDATE_ERROR') || 'Failed to update profile. Please try again.',
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

	// Consent form functions (similar to Home.tsx)
	const checkConsent = (consent: any[]) => {
		console.log('EditProfile - Checking consent array:', consent);
		const isPurposeMatched = consent.some(
			(item) => item.purpose === purpose
		);
		console.log(
			'EditProfile - Purpose matched:',
			isPurposeMatched,
			'for purpose:',
			purpose
		);

		// Show consent if user hasn't consented (like Home page)
		if (!isPurposeMatched) {
			console.log('EditProfile - Showing consent dialog');
			setConsentSaved(true);
		}
	};

	const getConsent = async () => {
		try {
			console.log(
				'EditProfile - Getting consent for user:',
				userData?.user_id
			);
			const response = await getUserConsents();
			console.log('EditProfile - Consent response:', response?.data);
			checkConsent(response?.data.data);
		} catch (error) {
			console.log(
				'EditProfile - Error getting consent (non-critical):',
				error
			);
			// Don't show error toast for consent check failures
			// This prevents 401 errors from causing logout during consent operations
		}
	};

	const handleConsent = async () => {
		setConsentSaved(!consentSaved);
		try {
			console.log('EditProfile - User denied consent, logging out');
			const response = await logoutUser();
			if (response) {
				navigate('/');
				navigate(0);
			}
		} catch (error) {
			console.log(error);
			toast({
				title: t('HOME_LOGOUT_FAILED'),
				status: 'error',
				duration: 3000,
				isClosable: true,
				description: t('HOME_TRY_AGAIN'),
			});
		}
	};

	const saveConsent = async () => {
		try {
			console.log('EditProfile - userData:', userData);
			console.log(
				'EditProfile - Sending consent with user_id:',
				userData?.user_id,
				'purpose:',
				purpose,
				'purpose_text:',
				purpose_text
			);

			// Try to get user_id from userData or localStorage as fallback
			let userId = userData?.user_id;

			if (!userId) {
				// Fallback: try to get user data from localStorage
				const storedUser = localStorage.getItem('user');
				if (storedUser) {
					try {
						const parsedUser = JSON.parse(storedUser);
						userId = parsedUser?.user_id || parsedUser?.accountId;
						console.log(
							'EditProfile - Using fallback user_id from localStorage:',
							userId
						);
					} catch (e) {
						console.error('Failed to parse stored user:', e);
					}
				}
			}

			if (!userId) {
				// Try to refresh user data
				await init();
				userId = userData?.user_id;
			}

			if (!userId) {
				throw new Error(
					'User ID not found. Please try refreshing the page.'
				);
			}

			await sendConsent(userId, purpose, purpose_text);
			setConsentSaved(false);
			toast({
				title: 'Consent Saved',
				description: 'Your consent has been saved successfully.',
				status: 'success',
				duration: 3000,
				isClosable: true,
			});
		} catch (error) {
			console.log(t('HOME_CONSENT_SEND_ERROR'), error);
			toast({
				title: 'Consent Error',
				description: `Failed to save consent: ${error.message}`,
				status: 'error',
				duration: 5000,
				isClosable: true,
			});
		}
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
				<VStack spacing={2} align="stretch">
					<FormControl>
						<FloatingInput
							label={
								t('EDIT_USER_PROFILE_PHONE_NUMBER') ||
								'Enter Mobile Number'
							}
							value={phoneNumber}
							onChange={(e) => {
								const value = e.target.value.replaceAll(
									/\D/g,
									''
								); // Remove non-digits
								if (value.length <= 10) {
									handlePhoneNumberChange(value);
								}
							}}
							name="phoneNumber"
							isInvalid={phoneNumberError !== ''}
							errorMessage={phoneNumberError}
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
							<Box
								mt={4}
								border="2px dashed"
								borderColor="var(--input-color)"
								borderRadius="md"
								p={4}
								textAlign="center"
								position="relative"
							>
								{/* Camera capture view */}
								{isCapturing && (
									<Box textAlign="center">
										<Box
											position="relative"
											width="100%"
											height={isMobile ? '350px' : '400px'}
											bg="black"
											borderRadius="md"
											overflow="hidden"
											mb={3}
											display="flex"
											justifyContent="center"
											alignItems="center"
										>
											<video
												ref={videoRef}
												autoPlay
												playsInline
												muted
												aria-label="Camera preview for profile picture"
												style={{
													width: '100%',
													height: '100%',
													objectFit: 'cover',
													transform: 'scaleX(1)',
												}}
											>
												<track kind="captions" />
											</video>
											{isMobile && (
												<Button
													position="absolute"
													top={4}
													right={4}
													colorScheme="blackAlpha"
													size="sm"
													onClick={switchCamera}
													leftIcon={
														<IoCameraReverse />
													}
													zIndex={10}
												>
													{t('Switch Camera') ||
														'Switch Camera'}
												</Button>
											)}
										</Box>
										<HStack
											spacing={2}
											justifyContent="center"
										>
											<Button
												colorScheme="green"
												size="md"
												onClick={capturePhoto}
												width="120px"
											>
												{t('SCAN_CAPTURE_PHOTO')}
											</Button>
											<Button
												colorScheme="gray"
												size="md"
												onClick={stopCaptureCamera}
												width="120px"
											>
												{t('SCAN_CANCEL') || 'Cancel'}
											</Button>
										</HStack>
									</Box>
								)}

								{/* Preview captured image */}
								{capturedImage && !isCapturing && (
									<CapturedImagePreview
										capturedImage={capturedImage}
										isCompressing={isCompressing}
										originalFileSize={originalFileSize}
										compressedFileSize={compressedFileSize}
										showCompressionInfo={showCompressionInfo}
										isUploading={false}
										onUpload={handleUseCapturedImage}
										onRetake={handleRetakePhoto}
										onCancel={handleCancelCapture}
									/>
								)}

								{/* Show selected/captured profile picture */}
								{profilePicturePreview &&
									!isCapturing &&
									!capturedImage && (
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
												onClick={
													handleRemoveProfilePicture
												}
												colorScheme="red"
												variant="solid"
											/>
										</Box>
									)}

								{/* Upload options when no image is selected */}
								{!profilePicturePreview &&
									!isCapturing &&
									!capturedImage && (
										<VStack spacing={4}>
											<input
												type="file"
												id="profilePictureInput"
												accept="image/*"
												onChange={
													handleProfilePictureChange
												}
												style={{ display: 'none' }}
											/>

											{/* Upload from gallery button */}
											<Button
												colorScheme="teal"
												size="lg"
												width="100%"
												onClick={() =>
													document
														.getElementById(
															'profilePictureInput'
														)
														?.click()
												}
											>
												{t(
													'EDIT_USER_PROFILE_UPLOAD_PICTURE'
												).replaceAll(
													'{maxSize}',
													maxProfilePictureSize.toString()
												)}
											</Button>

											{/* OR text - Always visible now */}
											<Text
												textAlign="center"
												fontWeight="normal"
												color="gray.500"
												fontSize="sm"
											>
												{t('OR')}
											</Text>

											{/* Camera capture button - Always visible now */}
											<Button
												colorScheme="purple"
												size="lg"
												width="100%"
												onClick={
													handleStartCameraCapture
												}
											>
												{t(
													'SCAN_CAPTURE_PHOTO_CAMERA'
												)}
											</Button>
										</VStack>
									)}

								{/* Camera error */}
								{cameraError && (
									<Box
										bg="red.50"
										p={2}
										borderRadius="md"
										mt={2}
									>
										<Text color="red.600" fontSize="sm">
											{cameraError}
										</Text>
									</Box>
								)}
							</Box>
						</Box>
					</FormControl>
					<CommonButton
						loading={loading}
						loadingLabel="Saving..."
						onClick={handleSubmit}
						label={t('COMMON_BUTTON_SUBMIT_LABEL')}
						isDisabled={phoneNumberError !== ''}
					/>
				</VStack>
			</Box>

			{/* Consent dialog for first-time login users */}
			{consentSaved && (
				<CommonDialogue
					isOpen={consentSaved}
					onClose={handleConsent}
					termsAndConditions={termsAndConditions}
					handleDialog={saveConsent}
				/>
			)}
		</Layout>
	);
};

export default EditUserProfile;
