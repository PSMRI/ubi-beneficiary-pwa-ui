import React, { useEffect, useRef, useState } from 'react';
import { Box, Center } from '@chakra-ui/react';
import useDeviceSize from './useDeviceSize';

import Navbar from './Navbar'; // Import your Navbar component
import HeadingText from './HeadingText'; // Import your HeadingText component
import BottomBar from './BottomBar';
import SearchBar from './SearchBar';
import Loader from '../Loader';

interface LayoutProps {
	isScrollable?: boolean;
	loading?: boolean;
	children?: React.ReactNode;
	isMenu?: boolean;
	isNavbar?: boolean;
	afterHeader?: React.ReactNode;
	_heading?: {
		heading?: string;
		subHeading?: string;
		isFilter?: boolean;
		beneficiary?: boolean;
		handleOpen?: () => void;
		onSearch?: (query: string) => void;
		setFilter?: React.Dispatch<React.SetStateAction<unknown>>;
		inputs?: {
			label: { [key: string]: string } | string;
			key: string;
			value: string;
			data: Array<{ label: { [key: string]: string } | string; value: string }>;
		}[];
		handleBack?: () => void;
		label?: string;
		profileSubHeading?: string;
	};
	isBottombar?: boolean;
	isSearchbar?: boolean;
	getBodyHeight?: (height: number) => void;
}

const Layout: React.FC<LayoutProps> = ({
	loading,
	children,
	isMenu = true,
	isNavbar = true,
	afterHeader,
	_heading = {},
	isBottombar = true,
	isSearchbar = false,
	getBodyHeight,
}) => {
	const { width, height } = useDeviceSize();
	const { onSearch } = _heading;
	const navHeader = useRef<HTMLDivElement>(null);
	const [bodyHeight, setBodyHeight] = useState<number | undefined>(undefined);
	const BOTTOM_BAR_HEIGHT = 67;
	useEffect(() => {
		const navHeight = navHeader?.current?.clientHeight ?? 0;
		if (height && navHeight >= 0) {
			const resultHeight = height - (BOTTOM_BAR_HEIGHT + navHeight);
			setBodyHeight(resultHeight);
			if (getBodyHeight) {
				getBodyHeight(resultHeight);
			}
		}
	}, [height, navHeader?.current?.clientHeight, _heading]);

	return (
		<Center
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			className="main-bg"
		>
			{loading || width === 0 ? (
				<Loader />
			) : (
				<Box
					overflowY={'scroll'}
					sx={{ '&::-webkit-scrollbar': { display: 'none' } }}
					height={height}
					width={width}
					bg="white"
					boxShadow="0px 0px 15px 0px #e1e1e1"
				>
					{isNavbar && (
						<Box ref={navHeader} width={width} bg={'white'}>
							<Navbar isMenu={isMenu} />

							<HeadingText {..._heading} />
							{isSearchbar && onSearch && (
								<SearchBar onSearch={onSearch} />
							)}
							{afterHeader}
						</Box>
					)}
					<Box
						overflowY={'scroll'}
						sx={{ '&::-webkit-scrollbar': { display: 'none' } }}
						height={bodyHeight}
					>
						{children}
					</Box>
					{isBottombar && (
						<>
							<Box minH={'67px'} />
							<BottomBar />
						</>
					)}
				</Box>
			)}
		</Center>
	);
};

export default Layout;
