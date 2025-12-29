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
	Tooltip,
} from '@chakra-ui/react';
import { CheckCircleIcon, AttachmentIcon, TimeIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import Layout from './common/layout/Layout';
import ScanVC from './ScanVC';
import { getDocumentsList, getUser } from '../services/auth/auth';
import { uploadUserDocuments, uploadDocumentQR } from '../services/user/User';
import { findDocumentStatus, getExpiryDate } from '../utils/jsHelper/helper';
import { AuthContext } from '../utils/context/checkToken';
import { fetchVCJson } from '../services/benefit/benefits';
import Loader from '../components/common/Loader';
import { AiFillCloseCircle } from 'react-icons/ai';
import { FaTrashAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { ConfigService } from '../services/configService';
// NOSONAR - VCFormWrapper import commented out: Backend does not support VC creation yet
// Uncomment when backend is ready. See: src/components/forms/VC_FORM_IMPLEMENTATION.md
// import { VCFormWrapper } from './forms/VCFormWrapper';
import { DocumentUploadResponse } from '../types/document.types';
interface Document {
	name: string;
	label: string;
	documentSubType: string;
	docType: string;
	issuer?: string;
	docHasORCode?: string;
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
	doc_data_link: string;
	vc_status?: string;
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
	const { t } = useTranslation();
	const [issueVC, setIssueVC] = React.useState<boolean | null>(null);
	const [isLoading, setIsLoading] = React.useState(true);

	const { result, success, isExpired } = useMemo(() => {
		const res = findDocumentStatus(userDocuments, status);
		const { success, isExpired } = getExpiryDate(userDocuments, status);
		return { result: res, success, isExpired };
	}, [userDocuments, status]);

	// Fetch VC configuration to check if issueVC is "yes"
	useEffect(() => {
		const fetchVCConfig = async () => {
			if (result?.matchFound && result?.docType && result?.docSubtype) {
				try {
					const vcConfig = await ConfigService.getVCConfiguration(
						result.docType,
						result.docSubtype
					);
					setIssueVC(vcConfig.issue_vc);
				} catch (error) {
					console.warn('Failed to fetch VC configuration:', error);
					setIssueVC(null);
				} finally {
					setIsLoading(false);
				}
			} else {
				setIsLoading(false);
			}
		};

		fetchVCConfig();
	}, [result?.matchFound, result?.docType, result?.docSubtype]);

	const documentExpired = success && isExpired;

	let iconComponent;
	let iconColor;
	let statusText;

	if (documentExpired) {
		iconComponent = AiFillCloseCircle;
		iconColor = '#C03744';
		statusText = t('DOCUMENT_LIST_STATUS_EXPIRED');
	} else if (result?.matchFound && issueVC === true) {
		// Handle VC-related statuses
		const vcStatus = result?.vc_status;
		
		if (vcStatus === 'pending') {
			// issueVc: yes, vc_status: pending
			iconComponent = TimeIcon;
			iconColor = '#FF9800'; // Orange color for pending
			statusText = t('DOCUMENT_LIST_STATUS_PENDING_VERIFICATION');
		} else if (vcStatus === 'revoked') {
			// issueVc: yes, vc_status: revoked
			iconComponent = AiFillCloseCircle;
			iconColor = '#C03744'; // Red color for revoked
			statusText = t('DOCUMENT_LIST_STATUS_REVOKED');
		} else if (vcStatus === 'deleted') {
			// issueVc: yes, vc_status: deleted
			iconComponent = FaTrashAlt;
			iconColor = '#C03744'; // Red color for deleted
			statusText = t('DOCUMENT_LIST_STATUS_DELETED');
		} else if (
			result?.doc_verified === true &&
			vcStatus !== 'pending' &&
			vcStatus !== 'revoked' &&
			vcStatus !== 'deleted'
		) {
			// issueVc: yes, vc_status: issued (or any other non-error status), doc_verified: true
			iconComponent = CheckCircleIcon;
			iconColor = '#0B7B69'; // Green color for verified
			statusText = t('DOCUMENT_LIST_STATUS_ISSUED');
		} else {
			// Default verified state
			iconComponent = CheckCircleIcon;
			iconColor = '#0B7B69';
			statusText = t('DOCUMENT_LIST_STATUS_AVAILABLE');
		}
	} else if (result?.matchFound && issueVC === false && result?.doc_verified === true) {
		// issueVc: no, doc_verified: true
		iconComponent = CheckCircleIcon;
		iconColor = '#0B7B69'; // Green color for verified
		statusText = t('DOCUMENT_LIST_STATUS_VERIFIED');
	} else if (result?.matchFound) {
		// Document found but not verified
		iconComponent = CheckCircleIcon;
		iconColor = '#0B7B69';
		statusText = t('DOCUMENT_LIST_STATUS_AVAILABLE');
	}

	let label;

	if (ariaLabel) {
		label = ariaLabel;
	} else {
		label = `${t('DOCUMENT_LIST_STATUS_PREFIX')}: ${statusText}`;
	}

	if (isLoading || !result?.matchFound) {
		return null;
	}

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
};
const DocumentScanner: React.FC<DocumentScannerProps> = ({
	userId,
	userData = [],
}) => {
	const { t } = useTranslation();
	const toast = useToast();
	const navigate = useNavigate();
	const [selectedDocument, setSelectedDocument] = useState<Document | null>(
		null
	);
	const [showScanner, setShowScanner] = useState(false);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isUploadingQR, setIsUploadingQR] = useState(false);
	const [pendingVerificationDocs, setPendingVerificationDocs] = useState<
		Set<string>
	>(new Set());
	// NOSONAR - Variables needed when VC form is enabled. See: src/components/forms/VC_FORM_IMPLEMENTATION.md
	const [uploadedDocument, setUploadedDocument] = // NOSONAR
		useState<DocumentUploadResponse | null>(null);
	const [uploadedFile, setUploadedFile] = useState<File | null>(null); // NOSONAR
	const [showVCForm, setShowVCForm] = useState(false);
	const { updateUserData } = useContext(AuthContext);

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
						issuer: doc.issuer,
						docHasORCode: doc.docHasORCode,
					}));
				setDocuments(formattedDocuments);
			} catch (error) {
				console.error('Error fetching documents:', error);
				toast({
					title: t('DOCUMENT_SCANNER_ERROR_TITLE'),
					description: t('DOCUMENT_SCANNER_ERROR_LOAD_DOCUMENTS'),
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

	// Check pending verification status for all documents
	// Disable re-upload button when: issueVc: yes, vc_status: pending
	useEffect(() => {
		const checkPendingVerification = async () => {
			if (documents.length === 0 || userData.length === 0) {
				return;
			}

			const pendingSet = new Set<string>();

			for (const document of documents) {
				const documentStatus = findDocumentStatus(
					userData,
					document.documentSubType
				);

				if (documentStatus?.matchFound) {
					try {
						const vcConfig = await ConfigService.getVCConfiguration(
							documentStatus.docType,
							documentStatus.docSubtype
						);

						// Disable re-upload when vc_status is pending
						const isPending =
							vcConfig?.issue_vc === true &&
							documentStatus.vc_status === 'pending';

						if (isPending) {
							pendingSet.add(document.documentSubType);
						}
					} catch (error) {
						console.warn(
							'Failed to fetch VC configuration:',
							error
						);
					}
				}
			}

			setPendingVerificationDocs(pendingSet);
		};

		checkPendingVerification();
	}, [documents, userData]);

	// NEW: Handle QR scan success - Direct upload to /upload-document-qr
	const handleQRScanSuccess = async (qrContent: string) => {
		if (!selectedDocument) return;

		setIsUploadingQR(true);
		setIsLoading(true);

		try {
			const docConfig = documents.find(
				(doc) => doc.name === selectedDocument.name
			);
			if (!docConfig) {
				throw new Error(t('DOCUMENT_SCANNER_ERROR_INVALID_TYPE'));
			}

			console.log('QR Content scanned:', qrContent);

			// Call the new QR upload API
			const response = await uploadDocumentQR({
				docType: docConfig.docType,
				docSubType: docConfig.documentSubType,
				docName: selectedDocument.name,
				importedFrom: 'QR Code',
				qrContent: qrContent,
				issuer: docConfig.issuer,
			});

			console.log('QR document uploaded successfully:', response);

			// Refresh user data to update the UI
			const userResult = await getUser();
			const docsResult = await getDocumentsList();
			updateUserData(userResult?.data, docsResult.data.value);

			toast({
				title: t('DOCUMENT_SCANNER_SUCCESS_TITLE'),
				description: t('DOCUMENT_SCANNER_QR_SUCCESS') || 'Document uploaded successfully via QR code',
				status: 'success',
				duration: 3000,
				isClosable: true,
			});

			// Navigate to home page after successful upload
			navigate('/');
		} catch (error) {
			console.error('Error uploading QR document:', error);

			const apiErrors = error?.response?.data?.errors;
			if (Array.isArray(apiErrors) && apiErrors.length > 0) {
				const errorMessages =
					apiErrors.length === 1
						? (apiErrors[0].error ?? t('DOCUMENT_SCANNER_ERROR_UNEXPECTED'))
						: apiErrors
								.map(
									(errObj, idx) =>
										`${idx + 1}. ${errObj.error ?? t('DOCUMENT_SCANNER_ERROR_UNEXPECTED')}`
								)
								.join('\n');
				toast({
					title: t('DOCUMENT_SCANNER_ERROR_TITLE'),
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
					title: t('DOCUMENT_SCANNER_ERROR_TITLE'),
					description:
						error?.response?.data?.message ??
						(error instanceof Error
							? error.message
							: t('DOCUMENT_SCANNER_ERROR_UNEXPECTED')),
					status: 'error',
					duration: 10000,
					isClosable: true,
				});
			}
		} finally {
			setIsUploadingQR(false);
			setIsLoading(false);
		}
	};

	const handleScanResult = async (result: string) => {
		if (!selectedDocument) return;

		setIsLoading(true);

		try {
			console.log('Scanned QR code URL:', result);

			// Fetch VC JSON using the service method
			const jsonDataResult = await fetchVCJson(result);
			const vcUrl = jsonDataResult?.data?.url;
			const jsonData = jsonDataResult?.data?.vcData;

			if (!jsonData || typeof jsonData !== 'object') {
				throw new Error(t('DOCUMENT_SCANNER_ERROR_INVALID_DATA'));
			}

			const credentialTitle = jsonData?.credentialSchema?.title || '';

			const docConfig = documents.find(
				(doc) => doc.name === selectedDocument.name
			);
			if (!docConfig) {
				throw new Error(t('DOCUMENT_SCANNER_ERROR_INVALID_TYPE'));
			}

			if (!credentialTitle.includes(docConfig.name)) {
				throw new Error(
					`${t('DOCUMENT_SCANNER_ERROR_WRONG_TYPE')}: ${docConfig.name}`
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
					doc_data_link: vcUrl,
					issuer: docConfig.issuer,
				},
			];

			// Upload the document
			await uploadUserDocuments(documentPayload);

			// Refresh user data to update the UI
			const userResult = await getUser();
			const docsResult = await getDocumentsList();
			updateUserData(userResult?.data, docsResult?.data?.value);
			toast({
				title: t('DOCUMENT_SCANNER_SUCCESS_TITLE'),
				description: t('DOCUMENT_SCANNER_SUCCESS_UPLOAD'),
				status: 'success',
				duration: 3000,
				isClosable: true,
			});

			// Navigate to home page after successful upload
			navigate('/');
		} catch (error) {
			console.error('Error uploading document:', error);

			// Check for API error format
			const apiErrors = error?.response?.data?.errors;
			if (Array.isArray(apiErrors) && apiErrors.length > 0) {
				const errorMessages =
					apiErrors.length === 1
						? (apiErrors[0].error ??
							t('DOCUMENT_SCANNER_ERROR_UNEXPECTED'))
						: apiErrors
								.map(
									(errObj, idx) =>
										`${idx + 1}. ${errObj.error ?? t('DOCUMENT_SCANNER_ERROR_UNEXPECTED')}`
								)
								.join('\n');
				toast({
					title: t('DOCUMENT_SCANNER_ERROR_TITLE'),
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
					title: t('DOCUMENT_SCANNER_ERROR_TITLE'),
					description:
						error?.response?.data?.message ??
						(error instanceof Error
							? error.message
							: t('DOCUMENT_SCANNER_ERROR_UNEXPECTED')),
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
		setShowScanner(true);
	};

	const handleUploadSuccess = async (response?: any, file?: File) => {
		// Check if response has issue_vc flag
		// For issue_vc: "yes" - Response structure: { statusCode, message, data: { doc_type, doc_subtype, issue_vc, mapped_data, ... } }
		// For issue_vc: "no" - Response structure: { statusCode, message, data: { doc_id, user_id, doc_type, ... } }
		// uploadDocument returns response.data from axios, which is { statusCode, message, data: {...} }
		console.log('handleUploadSuccess - Full response:', response);
		console.log('handleUploadSuccess - Uploaded file:', file);

		// Extract the data object from response
		// Response from uploadDocument is already { statusCode, message, data: {...} }
		const uploadResponse = response?.data || response;
		console.log('handleUploadSuccess - Upload response:', uploadResponse);
		console.log(
			'handleUploadSuccess - issue_vc:',
			uploadResponse?.issue_vc
		);

		// NOSONAR - VC Form disabled: Backend does not handle VC creation yet
		// The following code is commented out because the backend at http://localhost:3000/users/upload-document
		// does not currently support VC creation logic. When backend is ready, uncomment this section.
		// See: src/components/forms/VC_FORM_IMPLEMENTATION.md for instructions on how to enable.
		/* NOSONAR:START - Commented code preserved for future VC form feature
		// Show form if issue_vc is "yes" - doc_id is not required for form display
		if (uploadResponse?.issue_vc === 'yes') {
			console.log('handleUploadSuccess - Showing VC form');
			// Show VC form instead of navigating away
			setUploadedDocument(uploadResponse);
			setUploadedFile(file || null);
			setShowVCForm(true);
			setShowScanner(false);
			return;
		}
		NOSONAR:END */

		console.log('handleUploadSuccess - Skipping form, navigating home');

		// Refresh user data to update the UI with uploaded document
		try {
			const userResult = await getUser();
			const docsResult = await getDocumentsList();
			updateUserData(userResult?.data, docsResult.data.value);
		} catch (error) {
			console.error('Failed to refresh user data', error);
		}

		// Navigate to home page after successful upload (if no VC form needed)
		navigate('/');
	};

	// NOSONAR - Function needed when VC form is enabled. See: src/components/forms/VC_FORM_IMPLEMENTATION.md
	/* NOSONAR:START - Commented function preserved for future VC form feature
	const handleVCCreated = async (vc: any) => {
		// Refresh user data after VC creation
		try {
			const userResult = await getUser();
			const docsResult = await getDocumentsList();
			updateUserData(userResult?.data, docsResult.data.value);
		} catch (error) {
			console.error('Failed to refresh user data', error);
		}

		// Reset states and navigate home
		setShowVCForm(false);
		setUploadedDocument(null);
		setSelectedDocument(null);
		navigate('/');
	};
	NOSONAR:END */

	const handleBack = () => {
		if (showVCForm) {
			setShowVCForm(false);
			setUploadedDocument(null);
			setShowScanner(true);
		} else if (showScanner) {
			setShowScanner(false);
			setSelectedDocument(null);
		} else {
			globalThis.history.back();
		}
	};

	if (isLoading) {
		return <Loader />;
	}

	// NOSONAR - VC Form rendering disabled: Backend does not handle VC creation yet
	// The following code is commented out because the backend does not support VC creation logic.
	// When backend is ready to handle VC creation, uncomment this section to show the form.
	// See: src/components/forms/VC_FORM_IMPLEMENTATION.md for detailed instructions.
	/* NOSONAR:START - Commented code preserved for future VC form rendering
	//VC form if document was uploaded with issue_vc = yes
	if (showVCForm && uploadedDocument) {
		const documentLabel = selectedDocument?.label || '';
		const meaningfulHeading = `Complete ${documentLabel} Details to Create Verifiable Credential`;

		return (
			<Layout
				_heading={{
					heading: meaningfulHeading,
					handleBack: handleBack,
				}}
			>
				<VCFormWrapper
					uploadedDocument={uploadedDocument}
					uploadedFile={uploadedFile || undefined}
					onVCCreated={handleVCCreated}
				/>
			</Layout>
		);
	}
	NOSONAR:END */

	// Show scanner view
	if (showScanner && selectedDocument) {
		return (
			<Layout
				_heading={{
					heading: `${t('SCAN_DOCUMENTS_TITLE')} ${selectedDocument.label}`,
					handleBack: handleBack,
				}}
			>
				<ScanVC
					onScanResult={handleScanResult}
					showHeader={false}
					documentConfig={{
						docType: selectedDocument.docType,
						documentSubType: selectedDocument.documentSubType,
						label: selectedDocument.label,
						name: selectedDocument.name,
						docHasORCode: selectedDocument.docHasORCode,
					}}
					onUploadSuccess={handleUploadSuccess}
					onQRScanSuccess={handleQRScanSuccess}
				/>
			</Layout>
		);
	}

	// Show document list view
	return (
		<Layout
			_heading={{
				heading: t('DOCUMENT_SCANNER_TITLE'),
				handleBack: handleBack,
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
											isDisabled={pendingVerificationDocs.has(
												doc.documentSubType
											)}
										>
											{documentStatus.matchFound
												? t(
														'DOCUMENT_SCANNER_REUPLOAD_BUTTON'
													)
												: t(
														'DOCUMENT_SCANNER_UPLOAD_BUTTON'
													)}
										</Button>
									</HStack>
								</ListItem>
							);
						})}
					</List>
				</VStack>
			</Box>
		</Layout>
	);
};

export default DocumentScanner;
