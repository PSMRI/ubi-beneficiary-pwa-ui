import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';
import authRoutes from './routes/AuthRoutes';
import guestRoutes from './routes/GuestRoutes';
import adminRoutes from './routes/AdminRoutes';
import React, { Suspense, useEffect, useState } from 'react';
import Loader from './components/common/Loader';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './utils/context/checkToken';
import './assets/styles/App.css';
import Layout from './components/common/layout/Layout';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
	resource_access?: {
		[key: string]: {
			roles: string[];
		};
	};
}
function App() {
	const [loading, setLoading] = useState(true);
	const [routes, setRoutes] = useState<
		{ path: string; component: React.ElementType }[]
	>([]);

	const token = localStorage.getItem('authToken');

	useEffect(() => {
		const updateRoutes = () => {
			const token = localStorage.getItem('authToken');
			if (token) {
				const decoded = jwtDecode(token) as DecodedToken;
				// Check for roles in resource_access
				const resourceAccess = decoded.resource_access || {};
				const beneficiaryRoles =
					resourceAccess['beneficiary-app']?.roles || [];

				const isAdmin = beneficiaryRoles.includes('admin');
				const isBeneficiary = beneficiaryRoles.includes('beneficiary');
				if (isAdmin) {
					setRoutes(adminRoutes);
					const redirectUrl = localStorage.getItem('redirectUrl');
					if (redirectUrl) {
						window.location.href = redirectUrl;
						localStorage.removeItem('redirectUrl');
					}
				} else if (isBeneficiary) {
					setRoutes(authRoutes);
					const redirectUrl = localStorage.getItem('redirectUrl');
					if (redirectUrl) {
						window.location.href = redirectUrl;
						localStorage.removeItem('redirectUrl');
					}
				} else {
					// Role not recognized (not admin or beneficiary)
					setRoutes(guestRoutes);
					console.warn(
						'Unauthorized role, falling back to guest routes.'
					);
				}
			} else {
				setRoutes(guestRoutes);
			}
			setLoading(false);
		};

		updateRoutes();

		window.addEventListener('authTokenUpdated', updateRoutes);
		window.addEventListener('storage', updateRoutes);

		return () => {
			window.removeEventListener('authTokenUpdated', updateRoutes);
			window.removeEventListener('storage', updateRoutes);
		};
	}, []);

	if (loading) {
		return (
			<ChakraProvider theme={theme}>
				<Layout loading />
			</ChakraProvider>
		);
	}

	return (
		<ChakraProvider theme={theme}>
			<AuthProvider>
				<Suspense fallback={<Loader />}>
					<Router
						future={{
							v7_startTransition: true,
							v7_relativeSplatPath: true,
						}}
					>
						<Routes>
							{routes?.map((item, index) => (
								<Route
									key={item?.path + index}
									path={item?.path}
									element={<item.component />}
								/>
							))}
						</Routes>
					</Router>
				</Suspense>
			</AuthProvider>
		</ChakraProvider>
	);
}
export default App;
