import React from 'react';
import {
	Flex,
	Text,
	Button,
	IconButton,
	Select,
	Box,
	HStack,
	VStack,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { t } from 'i18next';

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
	onPageChange: (page: number) => void;
	onItemsPerPageChange: (itemsPerPage: number) => void;
	itemsPerPageOptions?: number[];
	maxVisiblePages?: number;
	showItemsPerPageSelector?: boolean;
	showResultsText?: boolean;
	size?: 'sm' | 'md' | 'lg';
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
	onItemsPerPageChange,
	itemsPerPageOptions = [5, 10, 20, 50],
	maxVisiblePages = 7,
	showItemsPerPageSelector = true,
	showResultsText = true,
	size = 'sm',
}) => {
	// Don't render if there are no items
	if (totalItems === 0) return null;

	const generatePageNumbers = () => {
		const pageNumbers = [];
		let startPage = Math.max(
			1,
			currentPage - Math.floor(maxVisiblePages / 2)
		);
		let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

		// Adjust start page if we don't have enough pages at the end
		if (endPage - startPage + 1 < maxVisiblePages) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1);
		}

		for (let i = startPage; i <= endPage; i++) {
			pageNumbers.push(i);
		}

		return { pageNumbers, startPage, endPage };
	};

	const { pageNumbers, startPage, endPage } = generatePageNumbers();

	const handleItemsPerPageChange = (value: string) => {
		const newItemsPerPage = parseInt(value, 10);
		onItemsPerPageChange(newItemsPerPage);
	};

	const getResultsText = () => {
		const startItem = (currentPage - 1) * itemsPerPage + 1;
		const endItem = Math.min(currentPage * itemsPerPage, totalItems);
		return `${startItem}-${endItem} ${t('BENEFIT_SEARCH_PAGINATION_OF')}${totalItems}`;
	};

	const getCompactResults = () => {
		return `${t('BENEFIT_SEARCH_PAGINATION_PAGE')} ${currentPage} ${t('BENEFIT_SEARCH_PAGINATION_OF')} ${totalPages}`;
	};

	return (
		<Box
			mt={6}
			p={{ base: 3, md: 4 }}
			bg="white"
			borderRadius="md"
			boxShadow="sm"
			w="100%"
		>
			{/* Mobile Layout - Stacked */}
			<VStack spacing={3} display={{ base: 'flex', md: 'none' }} w="100%">
				{/* Mobile: Page info and items per page */}
				<Flex
					justify="space-between"
					align="center"
					w="100%"
					wrap="wrap"
					gap={2}
				>
					<Text fontSize="sm" color="gray.600" flexShrink={0}>
						{getCompactResults()}
					</Text>
					{showItemsPerPageSelector && (
						<HStack spacing={1} flexShrink={0}>
							<Text fontSize="xs" color="gray.600">
								{t('BENEFIT_SEARCH_PAGINATION_SHOW')}
							</Text>
							<Select
								size="xs"
								width="60px"
								value={itemsPerPage}
								onChange={(e) =>
									handleItemsPerPageChange(e.target.value)
								}
							>
								{itemsPerPageOptions.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</Select>
						</HStack>
					)}
				</Flex>

				{/* Mobile: Navigation */}
				<HStack spacing={1} justify="center">
					<IconButton
						aria-label={t('BENEFIT_SEARCH_PAGINATION_PREVIOUS')}
						icon={<ChevronLeftIcon />}
						size="sm"
						onClick={() => onPageChange(currentPage - 1)}
						isDisabled={currentPage === 1}
						variant="outline"
					/>

					{currentPage > 2 && (
						<Button
							size="sm"
							variant="outline"
							onClick={() => onPageChange(1)}
							minW="32px"
						>
							1
						</Button>
					)}

					{currentPage > 3 && (
						<Text fontSize="sm" color="gray.500">
							...
						</Text>
					)}

					{currentPage > 1 && (
						<Button
							size="sm"
							variant="outline"
							onClick={() => onPageChange(currentPage - 1)}
							minW="32px"
						>
							{currentPage - 1}
						</Button>
					)}

					<Button
						size="sm"
						variant="solid"
						colorScheme="blue"
						minW="32px"
					>
						{currentPage}
					</Button>

					{currentPage < totalPages && (
						<Button
							size="sm"
							variant="outline"
							onClick={() => onPageChange(currentPage + 1)}
							minW="32px"
						>
							{currentPage + 1}
						</Button>
					)}

					{currentPage < totalPages - 2 && (
						<Text fontSize="sm" color="gray.500">
							...
						</Text>
					)}

					{currentPage < totalPages - 1 && (
						<Button
							size="sm"
							variant="outline"
							onClick={() => onPageChange(totalPages)}
							minW="32px"
						>
							{totalPages}
						</Button>
					)}

					<IconButton
						aria-label={t('BENEFIT_SEARCH_PAGINATION_NEXT')}
						icon={<ChevronRightIcon />}
						size="sm"
						onClick={() => onPageChange(currentPage + 1)}
						isDisabled={currentPage === totalPages}
						variant="outline"
					/>
				</HStack>

				{/* Mobile: Results */}
				{showResultsText && (
					<Text fontSize="xs" color="gray.500" textAlign="center">
						{getResultsText()} items
					</Text>
				)}
			</VStack>

			{/* Desktop/Tablet Layout - Horizontal */}
			<Flex
				justify="space-between"
				align="center"
				gap={4}
				display={{ base: 'none', md: 'flex' }}
				wrap={{ base: 'wrap', lg: 'nowrap' }}
			>
				{/* Items per page selector */}
				{showItemsPerPageSelector && (
					<HStack
						spacing={2}
						flexShrink={0}
						order={{ base: 1, lg: 0 }}
						w={{ base: '100%', lg: 'auto' }}
						justify={{ base: 'center', lg: 'flex-start' }}
					>
						<Text
							fontSize={size}
							color="gray.600"
							whiteSpace="nowrap"
						>
							{t('BENEFIT_SEARCH_PAGINATION_SHOW')}
						</Text>
						<Select
							size={size}
							width="70px"
							value={itemsPerPage}
							onChange={(e) =>
								handleItemsPerPageChange(e.target.value)
							}
						>
							{itemsPerPageOptions.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</Select>
						<Text
							fontSize={size}
							color="gray.600"
							whiteSpace="nowrap"
						>
							{t('BENEFIT_SEARCH_PAGINATION_PER_PAGE')}
						</Text>
					</HStack>
				)}

				{/* Page navigation */}
				<HStack
					spacing={1}
					justify="center"
					flex={1}
					order={{ base: 0, lg: 1 }}
					w={{ base: '100%', lg: 'auto' }}
				>
					{/* Previous button */}
					<IconButton
						aria-label={t('BENEFIT_SEARCH_PAGINATION_PREVIOUS')}
						icon={<ChevronLeftIcon />}
						size={size}
						onClick={() => onPageChange(currentPage - 1)}
						isDisabled={currentPage === 1}
						variant="outline"
					/>

					{/* First page + ellipsis */}
					{startPage > 1 && (
						<>
							<Button
								size={size}
								variant="outline"
								onClick={() => onPageChange(1)}
								minW="40px"
							>
								1
							</Button>
							{startPage > 2 && (
								<Text fontSize={size} color="gray.500" px={1}>
									...
								</Text>
							)}
						</>
					)}

					{/* Page numbers */}
					{pageNumbers.map((page) => (
						<Button
							key={page}
							size={size}
							variant={currentPage === page ? 'solid' : 'outline'}
							colorScheme={currentPage === page ? 'blue' : 'gray'}
							onClick={() => onPageChange(page)}
							minW="40px"
						>
							{page}
						</Button>
					))}

					{/* Last page + ellipsis */}
					{endPage < totalPages && (
						<>
							{endPage < totalPages - 1 && (
								<Text fontSize={size} color="gray.500" px={1}>
									...
								</Text>
							)}
							<Button
								size={size}
								variant="outline"
								onClick={() => onPageChange(totalPages)}
								minW="40px"
							>
								{totalPages}
							</Button>
						</>
					)}

					{/* Next button */}
					<IconButton
						aria-label={t('BENEFIT_SEARCH_PAGINATION_NEXT')}
						icon={<ChevronRightIcon />}
						size={size}
						onClick={() => onPageChange(currentPage + 1)}
						isDisabled={currentPage === totalPages}
						variant="outline"
					/>
				</HStack>

				{/* Results text */}
				{showResultsText && (
					<Text
						fontSize={size}
						color="gray.600"
						whiteSpace="nowrap"
						flexShrink={0}
						order={{ base: 2, lg: 2 }}
						w={{ base: '100%', lg: 'auto' }}
						textAlign={{ base: 'center', lg: 'right' }}
					>
						{getResultsText()} {t('BENEFIT_SEARCH_PAGINATION_RESULTS')}
					</Text>
				)}
			</Flex>
		</Box>
	);
};

export default Pagination;
