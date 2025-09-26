import React, {
	useEffect,
	useState,
	useCallback,
	useMemo,
	useRef,
} from 'react';
import {
	Box,
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Text,
	Tabs,
	TabList,
	TabPanels,
	Tab,
	TabPanel,
	Flex,
	IconButton,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import BenefitCard from '../../components/common/Card';
import Layout from '../../components/common/layout/Layout';
import FilterDialog from '../../components/common/layout/Filters';
import Pagination from '../../components/common/Pagination';
import { getUser } from '../../services/auth/auth';
import { getAll } from '../../services/benefit/benefits';
import { Castes, IncomeRange, Gender } from '../../assets/mockdata/FilterData';
import { getIncomeRangeValue } from '../../utils/jsHelper/helper';
import SearchBar from '../../components/common/layout/SearchBar';
import { useTranslation } from 'react-i18next';

// Define types for benefit data and filter structure
interface Benefit {
	item_id: number;
	title: string;
	provider_name: string;
	provider_id: string;
	bpp_id: string;
	bpp_uri: string;
	description: string;
	item: {
		price?: {
			value?: number;
			currency?: string;
		};
		tags: { list?: string[] }[];
		time?: {
			range?: {
				end?: string;
			};
		};
	};
}

interface Filter {
	caste?: string;
	annualIncome?: string;
	gender?: string;
	[key: string]: string | undefined;
}

interface PaginationInfo {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

const ExploreBenefits: React.FC = () => {
	const { t } = useTranslation();
	const [loading, setLoading] = useState<boolean>(false);
	const [search, setSearch] = useState<string>('');
	const [userFilter, setUserFilter] = useState<Filter>({});
	const [initState, setInitState] = useState<string>('yes');
	const [error, setError] = useState<string | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

	// Filter state only for All Benefits tab
	const [allBenefitsFilter, setAllBenefitsFilter] = useState<Filter>({});

	// Separate state for each tab
	const [allBenefits, setAllBenefits] = useState<Benefit[]>([]);
	const [myBenefits, setMyBenefits] = useState<Benefit[]>([]);
	const [activeTab, setActiveTab] = useState<number>(0);

	// Separate pagination info for each tab
	const [allBenefitsPagination, setAllBenefitsPagination] =
		useState<PaginationInfo>({
			total: 0,
			page: 1,
			limit: 5,
			totalPages: 0,
		});
	const [myBenefitsPagination, setMyBenefitsPagination] =
		useState<PaginationInfo>({
			total: 0,
			page: 1,
			limit: 5,
			totalPages: 0,
		});

	// Current page states
	const [allBenefitsPage, setAllBenefitsPage] = useState<number>(1);
	const [myBenefitsPage, setMyBenefitsPage] = useState<number>(1);
	const [itemsPerPage, setItemsPerPage] = useState<number>(5);

	// Use refs to track if data has been loaded for each tab
	const allBenefitsLoaded = useRef<boolean>(false);
	const myBenefitsLoaded = useRef<boolean>(false);

	// Debounce search to avoid excessive API calls
	const [debouncedSearch, setDebouncedSearch] = useState<string>('');

	const [showSearchBarMyBenefits, setShowSearchBarMyBenefits] =
		useState(false);
	const [showSearchBarAllBenefits, setShowSearchBarAllBenefits] =
		useState(false);
	const searchInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 500);
		return () => clearTimeout(timer);
	}, [search]);

	// Memoized current tab data
	const currentTabData = useMemo(() => {
		// When authenticated: tab 0 = My Benefits, tab 1 = All Benefits
		// When not authenticated: tab 0 = All Benefits
		if (
			(isAuthenticated && activeTab === 0) ||
			(!isAuthenticated && activeTab === 0 && !isAuthenticated)
		) {
			// My Benefits (authenticated) or All Benefits (not authenticated)
			if (isAuthenticated) {
				return {
					benefits: myBenefits,
					pagination: myBenefitsPagination,
					page: myBenefitsPage,
					setPage: setMyBenefitsPage,
				};
			} else {
				return {
					benefits: allBenefits,
					pagination: allBenefitsPagination,
					page: allBenefitsPage,
					setPage: setAllBenefitsPage,
				};
			}
		} else {
			// All Benefits (when authenticated)
			return {
				benefits: allBenefits,
				pagination: allBenefitsPagination,
				page: allBenefitsPage,
				setPage: setAllBenefitsPage,
			};
		}
	}, [
		activeTab,
		isAuthenticated,
		allBenefits,
		myBenefits,
		allBenefitsPagination,
		myBenefitsPagination,
		allBenefitsPage,
		myBenefitsPage,
	]);

	// Initialize user data only once
	useEffect(() => {
		const init = async () => {
			try {
				const token = localStorage.getItem('authToken');
				if (token) {
					setIsAuthenticated(true);
					const user = await getUser();
					const customFields = user?.data?.customFields || [];

					const incomeField = customFields.find(
						(field) => field.name === 'annualIncome'
					);
					const casteField = customFields.find(
						(field) => field.name === 'caste'
					);
					const genderField = customFields.find(
						(field) => field.name === 'gender'
					);

					const income = getIncomeRangeValue(incomeField?.value);

					const userFilters: Filter = {
						caste: casteField?.value || '',
						annualIncome: income,
						gender: genderField?.gender || '',
					};

					const newUserFilter: Filter = {};
					Object.keys(userFilters).forEach((key) => {
						if (
							userFilters[key] !== undefined &&
							userFilters[key] !== ''
						) {
							const val = userFilters[key];
							newUserFilter[key] =
								typeof val === 'string'
									? val.toLowerCase()
									: String(val);
						}
					});

					setUserFilter(newUserFilter);
				} else {
					setIsAuthenticated(false);
				}
			} catch (e) {
				setError(
					`Failed to initialize user data: ${(e as Error).message}`
				);
			} finally {
				setInitState('no');
			}
		};

		if (initState === 'yes') {
			init();
		}
	}, [initState]);

	// Memoized fetch functions
	const fetchAllBenefits = useCallback(async () => {
		try {
			setLoading(true);
			const result = await getAll(
				{
					filters: {
						gender: allBenefitsFilter?.gender ?? '',
						annualIncome: allBenefitsFilter?.annualIncome ?? '',
						caste: allBenefitsFilter?.caste ?? '',
					},
					search: debouncedSearch,
					page: allBenefitsPage,
					limit: itemsPerPage,
				},
				false
			); // Don't send token for All Benefits

			setAllBenefits(result?.data?.ubi_network_cache ?? []);
			setAllBenefitsPagination({
				total: result?.data?.total ?? 0,
				page: result?.data?.page ?? 1,
				limit: result?.data?.limit ?? itemsPerPage,
				totalPages: result?.data?.totalPages ?? 0,
			});
			allBenefitsLoaded.current = true;
		} catch (e) {
			setError(`Failed to fetch all benefits: ${(e as Error).message}`);
		} finally {
			setLoading(false);
		}
	}, [allBenefitsFilter, debouncedSearch, allBenefitsPage, itemsPerPage]);

	const fetchMyBenefits = useCallback(async () => {
		try {
			setLoading(true);
			const result = await getAll(
				{
					filters: {
						...userFilter,
						annualIncome: userFilter?.annualIncome
							? `${userFilter?.annualIncome}`
							: '',
						gender: userFilter?.gender ?? '',
						caste: userFilter?.caste ?? '',
					},
					search: debouncedSearch,
					page: myBenefitsPage,
					limit: itemsPerPage,
					strictCheck: true,
				},
				// Send token for authenticated call
				true
			);

			setMyBenefits(result?.data?.ubi_network_cache ?? []);
			setMyBenefitsPagination({
				total: result?.data?.total ?? 0,
				page: result?.data?.page ?? 1,
				limit: result?.data?.limit ?? itemsPerPage,
				totalPages: result?.data?.totalPages ?? 0,
			});
			myBenefitsLoaded.current = true;
		} catch (e) {
			setError(`Failed to fetch my benefits: ${(e as Error).message}`);
		} finally {
			setLoading(false);
		}
	}, [userFilter, debouncedSearch, myBenefitsPage, itemsPerPage]);

	// Separate useEffect for each tab to avoid unnecessary calls
	useEffect(() => {
		if (initState === 'no') {
			// When authenticated: tab 0 = My Benefits, tab 1 = All Benefits
			// When not authenticated: tab 0 = All Benefits
			if (
				(isAuthenticated && activeTab === 1) ||
				(!isAuthenticated && activeTab === 0)
			) {
				fetchAllBenefits();
			}
		}
	}, [fetchAllBenefits, initState, activeTab, isAuthenticated]);

	useEffect(() => {
		if (initState === 'no' && activeTab === 0 && isAuthenticated) {
			fetchMyBenefits();
		}
	}, [fetchMyBenefits, initState, activeTab, isAuthenticated]);

	// Optimized handlers
	// If the user is authenticated and on tab-0 we update My Benefits,
	// otherwise we update All Benefits (covers both unauthenticated case
	// and authenticated tab-1 case).
	const handlePageChange = (page: number) => {
		if (isAuthenticated && activeTab === 0) {
			setMyBenefitsPage(page);
		} else {
			setAllBenefitsPage(page);
		}
	};

	const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
		setItemsPerPage(newItemsPerPage);
		setAllBenefitsPage(1);
		setMyBenefitsPage(1);
		setAllBenefitsPagination((prev) => ({
			...prev,
			limit: newItemsPerPage,
		}));
		setMyBenefitsPagination((prev) => ({
			...prev,
			limit: newItemsPerPage,
		}));
	}, []);

	const handleTabChange = useCallback(
		(index: number) => {
			// Only allow tab change to "My Benefits" if authenticated
			if (index === 0 && !isAuthenticated) {
				return;
			}
			setActiveTab(index);
		},
		[isAuthenticated]
	);

	// Filter inputs only for All Benefits tab
	const filterInputs = useMemo(
		() => [
			{
				label: 'Caste',
				data: Castes,
				value: allBenefitsFilter?.caste ?? '',
				key: 'caste',
			},
			{
				label: 'Income Range',
				data: IncomeRange,
				value: allBenefitsFilter?.annualIncome ?? '',
				key: 'annualIncome',
			},
			{
				label: 'Gender',
				data: Gender,
				value: allBenefitsFilter?.gender ?? '',
				key: 'gender',
			},
		],
		[allBenefitsFilter]
	);

	// Memoized components
	const pagination = useMemo(
		() => (
			<Pagination
				currentPage={currentTabData.page}
				totalPages={currentTabData.pagination.totalPages}
				totalItems={currentTabData.pagination.total}
				itemsPerPage={itemsPerPage}
				onPageChange={handlePageChange}
				onItemsPerPageChange={handleItemsPerPageChange}
				itemsPerPageOptions={[3, 5, 10, 20]}
				maxVisiblePages={7}
				showItemsPerPageSelector={true}
				showResultsText={true}
				size="sm"
			/>
		),
		[
			currentTabData.page,
			currentTabData.pagination.totalPages,
			currentTabData.pagination.total,
			itemsPerPage,
			handlePageChange,
			handleItemsPerPageChange,
		]
	);

	const benefitsContent = useMemo(() => {
		if (currentTabData.benefits.length === 0) {
			return (
				<Box
					display="flex"
					alignItems="center"
					justifyContent="center"
					padding={5}
					height="200px"
					bg="#F7F7F7"
					borderRadius="md"
				>
					<Text fontSize="lg" color="gray.600">
						{activeTab === 0
							? t('BENEFITS_NO_BENEFITS_AVAILABLE')
							: t('BENEFITS_NO_BENEFITS_MATCH_PROFILE')}
					</Text>
				</Box>
			);
		}

		return (
			<>
				<Box className="card-scroll">
					{currentTabData.benefits.map((benefit) => (
						<BenefitCard item={benefit} key={benefit.item_id} />
					))}
				</Box>
				{pagination}
			</>
		);
	}, [currentTabData.benefits, activeTab, pagination]);

	const handleShowSearchBar = () => {
		if (activeTab === 0) {
			setShowSearchBarMyBenefits(true);
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 100);
		} else {
			setShowSearchBarAllBenefits(true);
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 100);
		}
	};

	const handleHideSearchBar = () => {
		if (activeTab === 0) {
			setShowSearchBarMyBenefits(false);
		} else {
			setShowSearchBarAllBenefits(false);
		}
	};

	const handleSearch = (query: string) => {
		setSearch(query);
		handleHideSearchBar();
	};

	return (
		<Layout
			loading={loading}
			_heading={{
				heading: t('BENEFITS_BROWSE_TITLE'),
			}}
			isMenu={Boolean(localStorage.getItem('authToken'))}
		>
			{error && (
				<Modal isOpen={!!error} onClose={() => setError(null)}>
					<ModalOverlay />
					<ModalContent>
						<ModalHeader>{t('BENEFITS_ERROR_MODAL_TITLE')}</ModalHeader>
						<ModalBody>
							<Text>{error}</Text>
						</ModalBody>
						<ModalFooter>
							<Button
								colorScheme="blue"
								onClick={() => setError(null)}
							>
								{t('BENEFITS_ERROR_CLOSE_BUTTON')}
							</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>
			)}

			<Tabs
				index={activeTab}
				onChange={handleTabChange}
				colorScheme="blue"
			>
				{/* Header section with tabs and filter - only show filter for All Benefits tab */}
				<Flex
					position="sticky"
					top={0}
					zIndex={10}
					bg="white"
					direction="row"
					align="center"
					justify="space-between"
					gap={4}
					width="100%"
					px={4}
					py={2}
					flexWrap="nowrap"
					boxShadow="sm"
				>
					<Box flexShrink={0}>
						<TabList>
							{isAuthenticated && <Tab>{t('BENEFITS_MY_BENEFITS_TAB')}</Tab>}
							<Tab>{t('BENEFITS_ALL_BENEFITS_TAB')}</Tab>
						</TabList>
					</Box>

					<Flex flexShrink={0} align="center" gap={2}>
						<IconButton
							icon={<SearchIcon />}
							aria-label={t('BENEFITS_SEARCH_ARIA')}
							variant="ghost"
							onClick={handleShowSearchBar}
						/>
						{/* Only show filter for All Benefits tab (when "All Benefits" is active) */}
						{((isAuthenticated && activeTab === 1) ||
							(!isAuthenticated && activeTab === 0)) && (
							<FilterDialog
								inputs={filterInputs}
								setFilter={setAllBenefitsFilter}
								mr="20px"
							/>
						)}
					</Flex>
				</Flex>

				<TabPanels>
					{isAuthenticated && (
						<TabPanel px={0}>
							{showSearchBarMyBenefits && (
								<SearchBar
									onSearch={handleSearch}
									ref={searchInputRef}
									onClose={handleHideSearchBar}
									placeholder={t('BENEFITS_SEARCH_MY_PLACEHOLDER')}
								/>
							)}
							{benefitsContent}
						</TabPanel>
					)}
					<TabPanel px={0}>
						{showSearchBarAllBenefits && (
							<SearchBar
								onSearch={handleSearch}
								ref={searchInputRef}
								onClose={handleHideSearchBar}
								placeholder={t('BENEFITS_SEARCH_ALL_PLACEHOLDER')}
							/>
						)}
						{benefitsContent}
					</TabPanel>
				</TabPanels>
			</Tabs>
		</Layout>
	);
};

export default ExploreBenefits;
