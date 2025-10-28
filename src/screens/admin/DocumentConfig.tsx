import React, { useState, useEffect } from 'react';
import {
	VStack,
	HStack,
	Box,
	Button,
	FormControl,
	FormLabel,
	Input,
	IconButton,
	FormErrorMessage,
	useToast,
	Divider,
	Textarea,
	Text,
	Select,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { getMapping, updateMapping } from '../../services/admin/admin';
import Layout from '../../components/common/admin/Layout';
import { useTranslation } from 'react-i18next';

interface DocumentConfig {
	id: number;
	name: string;
	label: string;
	documentSubType: string;
	docType: string;
	vcFields: string;
	issueVC: string;
	docQRContains?: string;
}
interface ValidationErrors {
	[key: string]: string;
}

// Dropdown options constants
const ISSUE_VC_OPTIONS = [
	{ label: 'Yes', value: 'yes' },
	{ label: 'No', value: 'no' },
];

const DOC_QR_CONTAINS_OPTIONS = [
	{ label: 'Doc URL', value: 'DOC_URL' },
	{ label: 'Plain Text', value: 'PLAIN_TEXT' },
	{ label: 'VC URL', value: 'VC_URL' },
	{ label: 'Text and URL', value: 'TEXT_AND_URL' },
	{ label: 'JSON URL', value: 'JSON_URL' },
	{ label: 'XML URL', value: 'XML_URL' },
	{ label: 'JSON', value: 'JSON' },
	{ label: 'XML', value: 'XML' },
];
const DocumentConfig = () => {
	const toast = useToast();
	const { t } = useTranslation();

	// --- State for document configurations and errors ---
	const [documentConfigs, setDocumentConfigs] = useState<DocumentConfig[]>(
		[]
	);
	const [errors, setErrors] = useState<ValidationErrors>({});

	// --- State for document types ---
	const [documentTypes, setDocumentTypes] = useState<string[]>([]);
	const [isLoadingDocumentTypes, setIsLoadingDocumentTypes] = useState(true);
	const [documentTypesFetchFailed, setDocumentTypesFetchFailed] =
		useState(false);

	// --- Fetch document types from API ---
	useEffect(() => {
		let isMounted = true;

		const fetchDocumentTypes = async () => {
			try {
				if (!isMounted) return;
				setIsLoadingDocumentTypes(true);
				setDocumentTypesFetchFailed(false);

				const mapping = await getMapping('documentTypeConfiguration');

				if (!isMounted) return;

				if (
					mapping?.data?.value?.documentType &&
					Array.isArray(mapping.data.value.documentType)
				) {
					setDocumentTypes(mapping.data.value.documentType);
					setDocumentTypesFetchFailed(false);
				} else {
					console.warn('Document types not found in expected format');
					setDocumentTypes([]);
					setDocumentTypesFetchFailed(true);
				}
			} catch (error) {
				if (!isMounted) return;

				console.error('Error fetching document types:', error);
				setDocumentTypesFetchFailed(true);
				toast({
					title: t('DOCUMENTCONFIG_ERROR_TITLE'),
					description: t('DOCUMENTCONFIG_FETCH_TYPES_ERROR'),
					status: 'error',
					duration: 2000,
					isClosable: true,
				});
				setDocumentTypes([]);
			} finally {
				if (isMounted) {
					setIsLoadingDocumentTypes(false);
				}
			}
		};

		fetchDocumentTypes();

		return () => {
			isMounted = false;
		};
	}, [toast, t]);

	// --- Fetch document configurations from API ---
	useEffect(() => {
		const fetchConfigs = async () => {
			try {
				const data = await getMapping('vcConfiguration');
				// Map API response to local state structure
				if (
					Array.isArray(data.data.value) &&
					data.data.value.length > 0
				) {
					const mapped = data.data.value.map((item, idx) => {
						let vcFieldsString = '';
						if (typeof item.vcFields === 'string') {
							vcFieldsString = item.vcFields;
						} else if (item.vcFields) {
							vcFieldsString = JSON.stringify(item.vcFields);
						}
						return {
							id: Date.now() + idx,
							name: item.name || '',
							label: item.label || '',
							documentSubType: item.documentSubType || '',
							docType: item.docType || '',
							vcFields: vcFieldsString,
							issueVC: item.issueVC || '',
							docQRContains: item.docQRContains || '',
						};
					});
					setDocumentConfigs(mapped);
				} else {
					setDocumentConfigs([
						{
							id: Date.now(),
							name: '',
							label: '',
							documentSubType: '',
							docType: '',
							vcFields: '',
							issueVC: '',
							docQRContains: '',
						},
					]);
				}
			} catch (error) {
				// Log the error for debugging
				console.error('Error fetching document configurations:', error);
				toast({
					title: t('DOCUMENTCONFIG_ERROR_TITLE'),
					description: t('DOCUMENTCONFIG_FETCH_ERROR'),
					status: 'error',
					duration: 2000,
					isClosable: true,
				});
			}
		};
		fetchConfigs();
	}, []);

	// --- Validate vcFields JSON structure ---
	const validateVcFields = (value: string) => {
		if (!value || value.trim() === '') return true;
		try {
			const parsed = JSON.parse(value);
			if (
				typeof parsed !== 'object' ||
				Array.isArray(parsed) ||
				parsed === null
			)
				return false;
			for (const key in parsed) {
				if (
					!parsed[key] ||
					typeof parsed[key] !== 'object' ||
					Array.isArray(parsed[key]) ||
					!('type' in parsed[key]) ||
					typeof parsed[key].type !== 'string'
				) {
					return false;
				}
			}
			return true;
		} catch {
			return false;
		}
	};

	// --- Handle input changes and validate fields ---
	const handleChange = (
		index: number,
		field: keyof DocumentConfig,
		value: string
	) => {
		const updated = [...documentConfigs];
		updated[index][field] = value as never;

		// If issueVC changes to "yes", clear docQRContains
		if (field === 'issueVC' && value === 'yes') {
			updated[index].docQRContains = '';
		}

		setDocumentConfigs(updated);

		const newErrors = { ...errors };
		delete newErrors[`${field}_${index}`];

		// If issueVC changes, clear docQRContains error
		if (field === 'issueVC') {
			delete newErrors[`docQRContains_${index}`];
		}

		// If the field is 'vcFields', validate JSON and structure
		if (field === 'vcFields') {
			if (value.trim() !== '' && !validateVcFields(value)) {
				newErrors[`vcFields_${index}`] = t(
					'DOCUMENTCONFIG_VC_FIELDS_INVALID_FORMAT'
				);
			} else {
				delete newErrors[`vcFields_${index}`];
			}
		}
		setErrors(newErrors);
	};

	// --- Add and remove document configuration blocks ---
	const addConfig = () => {
		// Prevent adding new config if document types fetch failed
		if (documentTypesFetchFailed) {
			toast({
				title: t('DOCUMENTCONFIG_ERROR_TITLE'),
				description: t('DOCUMENTCONFIG_CANNOT_ADD_CONFIG'),
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}

		setDocumentConfigs([
			...documentConfigs,
			{
				id: Date.now(),
				name: '',
				label: '',
				documentSubType: '',
				docType: '',
				vcFields: '',
				issueVC: '',
				docQRContains: '',
			},
		]);
	};

	const removeConfig = (index: number) => {
		const updated = [...documentConfigs];
		updated.splice(index, 1);
		setDocumentConfigs(updated);
	};

	// --- Save all document configurations to the backend ---
	const handleSaveAll = async () => {
		// Prevent saving if document types fetch failed
		if (documentTypesFetchFailed) {
			toast({
				title: t('DOCUMENTCONFIG_ERROR_TITLE'),
				description: t('DOCUMENTCONFIG_CANNOT_SAVE_CONFIG'),
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}

		let hasError = false;
		const newErrors = {};
		// Validate all required fields and vcFields structure
		documentConfigs.forEach((doc, index) => {
			[
				'name',
				'label',
				'documentSubType',
				'docType',
				'vcFields',
				'issueVC',
			].forEach((field) => {
				if (!doc[field]) {
					newErrors[`${field}_${index}`] = `${field} ${t(
						'DOCUMENTCONFIG_FIELD_REQUIRED'
					)}`;
					hasError = true;
				}
			});
			// Validate docQRContains is required when issueVC is "no"
			if (doc.issueVC === 'no' && !doc.docQRContains) {
				newErrors[`docQRContains_${index}`] = t(
					'DOCUMENTCONFIG_FIELD_REQUIRED'
				);
				hasError = true;
			}
			if (doc.vcFields && doc.vcFields.trim() !== '') {
				if (!validateVcFields(doc.vcFields)) {
					newErrors[`vcFields_${index}`] = t(
						'DOCUMENTCONFIG_VC_FIELDS_INVALID_FORMAT'
					);
					hasError = true;
				} else {
					delete newErrors[`vcFields_${index}`];
				}
			}
		});
		setErrors(newErrors);
		if (hasError) {
			toast({
				title: t('DOCUMENTCONFIG_VALIDATION_ERROR_TITLE'),
				description: t('DOCUMENTCONFIG_VALIDATION_ERROR_MESSAGE'),
				status: 'error',
				duration: 2000,
			});
			return;
		}
		try {
			// Prepare and send the payload
			const saveData = documentConfigs.map((doc) => ({
				name: doc.name,
				label: doc.label,
				documentSubType: doc.documentSubType,
				docType: doc.docType,
				vcFields: doc.vcFields,
				issueVC: doc.issueVC,
				docQRContains: doc.docQRContains,
			}));
			await updateMapping(saveData, 'vcConfiguration');
			toast({
				title: t('DOCUMENTCONFIG_SUCCESS_TITLE'),
				description: `${documentConfigs.length}${t('DOCUMENTCONFIG_SUCCESS_MESSAGE')}`,
				status: 'success',
				duration: 2000,
			});
		} catch (error) {
			// Log the error for debugging
			console.error('Error in JSON parsing or mapping:', error);
			toast({
				title: t('DOCUMENTCONFIG_ERROR_TITLE'),
				description: t('DOCUMENTCONFIG_SAVE_ERROR'),
				status: 'error',
				duration: 2000,
			});
		}
	};

	// --- Helper function to get document type select placeholder ---
	const getDocumentTypeSelectPlaceholder = () => {
		if (isLoadingDocumentTypes) {
			return 'Loading document types...';
		}
		if (documentTypesFetchFailed) {
			return t('DOCUMENTCONFIG_TYPES_FAILED_WARNING');
		}
		return 'Select document type';
	};

	return (
		<Box bg="gray.50" minH="100vh" py={{ base: 4, md: 8 }}>
			<Layout
				showMenu={true}
				title={t('DOCUMENTCONFIG_TITLE')}
				subTitle={t('DOCUMENTCONFIG_SUBTITLE')}
			>
				<VStack
					spacing={10}
					align="stretch"
					px={{ base: 2, md: 8 }}
					py={6}
				>
					<Box>
						<VStack spacing={6} align="stretch">
							{documentTypesFetchFailed &&
							!isLoadingDocumentTypes && (
								<Box
									bg="red.50"
									border="1px solid"
									borderColor="red.200"
									borderRadius="md"
									p={4}
									mb={4}
								>
									<Text color="red.600" fontWeight="bold">
										⚠️{' '}
										{t(
											'DOCUMENTCONFIG_TYPES_FAILED_WARNING'
										)}
									</Text>
									<Text color="red.500" fontSize="sm">
										{t(
											'DOCUMENTCONFIG_TYPES_FAILED_MESSAGE'
										)}
									</Text>
								</Box>
							)}
							{documentConfigs.map((doc, index) => (
								<Box
									key={doc.id}
									borderRadius="xl"
									boxShadow="0 2px 8px rgba(6,22,75,0.08)"
									borderWidth="1.5px"
									borderColor="#06164B"
									bg="white"
									p={{ base: 2, md: 6 }}
									mb={2}
								>
									<VStack spacing={6} align="stretch">
										<HStack justify="flex-end">
											<IconButton
												icon={<DeleteIcon />}
												colorScheme="red"
												aria-label={t(
													'DOCUMENTCONFIG_REMOVE_ARIA'
												)}
												size="lg"
												variant="ghost"
												onClick={() =>
													removeConfig(index)
												}
												isDisabled={
													documentConfigs.length === 1
												}
											/>
										</HStack>
										<HStack
											spacing={4}
											align={{
												base: 'stretch',
												md: 'start',
											}}
											flexDir={{
												base: 'column',
												md: 'row',
											}}
										>
											<FormControl
												isInvalid={
													!!errors[`name_${index}`]
												}
												flex={1}
											>
												<FormLabel
													fontSize="md"
													fontWeight="bold"
													color="#06164B"
												>
													{t(
														'DOCUMENTCONFIG_DOCUMENT_NAME_LABEL'
													)}
													<Text
														as="span"
														color="red.500"
													>
														*
													</Text>
												</FormLabel>
												<Input
													value={doc.name}
													onChange={(e) =>
														handleChange(
															index,
															'name',
															e.target.value
														)
													}
													borderWidth="2px"
													bg="white"
													size="lg"
													borderRadius="md"
													_focus={{
														borderColor: 'blue.400',
														boxShadow:
															'0 0 0 2px #06164B33',
													}}
												/>
												<FormErrorMessage fontSize="xs">
													{errors[`name_${index}`]}
												</FormErrorMessage>
											</FormControl>
											<FormControl
												isInvalid={
													!!errors[`label_${index}`]
												}
												flex={1}
											>
												<FormLabel
													fontSize="md"
													fontWeight="bold"
													color="#06164B"
												>
													{t(
														'DOCUMENTCONFIG_DOCUMENT_LABEL_LABEL'
													)}
													<Text
														as="span"
														color="red.500"
													>
														*
													</Text>
												</FormLabel>
												<Input
													value={doc.label}
													onChange={(e) =>
														handleChange(
															index,
															'label',
															e.target.value
														)
													}
													borderWidth="2px"
													bg="white"
													size="lg"
													borderRadius="md"
													_focus={{
														borderColor: 'blue.400',
														boxShadow:
															'0 0 0 2px #06164B33',
													}}
												/>
												<FormErrorMessage fontSize="xs">
													{errors[`label_${index}`]}
												</FormErrorMessage>
											</FormControl>
										</HStack>
										<HStack
											spacing={4}
											align={{
												base: 'stretch',
												md: 'start',
											}}
											flexDir={{
												base: 'column',
												md: 'row',
											}}
										>
											<FormControl
												isInvalid={
													!!errors[`docType_${index}`]
												}
												flex={1}
											>
												<FormLabel
													fontSize="md"
													fontWeight="bold"
													color="#06164B"
												>
													{t(
														'DOCUMENTCONFIG_DOCUMENT_TYPE_LABEL'
													)}
													<Text
														as="span"
														color="red.500"
													>
														*
													</Text>
												</FormLabel>
												<Select
													value={doc.docType}
													onChange={(e) =>
														handleChange(
															index,
															'docType',
															e.target.value
														)
													}
													borderWidth="2px"
													bg="white"
													size="lg"
													borderRadius="md"
													_focus={{
														borderColor: 'blue.400',
														boxShadow:
															'0 0 0 2px #06164B33',
													}}
												isDisabled={
													isLoadingDocumentTypes ||
													documentTypesFetchFailed
												}
												placeholder={getDocumentTypeSelectPlaceholder()}
												>
													{documentTypes.map(
														(type) => (
															<option
																key={type}
																value={type}
															>
																{type}
															</option>
														)
													)}
												</Select>
												<FormErrorMessage fontSize="xs">
													{errors[`docType_${index}`]}
												</FormErrorMessage>
											</FormControl>
											<FormControl
												isInvalid={
													!!errors[
														`documentSubType_${index}`
													]
												}
												flex={1}
											>
												<FormLabel
													fontSize="md"
													fontWeight="bold"
													color="#06164B"
												>
													{t(
														'DOCUMENTCONFIG_DOCUMENT_SUB_TYPE_LABEL'
													)}
													<Text
														as="span"
														color="red.500"
													>
														*
													</Text>
												</FormLabel>
												<Input
													value={doc.documentSubType}
													onChange={(e) =>
														handleChange(
															index,
															'documentSubType',
															e.target.value
														)
													}
													borderWidth="2px"
													bg="white"
													size="lg"
													borderRadius="md"
													_focus={{
														borderColor: 'blue.400',
														boxShadow:
															'0 0 0 2px #06164B33',
													}}
												/>
												<FormErrorMessage fontSize="xs">
													{
														errors[
															`documentSubType_${index}`
														]
													}
												</FormErrorMessage>
											</FormControl>
										</HStack>
										<HStack
											spacing={4}
											align={{
												base: 'stretch',
												md: 'start',
											}}
											flexDir={{
												base: 'column',
												md: 'row',
											}}
										>
											<FormControl
												isInvalid={
													!!errors[`issueVC_${index}`]
												}
												flex={1}
											>
												<FormLabel
													fontSize="md"
													fontWeight="bold"
													color="#06164B"
												>
													{t(
														'DOCUMENTCONFIG_ISSUE_VC_LABEL'
													)}
													<Text
														as="span"
														color="red.500"
													>
														*
													</Text>
												</FormLabel>
												<Select
													value={doc.issueVC}
													onChange={(e) =>
														handleChange(
															index,
															'issueVC',
															e.target.value
														)
													}
													borderWidth="2px"
													bg="white"
													size="lg"
													borderRadius="md"
													_focus={{
														borderColor: 'blue.400',
														boxShadow:
															'0 0 0 2px #06164B33',
													}}
													placeholder="Select option"
												>
													{ISSUE_VC_OPTIONS.map(
														(option) => (
															<option
																key={option.value}
																value={
																	option.value
																}
															>
																{option.label}
															</option>
														)
													)}
												</Select>
												<FormErrorMessage fontSize="xs">
													{errors[`issueVC_${index}`]}
												</FormErrorMessage>
											</FormControl>
											{doc.issueVC === 'no' && (
												<FormControl
													isInvalid={
														!!errors[
															`docQRContains_${index}`
														]
													}
													flex={1}
												>
													<FormLabel
														fontSize="md"
														fontWeight="bold"
														color="#06164B"
													>
														{t(
															'DOCUMENTCONFIG_DOC_QR_CONTAINS_LABEL'
														)}
														<Text
															as="span"
															color="red.500"
														>
															*
														</Text>
													</FormLabel>
													<Select
														value={
															doc.docQRContains ||
															''
														}
														onChange={(e) =>
															handleChange(
																index,
																'docQRContains',
																e.target.value
															)
														}
														borderWidth="2px"
														bg="white"
														size="lg"
														borderRadius="md"
														_focus={{
															borderColor:
																'blue.400',
															boxShadow:
																'0 0 0 2px #06164B33',
														}}
														placeholder="Select option"
													>
														{DOC_QR_CONTAINS_OPTIONS.map(
															(option) => (
																<option
																	key={
																		option.value
																	}
																	value={
																		option.value
																	}
																>
																	{
																		option.label
																	}
																</option>
															)
														)}
													</Select>
													<FormErrorMessage fontSize="xs">
														{
															errors[
																`docQRContains_${index}`
															]
														}
													</FormErrorMessage>
												</FormControl>
											)}
										</HStack>
										<FormControl
											isInvalid={
												!!errors[`vcFields_${index}`]
											}
										>
											<FormLabel
												fontSize="md"
												fontWeight="bold"
												color="#06164B"
											>
												{t(
													'DOCUMENTCONFIG_VC_FIELDS_LABEL'
												)}
												<Text as="span" color="red.500">
													*
												</Text>{' '}
												<Text
													color="#06164B"
													fontSize={12}
												>
													{t(
														'DOCUMENTCONFIG_VC_FIELDS_DESCRIPTION'
													)}
												</Text>
											</FormLabel>
											<Textarea
												value={doc.vcFields || ''}
												onChange={(e) =>
													handleChange(
														index,
														'vcFields',
														e.target.value
													)
												}
												placeholder={t(
													'DOCUMENTCONFIG_VC_FIELDS_PLACEHOLDER'
												)}
												resize="vertical"
												minH="200px"
												bg="white"
												size="lg"
												borderWidth="2px"
												borderRadius="md"
												_focus={{
													borderColor: 'blue.400',
													boxShadow:
														'0 0 0 2px #06164B33',
												}}
											/>
											<FormErrorMessage fontSize="xs">
												{errors[`vcFields_${index}`]}
											</FormErrorMessage>
										</FormControl>						
									</VStack>
								</Box>
							))}
							<Button
								leftIcon={<AddIcon />}
								bg="#06164B"
								color="white"
								_hover={{
									bg: '#06164Bcc',
									transform: 'translateY(-2px)',
									boxShadow: 'lg',
								}}
								_active={{ bg: '#06164B' }}
								borderRadius="lg"
								variant="solid"
								size="lg"
								mt={2}
								width="100%"
								onClick={addConfig}
								px={8}
								py={6}
								fontWeight="bold"
								fontSize="md"
								boxShadow="sm"
								isDisabled={
									documentTypesFetchFailed ||
									isLoadingDocumentTypes
								}
							>
								{t('DOCUMENTCONFIG_ADD_CONFIGURATION_BUTTON')}
							</Button>
						</VStack>
					</Box>
					<Divider my={6} />
					<HStack justify="flex-end" spacing={4}>
						<Button
							color="white"
							bg="#06164B"
							_hover={{
								bg: '#06164Bcc',
								transform: 'translateY(-2px)',
								boxShadow: 'lg',
							}}
							_active={{ bg: '#06164B' }}
							borderRadius="lg"
							size="lg"
							px={8}
							py={6}
							fontWeight="bold"
							fontSize="md"
							boxShadow="sm"
							onClick={handleSaveAll}
							isDisabled={
								documentTypesFetchFailed ||
								isLoadingDocumentTypes
							}
						>
							{t('DOCUMENTCONFIG_SAVE_ALL_BUTTON')}
						</Button>
					</HStack>
				</VStack>
			</Layout>
		</Box>
	);
};

export default DocumentConfig;
