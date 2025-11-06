import React from 'react';
import {
	Box,
	VStack,
	HStack,
	Text,
	Button,
	Image,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

interface CapturedImagePreviewProps {
	capturedImage: string;
	isCompressing: boolean;
	originalFileSize: number;
	compressedFileSize: number;
	showCompressionInfo: boolean;
	isUploading: boolean;
	onUpload: () => void;
	onRetake: () => void;
	onCancel: () => void;
}

export const CapturedImagePreview: React.FC<CapturedImagePreviewProps> = ({
	capturedImage,
	isCompressing,
	originalFileSize,
	compressedFileSize,
	showCompressionInfo,
	isUploading,
	onUpload,
	onRetake,
	onCancel,
}) => {
	const { t } = useTranslation();
	return (
		<Box textAlign="center" width="100%">
			<Text fontSize="lg" fontWeight="bold" mb={3}>
				{isCompressing ? t('SCAN_COMPRESSING') : t('SCAN_PREVIEW')}
			</Text>

			{/* Show compression status */}
			{isCompressing && (
				<Box
					bg="blue.50"
					p={3}
					borderRadius="md"
					mb={3}
					border="1px solid"
					borderColor="blue.200"
				>
					<VStack spacing={2}>
						<Text
							fontSize="sm"
							fontWeight="semibold"
							color="blue.700"
						>
							{t('SCAN_OPTIMIZING_IMAGE')}
						</Text>
						<Text fontSize="xs" color="gray.600">
							{t('SCAN_ORIGINAL_SIZE')}{' '}
							{(originalFileSize / (1024 * 1024)).toFixed(2)} MB
						</Text>
						<Box
							width="100%"
							height="4px"
							bg="blue.100"
							borderRadius="full"
							overflow="hidden"
						>
							<Box
								width="100%"
								height="100%"
								bg="blue.500"
								className="compress-loader"
								style={{
									animation: 'compress 2s ease-in-out infinite',
								}}
							/>
						</Box>
					</VStack>
				</Box>
			)}

			{/* Show compression result */}
			{!isCompressing &&
				showCompressionInfo &&
				compressedFileSize > 0 &&
				originalFileSize !== compressedFileSize && (
					<Box
						bg="green.50"
						p={3}
						borderRadius="lg"
						mb={3}
						border="1px solid"
						borderColor="green.300"
					>
						<VStack spacing={1}>
							<HStack
								spacing={2}
								justifyContent="center"
								fontSize="sm"
							>
								<Text color="green.700" fontWeight="semibold">
									{t('SCAN_COMPRESSED')}
								</Text>
							</HStack>
							<HStack
								spacing={2}
								fontSize="xs"
								color="gray.600"
							>
								<Text>
									{(originalFileSize / (1024 * 1024)).toFixed(2)}{' '}
									MB
								</Text>
								<Text>→</Text>
								<Text
									fontWeight="semibold"
									color="green.700"
								>
									{(compressedFileSize / (1024 * 1024)).toFixed(2)}{' '}
									MB
								</Text>
								<Text color="green.600" fontWeight="bold">
									(-
									{(
										((originalFileSize - compressedFileSize) /
											originalFileSize) *
										100
									).toFixed(0)}
									%)
								</Text>
							</HStack>
						</VStack>
					</Box>
				)}

			{/* Show file size for images under MAX_FILE_SIZE (no compression) */}
			{!isCompressing &&
				showCompressionInfo &&
				compressedFileSize > 0 &&
				originalFileSize === compressedFileSize && (
					<Box
						bg="blue.50"
						p={2}
						borderRadius="lg"
						mb={3}
						border="1px solid"
						borderColor="blue.200"
					>
						<HStack spacing={2} justifyContent="center" fontSize="sm">
							<Text color="blue.700" fontWeight="medium">
								{t('SCAN_SIZE')}{' '}
								{(originalFileSize / (1024 * 1024)).toFixed(2)} MB
							</Text>
						</HStack>
					</Box>
				)}

			{/* Verification message */}
			{!isCompressing && (
				<Box
					bg="yellow.50"
					p={2.5}
					borderRadius="lg"
					mb={3}
					border="1px solid"
					borderColor="yellow.300"
				>
					<HStack spacing={2} justifyContent="center">
						<Text fontSize="lg" color="yellow.600">
							⚠️
						</Text>
						<Text fontSize="sm" color="yellow.800" fontWeight="medium">
							{t('SCAN_ENSURE_CLEAR')}
						</Text>
					</HStack>
				</Box>
			)}

			{/* Image preview */}
			<Box
				position="relative"
				width="100%"
				maxWidth="400px"
				mx="auto"
				borderRadius="lg"
				overflow="hidden"
				border="2px solid"
				borderColor={isCompressing ? 'blue.300' : 'gray.300'}
				boxShadow="md"
				bg="white"
			>
				<Image
					src={capturedImage}
					alt="Captured Document"
					width="100%"
					height="auto"
					maxHeight="70vh"
					objectFit="contain"
					display="block"
				/>
			</Box>
			<VStack spacing={2} mt={3}>
				<Button
					colorScheme="blue"
					size="md"
					width="full"
					onClick={onUpload}
					isLoading={isUploading}
					loadingText={t('SCAN_UPLOADING')}
					isDisabled={isUploading || isCompressing}
				>
					{t('SCAN_UPLOAD_IMAGE')}
				</Button>
				<HStack spacing={2} width="full">
					<Button
						colorScheme="orange"
						size="md"
						flex={1}
						onClick={onRetake}
						isDisabled={isUploading || isCompressing}
					>
						{t('SCAN_RETAKE')}
					</Button>
					<Button
						colorScheme="gray"
						size="md"
						flex={1}
						onClick={onCancel}
						isDisabled={isUploading || isCompressing}
					>
						{t('SCAN_CANCEL')}
					</Button>
				</HStack>
			</VStack>
		</Box>
	);
};

