import * as React from 'react';
import {
	VStack,
	Text,
	Icon,
	HStack,
	useTheme,
	Box,
	Tooltip,
} from '@chakra-ui/react';

import { CheckCircleIcon, WarningIcon, TimeIcon } from '@chakra-ui/icons';
import Loader from './common/Loader';
import { findDocumentStatus, getExpiryDate } from '../utils/jsHelper/helper';
import { AiFillCloseCircle } from 'react-icons/ai';
import { FaTrashAlt } from 'react-icons/fa';
import DocumentActions from './DocumentActions';
import DocumentExpiry from './DocumentExpiry';
import { useTranslation } from 'react-i18next';
import { ConfigService } from '../services/configService';
interface StatusIconProps {
	status: string;
	size?: number;
	'aria-label'?: string;
	userDocuments: UserDocument[];
}

interface Document {
	name: string;
	code: string;
}
interface UserDocument {
	doc_id: string;
	user_id: string;
	doc_type: string;
	doc_subtype: string;
	doc_name: string;
	imported_from: string;
	doc_path: string;
	doc_data: string; // You can parse this JSON string into an object when needed
	doc_datatype: string;
	doc_verified: boolean;
	uploaded_at: string;
	is_uploaded: boolean;
	vc_status?: string;
}
interface DocumentListProps {
	documents: Document[] | string[];
	userDocuments: UserDocument[];
}

const StatusIcon: React.FC<StatusIconProps> = ({
	status,
	size = 5,
	'aria-label': ariaLabel,
	userDocuments,
}) => {
	const { t } = useTranslation();
	const [issueVC, setIssueVC] = React.useState<boolean | null>(null);
	const [isLoading, setIsLoading] = React.useState(true);

	const result = findDocumentStatus(userDocuments, status);
	const { success, isExpired } = getExpiryDate(userDocuments, status);
	const documentExpired = success && isExpired;

	// Fetch VC configuration to check if issueVC is "yes"
	React.useEffect(() => {
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
	} else {
		// Document not found
		iconComponent = WarningIcon;
		iconColor = '#EDA145';
		statusText = t('DOCUMENT_LIST_STATUS_INCOMPLETE');
	}

	let label;

	if (ariaLabel) {
		label = ariaLabel;
	} else {
		label = `${t('DOCUMENT_LIST_STATUS_PREFIX')}: ${statusText}`;
	}

	if (isLoading) {
		return null; // or a small loading spinner
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

const DocumentList: React.FC<DocumentListProps> = ({
	documents,
	userDocuments,
}) => {
	const theme = useTheme();

	return documents && documents.length > 0 ? (
		<VStack
			align="stretch"
			backgroundColor={theme.colors.background}
			padding={0}
			spacing={0}
		>
			{documents.map((document) => (
				<HStack
					key={document.documentSubType}
					borderBottomWidth="1px"
					borderBottomColor={theme.colors.border}
					paddingY={3}
					alignItems="center"
					spacing={3}
					height={70}
					width="100%"
					pl={2}
				>
					{/* Default status to false if not provided */}
					<StatusIcon
						status={document.documentSubType}
						userDocuments={userDocuments}
					/>
					<Box
						display="flex"
						alignItems="center"
						justifyContent="space-between"
						width={'100%'}
					>
						<Box width={'70%'}>
							<Text
								fontSize="16px"
								fontWeight="400"
								color={theme.colors.text}
							>
								{document.name}
							</Text>
							<DocumentExpiry
								status={document.documentSubType}
								userDocuments={userDocuments}
							/>
						</Box>

						<DocumentActions
							status={document.documentSubType}
							userDocuments={userDocuments}
						/>
					</Box>
				</HStack>
			))}
		</VStack>
	) : (
		<Loader />
	);
};

export default DocumentList;
