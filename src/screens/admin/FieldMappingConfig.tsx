import React, { useState, useEffect } from 'react';
import {
	Box,
	VStack,
	HStack,
	Text,
	Select,
	Button,
	FormControl,
	FormLabel,
	FormErrorMessage,
	Card,
	CardBody,
	IconButton,
	Divider,
	Badge,
	Flex,
	useToast,
	Textarea,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import {
	getMapping,
	updateMapping,
	fetchFields as fetchFieldsAPI,
} from '../../services/admin/admin';
import Layout from '../../components/common/admin/Layout';

// Props interface for FieldMappingConfig
interface FieldMappingConfigProps {
	refreshTrigger?: number;
}

const FieldMappingConfig: React.FC<FieldMappingConfigProps> = ({
	refreshTrigger = 0,
}) => {
	const [fields, setFields] = useState([]); // List of available form fields from API
	const [documents, setDocuments] = useState([]); // List of available documents from API
	const [fieldMappings, setFieldMappings] = useState([
		// User-configured field-to-document mappings
		{
			id: Date.now(),
			fieldId: '',
			documentMappings: [
				{
					id: Date.now() + 1,
					selectedDocument: '',
					vcFields: [],
					selectedVcField: '',
				},
			],
			isExpanded: false,
			addMapping: '', // Optional normalization mapping
		},
	]);

	const [errors, setErrors] = useState({});
	const toast = useToast();

	// --- Fetch available form fields from API ---
	const fetchFields = async () => {
		try {
			const apiFields = await fetchFieldsAPI('USERS', 'User');
			setFields(apiFields);
		} catch (error) {
			console.error('Error fetching fields:', error);
			toast({
				title: 'Error fetching fields',
				description:
					error.message || 'Failed to fetch fields from server.',
				status: 'error',
				duration: 2000,
				isClosable: true,
			});
		}
	};

	// --- Fetch available documents from API (vcConfiguration) ---
	const fetchDocuments = async () => {
		try {
			const data = await getMapping('vcConfiguration');
			setDocuments(
				(data.data.value || []).map((doc, i) => ({
					id: `doc_${i + 1}`,
					name: doc.name,
					label: doc.label,
					documentSubType: doc.documentSubType,
					docType: doc.docType,
					vcFieldsRaw: doc.vcFields, // Raw VC fields JSON for later parsing
				}))
			);
		} catch (error) {
			console.error('Error fetching documents:', error);
			toast({
				title: 'Error',
				description: 'Failed to fetch documents',
				status: 'error',
				duration: 2000,
				isClosable: true,
			});
		}
	};

	// --- Helper to parse VC fields from document config ---
	function parseVcFields(vcFieldsRaw) {
		if (!vcFieldsRaw) return [];
		try {
			const parsed = JSON.parse(vcFieldsRaw);
			return Object.entries(parsed).map(([key, value]) => {
				const v = value as any;
				return {
					id: key,
					label: key,
					type: v.type,
				};
			});
		} catch (e) {
			console.error('Error parsing VC fields JSON:', e);
			return [];
		}
	}

	// --- Helper to map documentMappings from API config ---
	function mapDocumentMappings(documentMappings, vcConfigDocs, idx) {
		return (documentMappings || []).map((doc, j) => {
			// Find the corresponding document config
			const docConfig = vcConfigDocs.find(
				(d) => d.documentSubType === doc.document
			);
			const vcFields = docConfig
				? parseVcFields(docConfig.vcFieldsRaw)
				: [];
			return {
				id: Date.now() + idx * 100 + j,
				selectedDocument: doc.document,
				vcFields,
				selectedVcField: doc.documentField,
			};
		});
	}

	// --- Fetch VC fields for a selected document ---
	const fetchVcFields = async (documentSubType, fieldIndex, docIndex) => {
		if (!documentSubType) return;
		try {
			// Find the document config by subtype
			const doc = documents.find(
				(d) => d.documentSubType === documentSubType
			);
			const vcFields = doc ? parseVcFields(doc.vcFieldsRaw) : [];
			// Update the fieldMappings state with fetched VC fields
			const newFieldMappings = [...fieldMappings];
			newFieldMappings[fieldIndex].documentMappings[docIndex].vcFields =
				vcFields;
			setFieldMappings(newFieldMappings);
		} catch (error) {
			console.error('Error fetching VC fields:', error);
			toast({
				title: 'Error',
				description: 'Failed to fetch VC fields',
				status: 'error',
				duration: 2000,
				isClosable: true,
			});
		}
	};

	// --- Save all field mappings to the backend ---
	const saveAllMappings = async () => {
		// Validate all required fields except addMapping (which is optional)
		const validationErrors = {};
		let hasErrors = false;

		fieldMappings.forEach((fieldMapping, fieldIndex) => {
			// Validate field selection
			if (!fieldMapping.fieldId) {
				validationErrors[`field_${fieldIndex}`] =
					'Form field selection is required';
				hasErrors = true;
			}
			// 'Add Field Mapping' (addMapping) is now optional, so skip its required validation
			// Validate document mappings
			fieldMapping.documentMappings.forEach((docMapping, docIndex) => {
				if (!docMapping.selectedDocument) {
					validationErrors[`field_${fieldIndex}_doc_${docIndex}`] =
						'Document selection is required';
					hasErrors = true;
				}
				if (
					!docMapping.selectedVcField &&
					docMapping.selectedDocument
				) {
					validationErrors[`field_${fieldIndex}_vc_${docIndex}`] =
						'VC Field selection is required';
					hasErrors = true;
				}
			});
		});

		setErrors(validationErrors);

		if (hasErrors) {
			toast({
				title: 'Validation Error',
				description: 'Please fill in all required fields correctly.',
				status: 'error',
				duration: 2000,
				isClosable: true,
			});
			return;
		}

		try {
			// Prepare and send the payload
			const saveData = fieldMappings
				.filter((f) => f.fieldId)
				.map((fieldMapping) => {
					const fieldObj = fields.find(
						(f) => f.fieldId === fieldMapping.fieldId
					);
					return {
						fieldId: fieldObj
							? fieldObj.fieldId
							: fieldMapping.fieldId,
						fieldName: fieldObj ? fieldObj.name : '',
						documentMappings: fieldMapping.documentMappings
							.filter(
								(doc) =>
									doc.selectedDocument && doc.selectedVcField
							)
							.map((doc) => ({
								document: doc.selectedDocument,
								documentField: doc.selectedVcField,
							})),
						fieldValueNormalizationMapping:
							fieldMapping?.addMapping?.trim()
								? JSON.parse(fieldMapping.addMapping.trim())
								: undefined,
					};
				});

			await updateMapping(saveData, 'profileFieldToDocumentFieldMapping');

			const totalFields = saveData.length;
			const totalDocMappings = saveData.reduce(
				(sum, field) => sum + field.documentMappings.length,
				0
			);

			toast({
				title: 'Success',
				description: `Mappings saved! ${totalFields} fields with ${totalDocMappings} document mappings.`,
				status: 'success',
				duration: 2000,
				isClosable: true,
			});

			console.log('Saved data:', saveData);
		} catch (error) {
			console.error('Error saving mappings:', error);
			toast({
				title: 'Error',
				description: 'Failed to save mappings',
				status: 'error',
				duration: 2000,
				isClosable: true,
			});
		}
	};

	// Field Management
	const addFieldMapping = () => {
		setFieldMappings([
			...fieldMappings,
			{
				id: Date.now(),
				fieldId: '',
				documentMappings: [
					{
						id: Date.now() + 1,
						selectedDocument: '',
						vcFields: [],
						selectedVcField: '',
					},
				],
				isExpanded: false,
				addMapping: '', // always present
			},
		]);
	};

	const removeFieldMapping = (fieldIndex) => {
		let newFieldMappings = fieldMappings.filter((_, i) => i !== fieldIndex);
		if (newFieldMappings.length === 0) {
			newFieldMappings = [
				{
					id: Date.now(),
					fieldId: '',
					documentMappings: [
						{
							id: Date.now() + 1,
							selectedDocument: '',
							vcFields: [],
							selectedVcField: '',
						},
					],
					isExpanded: false,
					addMapping: '',
				},
			];
		}
		setFieldMappings(newFieldMappings);

		// Clear related errors
		const newErrors = { ...errors };
		Object.keys(errors).forEach((key) => {
			if (key.startsWith(`field_${fieldIndex}`)) {
				delete newErrors[key];
			}
		});
		setErrors(newErrors);
	};

	const updateFieldMapping = (fieldIndex, fieldId) => {
		const newFieldMappings = [...fieldMappings];
		newFieldMappings[fieldIndex].fieldId = fieldId;
		newFieldMappings[fieldIndex].isExpanded = !!fieldId;
		setFieldMappings(newFieldMappings);

		// Clear related errors
		const newErrors = { ...errors };
		delete newErrors[`field_${fieldIndex}`];
		setErrors(newErrors);
	};

	const toggleFieldExpansion = (fieldIndex) => {
		const newFieldMappings = [...fieldMappings];
		newFieldMappings[fieldIndex].isExpanded =
			!newFieldMappings[fieldIndex].isExpanded;
		setFieldMappings(newFieldMappings);
	};

	// Document Mapping Management
	const addDocumentMapping = (fieldIndex) => {
		const newFieldMappings = [...fieldMappings];
		newFieldMappings[fieldIndex].documentMappings.push({
			id: Date.now(),
			selectedDocument: '',
			vcFields: [],
			selectedVcField: '',
		});
		setFieldMappings(newFieldMappings);
	};

	const removeDocumentMapping = (fieldIndex, docIndex) => {
		const newFieldMappings = [...fieldMappings];
		if (newFieldMappings[fieldIndex].documentMappings.length > 1) {
			newFieldMappings[fieldIndex].documentMappings = newFieldMappings[
				fieldIndex
			].documentMappings.filter((_, i) => i !== docIndex);
			setFieldMappings(newFieldMappings);

			// Clear related errors
			const newErrors = { ...errors };
			delete newErrors[`field_${fieldIndex}_doc_${docIndex}`];
			delete newErrors[`field_${fieldIndex}_vc_${docIndex}`];
			setErrors(newErrors);
		}
	};
	const handleDocumentChange = (fieldIndex, docIndex, documentSubType) => {
		const newFieldMappings = [...fieldMappings];
		newFieldMappings[fieldIndex].documentMappings[
			docIndex
		].selectedDocument = documentSubType;
		newFieldMappings[fieldIndex].documentMappings[docIndex].vcFields = [];
		newFieldMappings[fieldIndex].documentMappings[
			docIndex
		].selectedVcField = '';
		setFieldMappings(newFieldMappings);

		// Clear errors
		const newErrors = { ...errors };
		delete newErrors[`field_${fieldIndex}_doc_${docIndex}`];
		delete newErrors[`field_${fieldIndex}_vc_${docIndex}`];
		setErrors(newErrors);

		if (documentSubType) {
			fetchVcFields(documentSubType, fieldIndex, docIndex);
		}
	};

	const handleVcFieldChange = (fieldIndex, docIndex, vcFieldId) => {
		const newFieldMappings = [...fieldMappings];
		newFieldMappings[fieldIndex].documentMappings[
			docIndex
		].selectedVcField = vcFieldId;
		setFieldMappings(newFieldMappings);

		// Clear VC field error
		const newErrors = { ...errors };
		delete newErrors[`field_${fieldIndex}_vc_${docIndex}`];
		setErrors(newErrors);
	};

	// Helper functions

	const getDocumentName = (docId) => {
		const doc = documents.find((d) => d.id === docId);
		return doc ? doc.name : '';
	};

	const getVcFieldLabel = (vcFields, vcFieldId) => {
		const vcField = vcFields.find((f) => f.id === vcFieldId);
		return vcField ? vcField.label : '';
	};

	const getTotalConfiguredMappings = () => {
		return fieldMappings.reduce((total, fieldMapping) => {
			if (!fieldMapping.fieldId) return total;
			return (
				total +
				fieldMapping.documentMappings.filter(
					(doc) => doc.selectedDocument && doc.selectedVcField
				).length
			);
		}, 0);
	};

	// --- Prefill fieldMappings from API config ---
	const fetchFieldMappings = async () => {
		try {
			// Fetch both profile mappings and VC config in parallel
			const [profileMappingData, vcConfigData] = await Promise.all([
				getMapping('profileFieldToDocumentFieldMapping'),
				getMapping('vcConfiguration'),
			]);
			const vcConfigDocs = (vcConfigData.data.value || []).map(
				(doc, i) => ({
					documentSubType: doc.documentSubType,
					vcFieldsRaw: doc.vcFields,
				})
			);
			if (
				Array.isArray(profileMappingData.data.value) &&
				profileMappingData.data.value.length > 0
			) {
				const mapped = profileMappingData.data.value.map(
					(item, idx) => {
						let addMappingValue = '';
						if (item.fieldValueNormalizationMapping) {
							if (
								typeof item.fieldValueNormalizationMapping ===
								'string'
							) {
								addMappingValue =
									item.fieldValueNormalizationMapping;
							} else {
								addMappingValue = JSON.stringify(
									item.fieldValueNormalizationMapping
								);
							}
						}
						return {
							id: Date.now() + idx,
							fieldId:
								fields.find((f) => f.fieldId === item.fieldId)
									?.fieldId ||
								fields.find((f) => f.name === item.fieldName)
									?.fieldId ||
								'',
							documentMappings: mapDocumentMappings(
								item.documentMappings,
								vcConfigDocs,
								idx
							),
							isExpanded: true,
							addMapping: addMappingValue,
						};
					}
				);
				setFieldMappings(mapped);
			}
		} catch (error) {
			console.error('Error fetching field mappings:', error);
			toast({
				title: 'Error',
				description: 'Failed to fetch field mappings',
				status: 'error',
				duration: 2000,
				isClosable: true,
			});
		}
	};

	// Initial data fetch on component mount
	useEffect(() => {
		const init = async () => {
			await fetchFields();
			await fetchDocuments();
		};
		init();
	}, []);

	// Refresh documents when tab becomes active (refreshTrigger changes)
	useEffect(() => {
		if (refreshTrigger > 0) {
			fetchDocuments();
		}
	}, [refreshTrigger]);

	// Fetch field mappings when fields are loaded
	useEffect(() => {
		if (fields.length > 0) {
			fetchFieldMappings();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fields]);

	return (
		<Box bg="gray.50" minH="100vh" py={{ base: 4, md: 8 }}>
			<Layout
				showMenu={true}
				title="Field Mappings"
				subTitle="Configure form fields and their corresponding document mappings."
			>
				<VStack
					spacing={10}
					align="stretch"
					px={{ base: 2, md: 8 }}
					py={6}
				>
					<Box>
						<VStack spacing={6} align="stretch">
							{fieldMappings.map((mapping, fieldIndex) => (
								<Box
									key={mapping.id}
									borderRadius="xl"
									boxShadow="0 2px 8px rgba(6,22,75,0.08)"
									borderWidth="1.5px"
									borderColor="#06164B"
									bg="white"
									p={{ base: 4, md: 8 }}
									mb={4}
								>
									<VStack spacing={4} align="stretch">
										{/* Field Selection */}
										<HStack
											justify="space-between"
											align="start"
										>
											<FormControl
												flex="1"
												isInvalid={
													errors[
														`field_${fieldIndex}`
													]
												}
											>
												<FormLabel
													fontSize="sm"
													fontWeight="semibold"
													color="#06164B"
												>
													Form Field #{fieldIndex + 1}
												</FormLabel>
												<Select
													placeholder="Select form field"
													value={mapping.fieldId}
													onChange={(e) =>
														updateFieldMapping(
															fieldIndex,
															e.target.value
														)
													}
													bg="white"
													size="lg"
													_focus={{
														boxShadow:
															'0 0 0 1px #06164B, 0 0 0 1px #06164B',
													}}
												>
													{fields.map((field) => (
														<option
															key={field.fieldId}
															value={
																field.fieldId
															}
														>
															{field.label} (
															{field.type})
															{field.isRequired &&
																' *'}
														</option>
													))}
												</Select>
												<FormErrorMessage>
													{
														errors[
															`field_${fieldIndex}`
														]
													}
												</FormErrorMessage>
											</FormControl>

											<HStack>
												<IconButton
													aria-label="Remove field mapping"
													icon={<DeleteIcon />}
													size="lg"
													colorScheme="red"
													variant="ghost"
													onClick={() =>
														removeFieldMapping(
															fieldIndex
														)
													}
													isDisabled={
														fieldMappings.length ===
														1
													}
												/>
											</HStack>
										</HStack>

										<Box
											mt={4}
											p={4}
											borderRadius="md"
											borderWidth="1px"
											borderColor="#06164B"
										>
											<Flex
												justify="space-between"
												align="center"
												mb={4}
											>
												<Text
													fontSize="lg"
													fontWeight="semibold"
													color="#06164B"
												>
													Document Mappings
												</Text>
												<Badge
													variant="outline"
													color="#06164B"
												>
													{
														mapping.documentMappings.filter(
															(doc) =>
																doc.selectedDocument &&
																doc.selectedVcField
														).length
													}{' '}
													configured
												</Badge>
											</Flex>

											<VStack spacing={3} align="stretch">
												{mapping.documentMappings.map(
													(docMapping, docIndex) => (
														<Card
															key={docMapping.id}
															variant="outline"
															bg="white"
															size="sm"
														>
															<CardBody>
																<HStack
																	justify="space-between"
																	align="center"
																	mb={3}
																>
																	<Text
																		fontSize="sm"
																		fontWeight="medium"
																		color="#06164B"
																	>
																		Document
																		#
																		{docIndex +
																			1}
																	</Text>
																	<IconButton
																		aria-label="Remove document mapping"
																		icon={
																			<DeleteIcon />
																		}
																		size="xs"
																		colorScheme="red"
																		variant="ghost"
																		onClick={() =>
																			removeDocumentMapping(
																				fieldIndex,
																				docIndex
																			)
																		}
																		isDisabled={
																			mapping
																				.documentMappings
																				.length ===
																			1
																		}
																	/>
																</HStack>

																<HStack
																	spacing={3}
																	align="start"
																>
																	<FormControl
																		flex="1"
																		isInvalid={
																			errors[
																				`field_${fieldIndex}_doc_${docIndex}`
																			]
																		}
																	>
																		<FormLabel fontSize="xs">
																			Document
																			Type
																		</FormLabel>
																		<Select
																			placeholder="Select document"
																			value={
																				docMapping.selectedDocument
																			}
																			onChange={(
																				e
																			) =>
																				handleDocumentChange(
																					fieldIndex,
																					docIndex,
																					e
																						.target
																						.value
																				)
																			}
																			size="sm"
																			_focus={{
																				boxShadow:
																					'0 0 0 1px #06164B, 0 0 0 1px #06164B',
																			}}
																		>
																			{documents.map(
																				(
																					doc
																				) => (
																					<option
																						key={
																							doc.id
																						}
																						value={
																							doc.documentSubType
																						}
																					>
																						{
																							doc.name
																						}{' '}
																						(
																						{
																							doc.documentSubType
																						}

																						)
																					</option>
																				)
																			)}
																		</Select>

																		<FormErrorMessage fontSize="xs">
																			{
																				errors[
																					`field_${fieldIndex}_doc_${docIndex}`
																				]
																			}
																		</FormErrorMessage>
																	</FormControl>

																	<FormControl
																		flex="1"
																		isInvalid={
																			errors[
																				`field_${fieldIndex}_vc_${docIndex}`
																			]
																		}
																	>
																		<FormLabel fontSize="xs">
																			VC
																			Field
																		</FormLabel>
																		<Select
																			placeholder="Select VC field"
																			value={
																				docMapping.selectedVcField
																			}
																			onChange={(
																				e
																			) =>
																				handleVcFieldChange(
																					fieldIndex,
																					docIndex,
																					e
																						.target
																						.value
																				)
																			}
																			disabled={
																				!docMapping.selectedDocument
																			}
																			size="sm"
																			_focus={{
																				boxShadow:
																					'0 0 0 1x #06164B, 0 0 0 1px #06164B',
																			}}
																		>
																			{docMapping.vcFields.map(
																				(
																					vcField
																				) => (
																					<option
																						key={
																							vcField.id
																						}
																						value={
																							vcField.id
																						}
																					>
																						{
																							vcField.label
																						}{' '}
																						(
																						{
																							vcField.type
																						}

																						)
																					</option>
																				)
																			)}
																		</Select>
																		<FormErrorMessage fontSize="xs">
																			{
																				errors[
																					`field_${fieldIndex}_vc_${docIndex}`
																				]
																			}
																		</FormErrorMessage>
																	</FormControl>
																</HStack>

																{docMapping.selectedDocument &&
																	docMapping.selectedVcField && (
																		<Box
																			mt={
																				2
																			}
																			p={
																				2
																			}
																			bg="green.50"
																			borderRadius="sm"
																		>
																			<Text
																				fontSize="xs"
																				color="green.700"
																			>
																				<strong>
																					Mapping:
																				</strong>{' '}
																				{getDocumentName(
																					docMapping.selectedDocument
																				)}{' '}
																				→{' '}
																				{getVcFieldLabel(
																					docMapping.vcFields,
																					docMapping.selectedVcField
																				)}
																			</Text>
																		</Box>
																	)}
															</CardBody>
														</Card>
													)
												)}

												<Flex justify="flex-end" mt={2}>
													<IconButton
														icon={<AddIcon />}
														aria-label="Add Document Mapping"
														size="sm"
														bg="#06164B"
														color="white"
														variant="solid"
														borderRadius="full"
														onClick={() =>
															addDocumentMapping(
																fieldIndex
															)
														}
														_hover={{
															bg: '#06164B',
															color: 'white',
														}}
														_active={{
															bg: '#06164B',
															color: 'white',
														}}
														_focus={{
															boxShadow: 'none',
														}}
													/>
												</Flex>
											</VStack>
										</Box>

										<FormControl
											isInvalid={
												!!errors[
													`addMapping_${fieldIndex}`
												]
											}
										>
											<FormLabel
												fontSize="sm"
												color="#06164B"
											>
												Add Mapping (JSON)
											</FormLabel>
											<Textarea
												placeholder='e.g. { "original": "m" , "mapped":"male"}'
												value={mapping.addMapping}
												onChange={(e) => {
													const newFieldMappings = [
														...fieldMappings,
													];
													newFieldMappings[
														fieldIndex
													].addMapping =
														e.target.value;

													try {
														if (
															e.target.value.trim() !==
															''
														) {
															JSON.parse(
																e.target.value
															);
															const newErrors = {
																...errors,
															};
															delete newErrors[
																`addMapping_${fieldIndex}`
															];
															setErrors(
																newErrors
															);
														}
													} catch {
														setErrors((prev) => ({
															...prev,
															[`addMapping_${fieldIndex}`]:
																'Invalid JSON format',
														}));
													}

													setFieldMappings(
														newFieldMappings
													);
												}}
												bg="white"
												size="sm"
												_focus={{
													boxShadow:
														'0 0 0 1px #06164B, 0 0 0 1px #06164B',
												}}
											/>
											<FormErrorMessage fontSize="xs">
												{
													errors[
														`addMapping_${fieldIndex}`
													]
												}
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
								onClick={addFieldMapping}
								px={8}
								py={6}
								fontWeight="bold"
								fontSize="md"
								boxShadow="sm"
							>
								Add Field Mapping
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
							onClick={saveAllMappings}
						>
							Save All Mappings
						</Button>
					</HStack>
				</VStack>
			</Layout>
		</Box>
	);
};

export default FieldMappingConfig;
