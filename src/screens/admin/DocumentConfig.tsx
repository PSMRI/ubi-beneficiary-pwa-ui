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
	Select,
	Text,
	Textarea,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { getMapping, updateMapping } from '../../services/admin/admin';
import { getIssuers, type Issuer } from '../../services/admin/issuer';
import { ConfigService } from '../../services/configService';
import Layout from '../../components/common/admin/Layout';
import TagInput from '../../components/common/input/TagInput';
import { useTranslation } from 'react-i18next';
import ClickableTooltip from '../../components/ClickableTooltip';

interface DocumentConfig {
	id: number;
	name: string;
	label: string;
	documentSubType: string;
	docType: string;
	vcFields: string;
	issueVC: string;
	docHasORCode?: string;
	docQRContains?: string;
	issuer?: string; // Issuer ID (e.g., "passport_seva")
	spaceId?: string;
	ocrMappingPrompt?: string;
	preValidationEnabled?: string;
	preValidationRequiredKeywords?: string[];
	preValidationExclusionKeywords?: string[];
	postValidationEnabled?: string;
	postValidationRequiredFields?: string[];
	postValidationFieldMappingNumbers?: number;
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
	const scrollContainerRef = React.useRef<HTMLDivElement>(null);
	const toast = useToast();
	const { t } = useTranslation();

	// --- State for document configurations and errors ---
	const [documentConfigs, setDocumentConfigs] = useState<DocumentConfig[]>(
		[]
	);
	const [errors, setErrors] = useState<ValidationErrors>({});

	// --- State for TagInput inline errors ---
	const [tagInputErrors, setTagInputErrors] = useState<{ [key: string]: string | null }>({});

	// --- State for issuers ---
	const [allIssuers, setAllIssuers] = useState<Issuer[]>([]);
	const [isLoadingIssuers, setIsLoadingIssuers] = useState(true);
	const [issuersFetchFailed, setIssuersFetchFailed] = useState(false);

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

