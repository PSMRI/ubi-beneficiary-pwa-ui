import { Box, IconButton, useToast } from '@chakra-ui/react';
import { findDocumentStatus } from '../utils/jsHelper/helper';
import { useContext, useState } from 'react';
import { deleteDocument } from '../services/user/User';
import { FaEye, FaTrashAlt } from 'react-icons/fa';
import { getDocumentsList, getUser } from '../services/auth/auth';
import { AuthContext } from '../utils/context/checkToken';
import CommonDialogue from './common/Dialogue';

interface DocumentActionsProps {
	status: boolean;
	userData: {
		doc_id: string;
		doc_data: string;
		doc_name: string;
		[key: string]: any;
	};
}
const DocumentActions: React.FC<DocumentActionsProps> = ({
	status,
	userData,
}) => {
	const documentStatus = findDocumentStatus(userData, status);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
	const [document, setDocument] = useState();

	const { updateUserData } = useContext(AuthContext)!;
	const toast = useToast();

	const init = async () => {
		try {
			const result = await getUser();
			const data = await getDocumentsList();
			updateUserData(result?.data, data?.data);
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
					title: 'Document deleted successfully',
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
				title: 'Error deleting document',
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
	const handleOpneConfirmation = () => {
		setIsConfirmationOpen(true);
	};
	if (documentStatus?.matchFound) {
		return (
			<>
				<Box>
					<IconButton
						icon={<FaEye />}
						aria-label="Preview"
						size="sm"
						color={'grey'}
						onClick={() => handlepreview()}
					/>
					<IconButton
						icon={<FaTrashAlt />}
						aria-label="Delete"
						size="sm"
						color={'grey'}
						onClick={() => handleOpneConfirmation()}
					/>
				</Box>

				<CommonDialogue
					isOpen={isConfirmationOpen}
					onClose={() => setIsConfirmationOpen(false)}
					handleDialog={handleDelete}
					deleteConfirmation={isConfirmationOpen}
					documentName={documentStatus.doc_name}
				/>
				<CommonDialogue
					isOpen={isPreviewOpen}
					previewDocument={isPreviewOpen}
					onClose={() => setIsPreviewOpen(false)}
					document={document}
				/>
			</>
		);
	}
};
export default DocumentActions;
