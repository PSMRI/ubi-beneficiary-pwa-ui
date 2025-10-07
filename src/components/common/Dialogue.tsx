import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalCloseButton,
	ModalBody,
	ModalFooter,
	Box,
	Text,
	Accordion,
	AccordionItem,
	AccordionButton,
	AccordionPanel,
	AccordionIcon,
	Code,
} from '@chakra-ui/react';
import CommonButton from './button/Button';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserFields } from '../../services/user/User';

interface Term {
	title?: string;
	description?: string;
	list?: {
		value: string;
	}[];
}
interface CommonDialogueProps {
	isOpen?: boolean | object;
	onClose?: () => void;
	termsAndConditions?: Term[];
	handleDialog?: () => void;
	deleteConfirmation?: boolean;
	documentName?: string;
	document?: object;
	previewDocument?: boolean;
	docImageList?: string[];
}
const CommonDialogue: React.FC<CommonDialogueProps> = ({
	isOpen,
	onClose,
	termsAndConditions,
	handleDialog,
	deleteConfirmation,
	documentName,
	document,
	previewDocument,
	docImageList,
}) => {
	const [isAccordionOpen, setIsAccordionOpen] = useState(false);
	const [userFields, setUserFields] = useState([]);
	
	const handleAccordionChange = (expandedIndex) => {
		setIsAccordionOpen(expandedIndex.length > 0);
	};

	// Fetch user fields when component mounts
	useEffect(() => {
		const fetchUserFields = async () => {
			if (termsAndConditions && termsAndConditions.length > 0) {
				try {
					const fields = await getUserFields();
					setUserFields(fields);
				} catch (error) {
					console.error('Failed to fetch user fields:', error);
				}
			}
		};

		fetchUserFields();
	}, [termsAndConditions]);

	const { t } = useTranslation();
	if (previewDocument) {
		return (
			<Modal isOpen={previewDocument} onClose={onClose} size="lg">
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>{t('DIALOGUE_PREVIEW_DOCUMENT_TITLE')}: {documentName}</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<Box
							as="pre"
							p={4}
							bg="gray.100"
							rounded="md"
							overflowX="auto"
							overflowY="auto"
							fontSize="sm"
							whiteSpace="pre-wrap"
							maxHeight="500px"
							width="auto"
						>
							<Code>{JSON.stringify(document, null, 2)}</Code>
						</Box>
					</ModalBody>
					<ModalFooter>
						<CommonButton
							label={t('DIALOGUE_CLOSE_BUTTON')}
							onClick={onClose}
							width="100px"
						/>
					</ModalFooter>
				</ModalContent>
			</Modal>
		);
	}
	if (deleteConfirmation) {
		return (
			<Modal isOpen={Boolean(isOpen)} onClose={onClose}>
				<ModalOverlay />
				<ModalContent borderRadius="md">
					<ModalHeader className="border-bottom">
						<Box className="heading">{t('DIALOGUE_CONFIRMATION_TITLE')}</Box>
					</ModalHeader>
					<ModalCloseButton />
					<ModalBody
						className="border-bottom"
						maxHeight="400px" // Fixed height for Modal Body
						overflowY="auto" // Enables scrolling for Modal Body
						p={5}
					>
						{t('DIALOGUE_DELETE_CONFIRMATION_MESSAGE')}{' '}
						<strong>{documentName}</strong>? {t('DIALOGUE_DELETE_ACTION_WARNING')}
					</ModalBody>
					<ModalFooter>
						<CommonButton
							onClick={handleDialog}
							width={'40%'}
							label={t('SUBMIT_DIALOGUE_BUTTON')}
						/>
					</ModalFooter>
				</ModalContent>
			</Modal>
		);
	}
	if (docImageList && docImageList.length > 0) {
		return (
			<Modal isOpen={true} onClose={onClose} size="xl">
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>
						{t('DIALOGUE_DOCUMENT_IMAGE_PREVIEW_TITLE')}: {documentName}
					</ModalHeader>
					<ModalCloseButton />
					<ModalBody
						display="flex"
						flexDirection="column"
						alignItems="center"
						gap={4}
						p={4}
					>
						{docImageList.map((img, idx) => (
							<img
								key={img.slice(0, 20)}
								src={`${img}`}
								alt={`Document Preview ${idx + 1}`}
								style={{
									maxWidth: '100%',
									maxHeight: '60vh',
									borderRadius: '8px',
									objectFit: 'contain',
								}}
							/>
						))}
					</ModalBody>
					<ModalFooter>
						<CommonButton
							label="Close"
							onClick={onClose}
							width="100px"
						/>
					</ModalFooter>
				</ModalContent>
			</Modal>
		);
	}

	return (
		<Modal isOpen={Boolean(isOpen)} onClose={onClose}>
			<ModalOverlay />
			<ModalContent borderRadius="md">
				<ModalHeader className="border-bottom">
					{termsAndConditions ? (
						<>
							<Box className="heading">Terms and Conditions</Box>
							<Box
								color="gray.600"
								fontWeight="300"
								fontSize="18px"
							>
								Confirmation
							</Box>
						</>
					) : (
						<>
							<Box className="heading">Application Submited</Box>
							<Box
								color="gray.600"
								fontWeight="300"
								fontSize="18px"
							>
								Confirmation
							</Box>
						</>
					)}
				</ModalHeader>
				{!termsAndConditions && <ModalCloseButton />}

				<ModalBody
					className="border-bottom"
					maxHeight="400px" // Fixed height for Modal Body
					overflowY="auto" // Enables scrolling for Modal Body
				>
					{termsAndConditions ? (
						<>
							<Text
								mt={4}
								mb={10}
								fontWeight="500"
								fontSize="20px"
							>
								{t('CONFIRMATION_DIALOGUE_CONSENT_TEXT')}
							</Text>
							<Text
								mt={4}
								mb={4}
								fontWeight="normal"
								fontSize="17px"
							>
								{t('DIALOGUE_CLICK_TO_READ_AND_PROCEED')}
							</Text>
							<Accordion
								allowMultiple
								onChange={handleAccordionChange}
							>
								<AccordionItem>
									<h2>
										<AccordionButton>
											<Box flex="1" textAlign="left">
												{t('DIALOGUE_T&C')}
											</Box>
											<AccordionIcon />
										</AccordionButton>
									</h2>
									<AccordionPanel
										pb={4}
										maxHeight="200px" // Fixed height for Accordion Panel
										overflowY="auto" // Enables scrolling for Accordion Panel
									>
										<div>
											{termsAndConditions?.map(
												(item, index) => (
													<Text
														color={'#4D4639'}
														size="16px"
														key={index + 100}
													>
														{index + 1}.{' '}
														{item.description}
													</Text>
												)
											)}
											
											{/* New terms and conditions item for user information collection */}
											{userFields.length > 0 && (
												<>
													<Text
														color={'#4D4639'}
														size="16px"
														mt={3}
													>
														{termsAndConditions?.length + 1}. {t('DIALOGUE_USER_INFO_COLLECTION')}
													</Text>
													<Box ml={4} mt={2}>
														{userFields.map((field, index) => (
															<Text
																color={'#4D4639'}
																size="14px"
																key={`field-${field.name}`}
																mb={1}
															>
																• {field.label}
															</Text>
														))}
													</Box>
												</>
											)}
										</div>
									</AccordionPanel>
								</AccordionItem>
							</Accordion>
						</>
					) : (
						<>
							<Text fontSize="md" color="gray.700">
								{t('SUBMIT_DIALOGUE_CONTENT_TEXT')}
								<Text
									as="span"
									color="blue.600"
									fontWeight="medium"
								>
									{(isOpen as { name?: string })?.name || ''}
								</Text>{' '}
								{t('SUBMIT_DIALOGUE_SUBMITTED_TEXT')}!
							</Text>
							<Text fontSize="sm" color="gray.500" mt={3}>
								{t('SUBMIT_DIALOGUE_APPLICATION_ID_TEXT')}:
								<Text as="span" fontWeight="medium">
									{(isOpen as { orderId?: string })
										?.orderId || ''}
								</Text>
							</Text>
						</>
					)}
				</ModalBody>
				<ModalFooter>
					{termsAndConditions ? (
						<>
							<CommonButton
								variant="outline"
								onClick={onClose}
								label={t('CONFIRMATION_DIALOGUE_DENY')}
								isDisabled={!isAccordionOpen}
							/>
							<Box ml={2}>
								<CommonButton
									label={t('CONFIRMATION_DIALOGUE_ACCEPT')}
									isDisabled={!isAccordionOpen}
									onClick={handleDialog}
								/>
							</Box>
						</>
					) : (
						<CommonButton
							onClick={handleDialog}
							width={'40%'}
							label={t('SUBMIT_DIALOGUE_BUTTON')}
						/>
					)}
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default CommonDialogue;
