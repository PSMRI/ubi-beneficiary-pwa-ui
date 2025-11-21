import { lazy } from 'react';
import SignIn from '../screens/auth/SignIn';
const Splash = lazy(() => import('../screens/auth/Splash'));
const ExploreBenefits = lazy(() => import('../screens/benefit/Benefits'));
const BenefitsDetails = lazy(() => import('../screens/benefit/Details'));
const Signup = lazy(() => import('../screens/auth/SignUpWithOtr'));
const UpdatePassword = lazy(() => import('../screens/auth/UpdatePassword'));
const EditUserProfile = lazy(() => import('../screens/auth/EditUserProfile'));
const routes = [
	{
		path: '/signup',
		component: Signup,
	},
	{
		path: '/explorebenefits',
		component: ExploreBenefits,
	},
	{
		path: '/benefits/:id',
		component: BenefitsDetails,
	},
	{
		path: '/signin',
		component: SignIn,
	},
	{
		path: '/update-password',
		component: UpdatePassword,
	},
	{
		path: '/edit-user-profile',
		component: EditUserProfile,
	},
	{
		path: '*',
		component: Splash,
	},
];
export default routes;
