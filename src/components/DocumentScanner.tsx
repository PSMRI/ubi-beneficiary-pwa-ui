import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
	Box,
	VStack,
	Text,
	Button,
	HStack,
	useToast,
	List,
	ListItem,
	Icon,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalCloseButton,
	useDisclosure,
	Tooltip,
} from '@chakra-ui/react';
import { CheckCircleIcon, AttachmentIcon } from '@chakra-ui/icons';
import Layout from './common/layout/Layout';
import ScanVC from './ScanVC';
import { getDocumentsList, getUser } from '../services/auth/auth';
import { uploadUserDocuments } from '../services/user/User';
import { findDocumentStatus, getExpiryDate } from '../utils/jsHelper/helper';
import { AuthContext } from '../utils/context/checkToken';
import { fetchVCJson } from '../services/benefit/benefits';
import Loader from '../components/common/Loader';
import { AiFillCloseCircle } from 'react-icons/ai';
import { useTranslation } from 'react-i18next';
interface Document {
	name: string;
	label: string;
	documentSubType: string;
	docType: string;
}

interface UserDocument {
	doc_id: string;
	user_id: string;
	doc_type: string;
	doc_subtype: string;
	doc_name: string;
	imported_from: string;
	doc_path: string;
	doc_data: string;
	doc_datatype: string;
	doc_verified: boolean;
	uploaded_at: string;
	is_uploaded: boolean;
}

