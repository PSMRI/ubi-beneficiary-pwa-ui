import { Box, IconButton, useToast } from '@chakra-ui/react';
import { findDocumentStatus, type DocumentStatus } from '../utils/jsHelper/helper';
import React, { useContext, useState } from 'react';
import { deleteDocument } from '../services/user/User';
import { FaEye, FaTrashAlt } from 'react-icons/fa';
import { getDocumentsList, getUser } from '../services/auth/auth';
import { AuthContext } from '../utils/context/checkToken';
import CommonDialogue from './common/Dialogue';
import { VscPreview } from 'react-icons/vsc';
import { useTranslation } from 'react-i18next';

interface DocumentActionsProps {
	status: string;
	userDocuments: {
		doc_id: string;
		doc_data: string;
		doc_name: string;
	}[];
	isDelete?: boolean;
}
interface ImageEntry {
	mimetype?: string;
	content?: string;
}
const DocumentActions: React.FC<DocumentActionsProps> = ({
	status,
	userDocuments,
	isDelete = true,
}) => {
	const { t } = useTranslation();
	const documentStatus = findDocumentStatus(userDocuments, status);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
	const [document, setDocument] = useState();
	const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
	const [docImageList, setdocImageList] = useState<string[]>([]);
	const { updateUserData } = useContext(AuthContext)!;
	const toast = useToast();

	const init = async () => {
		try {
			const result = await getUser();
			const data = await getDocumentsList();
			updateUserData(result?.data, data?.data?.value);
		} catch (error) {
			console.error('Error fetching user data or documents:', error);
		}
	};
	const handleDelete = async () => {
		try {
			const response = await deleteDocument(documentStatus.doc_id);
			setIsConfirmationOpen(false);
			if (response) {
				toast({
					title: t('DOCUMENT_ACTIONS_DELETE_SUCCESS'),
					status: 'success',
					duration: 3000,
					isClosable: true,
					containerStyle: {
						padding: '16px',
						margin: '16px',
					},
				});
				init();
			}
		} catch (error) {
			console.error('Error deleting document:', error);
			toast({
				title: t('DOCUMENT_ACTIONS_DELETE_ERROR'),
				status: 'error',
				duration: 3000,
				isClosable: true,
				containerStyle: {
					padding: '16px',
					margin: '16px',
				},
			});
		}
	};
	const handlepreview = () => {
		setDocument(JSON.parse(documentStatus?.doc_data as string));

		setIsPreviewOpen(true);
	};

	const handleImagePreview = () => {
		try {
			// Check if download_url is present (S3 presigned URL)
			if (documentStatus?.download_url) {
				setdocImageList([documentStatus.download_url]);
				setIsImageDialogOpen(true);
				return;
			}

			// Fallback to old logic for base64 preview
			console.log("documentStatus?.doc_data:", documentStatus);
			const parseData = JSON.parse(documentStatus?.doc_data as string);
			const credentialSubject = parseData?.credentialSubject;

			const images: string[] = [];

			if (credentialSubject && typeof credentialSubject === 'object') {
				Object.values(credentialSubject).forEach((entry) => {
					if (
						typeof entry === 'object' &&
						entry !== null &&
						'url' in entry &&
						typeof (entry as { url: unknown }).url === 'string'
					) {
						images.push((entry as { url: string }).url);
					}
				});
			}

			if (images.length > 0) {
				setdocImageList(images);
				setIsImageDialogOpen(true);
			} else {
				toast({
					title: t('DOCUMENT_ACTIONS_NO_IMAGES_FOUND'),
					status: 'info',
					duration: 3000,
					isClosable: true,
				});
			}
		} catch {
			toast({
				title: t('DOCUMENT_ACTIONS_INVALID_JSON'),
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
		}
	};

	const handleOpneConfirmation = () => {
		setIsConfirmationOpen(true);
	};
	if (documentStatus?.matchFound) {
		return (
			<>
				<Box display="flex" gap={2} alignItems="center">
					<IconButton
						icon={<FaEye />}
						aria-label={t('DOCUMENT_ACTIONS_PREVIEW_ARIA')}
						size="sm"
						color={'grey'}
						onClick={() => handlepreview()}
					/>
					<IconButton
						icon={<VscPreview />}
						aria-label={t('DOCUMENT_ACTIONS_PREVIEW_IMAGE_ARIA')}
						size="sm"
						color="grey"
						onClick={handleImagePreview}
					/>
					{isDelete && (
						<IconButton
							icon={<FaTrashAlt />}
							aria-label={t('DOCUMENT_ACTIONS_DELETE_ARIA')}
							size="sm"
							color={'grey'}
							onClick={() => handleOpneConfirmation()}
						/>
					)}
				</Box>

				<CommonDialogue
					isOpen={isConfirmationOpen}
					onClose={() => setIsConfirmationOpen(false)}
					handleDialog={handleDelete}
					deleteConfirmation={isConfirmationOpen}
					documentName={documentStatus.doc_name}
				/>
				<CommonDialogue
					isOpen={isImageDialogOpen}
					onClose={() => {
						setIsImageDialogOpen(false);
						setdocImageList([]);
					}}
					docImageList={docImageList}
					documentName={documentStatus.doc_name}
				/>

				<CommonDialogue
					isOpen={isPreviewOpen}
					previewDocument={isPreviewOpen}
					onClose={() => setIsPreviewOpen(false)}
					document={document}
					documentName={documentStatus.doc_name}
				/>
			</>
		);
	}
};
export default DocumentActions;
