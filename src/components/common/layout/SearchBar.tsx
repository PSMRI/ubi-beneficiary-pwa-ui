import React, { useState, forwardRef } from 'react';
import {
	Input,
	InputGroup,
	InputRightElement,
	IconButton,
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
	onSearch: (query: string) => void;
	placeholder?: string;
	onClose?: () => void;
	value?: string;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
	({ onSearch, placeholder, onClose, value }, ref) => {
		const { t } = useTranslation();
		const [query, setQuery] = useState(value || '');

		// Use translation constant if no placeholder is provided
		const placeholderText = placeholder || t('COMMON_SEARCHBAR_PLACEHOLDER');

		React.useEffect(() => {
			if (value !== undefined) {
				setQuery(value);
			}
		}, [value]);

		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			const newQuery = event.target.value;
			setQuery(newQuery);
		};

		const handleSearchClick = () => {
			onSearch(query);
		};

		const handleKeyDown = (
			event: React.KeyboardEvent<HTMLInputElement>
		) => {
			if (event.key === 'Enter' && query.trim() !== '') {
				onSearch(query);
			}
		};

		const handleClear = () => {
			setQuery('');
			onSearch(''); // Clear search results
			onClose?.();
		};

		return (
			<InputGroup>
				<Input
					type="text"
					placeholder={placeholderText}
					value={query}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					borderRadius={28}
					h="12"
					bg="#E9E7EF"
					m="4"
					mt="3"
					aria-label="Search input"
					ref={ref}
					pr="80px"
				/>

				<InputRightElement
					h={'100%'}
					w="60px"
					display="flex"
					alignItems="center"
					justifyContent="flex-end"
					pr="20px"
				>
					{query && (
						<IconButton
							icon={<SearchIcon />}
							aria-label="Search"
							onClick={handleSearchClick}
							bg="transparent"
							_hover={{ bg: 'transparent' }}
							_focus={{ outline: 'none' }}
							size="sm"
							mr={onClose ? 1 : 0}
						/>
					)}
					{onClose && (
						<IconButton
							icon={<CloseIcon />}
							aria-label="Close"
							onClick={handleClear}
							bg="transparent"
							_hover={{ bg: 'transparent' }}
							_focus={{ outline: 'none' }}
							size="sm"
							ml={1}
						/>
					)}
				</InputRightElement>
			</InputGroup>
		);
	}
);
SearchBar.displayName = 'SearchBar';
export default SearchBar;