interface DocumentScannerProps {
	userId: string;
	userData: UserDocument[];
}
interface StatusIconProps {
	status: string;
	size?: number;
	'aria-label'?: string;
	userDocuments: UserDocument[];
}
const StatusIcon: React.FC<StatusIconProps> = ({
	status,
	size = 4,
	'aria-label': ariaLabel,
	userDocuments,
}) => {
	const { result, success, isExpired } = useMemo(() => {
		const res = findDocumentStatus(userDocuments, status);
		const { success, isExpired } = getExpiryDate(userDocuments, status);
		return { result: res, success, isExpired };
	}, [userDocuments, status]);
	const documentExpired = success && isExpired;
	let iconComponent;
	let iconColor;

	if (documentExpired) {
		iconComponent = AiFillCloseCircle;
		iconColor = '#C03744';
	} else if (result?.matchFound) {
		iconComponent = CheckCircleIcon;
		iconColor = '#0B7B69';
	}

	let label;

	if (ariaLabel) {
		label = ariaLabel;
	} else {
		let statusText;

		if (isExpired) {
			statusText = 'Expired';
		} else if (result?.matchFound) {
			statusText = 'Available';
		}

		label = `Document status: ${statusText}`;
	}

	if (result?.matchFound) {
		return (
			<Tooltip label={label} hasArrow>
				<Box display="inline-block">
					<Icon
						as={iconComponent}
						color={iconColor}
						boxSize={size}
						aria-label={label}
					/>
				</Box>
			</Tooltip>
		);
	}

	return null;
};
const DocumentScanner: React.FC<DocumentScannerProps> = ({
	userId,
	userData = [],
}) => {
	const { t } = useTranslation();
	const toast = useToast();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [selectedDocument, setSelectedDocument] = useState<Document | null>(
		null
	);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const { updateUserData } = useContext(AuthContext)!;

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const userResult = await getUser();
				const docsResult = await getDocumentsList();
				updateUserData(userResult?.data, docsResult.data.value);
			} catch (error) {
				console.error('Failed to fetch user data', error);
			}
		};

		fetchUserData();
	}, []);

	useEffect(() => {
		const fetchDocuments = async () => {
			try {
				const response = await getDocumentsList();
				const formattedDocuments = response?.data?.value
					.filter((doc: any) => doc.documentSubType !== 'aadhaar')
					.map((doc: any) => ({
						name: doc.name,
						label: doc.label,
						documentSubType: doc.documentSubType,
						docType: doc.docType,
					}));
				setDocuments(formattedDocuments);
			} catch (error) {
				console.error('Error fetching documents:', error);
				toast({
					title: 'Error',
					description: 'Failed to load documents',
					status: 'error',
					duration: 3000,
					isClosable: true,
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchDocuments();
	}, []);

	const handleScanResult = async (result: string) => {
		if (!selectedDocument) return;

		setIsLoading(true);

		try {
			console.log('Scanned QR code URL:', result);

			// Fetch VC JSON using the service method
			const jsonData = await fetchVCJson(result);
			console.log('jsonData', jsonData);

			if (!jsonData || typeof jsonData !== 'object') {
				throw new Error('Invalid document data structure');
			}

			const credentialTitle = jsonData?.credentialSchema?.title || '';

			const docConfig = documents.find(
				(doc) => doc.name === selectedDocument.name
			);
			if (!docConfig) {
				throw new Error('Invalid document type selected');
			}

			if (!credentialTitle.includes(docConfig.name)) {
				throw new Error(
					`Scanned document is not of type: ${docConfig.name}`
				);
			}

			// Prepare the document payload
			const documentPayload = [
				{
					doc_name: selectedDocument.name,
					doc_type: docConfig.docType,
					doc_subtype: docConfig.documentSubType,
					doc_data: jsonData,
					uploaded_at: new Date().toISOString(),
					imported_from: 'QR Code',
					doc_datatype: 'Application/JSON',
				},
			];

			// Upload the document
			await uploadUserDocuments(documentPayload);

			// Refresh user data to update the UI
			const userResult = await getUser();
			const docsResult = await getDocumentsList();
			updateUserData(userResult?.data, docsResult?.data?.value);
			toast({
				title: 'Success',
				description: 'Document uploaded successfully',
				status: 'success',
				duration: 3000,
				isClosable: true,
			});

			onClose(); // Close the modal
		} catch (error) {
			console.error('Error uploading document:', error);

			// Check for API error format
			const apiErrors = error?.response?.data?.errors;
			if (Array.isArray(apiErrors) && apiErrors.length > 0) {
				const errorMessages =
					apiErrors.length === 1
						? (apiErrors[0].error ?? 'Unexpected error occurred')
						: apiErrors
								.map(
									(errObj, idx) =>
										`${idx + 1}. ${errObj.error ?? 'Unexpected error occurred'}`
								)
								.join('\n');
				toast({
					title: 'Error',
					description: (
						<Box as="span" whiteSpace="pre-line">
							{errorMessages}
						</Box>
					),
					status: 'error',
					duration: 10000,
					isClosable: true,
				});
			} else {
				toast({
					title: 'Error',
					description:
						error?.response?.data?.message ??
						(error instanceof Error
							? error.message
							: 'Unexpected error occurred'),
					status: 'error',
					duration: 10000,
					isClosable: true,
				});
			}
		} finally {
			setIsLoading(false); // Hide loader
		}
	};

	const openUploadModal = (document: Document) => {
		setSelectedDocument(document);
		onOpen();
	};

	if (isLoading) {
		return <Loader />;
	}

	return (
		<Layout
			_heading={{
				heading: t('DOCUMENT_SCANNER_TITLE'),
				handleBack: () => window.history.back(),
			}}
		>
			<Box shadow="md" borderWidth="1px" borderRadius="md" p={4}>
				<VStack spacing={4} align="stretch">
					<List spacing={3}>
						{documents.map((doc, index) => {
							const documentStatus = findDocumentStatus(
								userData || [],
								doc.documentSubType
							);

							return (
								<ListItem
									key={`doc-${doc.documentSubType}-${index}`}
									p={3}
									borderWidth="1px"
									borderRadius="md"
									display="flex"
									justifyContent="space-between"
									alignItems="center"
								>
									<Text>{doc.label}</Text>
									<HStack
										key={`actions-${doc.documentSubType}-${index}`}
									>
										<StatusIcon
											status={doc.documentSubType}
											userDocuments={userData || []}
										/>
										<Button
											key={`button-${doc.documentSubType}-${index}`}
											size="sm"
											colorScheme="blue"
											onClick={() => openUploadModal(doc)}
											leftIcon={<AttachmentIcon />}
										>
											{documentStatus.matchFound
												? t('DOCUMENT_SCANNER_REUPLOAD_BUTTON')
												: t('DOCUMENT_SCANNER_UPLOAD_BUTTON')}
										</Button>
									</HStack>
								</ListItem>
							);
						})}
					</List>
				</VStack>
			</Box>

			<Modal isOpen={isOpen} onClose={onClose} size="xl">
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>{t('SCAN_DOCUMENTS_TITLE')} {selectedDocument?.name}</ModalHeader>
					<ModalCloseButton />
					<ModalBody pb={6}>
						<ScanVC onScanResult={handleScanResult} />
					</ModalBody>
				</ModalContent>
			</Modal>
		</Layout>
	);
};

export default DocumentScanner;
