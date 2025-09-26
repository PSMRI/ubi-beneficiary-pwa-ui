import React from 'react';
import {
	Box,
	Card,
	CardBody,
	Flex,
	Heading,
	Text,
	Link,
	Icon,
	HStack,
} from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { formatDateString } from '../../utils/jsHelper/helper';
import { MdCurrencyRupee } from 'react-icons/md';
interface BenefitCardProps {
	item: {
		item_id: number;
		title: string;
		provider_name: string;
		provider_id: string;
		bpp_id: string;
		bpp_uri: string;
		description: string;
		item: {
			price?: { value?: number; currency?: string };
			tags: Array<{ list?: string[] }>;
			time?: { range?: { end?: string } };
		};
		descriptor?: {
			short_desc: string;
		};
	};
}

const BenefitCard: React.FC<BenefitCardProps> = ({ item }) => {
	/* const extractValuesByDescriptors = (data, descriptorCodes) => {
		const values = [];

		data.forEach((item) => {
			if (item.list && Array.isArray(item.list)) {
				item.list.forEach((subItem) => {
					if (descriptorCodes.includes(subItem.descriptor.code)) {
						try {
							// Parse subItem.value as a JSON string
							const parsedValue = JSON.parse(subItem.value);

							// Check if parsedValue contains `conditionValues`
							if (
								parsedValue &&
								Array.isArray(parsedValue.conditionValues)
							) {
								// Join `conditionValues` array into a comma-separated string
								values.push(
									parsedValue.conditionValues.join(', ')
								);
							} else if (parsedValue?.conditionValues) {
								// If conditionValues is not an array, push it as is
								values.push(parsedValue.conditionValues);
							}
						} catch (error) {
							console.error(
								'Error parsing JSON:',
								subItem.value,
								error
							);
						}
					}
				});
			}
		});

		return values;
	}; */ // NO SONAR

	const id = item?.item_id;
	const dateStr = item?.item?.time?.range?.end;
	const formattedDate = dateStr ? formatDateString(dateStr) : '';
	const bpp_id = encodeURIComponent(item?.bpp_id);
	
	return (
		<Card
			maxW="2xl"
			m={4}
			shadow="lg"
			sx={{ border: '1px solid #ebe4e4c9', borderRadius: '10px' }}
		>
			<CardBody>
				<Box className="badge-box" width={'auto'}>
					{formattedDate}
				</Box>
				<Heading size="md" mt={2}>
					{item?.title}
				</Heading>
				<Text mt={2} fontSize="sm" color="black">
					{item?.provider_id}
				</Text>
				{item?.item?.price?.value && (
					<HStack
						align="center"
						flexDirection={'row'}
						alignItems={'center'}
						mt={2}
					>
						{' '}
						<Icon
							as={MdCurrencyRupee}
							boxSize={4}
							color="#484848"
						/>{' '}
						<Text color="#484848" marginLeft="1">
							{' '}
							{item?.item?.price?.value}{' '}
						</Text>{' '}
						<Text color="#484848" marginLeft="1">
							{' '}
						</Text>{' '}
					</HStack>
				)}
				{/* <Flex alignItems="center" mt={2}>
					{eligibility?.length > 0 ? (
						eligibility.map((category, index) => (
							<Box
								key={'Benefit' + index}
								mr={2}
								color={'#0037B9'}
								border={'1px'}
								borderRadius={'6px'}
								p={'2px 10px'}
								fontSize={'11px'}
								fontWeight={500}
							>
								{category.toUpperCase()}
							</Box>
						))
					) : (
						<Box mr={2}>No eligibility criteria specified</Box>
					)}
				</Flex> */}
				<Text mt={4}>{item?.description}</Text>
			</CardBody>
			<Flex
				align="center"
				justify="center"
				width="100%"
				pt={2}
				mb={4}
				fontWeight={400}
			>
				<Link
					className="text-blue"
					as={RouterLink}
					to={`/benefits/${bpp_id}/${id}`}
					color={'#0037b9'}
				>
					View Details <ArrowForwardIcon />
				</Link>
			</Flex>
		</Card>
	);
};

export default BenefitCard;
