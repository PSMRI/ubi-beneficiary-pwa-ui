import React, { useContext, useEffect, useState } from 'react';
import { Box, useToast, VStack } from '@chakra-ui/react';
import {
	getUser,
	getDocumentsList,
	sendConsent,
	getUserConsents,
	logoutUser,
} from '../services/auth/auth';
import { useNavigate } from 'react-router-dom';
import CommonButton from '../components/common/button/Button';
import Layout from '../components/common/layout/Layout';
import { AuthContext } from '../utils/context/checkToken';
import { useTranslation } from 'react-i18next';
import DocumentList from '../components/DocumentList';
// import { useKeycloak } from '@react-keycloak/web'; // NOSONAR
import '../assets/styles/App.css';
import UploadDocumentEwallet from '../components/common/UploadDocumentEwallet';
import { isWalletUploadEnabled } from '../utils/envUtils';
import CommonDialogue from '../components/common/Dialogue';
import termsAndConditions from '../assets/termsAndConditions.json';
/* import { getAadhar, getDigiLockerRequest } from '../services/dhiway/aadhar'; */ // NOSONAR

const Home: React.FC = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [showIframe, setShowIframe] = useState(false);
	const [consentSaved, setConsentSaved] = useState(false);
	// const { keycloak } = useKeycloak(); // NOSONAR
	const { userData, documents, updateUserData } = useContext(AuthContext)!;
	const [userName, setUserName] = useState('');
	const purpose = 'sign_up_tnc';
	const purpose_text = 'sign_up_tnc';
	const toast = useToast();
	/* 	const [fetchingAadhar, setFetchingAadhar] = useState(false); */ // NOSONAR

	const handleRedirect = () => {
		navigate('/explorebenefits');
	};
	const handleScanRedirect = () => {
		navigate('/document-scanner');
	};
	const init = async () => {
		try {
			const result = await getUser();
			const data = await getDocumentsList();
			updateUserData(result?.data, data?.data?.value);
		} catch (error) {
			console.error('Error fetching user data or documents:', error);
		}
	};

	const handleConsent = async () => {
		setConsentSaved(!consentSaved);
		try {
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

	const checkConsent = (consent: any[]) => {
		const isPurposeMatched = consent.some(
			(item) => item.purpose === purpose
		);

		if (!isPurposeMatched) {
			setConsentSaved(true);
		}
	};

	const getConsent = async () => {
		try {
			const response = await getUserConsents();
			checkConsent(response?.data.data);
		} catch (error) {
			console.log(t('HOME_CONSENTS_LOAD_ERROR'), error);
		}
	};

	const saveConsent = async () => {
		try {
			await sendConsent(userData?.user_id, purpose, purpose_text);
			setConsentSaved(false);

			// Check if isFirstTimeLogin is true in sessionStorage
			const isFirstTimeLogin = sessionStorage.getItem('isFirstTimeLogin');
			if (isFirstTimeLogin === 'true') {
				// Redirect to edit-user-profile page
				navigate('/edit-user-profile');
				return;
			}
		} catch {
			console.log(t('HOME_CONSENT_SEND_ERROR'));
		}
	};

	useEffect(() => {
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			try {
				const storedUserData = JSON.parse(storedUser);
				setUserName(String(storedUserData?.accountId ?? ''));
			} catch (e) {
				console.error('Failed to parse stored user JSON', e);
				setUserName('');
			}
		}
		if (!userData || !documents || documents.length === 0) {
			init();
		}
	}, [userData, documents]);

	useEffect(() => {
		getConsent();
	}, []);

	/* 	const handleAadharFetch = async () => {
		try {
			const digilockerURL = await getDigiLockerRequest();

			const popup = window.open(
				digilockerURL.url,
				'DigiLockerPopup',
				'width=800,height=600,resizable,scrollbars'
			);

			if (!popup) {
				console.error(
					'Failed to open popup. Please allow popups for this website.'
				);
				return;
			}

			const handleMessage = async (event) => {
				if (event.origin !== import.meta.env.VITE_DHIWAY_REDIRECT_URL)
					return;

				const { type, finalUrl } = event.data;

				if (type === 'DIGILOCKER_DONE') {
					const url = new URL(finalUrl);

					const uriCode = url.searchParams.get('code');

					if (popup && !popup.closed) {
						popup.close();
					}

					cleanupListener();
					clearInterval(interval);

					setFetchingAadhar(true);
					try {
						await getAadhar(uriCode, userData.user_id);
						// handle result if needed
					} catch (error) {
						console.error('Failed to fetch Aadhaar:', error);
					} finally {
						setFetchingAadhar(false); // Ensure it's reset
						init();
					}
				}
			};

			window.addEventListener('message', handleMessage);

			const cleanupListener = () => {
				window.removeEventListener('message', handleMessage);
			};

			const interval = setInterval(() => {
				if (popup.closed) {
					clearInterval(interval);
					cleanupListener();
				}
			}, 500);
		} catch (err) {
			console.error('Error fetching DigiLocker URL:', err);
		}
	}; */ // NOSONAR

	return (
		<Layout
			_heading={{
				beneficiary: true,
				heading: `${userData?.firstName || ''} ${userData?.lastName || ''}`,
				profileSubHeading: `${userName}`,
				// label: keycloak.tokenParsed?.preferred_username,
			}}
		>
			<Box shadow="md" borderWidth="1px" borderRadius="md" p={2}>
				<VStack spacing={4} align="stretch">
					<DocumentList
						documents={documents}
						userDocuments={userData?.docs}
					/>
					<CommonButton
						onClick={handleScanRedirect}
						label={t('SCAN_UPLOAD_DOCUMENT')}
					/>
					{/* <CommonButton
						onClick={handleAadharFetch}
						label={t('FETCH_AADHAAR_FROM_DIGILOCKER')}
						loading={fetchingAadhar}
						loadingLabel={t('FETCHING_AADHAAR')}
					/> */}
					<CommonButton
						onClick={handleRedirect}
						label={t('PROFILE_EXPLORE_BENEFITS')}
					/>
					{isWalletUploadEnabled() &&
						(!showIframe ? (
							<UploadDocumentEwallet />
						) : (
							<CommonButton
								onClick={() => setShowIframe(false)}
								label={t('HIDE_DIGILOCKER')}
							/>
						))}
				</VStack>
			</Box>

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

export default Home;