	// --- Fetch issuers from API ---
	useEffect(() => {
		let isMounted = true;

		const fetchIssuers = async () => {
			try {
				if (!isMounted) return;
				setIsLoadingIssuers(true);
				setIssuersFetchFailed(false);

				const issuers = await getIssuers();

				if (!isMounted) return;

				if (Array.isArray(issuers)) {
					setAllIssuers(issuers);
					setIssuersFetchFailed(false);
				} else {
					console.warn('Issuers not found in expected format');
					setAllIssuers([]);
					setIssuersFetchFailed(true);
				}
			} catch (error) {
				if (!isMounted) return;

				console.error('Error fetching issuers:', error);
				setIssuersFetchFailed(true);
				toast({
					title: t('DOCUMENTCONFIG_ERROR_TITLE'),
					description: t('DOCUMENTCONFIG_FETCH_ISSUERS_ERROR'),
					status: 'error',
					duration: 2000,
					isClosable: true,
				});
				setAllIssuers([]);
			} finally {
				if (isMounted) {
					setIsLoadingIssuers(false);
				}
			}
		};

		fetchIssuers();

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
							docHasORCode: item.docHasORCode || '',
							docQRContains: item.docQRContains || '',
							issuer: item.issuer || '',
							spaceId: item.spaceId || '',

							ocrMappingPrompt: item.ocrMappingPrompt || item.OCR_MAPPING_PROMPT_TEMPLATE || '',
							preValidationEnabled: item.preValidationEnabled || '',
							preValidationRequiredKeywords:
								Array.isArray(item.preValidationRequiredKeywords)
									? item.preValidationRequiredKeywords
									: [],
							preValidationExclusionKeywords:
								Array.isArray(item.preValidationExclusionKeywords)
									? item.preValidationExclusionKeywords
									: [],
							postValidationEnabled: item.postValidationEnabled || '',
							postValidationRequiredFields:
								Array.isArray(item.postValidationRequiredFields)
									? item.postValidationRequiredFields
									: [],
							postValidationFieldMappingNumbers: item.postValidationFieldMappingNumbers ?? null,
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
							docHasORCode: '',
							docQRContains: '',
							issuer: '',
							spaceId: '',
							ocrMappingPrompt: '',
							preValidationEnabled: '',
							preValidationRequiredKeywords: [],
							preValidationExclusionKeywords: [],
							postValidationEnabled: '',
							postValidationRequiredFields: [],
							postValidationFieldMappingNumbers: null,
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

	// --- Helper to check if vcFields is valid and non-empty ---
	const hasValidVcFields = (vcFields: string): boolean => {
		if (!vcFields || vcFields.trim() === '') return false;
		return validateVcFields(vcFields);
	};

	// --- Helper to get keys from vcFields JSON ---
	const getVcFieldKeys = (vcFields: string): string[] => {
		if (!hasValidVcFields(vcFields)) return [];
		try {
			const parsed = JSON.parse(vcFields);
			return Object.keys(parsed);
		} catch {
			return [];
		}
	};

	// --- Handle input changes and validate fields ---
	const handleChange = <K extends keyof DocumentConfig>(
		index: number,
		field: K,
		value: DocumentConfig[K]
	) => {
		const updated = [...documentConfigs];
		updated[index][field] = value;

		// If issueVC changes to "yes", clear docHasORCode and docQRContains
		if (field === 'issueVC' && value === 'yes') {
			updated[index].docHasORCode = '';
			updated[index].docQRContains = '';
		}

		// If issueVC changes to "no", clear spaceId
		if (field === 'issueVC' && value === 'no') {
			updated[index].spaceId = '';
		}

		// If docHasORCode changes to "no", clear docQRContains
		if (field === 'docHasORCode' && value === 'no') {
			updated[index].docQRContains = '';
		}

		setDocumentConfigs(updated);

		const newErrors = { ...errors };
		delete newErrors[`${field}_${index}`];

		// If issueVC changes, clear docHasORCode, docQRContains and spaceId errors
		if (field === 'issueVC') {
			delete newErrors[`docHasORCode_${index}`];
			delete newErrors[`docQRContains_${index}`];
			delete newErrors[`spaceId_${index}`];
		}

		// If docHasORCode changes, clear docQRContains error
		if (field === 'docHasORCode') {
			delete newErrors[`docQRContains_${index}`];
		}

		// If docType changes, clear issuer error
		if (field === 'docType') {
			delete newErrors[`issuer_${index}`];
		}

		// If the field is 'vcFields', validate JSON and structure
		if (field === 'vcFields') {
			if (
				typeof value === 'string' &&
				value.trim() !== '' &&
				!validateVcFields(value)
			) {
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
				docHasORCode: '',
				docQRContains: '',
				issuer: '',
				spaceId: '',
				ocrMappingPrompt: '',
				preValidationEnabled: '',
				preValidationRequiredKeywords: [],
				preValidationExclusionKeywords: [],
				postValidationEnabled: '',
				postValidationRequiredFields: [],
				postValidationFieldMappingNumbers: null,
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
				'issuer',
				'preValidationEnabled',
			].forEach((field) => {
				if (!doc[field]) {
					newErrors[`${field}_${index}`] = `${field} ${t(
						'DOCUMENTCONFIG_FIELD_REQUIRED'
					)}`;
					hasError = true;
				}
			});
			// Validate docHasORCode is required when issueVC is "no"
			if (doc.issueVC === 'no' && !doc.docHasORCode) {
				newErrors[`docHasORCode_${index}`] = t(
					'DOCUMENTCONFIG_FIELD_REQUIRED'
				);
				hasError = true;
			}
			// Validate docQRContains is required when issueVC is "no" AND docHasORCode is "yes"
			if (doc.issueVC === 'no' && doc.docHasORCode === 'yes' && !doc.docQRContains) {
				newErrors[`docQRContains_${index}`] = t(
					'DOCUMENTCONFIG_FIELD_REQUIRED'
				);
				hasError = true;
			}
			// Validate spaceId is required when issueVC is "yes"
			if (doc.issueVC === 'yes' && !doc.spaceId) {
				newErrors[`spaceId_${index}`] = t(
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

			// Validate postValidationEnabled is required when vcFields is valid
			if (hasValidVcFields(doc.vcFields) && !doc.postValidationEnabled) {
				newErrors[`postValidationEnabled_${index}`] = t(
					'DOCUMENTCONFIG_FIELD_REQUIRED'
				);
				hasError = true;
			}

			// Validate postValidationRequiredFields values exist in vcFields
			if (hasValidVcFields(doc.vcFields) && doc.postValidationRequiredFields && doc.postValidationRequiredFields.length > 0) {
				const vcFieldKeys = getVcFieldKeys(doc.vcFields);
				const invalidFields = doc.postValidationRequiredFields.filter(
					fieldName => !vcFieldKeys.includes(fieldName)
				);
				if (invalidFields.length > 0) {
					newErrors[`postValidationRequiredFields_${index}`] =
						`Invalid fields: ${invalidFields.join(', ')}. Must exist in VC Fields.`;
					hasError = true;
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
				docHasORCode: doc.docHasORCode,
				docQRContains: doc.docQRContains,
				issuer: doc.issuer,
				spaceId: doc.spaceId,
				ocrMappingPrompt: doc.ocrMappingPrompt || '',
				preValidationEnabled: doc.preValidationEnabled,
				preValidationRequiredKeywords: doc.preValidationRequiredKeywords,
				preValidationExclusionKeywords: doc.preValidationExclusionKeywords,
				postValidationEnabled: doc.postValidationEnabled,
				postValidationRequiredFields: doc.postValidationRequiredFields,
				postValidationFieldMappingNumbers: doc.postValidationFieldMappingNumbers,
			}));
			await updateMapping(saveData, 'vcConfiguration');

			// Clear the cache so the new configuration is loaded on next access
			ConfigService.clearCache();

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
			return t('DOCUMENTCONFIG_LOADING_TYPES');
		}
		if (documentTypesFetchFailed) {
			return t('DOCUMENTCONFIG_TYPES_FAILED_WARNING');
		}
		return t('DOCUMENTCONFIG_SELECT_TYPE');
	};

	return (
		<Box ref={scrollContainerRef} bg="gray.50" minH="100vh" py={{ base: 4, md: 8 }}>
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
													<ClickableTooltip
														label={t(
															'DOCUMENTCONFIG_INFO_NAME'
														)}
														fontSize="md"
														placement="right"
														closeOnScroll={true}
														zIndex={1100}
													>
														<InfoOutlineIcon
															ml={2}
															color="gray.500"
															cursor="pointer"
														/>
													</ClickableTooltip>
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
													<ClickableTooltip
														label={t(
															'DOCUMENTCONFIG_INFO_LABEL'
														)}
														fontSize="md"
														placement="right"
														closeOnScroll={true}
														zIndex={1100}
													>
														<InfoOutlineIcon
															ml={2}
															color="gray.500"
															cursor="pointer"
														/>
													</ClickableTooltip>
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
													<ClickableTooltip
														label={t(
															'DOCUMENTCONFIG_INFO_TYPE'
														)}
														fontSize="md"
														placement="right"
														closeOnScroll={true}
														zIndex={1100}
													>
														<InfoOutlineIcon
															ml={2}
															color="gray.500"
															cursor="pointer"
														/>
													</ClickableTooltip>
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
													<ClickableTooltip
														label={t(
															'DOCUMENTCONFIG_INFO_SUBTYPE'
														)}
														fontSize="md"
														placement="right"
														closeOnScroll={true}
														zIndex={1100}
													>
														<InfoOutlineIcon
															ml={2}
															color="gray.500"
															cursor="pointer"
														/>
													</ClickableTooltip>
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
													!!errors[`issuer_${index}`]
												}
												flex={1}
											>
												<FormLabel
													fontSize="md"
													fontWeight="bold"
													color="#06164B"
												>
													{t(
														'DOCUMENTCONFIG_ISSUER_LABEL'
													)}
													<Text
														as="span"
														color="red.500"
													>
														*
													</Text>
													<ClickableTooltip
														label={t(
															'DOCUMENTCONFIG_INFO_ISSUER'
														)}
														fontSize="md"
														placement="right"
														closeOnScroll={true}
														zIndex={1100}
													>
														<InfoOutlineIcon
															ml={2}
															color="gray.500"
															cursor="pointer"
														/>
													</ClickableTooltip>
												</FormLabel>
												<Select
													value={doc.issuer || ''}
													onChange={(e) =>
														handleChange(
															index,
															'issuer',
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
														isLoadingIssuers ||
														issuersFetchFailed ||
														allIssuers.length === 0
													}
													placeholder={
														isLoadingIssuers
															? t(
																'DOCUMENTCONFIG_LOADING_ISSUERS'
															)
															: issuersFetchFailed
																? t(
																	'DOCUMENTCONFIG_ISSUERS_FAILED'
																)
																: allIssuers.length ===
																	0
																	? t(
																		'DOCUMENTCONFIG_NO_ISSUERS_AVAILABLE'
																	)
																	: t(
																		'DOCUMENTCONFIG_SELECT_ISSUER'
																	)
													}
												>
													{allIssuers.map(
														(issuer) => (
															<option
																key={issuer.id}
																value={
																	issuer.id
																}
															>
																{issuer.name}
															</option>
														)
													)}
												</Select>
												<FormErrorMessage fontSize="xs">
													{errors[`issuer_${index}`]}
												</FormErrorMessage>
											</FormControl>
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
													<ClickableTooltip
														label={t(
															'DOCUMENTCONFIG_INFO_ISSUE_VC'
														)}
														fontSize="md"
														placement="right"
														closeOnScroll={true}
														zIndex={1100}
													>
														<InfoOutlineIcon
															ml={2}
															color="gray.500"
															cursor="pointer"
														/>
													</ClickableTooltip>
												</FormLabel>
												<Select
													value={doc.issueVC}
													onChange={(e) =>
														handleChange(
															index,
															'issueVC',
															e.target.value as
															| 'yes'
															| 'no'
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
													placeholder={t(
														'DOCUMENTCONFIG_SELECT_DEFAULT_PLACEHOLDER'
													)}
												>
													{ISSUE_VC_OPTIONS.map(
														(option) => (
															<option
																key={
																	option.value
																}
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
											{doc.issueVC === 'yes' && (
												<FormControl
													isInvalid={
														!!errors[
														`spaceId_${index}`
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
															'DOCUMENTCONFIG_SPACE_ID_LABEL'
														)}
														<Text
															as="span"
															color="red.500"
														>
															*
														</Text>
														<ClickableTooltip
															label={t(
																'DOCUMENTCONFIG_INFO_SPACE_ID'
															)}
															fontSize="md"
															placement="right"
															closeOnScroll={true}
															zIndex={1100}
														>
															<InfoOutlineIcon
																ml={2}
																color="gray.500"
																cursor="pointer"
															/>
														</ClickableTooltip>
													</FormLabel>
													<Input
														value={
															doc.spaceId || ''
														}
														onChange={(e) =>
															handleChange(
																index,
																'spaceId',
																e.target.value
															)
														}
														placeholder="f7401ef81-aa6e-44be-b929-0ffb0c958383"
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
													/>
													<FormErrorMessage fontSize="xs">
														{
															errors[
															`spaceId_${index}`
															]
														}
													</FormErrorMessage>
												</FormControl>
											)}
											{doc.issueVC === 'no' && (
												<>
													<FormControl
														isInvalid={
															!!errors[
															`docHasORCode_${index}`
															]
														}
														flex={1}
													>
														<FormLabel
															fontSize="md"
															fontWeight="bold"
															color="#06164B"
															alignItems="center"
															display="flex"
														>
															{t(
																'DOCUMENTCONFIG_DOCUMENT_HAS_OR_CODE_LABEL'
															)}
															<Text
																as="span"
																color="red.500"
																mx={1}
															>
																*
															</Text>
															<ClickableTooltip
																label={t(
																	'DOCUMENTCONFIG_INFO_HAS_QR'
																)}
																fontSize="md"
																placement="right"
																closeOnScroll={true}
																zIndex={1100}
															>
																<InfoOutlineIcon
																	color="gray.500"
																	cursor="pointer"
																/>
															</ClickableTooltip>
														</FormLabel>
														<Select
															value={
																doc.docHasORCode ||
																''
															}
															onChange={(e) =>
																handleChange(
																	index,
																	'docHasORCode',
																	e.target
																		.value as
																	| 'yes'
																	| 'no'
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
															placeholder={t(
																'DOCUMENTCONFIG_SELECT_DEFAULT_PLACEHOLDER'
															)}
														>
															{ISSUE_VC_OPTIONS.map(
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
																`docHasORCode_${index}`
																]
															}
														</FormErrorMessage>
													</FormControl>
													{doc.docHasORCode === 'yes' ? (
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
																<ClickableTooltip
																	label={t(
																		'DOCUMENTCONFIG_INFO_QR_CONTAINS'
																	)}
																	fontSize="md"
																	placement="right"
																	closeOnScroll={true}
																	zIndex={1100}
																>
																	<InfoOutlineIcon
																		ml={2}
																		color="gray.500"
																		cursor="pointer"
																	/>
																</ClickableTooltip>
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
																		e.target
																			.value as DocumentConfig['docQRContains']
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
																placeholder={t(
																	'DOCUMENTCONFIG_SELECT_DEFAULT_PLACEHOLDER'
																)}
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
													) : (
														<Box flex={1} />
													)}
												</>
											)}
										</HStack>

										<HStack spacing={6} align="flex-start">
											{/* Enable Pre-Validations */}
											<FormControl
												isInvalid={!!errors[`preValidationEnabled_${index}`]}
												width={{ base: '100%', md: '50%' }}
											>
												<FormLabel fontSize="md" fontWeight="bold" color="#06164B">
													{t('DOCUMENTCONFIG_PREVAL_ENABLED_LABEL')}
													<Text as="span" color="red.500">*</Text>


													<ClickableTooltip
														label={t(
															'DOCUMENTCONFIG_INFO_PREVAL_ENABLED'
														)}
														fontSize="md"
														placement="right"
														closeOnScroll={true}
														zIndex={1100}
													>
														<InfoOutlineIcon
															ml={2}
															color="gray.500"
															cursor="pointer"
														/>
													</ClickableTooltip>
												</FormLabel>

												<Select
													value={doc.preValidationEnabled || ''}
													onChange={(e) =>
														handleChange(index, 'preValidationEnabled', e.target.value)
													}
													borderWidth="2px"
													bg="white"
													size="lg"
													borderRadius="md"
													placeholder="Select option"
													_focus={{
														borderColor: 'blue.400',
														boxShadow: '0 0 0 2px #06164B33',
													}}
												>
													<option value="yes">Yes</option>
													<option value="no">No</option>
												</Select>

												<FormErrorMessage fontSize="xs">
													{errors[`preValidationEnabled_${index}`]}
												</FormErrorMessage>
											</FormControl>

											{/* Pre-Validation Required Keywords (same row, conditional) */}

											<FormControl
												isInvalid={!!tagInputErrors[`preValidationRequiredKeywords_${index}`]}
												width={{ base: '100%', md: '50%' }}
											>
												<FormLabel fontSize="md" fontWeight="bold" color="#06164B">
													{t('DOCUMENTCONFIG_PREVAL_REQUIRED_LABEL')}
													<ClickableTooltip
														label={t(
															'DOCUMENTCONFIG_INFO_PREVAL_REQUIRED'
														)}
														fontSize="md"
														placement="right"
														closeOnScroll={true}
														zIndex={1100}
													>
														<InfoOutlineIcon
															ml={2}
															color="gray.500"
															cursor="pointer"
														/>
													</ClickableTooltip>
												</FormLabel>

												<TagInput
													tags={doc.preValidationRequiredKeywords || []}
													onTagsChange={(newTags) =>
														handleChange(
															index,
															'preValidationRequiredKeywords',
															newTags
														)
													}
													placeholder={t('DOCUMENTCONFIG_FIELD_PREVALIDAYIONS_REQUIRED_KEYWORDS')}
													onError={(errorMessage) => {
														setTagInputErrors(prev => ({
															...prev,
															[`preValidationRequiredKeywords_${index}`]: errorMessage
														}));
													}}
													caseSensitive={true}
												/>
												<FormErrorMessage fontSize="xs">
													{tagInputErrors[`preValidationRequiredKeywords_${index}`]}
												</FormErrorMessage>
											</FormControl>

										</HStack>

										{/* Row 2 */}


										<FormControl width={{ base: '100%', md: '50%' }}>
											<FormLabel fontSize="md" fontWeight="bold" color="#06164B">
												{t('DOCUMENTCONFIG_PREVAL_EXCLUDED_LABEL')}
												<ClickableTooltip
													label={t(
														'DOCUMENTCONFIG_INFO_PREVAL_EXCLUDED'
													)}
													fontSize="md"
													placement="right"
													closeOnScroll={true}
													zIndex={1100}
												>
													<InfoOutlineIcon
														ml={2}
														color="gray.500"
														cursor="pointer"
													/>
												</ClickableTooltip>
											</FormLabel>

											<TagInput
												tags={doc.preValidationExclusionKeywords || []}
												onTagsChange={(newTags) =>
													handleChange(
														index,
														'preValidationExclusionKeywords',
														newTags
													)
												}
												placeholder={t('DOCUMENTCONFIG_FIELD_PREVALIDAYIONS_EXCLUDED_KEYWORDS')}
											/>
										</FormControl>
										<FormControl
											isInvalid={
												!!errors[`vcFields_${index}`]
											}
										>
											<FormLabel
												fontSize="md"
												fontWeight="bold"
												color="#06164B"
												alignItems="center"
												display="flex"
											>
												{t(
													'DOCUMENTCONFIG_VC_FIELDS_LABEL'
												)}
												<Text as="span" color="red.500" mx={1}>
													*
												</Text>{' '}
												<ClickableTooltip
													label={t(
														'DOCUMENTCONFIG_INFO_VC_FIELDS'
													)}
													fontSize="md"
													placement="right"
													closeOnScroll={true}
													zIndex={1100}
												>
													<InfoOutlineIcon
														ml={2}
														color="gray.500"
														cursor="pointer"
													/>
												</ClickableTooltip>

											</FormLabel>
											{doc.issueVC === 'no' && (
												<Text
													color="blue.600"
													fontSize={11}
													mb={3}
													fontStyle="italic"
												>
													{t(
														'DOCUMENTCONFIG_VC_FIELDS_VALID_UNTIL_NOTE'
													)}
												</Text>
											)}
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

										{/* Post Validation Section - Row 1 */}
										<HStack spacing={6} align="flex-start">
											{/* Enable Post Validation */}
											<FormControl
												isInvalid={!!errors[`postValidationEnabled_${index}`]}
												width={{ base: '100%', md: '50%' }}
											>
												<FormLabel fontSize="md" fontWeight="bold" color="#06164B">
													{t('DOCUMENTCONFIG_POSTVAL_ENABLED_LABEL')}
													{hasValidVcFields(doc.vcFields) && (
														<Text as="span" color="red.500">*</Text>
													)}
													<ClickableTooltip
														label={t('DOCUMENTCONFIG_INFO_POSTVAL_ENABLED')}
														fontSize="md"
														placement="right"
														closeOnScroll={true}
														zIndex={1100}
													>
														<InfoOutlineIcon
															ml={2}
															color="gray.500"
															cursor="pointer"
														/>
													</ClickableTooltip>
												</FormLabel>

												<Select
													value={doc.postValidationEnabled || ''}
													onChange={(e) =>
														handleChange(index, 'postValidationEnabled', e.target.value)
													}
													borderWidth="2px"
													bg="white"
													size="lg"
													borderRadius="md"
													_focus={{
														borderColor: 'blue.400',
														boxShadow: '0 0 0 2px #06164B33',
													}}
													isDisabled={!hasValidVcFields(doc.vcFields)}
													placeholder={
														hasValidVcFields(doc.vcFields)
															? t('DOCUMENTCONFIG_SELECT_DEFAULT_PLACEHOLDER')
															: 'VC Fields must be valid'
													}
												>
													{ISSUE_VC_OPTIONS.map((option) => (
														<option key={option.value} value={option.value}>
															{option.label}
														</option>
													))}
												</Select>
												<FormErrorMessage fontSize="xs">
													{errors[`postValidationEnabled_${index}`]}
												</FormErrorMessage>
											</FormControl>

											{/* Post Validation Required Fields */}
											<FormControl
												isInvalid={!!tagInputErrors[`postValidationRequiredFields_${index}`]}
												width={{ base: '100%', md: '50%' }}
											>
												<FormLabel fontSize="md" fontWeight="bold" color="#06164B">
													{t('DOCUMENTCONFIG_POSTVAL_REQUIRED_FIELDS_LABEL')}
													<ClickableTooltip
														label={t('DOCUMENTCONFIG_INFO_POSTVAL_REQUIRED_FIELDS')}
														fontSize="md"
														placement="right"
														closeOnScroll={true}
														zIndex={1100}
													>
														<InfoOutlineIcon
															ml={2}
															color="gray.500"
															cursor="pointer"
														/>
													</ClickableTooltip>
												</FormLabel>

												<TagInput
													tags={doc.postValidationRequiredFields || []}
													onTagsChange={(newTags) =>
														handleChange(
															index,
															'postValidationRequiredFields',
															newTags
														)
													}
													placeholder={t('DOCUMENTCONFIG_POSTVAL_REQUIRED_FIELDS_PLACEHOLDER')}
													isDisabled={!hasValidVcFields(doc.vcFields)}
													onValidate={(tag: string) => {
														const vcFieldKeys = getVcFieldKeys(doc.vcFields);
														if (!hasValidVcFields(doc.vcFields)) {
															return {
																isValid: false,
																errorMessage: 'VC Fields must be valid JSON before adding required fields.'
															};
														}
														if (!vcFieldKeys.includes(tag)) {
															return {
																isValid: false,
																errorMessage: `Field "${tag}" does not exist in VC Fields. Allowed fields: ${vcFieldKeys.join(', ')}`
															};
														}
														return { isValid: true };
													}}
													onError={(errorMessage) => {
														setTagInputErrors(prev => ({
															...prev,
															[`postValidationRequiredFields_${index}`]: errorMessage
														}));
													}}
												/>
												<FormErrorMessage fontSize="xs">
													{tagInputErrors[`postValidationRequiredFields_${index}`]}
												</FormErrorMessage>
											</FormControl>
										</HStack>

										{/* Post Validation Section - Row 2 */}
										<FormControl
											isInvalid={!!errors[`postValidationFieldMappingNumbers_${index}`]}
											width={{ base: '100%', md: '50%' }}
										>
											<FormLabel fontSize="md" fontWeight="bold" color="#06164B">
												{t('DOCUMENTCONFIG_POSTVAL_FIELD_MAPPING_NUMBERS_LABEL')}
												<ClickableTooltip
													label={t('DOCUMENTCONFIG_INFO_POSTVAL_FIELD_MAPPING_NUMBERS')}
													fontSize="md"
													placement="right"
													closeOnScroll={true}
													zIndex={1100}
												>
													<InfoOutlineIcon
														ml={2}
														color="gray.500"
														cursor="pointer"
													/>
												</ClickableTooltip>
											</FormLabel>

											<Input
												type="text"
												value={doc.postValidationFieldMappingNumbers !== undefined && doc.postValidationFieldMappingNumbers !== null ? doc.postValidationFieldMappingNumbers.toString() : ''}
												onChange={(e) => {
													const value = e.target.value;
													if (value === '') {
														handleChange(index, 'postValidationFieldMappingNumbers', null);
														return;
													}
													if (!/^-?\d+$/.test(value)) {
														return;
													}
													const numValue = parseInt(value, 10);
													if (!isNaN(numValue)) {
														handleChange(index, 'postValidationFieldMappingNumbers', numValue);
														// Set error if value is <= 0
														if (numValue <= 0) {
															setErrors(prev => ({
																...prev,
																[`postValidationFieldMappingNumbers_${index}`]: numValue < 0
																	? 'Value must be a positive number (greater than 0)'
																	: 'Value must be greater than 0'
															}));
														} else {
															// Clear error if value is valid
															setErrors(prev => {
																const newErrors = { ...prev };
																delete newErrors[`postValidationFieldMappingNumbers_${index}`];
																return newErrors;
															});
														}
													}
												}}
												onKeyDown={(e) => {
													if (['+', 'e', 'E', '.'].includes(e.key)) {
														e.preventDefault();
													}
												}}
												placeholder="Enter a number"
												borderWidth="2px"
												bg="white"
												size="lg"
												borderRadius="md"
												_focus={{
													borderColor: 'blue.400',
													boxShadow: '0 0 0 2px #06164B33',
												}}
												isDisabled={!hasValidVcFields(doc.vcFields)}
											/>
											<FormErrorMessage fontSize="xs">
												{errors[`postValidationFieldMappingNumbers_${index}`]}
											</FormErrorMessage>
										</FormControl>

										<FormControl
											isInvalid={
												!!errors[`ocrMappingPrompt_${index}`]
											}
										>
											<FormLabel
												fontSize="md"
												fontWeight="bold"
												color="#06164B"
											>
												{t(
													'DOCUMENTCONFIG_FIELD_MAPPING_PROMPT_LABEL'
												)}
												<ClickableTooltip
													label={t(
														'DOCUMENTCONFIG_INFO_MAPPING_PROMPT'
													)}
													fontSize="md"
													placement="right"
													closeOnScroll={true}
													zIndex={1100}
												>
													<InfoOutlineIcon
														ml={2}
														color="gray.500"
														cursor="pointer"
													/>
												</ClickableTooltip>
											</FormLabel>
											<Text
												color="#06164B"
												fontSize={12}
												mb={2}
												fontWeight="normal"
											>
												{t(
													'DOCUMENTCONFIG_FIELD_MAPPING_PROMPT_DESCRIPTION'
												)}
											</Text>
											<Text
												color="blue.600"
												fontSize={11}
												mb={3}
												fontStyle="italic"
											>
												{t(
													'DOCUMENTCONFIG_FIELD_MAPPING_PROMPT_PLACEHOLDERS_INFO'
												)}
											</Text>
											<Textarea
												value={doc.ocrMappingPrompt || ''}
												onChange={(e) =>
													handleChange(
														index,
														'ocrMappingPrompt',
														e.target.value
													)
												}
												placeholder={t(
													'DOCUMENTCONFIG_FIELD_MAPPING_PROMPT_PLACEHOLDER'
												)}
												resize="vertical"
												minH="150px"
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
												{errors[`ocrMappingPrompt_${index}`]}
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
				</VStack >
			</Layout >
		</Box >
	);
};

export default DocumentConfig;
