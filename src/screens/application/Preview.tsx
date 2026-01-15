import React, { useEffect, useState } from 'react';
import {
	Box,
	HStack,
	ListItem,
	Text,
	UnorderedList,
	useToast,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApplicationDetails } from '../../services/auth/auth';
import Layout from '../../components/common/layout/Layout';
import {
	formatDocuments,
	getPreviewDetails,
	getSubmmitedDoc,
} from '../../utils/jsHelper/helper';
import { t } from 'i18next';

interface UserData {
	id: number;
	label: string;
	value: string;
	length?: number;
}

const labelStyles = {
	fontSize: '16px',
	fontWeight: '600',
	mb: 1,
	color: '#06164B',
	lineHeight: '16px',
};

const valueStyles = {
	fontSize: '16px',
	fontWeight: '400',
	color: '#1F1B13',
	lineHeight: '14px',
};
const Preview: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [userData, setUserData] = useState<UserData[]>();
	const [benefitName, setBenefitName] = useState<string | undefined>('');
	const [status, setStatus] = useState('');
	const [document, setDocument] = useState<{ key: string; value: string }[]>(
		[]
	);
	const [loading, setLoading] = useState(true);
	const toast = useToast();
	const handleBack = () => {
		navigate('/applicationstatus');
	};
	const getStatus = (status: string) => {
		switch (status) {
			case 'application approved':
				return t('APPLICATION_STATUS_APPROVED');
			case 'application rejected':
				return t('APPLICATION_STATUS_REJECTED');
			case 'application pending':
			case 'submitted':
				return t('APPLICATION_STATUS_PENDING');
			case 'application resubmit':
				return t('APPLICATION_STATUS_RESUBMIT');
			default:
				return t('APPLICATION_STATUS_INITIATED');
		}
	};
	const init = async () => {
		try {
			if (!id) {
				toast({
					title: 'Error',
					description: 'Invalid application ID',
					status: 'error',
					duration: 3000,
					isClosable: true,
				});
				navigate('/applicationstatus');
				return;
			}
			setLoading(true);

			const result = await getApplicationDetails(id);
			console.log(result.data.status);
			setStatus(result?.data?.status);
			if (result?.data?.application_data?.vc_documents) {
				const formattedDoc = formatDocuments(
					result?.data?.application_data?.vc_documents
				);
				setDocument(formattedDoc);
				const data = getPreviewDetails(result?.data?.application_data);
				setUserData(data);
			} else {
				const doc = getSubmmitedDoc(result?.data?.application_data);
				const data = getPreviewDetails(
					result?.data?.application_data,
					doc
				);
				setUserData(data);
				const seen = new Set();
				const filteredDoc = doc.filter((item) => {
					if (seen.has(item.value)) return false;
					seen.add(item.value);
					return true;
				});
				setDocument(filteredDoc);
			}

			setBenefitName(result?.data?.bpp_application_id);

			setLoading(false);
		} catch (error) {
			console.error('Error fetching application details:', error);

			toast({
				title: 'Error',
				description: 'Failed to fetch application details',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			navigate('/applicationstatus');
		}
	};


	useEffect(() => {
		init();
	}, [id]);

	return (
		<Layout
			_heading={{
				heading: t('PREVIEW_MY_APPLICATIONS_TITLE'),
				subHeading: `${t('PREVIEW_ORDER_ID_PREFIX')} ${benefitName}`,
				handleBack,
			}}
			loading={loading}
		>
			<HStack
				justifyContent="space-between"
				alignItems="center"
				bg="#DEE4F9"
				p={3}
				height="52px"
			>
				<Text fontWeight={400} fontSize={14}>
					{t('PREVIEW_STATUS_LABEL')}
				</Text>
				<Text color="#41424B" fontWeight={700} fontSize={14}>
					{getStatus(status)}

				</Text>
			</HStack>

			<Box
				flex={1}
				alignItems="center"
				justifyContent="center"
				ml={'10%'}
				mt={'5%'}
			>
				{userData?.map((item, index) => {
					if (index % 2 === 0 && index < userData.length) {
						const firstItem = item;
						const secondItem = userData[index + 1];

						return (
							<HStack
								key={item.id}
								mb={6}
								alignItems="center"
								justifyContent="center"
							>
								<Box flex={1} alignItems="center">
									<Text {...labelStyles}>
										{firstItem.label}
									</Text>
									{firstItem && firstItem.value === '' ? (
										<Text {...valueStyles}>-</Text>
									) : (
										<Text {...valueStyles}>
											{firstItem.value}
										</Text>
									)}
								</Box>

								{secondItem && (
									<Box flex={1} alignItems="center">
										<Text {...labelStyles}>
											{secondItem.label}
										</Text>
										{secondItem.label === 'Student Type' ||
											secondItem.value === '' ? (
											<Text {...valueStyles}>-</Text>
										) : (
											<Text {...valueStyles}>
												{secondItem.value}
											</Text>
										)}
									</Box>
								)}
							</HStack>
						);
					}

					return null;
				})}
				{userData && (
					<>
						<Text {...labelStyles}>Uploaded Documents</Text>
						<UnorderedList m={3}>
							{document.map((document) => (
								<ListItem key={document.key}>
									{document.value}
								</ListItem>
							))}
						</UnorderedList>
					</>
				)}
			</Box>
		</Layout>
	);
};

export default Preview;
