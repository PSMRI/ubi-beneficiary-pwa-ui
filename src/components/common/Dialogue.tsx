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
		const hasDocumentData = document && document !== null && Object.keys(document).length > 0;

		return (
			<Modal isOpen={previewDocument} onClose={onClose} size="xl">
				<ModalOverlay />
				<ModalContent maxH="90vh">
					<ModalHeader>
						{t('DIALOGUE_PREVIEW_DOCUMENT_TITLE')}: {documentName}
					</ModalHeader>
					<ModalCloseButton />
					<ModalBody overflowY="auto">
						{hasDocumentData ? (
							<Box
								as="pre"
								p={4}
								bg="gray.100"
								rounded="md"
								overflowX="auto"
								fontSize="sm"
								whiteSpace="pre-wrap"
							>
								<Code>{JSON.stringify(document, null, 2)}</Code>
							</Box>
						) : (
							<Box
								p={6}
								textAlign="center"
								bg="gray.50"
								rounded="md"
								borderWidth="1px"
								borderColor="gray.200"
							>
								<Text color="gray.600" fontSize="md">
									{t('DIALOGUE_NO_DOCUMENT_DATA')}
								</Text>
							</Box>
						)}
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
			<Modal isOpen={true} onClose={onClose} size="full">
				<ModalOverlay bg="blackAlpha.600" />
				<ModalContent
					maxW={{ base: '95vw', md: '90vw', lg: '85vw' }}
					maxH={{ base: '95vh', md: '90vh' }}
					m="auto"
					borderRadius="lg"
				>
					<ModalHeader
						fontSize={{ base: 'md', md: 'lg' }}
						py={3}
						borderBottom="1px"
						borderColor="gray.200"
					>
						{t('DIALOGUE_DOCUMENT_IMAGE_PREVIEW_TITLE')}: {documentName}
					</ModalHeader>
					<ModalCloseButton top={2} right={2} />
					<ModalBody p={0} overflow="hidden">
						<Box
							overflowY="auto"
							maxH="calc(95vh - 120px)"
							p={{ base: 4, md: 6 }}
							bg="gray.50"
						>
							{docImageList.map((img, idx) => (
								<Box
									key={img.slice(0, 20)}
									mb={docImageList.length > 1 ? 6 : 0}
									pb={docImageList.length > 1 ? 6 : 0}
									borderBottom={
										idx < docImageList.length - 1 ? '1px' : 'none'
									}
									borderColor="gray.300"
								>
									{docImageList.length > 1 && (
										<Text
											fontSize="sm"
											fontWeight="semibold"
											color="gray.600"
											mb={3}
											textAlign="center"
										>
											Page {idx + 1} of {docImageList.length}
										</Text>
									)}
									<Box
										as="img"
										src={img}
										alt={`Document Preview ${idx + 1}`}
										width="100%"
										height="auto"
										borderRadius="md"
										boxShadow="md"
										bg="white"
									/>
								</Box>
							))}
						</Box>
					</ModalBody>
					<ModalFooter
						py={3}
						borderTop="1px"
						borderColor="gray.200"
						justifyContent="center"
					>
						<CommonButton
							label={t('DIALOGUE_CLOSE_BUTTON')}
							onClick={onClose}
							width="120px"
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
							<Box className="heading">{t('DIALOGUE_T&C')}</Box>
							<Box
								color="gray.600"
								fontWeight="300"
								fontSize="18px"
							>
								{t('DIALOGUE_CONFIRMATION_TITLE')}
							</Box>
						</>
					) : (
						<>
							<Box className="heading">{t('DIALOGUE_APPLICATION_SUBMITTED_TITLE')}</Box>
							<Box
								color="gray.600"
								fontWeight="300"
								fontSize="18px"
							>
								{t('DIALOGUE_CONFIRMATION_TITLE')}
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
														{t(item.description || '')}
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
