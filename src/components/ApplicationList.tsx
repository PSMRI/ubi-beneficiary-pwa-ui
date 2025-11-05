import React from 'react';
import {
	Box,
	Text,
	VStack,
	Divider,
	HStack,
	Button,
	Link,
} from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
	IoCheckmarkCircle,
	IoCloseCircle,
	IoTimeOutline,
	IoWarning,
	IoHelpCircleOutline,
} from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

interface Application {
	benefit_provider_id: string;
	benefit_id: string;
	application_name: string;
	internal_application_id: string;
	status: string;
	remark?: string;
	application_data: Record<string, unknown>;
}

interface ApplicationListProps {
	applicationList?: Application[];
}

const COLORS = {
	success: '#0B7B69',
	warning: '#EDA145',
	error: '#8C1823',
	text: '#1F1B13',
} as const;

const StatusIcon = ({ status }: { status: string }) => {
	const key = status.toLowerCase();
	let IconComponent;
	let iconColor;
	let label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

	switch (key) {
		case 'application approved':
			IconComponent = IoCheckmarkCircle;
			iconColor = COLORS.success;
			label = `${label}`;
			break;
		case 'application rejected':
			IconComponent = IoCloseCircle;
			iconColor = COLORS.error;
			label = `${label}`;
			break;
		case 'application pending':
		case 'submitted':
			IconComponent = IoTimeOutline;
			iconColor = '#CC7914';
			label = `${label}`;
			break;

		case 'application resubmit':
			IconComponent = IoWarning;
			iconColor = COLORS.warning;
			break;
		default:
			IconComponent = IoHelpCircleOutline;
			iconColor = '#999999';
			break;
	}

	return (
		<HStack spacing={2} align="center">
			<IconComponent
				style={{ fontSize: 23, color: iconColor }}
				aria-label={`${label} status`}
			/>
			<Text fontSize="16px" fontWeight="semibold" color={COLORS.text}>
				{label}
			</Text>
		</HStack>
	);
};

const ApplicationList: React.FC<ApplicationListProps> = ({
	applicationList = [],
}) => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const groupedApplications = React.useMemo(() => {
		return applicationList.reduce(
			(acc, app) => {
				if (!acc[app.status]) {
					acc[app.status] = [];
				}
				acc[app.status].push(app);
				return acc;
			},
			{} as Record<string, Application[]>
		);
	}, [applicationList]);

	const statusKeys = React.useMemo(() => {
		return Object.keys(groupedApplications).sort((a, b) =>
			a.localeCompare(b, undefined, { sensitivity: 'base' })
		);
	}, [groupedApplications]);
	const getActionLabel = (
		status: string | null,
		t: (key: string) => string
	): string => {
		if (
			status === 'application resubmit' ||
			status === 'application pending' ||
			status === 'submitted'
		) {
			return t('BENEFIT_DETAILS_RESUBMIT_APPLICATION');
		} else if (
			status === 'application initiated'
		) {
			return t('BENEFIT_DETAILS_COMPLETE_APPLICATION');
		}
	};
	return (
		<Box
			as="section"
			aria-label="Applications list"
			pb="100px"
			px="16px"
			width="100%"
		>
			<VStack spacing={4} align="stretch" mt="10px">
				{statusKeys.map((status, index) => (
					<Box
						key={`${status}${index}`}
						borderRadius="10px"
						bg="#FFFFFF"
						shadow="md"
						border="1px solid #DDDDDD"
						width="100%"
					>
						<Box
							height="56px"
							px="16px"
							display="flex"
							alignItems="center"
							bg="#EDEFFF"
							borderBottom="1px solid #DDDDDD"
							borderTopRadius="10px"
						>
							<StatusIcon status={status} />
						</Box>

						<VStack align="stretch" spacing={0}>
							{groupedApplications[status].map((app, i, arr) => {
								const hasRemark = !!app.remark?.trim();
								// Show Resubmit for Pending, Submitted, or Application Resubmit
								const isResubmit = [
									'application resubmit',
									'application pending',
									'submitted',
									'application initiated',
								].includes(app.status.toLowerCase());

								let paddingBottom = 'initial';

								if (isResubmit) {
									if (hasRemark) {
										paddingBottom = '48px';
									} else {
										paddingBottom = '40px';
									}
								}

								return (
									<React.Fragment
										key={app.internal_application_id}
									>
										<Link
											as={RouterLink}
											to={`/previewapplication/${app.internal_application_id}`}
											width="100%"
											px="16px"
											py="12px"
											_hover={{
												bg: '#F5F5F5',
												textDecoration: 'none',
											}}
											position="relative"
											pb={paddingBottom}
											display="block"
											aria-label={`View ${app.application_name}`}
											title={`View ${app.application_name}`}
											_focusVisible={{
												outline: '2px solid',
												outlineColor: '#3c5fdd',
												outlineOffset: '2px',
											}}
										>
											<Text
												fontSize="14px"
												color={COLORS.text}
												mb={2}
											>
												{app.application_name}
											</Text>

											{hasRemark && (
												<Text
													mt={2}
													fontSize="13px"
													color="black"
													display="flex"
													alignItems="center"
												>
													Reviewer Comment:{' '}
													{app.remark}
												</Text>
											)}

											{isResubmit && (
												<Button
													size="sm"
													bg="#3c5fdd"
													position="absolute"
													color="white"
													bottom="12px"
													right="16px"
													mt={hasRemark ? 2 : 0}
													_hover={{ bg: '#3c5fdd' }}
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														navigate(
															`/benefits/${encodeURIComponent(app.benefit_provider_id)}/${app.benefit_id}`
														);
													}}
												>
													{getActionLabel(app.status, t)}
												</Button>
											)}
										</Link>
										{i !== arr.length - 1 && (
											<Divider
												borderColor="#E2E8F0"
												marginX="16px"
											/>
										)}
									</React.Fragment>
								);
							})}
						</VStack>
					</Box>
				))}
			</VStack>
		</Box>
	);
};

export default ApplicationList;
