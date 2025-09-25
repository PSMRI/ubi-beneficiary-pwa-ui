import React, { useEffect, useState } from 'react';
import {
	Box,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Stack,
	Text,
} from '@chakra-ui/react';
import '../../assets/styles/App.css';
import Layout from '../../components/common/layout/Layout';
import ApplicationList from '../../components/ApplicationList';

import { getApplicationList, getUser } from '../../services/auth/auth';
import CommonButton from '../../components/common/button/Button';
import { useTranslation } from 'react-i18next';

// Define a type for your application object if you have specific fields
type ApplicationType = {
	benefit_id: string;
	application_name: string;
	internal_application_id: string;
	status:
		| 'submitted'
		| 'application approved'
		| 'application rejected'
		| 'application pending'
		| 'application resubmit';
	application_data: Record<string, unknown>;
	benefit_provider_id: string;
};

const ApplicationStatus: React.FC = () => {
	const { t } = useTranslation();
	// Explicitly type applicationList as an array of ApplicationType
	const [applicationList, setApplicationList] = useState<ApplicationType[]>(
		[]
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const init = async (SearchText?: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await getUser();
			const user_id = result?.data?.user_id;

			const data = await getApplicationList(SearchText, user_id);
			setApplicationList(data.data.applications || []); // Ensure it's an array
		} catch (error) {
			if (error instanceof Error) {
				setError(`Failed to fetch applications: ${error.message}`);
			} else {
				setError(`Failed to fetch applications: ${String(error)}`);
			}
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		init();
	}, []);

	if (error) {
		return (
			<Modal isOpen={true} onClose={() => setError(null)}>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>
						{t('APPLICATION_STATUS_ERROR_MODAL')}
					</ModalHeader>
					<ModalBody>
						<Text>{error}</Text>
					</ModalBody>
					<ModalFooter>
						<CommonButton
							onClick={() => setError(null)}
							label={t('APPLICATION_STATUS_CLOSE_BUTTON')}
						/>
					</ModalFooter>
				</ModalContent>
			</Modal>
		);
	}

	return (
		<Layout
			loading={isLoading}
			_heading={{
				heading: t('APPLICATION_STATUS_TITLE'),
				subHeading: t('APPLICATION_STATUS_SUBTITLE'),
				isFilter: true,
			}}
			isSearchbar={true}
		>
			<Box>
				<Stack spacing={4}>
					{applicationList.length > 0 ? (
						<ApplicationList applicationList={applicationList} />
					) : (
						<Box textAlign="center" pt={'30%'}>
							{t('APPLICATION_STATUS_NO_APPLICATIONS')}
						</Box>
					)}
				</Stack>
			</Box>
		</Layout>
	);
};

export default ApplicationStatus;
