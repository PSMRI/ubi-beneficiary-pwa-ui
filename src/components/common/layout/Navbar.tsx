import React, { ChangeEvent, useState } from 'react';
// import {ChangeEvent} from 'react'
import {
	Box,
	Button,
	Text,
	Flex,
	MenuButton,
	Menu,
	MenuList,
	MenuItem,
	Stack,
	Alert,
	AlertIcon,
	Icon,
	useToast,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import CustomSelect from '../input/Select';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { logoutUser } from '../../../services/auth/auth';
import { changeLanguage } from 'i18next';
import { useAuth } from '../../../utils/context/checkToken';

const options = [
	{ label: 'EN', value: 'en' },
	{ label: 'HI', value: 'hi' },
];
const Navbar: React.FC<{ isMenu?: boolean }> = ({ isMenu = true }) => {
	const [success] = useState<string>('');
	const navigate = useNavigate();
	const { t } = useTranslation();

	const toast = useToast();
	const { language, selectLanguage } = useAuth();
	const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
		const { value } = e.target;
		selectLanguage(e.target.value);
		changeLanguage(value);
	};
	const handleLogout = async () => {
		try {
			const response = await logoutUser();
			if (response) {
				navigate('/');
				navigate(0);
			}
		} catch (error) {
			console.log(error);
			toast({
				title: 'Logout failed',
				status: 'error',
				duration: 3000,
				isClosable: true,
				description: 'Try Again',
			});
		}
	};

	return (
		<Stack bg="#EDEFFF" p="6">
			<Flex justifyContent="space-between" alignItems="center">
				<Box
					display="flex"
					flexDirection="row"
					alignItems="center"
					paddingLeft={0}
					marginLeft={0}
				>
					{isMenu && (
						<Menu>
							<MenuButton
								as={Button}
								rightIcon={<HamburgerIcon w={5} h={5} />}
								paddingLeft={0}
							></MenuButton>
							<MenuList bg="var(--menu-background)" mt={'15px'}>
								<MenuItem
									bg="var(--menu-background)"
									className="border-bottom"
									p={4}
									onClick={() => {
										navigate('/userprofile');
									}}
								>
									<Icon as={FiUser} boxSize={5} />
									<Text ml={4}>{t('NAVBAR_PROFILE')}</Text>
								</MenuItem>
								<MenuItem
									bg="var(--menu-background)"
									onClick={handleLogout}
									p={4}
								>
									<Icon as={FiLogOut} boxSize={5} />
									<Text ml={4}>{t('NAVBAR_LOGOUT')}</Text>
								</MenuItem>
							</MenuList>
						</Menu>
					)}
					<Text fontStyle={'italic'}> {t('NAVBAR_FAST_PASS')}</Text>
				</Box>
				<Box>
					{success && (
						<Alert status="success" variant="solid">
							<AlertIcon />
							{success}
						</Alert>
					)}
				</Box>

				<CustomSelect
					options={options}
					value={language.name}
					onChange={handleChange}
				/>
			</Flex>
		</Stack>
	);
};

export default Navbar;
