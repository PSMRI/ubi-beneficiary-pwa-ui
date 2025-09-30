import React, { lazy, useContext } from 'react';
import ScanVC from '../components/ScanVC';
import { AuthContext } from '../utils/context/checkToken';

const ExploreBenefits = lazy(() => import('../screens/benefit/Benefits'));
const BenefitsDetails = lazy(() => import('../screens/benefit/Details'));
const BenefitFormScreenWrapper = lazy(() => import('../screens/benefit/BenefitFormScreenWrapper'));
const Preview = lazy(() => import('../screens/application/Preview'));
const MyApplications = lazy(
	() => import('../screens/application/ApplicationStatus')
);
const UploadDocuments = lazy(
	() => import('../components/common/layout/UploadDocuments')
);
const Home = lazy(() => import('../screens/Home'));
const UserProfile = lazy(() => import('../screens/UserProfile'));
const DocumentScanner = lazy(() => import('../components/DocumentScanner'));
const DocumentScannerRoute = () => {
	const { userData } = useContext(AuthContext)!;
	return (
		<DocumentScanner userId={userData?.user_id} userData={userData?.docs as any} />
	);
};
const routes = [
	{
		path: '/uploaddocuments',
		component: UploadDocuments,
	},
	{
		path: '/explorebenefits',
		component: ExploreBenefits,
	},
	{
		path: '/vcscans',
		component: ScanVC,
	},
	{
		path: '/document-scanner',
		component: DocumentScannerRoute,
	},
	{
		path: '/benefits/:bpp_id/:id',
		component: BenefitsDetails,
	},
	{
		path: '/benefits/:bpp_id/:id/apply',
		component: BenefitFormScreenWrapper,
	},
	{
		path: '/previewapplication/:id',
		component: Preview,
	},
	{
		path: '/applicationStatus',
		component: MyApplications,
	},
	// {
	//   path: "/editProfile",
	//   component: EditProfile,
	// },
	{
		path: '/userprofile',
		component: UserProfile,
	},
	{
		path: '*',
		component: Home,
	},
];

export default routes;
