import React from 'react';
import { Box, HStack, IconButton, Text } from '@chakra-ui/react';
import { FaFileAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { MdHome } from 'react-icons/md';
import { HiDocumentSearch } from 'react-icons/hi';
import useDeviceSize from './useDeviceSize';
import { useTranslation } from 'react-i18next';

interface FooterProps {
	setRef?: (ref: HTMLDivElement | null) => void;
}
const BottomBar: React.FC<FooterProps> = ({ setRef, ...props }) => {
	const { width } = useDeviceSize();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const handleNavigation = (path: string) => {
		navigate(path);
	};
	const getTabColor = (paths: string[]) => {
		const currentPath = window.location.pathname; // Get the current path
		return paths.some((path) => currentPath.startsWith(path))
			? '#3C5FDD'
			: '#433E3F';
	};
	return (
		<Box
			width={width}
			bg={'white'}
			position="fixed"
			bottom="0"
			ref={(e) => typeof setRef === 'function' && setRef(e)}
			{...props}
			zIndex={999}
			pb={2}
		>
			<HStack
				bg="primary.50"
				alignItems="center"
				borderTopWidth={'1px'}
				borderTopColor={'#DDDDDD'}
				shadow={'FooterShadow'}
				justifyContent={'space-around'}
			>
				<Box
					display="flex"
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					onClick={() => handleNavigation('/home')}
				>
					<IconButton
						aria-label="Home"
						icon={<MdHome />}
						fontSize="29px"
						variant="ghost"
						color={getTabColor(['/home'])}
					/>
					<Text fontSize="xs" color={getTabColor(['/home'])}>
						{t('HOME')}
					</Text>
				</Box>

				<Box
					display="flex"
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					onClick={() => handleNavigation('/explorebenefits')}
				>
					<IconButton
						aria-label="Search"
						icon={<HiDocumentSearch />}
						fontSize="29px"
						variant="ghost"
						color={getTabColor(['/explorebenefits', '/benefits'])}
					/>
					<Text
						fontSize="xs"
						color={getTabColor(['/explorebenefits', '/benefits'])}
					>
						{t('SEARCH')}
					</Text>
				</Box>

				<Box
					display="flex"
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					onClick={() => handleNavigation('/applicationstatus')}
				>
					<IconButton
						aria-label="Applications"
						icon={<FaFileAlt />}
						fontSize="24px"
						variant="ghost"
						color={getTabColor([
							'/applicationstatus',
							'/previewapplication',
						])}
					/>
					<Text
						fontSize="xs"
						color={getTabColor([
							'/applicationstatus',
							'/previewapplication',
						])}
					>
						{t('MY_APPLICATIONS')}
					</Text>
				</Box>
			</HStack>
		</Box>
	);
};

export default BottomBar;
