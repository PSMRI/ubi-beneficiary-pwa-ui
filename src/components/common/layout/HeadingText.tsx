import * as React from 'react';
import { Box, Text, IconButton, VStack, Avatar } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import FilterDialog from './Filters';

interface HeadingTextProps {
	beneficiary?: boolean;
	heading?: string;
	subHeading?: string;
	handleBack?: () => void;
	isFilter?: boolean;
	inputs?: {
		label: string;
		key: string;
		value: string;
		data: Array<{ label: string; value: string }>;
	}[];
	setFilter?: React.Dispatch<React.SetStateAction<unknown>>;
	profileSubHeading?: string;
}

const BackIcon: React.FC<{ onClick: () => void; iconSize?: number }> = ({
	onClick,
	iconSize = 7,
}) => (
	<IconButton
		aria-label="Back"
		icon={<ArrowBackIcon boxSize={iconSize} />}
		onClick={onClick}
		variant="ghost"
		size="sm"
		bg="white"
		_hover={{ bg: 'white' }}
		_active={{ bg: 'white' }}
	/>
);

const HeadingText: React.FC<HeadingTextProps> = ({
	beneficiary,
	heading,
	subHeading,
	handleBack,
	isFilter,
	inputs,
	setFilter,
	profileSubHeading,
}) => {
	return (
		<Box
			display="flex"
			flexDirection="column"
			padding="3"
			backgroundColor="#FFFFFF"
			borderBottomWidth={beneficiary ? 0 : 1}
			borderBottomColor="#DDDDDD"
		>
			{(handleBack || heading || subHeading) && (
				<VStack align="start">
					{(handleBack || heading) && (
						<Box display="flex" alignItems="center" width="100%">
							{beneficiary && heading && (
								<Avatar variant="solid" name={heading} mr={2} />
							)}
							{handleBack && <BackIcon onClick={handleBack} />}
							{heading && (
								<Box>
									<Text
										fontFamily="Poppins"
										fontSize="18px"
										fontWeight="600"
										lineHeight="24px"
										color="#4D4639"
										marginLeft={handleBack ? '2' : '0'}
									>
										{heading}{' '}
									</Text>
									{beneficiary && profileSubHeading && (
										<Text
											fontFamily="Poppins"
											fontSize="13px"
											fontWeight="400"
											color="#4D4639"
											marginLeft={handleBack ? '2' : '0'}
										>
											{profileSubHeading}
										</Text>
									)}
								</Box>
							)}

							{isFilter && inputs && setFilter && (
								<FilterDialog
									inputs={inputs}
									setFilter={setFilter}
								/>
							)}
						</Box>
					)}
					{beneficiary && subHeading ? (
						<Text
							fontFamily="Poppins"
							fontSize="11px"
							fontWeight="500"
							lineHeight="16px"
							color="#4D4639"
							marginLeft="12"
						>
							{subHeading}
						</Text>
					) : (
						subHeading && (
							<Text
								fontFamily="Poppins"
								fontSize="11px"
								fontWeight="500"
								lineHeight="16px"
								color="#4D4639"
								marginTop="1"
							>
								{subHeading}
							</Text>
						)
					)}
				</VStack>
			)}
		</Box>
	);
};

export default HeadingText;
