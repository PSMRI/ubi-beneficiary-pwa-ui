import React from 'react';
import { Button, Text, Spinner, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

interface CustomButton {
	onClick?: (event?: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>) => void | Promise<void>;
	mt?: number;
	width?: string;
	label?: string;
	isDisabled?: boolean;
	variant?: string;
	loading?: boolean; // New loading prop
	loadingLabel?: string;
}

const CommonButton: React.FC<CustomButton> = ({
	onClick,
	mt,
	width = '100%',
	label,
	isDisabled = false,
	variant = 'solid',
	loading = false, // Default to false if not passed
	loadingLabel,
}) => {
	const { t } = useTranslation();
	
	// Use translation constants if no custom labels are provided
	const buttonLabel = label || t('COMMON_BUTTON_SUBMIT_LABEL');
	const buttonLoadingLabel = loadingLabel || t('COMMON_BUTTON_LOADING_LABEL');
	return (
		<div style={{ textAlign: 'center' }}>
			<Button
				className={
					variant === 'solid' ? 'custom-btn' : 'outline-custom-btn'
				}
				type="submit"
				mt={mt}
				width={width}
				onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
					onClick?.(event)
				}
				isDisabled={isDisabled || loading} // Disable button when loading
				sx={{
					'&:disabled': {
						bg: 'gray.300',
						color: 'gray.600',
						cursor: 'not-allowed',
						opacity: 1, // Prevent default opacity reduction
						border:
							variant === 'outline'
								? '1px solid gray'
								: undefined,
					},
				}}
			>
				{loading ? (
					<Flex align="center" gap={2}>
						{buttonLoadingLabel}
						<Spinner size="sm" color="blue.500" />
					</Flex>
				) : (
					buttonLabel
				)}
				{/* Show loading spinner if loading */}
			</Button>
			{loading && <Text mt={2} fontSize="sm" color="gray.500"></Text>}{' '}
			{/* Show loading text below button */}
		</div>
	);
};

export default CommonButton;
