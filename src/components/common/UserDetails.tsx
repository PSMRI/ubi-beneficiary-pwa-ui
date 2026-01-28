import React, { useState, useEffect } from 'react';
import { Box, Text, HStack, VStack } from '@chakra-ui/react';
import {
	formatDate,
	calculateAge,
	formatText,
} from '../../utils/jsHelper/helper';
import { maskPIIValue, shouldMaskField } from '../../services/pii/piiMasking';
import { useTranslation } from 'react-i18next';
import { getMapping } from '../../services/admin/admin';

// Define common styles for Text and Input components
const labelStyles = {
	fontSize: '12px',
	fontWeight: '600',
	mb: 1,
	color: '#06164B',
	lineHeight: '16px',
};

const valueStyles = {
	fontSize: '14px',
	fontWeight: '400',
	color: '#1F1B13',
	lineHeight: '14px',
};

interface CustomField {
	label: string;
	value: string | number | null;
	name?: string;
}

interface FieldConfig {
	fieldId: string;
	fieldName: string;
	fieldType: string;
	fieldValueNormalizationMapping?: Array<{
		rawValue: string[];
		transformedValue: string;
	}>;
}

interface UserData {
	firstName?: string;
	middleName?: string | null;
	lastName?: string;
	dob?: string | null;
	customFields?: CustomField[];
}

interface UserDetailsProps {
	userData: UserData;
}
type FieldValue = string | number | null | undefined;
interface FieldProps {
	label: string;
	value?: FieldValue;
	defaultValue?: string;
}

const Field: React.FC<FieldProps> = ({ label, value }) => (
	<Box flex={1}>
		<Text {...labelStyles}>{label}</Text>
		<Text {...valueStyles}>{value}</Text>
	</Box>
);

// Helper function to process field values based on field type
const processFieldValue = (
	field: CustomField,
	userDob?: string | null,
	fieldsConfig?: FieldConfig[]
): string | number | null => {
	// Handle null or empty values for any custom field
	if (
		field.value === null ||
		field.value === undefined ||
		field.value === ''
	) {
		return '-';
	}

	// Handle age field - calculate from DOB
	if (field.name === 'age' && userDob) {
		const calculatedAge = calculateAge(userDob);
		return calculatedAge !== null ? calculatedAge.toString() : '-';
	}

	// Find field config for dynamic processing
	const fieldConfig = fieldsConfig?.find(
		(config) => config.fieldName === field.name
	);

	// If field has normalization mapping, apply formatText
	if (fieldConfig?.fieldValueNormalizationMapping) {
		return formatText(field.value);
	}

	// Mask if field is encrypted/PII
	if (field.name && shouldMaskField(field.name)) {
		return maskPIIValue(field.name, field.value);
	}

	// Return original value for all other fields
	return field.value;
};

// Helper to chunk an array into pairs
function chunkArray<T>(arr: T[], size: number): T[][] {
	return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
		arr.slice(i * size, i * size + size)
	);
}

const UserDetails: React.FC<UserDetailsProps> = ({ userData }) => {
	const { t } = useTranslation();

	// State for dynamic field configuration
	const [fieldsConfig, setFieldsConfig] = useState<FieldConfig[]>([]);

	// Load field configuration from API
	useEffect(() => {
		const loadFieldsConfig = async () => {
			try {
				const config = await getMapping(
					'profileFieldToDocumentFieldMapping'
				);
				const configData = config?.data?.value || [];
				setFieldsConfig(configData);
			} catch (error) {
				console.error('Failed to load fields config:', error);
				setFieldsConfig([]); // Fallback to empty array
			}
		};
		loadFieldsConfig();
	}, []);

	// Prepare base fields as an array
	const baseFields = [
		{
			label: t('USER_DETAILS_FIRST_NAME'),
			value: userData?.firstName ?? '-',
		},
		{
			label: t('USER_DETAILS_MIDDLE_NAME'),
			value: userData?.middleName ?? '-',
		},
		{
			label: t('USER_DETAILS_LAST_NAME'),
			value: userData?.lastName ?? '-',
		},
		{
			label: t('USER_DETAILS_DATE_OF_BIRTH'),
			value: userData?.dob ? formatDate(userData?.dob) : '-',
		},
	];

	return (
		<Box
			borderRadius="5px"
			boxShadow="0px 2px 4px rgba(0, 0, 0, 0.1)"
			bg="white"
			w="100%"
			borderWidth={1}
			p={6}
		>
			<VStack spacing={6} align="stretch">
				{/* Base fields, 2 per row */}
				{chunkArray(baseFields, 2).map((row) => (
					<HStack key={row.map((f) => f.label).join('_')} spacing={4}>
						{row.map((field) => (
							<Field
								label={field.label}
								value={field.value}
								key={field.label}
							/>
						))}
					</HStack>
				))}
				{/* Custom fields, 2 per row */}
				{userData?.customFields && userData.customFields.length > 0 && (
					<Box>
						<VStack spacing={2} align="stretch">
							{chunkArray(userData.customFields, 2).map((row) => (
								<HStack
									key={row.map((f) => f.label).join('_')}
									spacing={4}
								>
									{row.map((field) => (
										<Field
											label={field.label}
											value={processFieldValue(
												field,
												userData?.dob,
												fieldsConfig
											)}
											key={field.label}
										/>
									))}
								</HStack>
							))}
						</VStack>
					</Box>
				)}
			</VStack>
		</Box>
	);
};
export default UserDetails;
