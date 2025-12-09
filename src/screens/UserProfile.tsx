import React, { useContext, useEffect, useState } from 'react';
import { Avatar, Box, Flex, HStack, Text, VStack, Image } from '@chakra-ui/react';

import { getUser, getDocumentsList } from '../services/auth/auth';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/layout/Layout';
import { AuthContext } from '../utils/context/checkToken';
import DocumentList from '../components/DocumentList';

import ProgressBar from '../components/common/ProgressBar';
import UserDetails from '../components/common/UserDetails';

import UploadDocumentEwallet from '../components/common/UploadDocumentEwallet';
import { isWalletUploadEnabled } from '../utils/envUtils';
import CommonButton from '../components/common/button/Button';
import { useTranslation } from 'react-i18next';
import { EditIcon } from '@chakra-ui/icons';
const UserProfile: React.FC = () => {
	const [showIframe, setShowIframe] = useState(true);
	const { userData, documents, updateUserData } = useContext(AuthContext);
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [userName, setUserName] = useState('');
	const handleBack = () => {
		navigate('/');
	};
	// Function to fetch user data and documents
	const init = async () => {
		try {
			const result = await getUser();
			const data = await getDocumentsList();
			updateUserData(result?.data, data?.data?.value);
		} catch (error) {
			console.error('Error fetching user data or documents:', error);
		}
	};

	const redirectToEditProfile = () => {
		console.log('redirectToEditProfile');
		navigate('/edit-user-profile');
	}

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

	return (
		<Layout
			_heading={{
				heading: t('USER_PROFILE_HEADING'),
				handleBack: () => {
					handleBack();
				},
			}}
		>
			<HStack m={5} mt={0} p={0} h={82}>
				<Box position="relative" display="inline-block" mr={2}>
					{userData?.pictureUrl ? (
						<>
							<Image
								src={userData.pictureUrl}
								alt="Profile Picture"
								borderRadius="full"
								boxSize="60px"
								objectFit="cover"
							/>

							{/* Edit Icon Overlay */}
							<EditIcon
								boxSize={5}
								color="white"
								position="absolute"
								bottom="10"
								right="0"
								bg="gray.700"
								borderRadius="full"
								p={1}
								cursor="pointer"
								onClick={redirectToEditProfile}
							/>
						</>
					) : (
						<>
							<Avatar
								variant="solid"
								name={userData?.name || ''}
								boxSize="60px"
							/>

							<EditIcon
								boxSize={5}
								color="white"
								position="absolute"
								bottom="10"
								right="0"
								bg="gray.700"
								borderRadius="full"
								p={1}
								cursor="pointer"
								onClick={redirectToEditProfile}
							/>
						</>
					)}
				</Box>

				<VStack mt={8}>
					<Text
						fontSize="16px"
						fontWeight="500"
						lineHeight="24px"
						color="#433E3F"
						textAlign={'start'}
					>
						{userData?.name || ''}
					</Text>
					<Text
						fontSize="12px"
						fontWeight="500"
						lineHeight="16px"
						color="#433E3F"
						alignSelf={'flex-start'}
					>
						{userName}
					</Text>
					<Text
						fontSize="11px"
						fontWeight="500"
						lineHeight="16px"
						color="#433E3F"
						alignSelf={'flex-start'}
					>
						{userData?.phoneNumber
							? ` +91 ${userData?.phoneNumber}`
							: t('USER_PROFILE_PHONE_NUMBER')}
					</Text>
				</VStack>
			</HStack>

			<Box shadow="md" borderWidth="1px" borderRadius="md" p={2}>
				<ProgressBar
					totalDocuments={documents?.length}
					presentDocuments={userData?.docs?.length}
				/>
				<Flex
					alignItems="center"
					justifyContent="space-between"
					mt={3}
					ml={4}
				>
					<Text
						fontSize="16px"
						fontWeight="500"
						lineHeight="24px"
						color="#433E3F"
						mr={2} // Adds spacing between Text and IconButton
					>
						{t('USER_PROFILE_BASIC_DETAILS')}
					</Text>
				</Flex>

				<UserDetails
					userData={{
						name: userData?.name,
						dob: userData?.dob,
						customFields:
							userData?.customFields?.map((field) => ({
								...field,
								value: String(field.value || ''),
							})) || [],
					}}
				/>
				<Box
					p={5}
					shadow="md"
					borderWidth="1px"
					borderRadius="md"
					className="card-scroll invisible-scroll"
				>
					<VStack spacing={4} align="stretch">
						<DocumentList
							documents={documents}
							userDocuments={userData?.docs}
						/>
						{isWalletUploadEnabled() &&
							(showIframe ? (
								<UploadDocumentEwallet />
							) : (
								<CommonButton
									onClick={() => setShowIframe(true)}
									label={t(
										'USER_PROFILE_UPLOAD_DOCUMENT_BUTTON'
									)}
								/>
							))}
					</VStack>
				</Box>
			</Box>
		</Layout>
	);
};

export default UserProfile;