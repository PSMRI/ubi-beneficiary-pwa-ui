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

	// Check if document is pending verification
	const isPendingVerification =
		result?.matchFound &&
		issueVC === true &&
		result?.doc_verified !== true &&
		result?.imported_from === 'Manual Upload';

	let iconComponent;
	let iconColor;

	if (documentExpired) {
		iconComponent = AiFillCloseCircle;
		iconColor = '#C03744';
	} else if (isPendingVerification) {
		// Show pending icon for documents with issueVC: yes and doc_verified: false
		iconComponent = TimeIcon;
		iconColor = '#FF9800'; // Orange color for pending
	} else if (result?.matchFound) {
		iconComponent = CheckCircleIcon;
		iconColor = '#0B7B69';
	} else {
		iconComponent = WarningIcon;
		iconColor = '#EDA145';
	}

	let label;

	if (ariaLabel) {
		label = ariaLabel;
	} else {
		let statusText;

		if (isExpired) {
			statusText = t('DOCUMENT_LIST_STATUS_EXPIRED');
		} else if (isPendingVerification) {
			statusText = t('DOCUMENT_LIST_STATUS_PENDING_VERIFICATION');
		} else if (result?.matchFound) {
			statusText = t('DOCUMENT_LIST_STATUS_AVAILABLE');
		} else {
			statusText = t('DOCUMENT_LIST_STATUS_INCOMPLETE');
		}

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
					key={document.docType}
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
