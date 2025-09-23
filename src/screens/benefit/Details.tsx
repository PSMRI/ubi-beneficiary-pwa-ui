import React, { useEffect, useState } from 'react';
import {
	Box,
	Heading,
	Text,
	UnorderedList,
	ListItem,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
} from '@chakra-ui/react';
import '../../assets/styles/App.css';
import { useNavigate, useParams } from 'react-router-dom';
import CommonButton from '../../components/common/button/Button';
import Layout from '../../components/common/layout/Layout';
import { getUser, sendConsent } from '../../services/auth/auth';
import {
	applyApplication,
	checkEligibilityOfUser,
	confirmApplication,
	createApplication,
	getApplication,
	getOne,
} from '../../services/benefit/benefits';
import WebViewFormSubmitWithRedirect from '../../components/WebView';
import { useTranslation } from 'react-i18next';
import Loader from '../../components/common/Loader';
import {
	calculateAge,
	formatLabel,
	getExpiredRequiredDocsMessage,
	parseDocList,
	validateBenefitEndDate,
	validateRequiredDocuments,
	filterExpiredDocuments,
} from '../../utils/jsHelper/helper';

import termsAndConditions from '../../assets/termsAndConditions.json';
import CommonDialogue from '../../components/common/Dialogue';
import DocumentActions from '../../components/DocumentActions';

// Define types for benefit item and user
interface BenefitItem {
	descriptor?: {
		name?: string;
		long_desc?: string;
	};
	price?: {
		value?: number;
		currency?: string;
	};
	document?: {
		label?: string;
		proof?: string;
		code?: string;
		allowedProofs?: string[];
		isRequired?: boolean;
	}[];
	tags?: Array<{
		descriptor?: {
			code?: string;
			short_desc: string;
		};
		list?: Array<{
			value: string;
			descriptor?: {
				code?: string;
				name?: string;
				short_desc?: string;
			};
		}>;
	}>;
	time?: {
		range?: {
			start?: string;
			end?: string;
		};
	};
}
interface FinancialSupportRequest {
	domain: string;
	action: string;
	version: string;
	bpp_id: string;
	bpp_uri: string;
	country: string;
	city: string;
	bap_id: string;
	bap_uri: string;
	transaction_id: string;
	message_id: string;
	ttl: string;
	timestamp: string;
}
interface AuthUser {
	user_id?: string;
	name?: string;
	current_class?: string;
	previous_year_marks?: string;
	phone_number?: string;
	username: string;
	email: string;
	dob: string;
	age: number;
	docs?: any[];
}

interface WebFormProps {
	url?: string;
	formData?: {};
	item?: BenefitItem;
}
export interface DocumentItem {
	id?: number;
	code?: string | string[];
	isRequired?: boolean;
	allowedProofs?: string[];
	proof?: string | string[];
	label?: string;
}
interface ApplicationData {
	status: string;
	application_data?: Record<string, any>;
	external_application_id?: string;
	remark?: string;
	docs?: any[];
}
const BenefitsDetails: React.FC = () => {
	const [context, setContext] = useState<FinancialSupportRequest | null>(
		null
	);
	const [item, setItem] = useState<BenefitItem | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [applicationStatus, setApplicationStatus] = useState<string | null>(
		null
	);

	const [error, setError] = useState<string>('');
	const [authUser, setAuthUser] = useState<AuthUser | null>(null);
	const [webFormProp, setWebFormProp] = useState<WebFormProps>({});
	const [confirmationConsent, setConfirmationConsent] = useState<
		boolean | object
	>(false);
	const [submitDialouge, setSubmitDialouge] = useState<boolean | object>(
		false
	);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	// const [isEligible, setIsEligible] = useState<any[]>(); // NOSONAR
	const [userDocuments, setUserDocuments] = useState();
	const [applicationData, setApplicationData] =
		useState<ApplicationData | null>(null);
	const handleConfirmation = async () => {
		setLoading(true);
		const expiredMessage = getExpiredRequiredDocsMessage(
			userDocuments,
			item?.document ?? []
		);
		if (expiredMessage) {
			setError(expiredMessage);
			setLoading(false);
			return;
		}

		// Validate required documents are uploaded
		const documentValidationResult = validateRequiredDocuments(
			item?.document ?? [],
			userDocuments ?? []
		);
		if (!documentValidationResult.isValid) {
			setError(
				documentValidationResult.errorMessage ||
					'Required documents are missing'
			);
			setLoading(false);
			return;
		}

		// Validate benefit end date
		const benefitEndDateValidation = validateBenefitEndDate(
			item?.time?.range?.end
		);
		if (!benefitEndDateValidation.isValid) {
			setError(
				benefitEndDateValidation.errorMessage ||
					'Benefit validation failed'
			);
			setLoading(false);
			return;
		}
		// Step 1: Try eligibility API
		let eligibilityResponse;
		try {
			if (!id) {
				setError(t('DETAILS_BENEFIT_IDENTIFIER_ERROR'));
				setLoading(false);
				return;
			}
			eligibilityResponse = await checkEligibilityOfUser(id);
		} catch (err) {
			console.error('Error in checking eligibility', err);
			setError(t('DETAILS_ELIGIBILITY_CHECK_ERROR'));
			setLoading(false);
			return;
		}

		// Step 2: Process eligibility reasons
		const reasons =
			eligibilityResponse?.ineligible?.[0]?.details?.reasons ?? [];

		const reasonMessages = reasons.map((r: any) => {
			if (
				r.requiredValue &&
				Array.isArray(r.requiredValue) &&
				r.requiredValue.length > 0
			) {
				return `${r.reason} ${r.requiredValue.join(', ')} ${r?.field}`;
			}
			return r.reason;
		});

		if (reasonMessages.length > 0) {
			setError(
				`${t('DETAILS_ELIGIBILITY_ERROR_PREFIX')}\n${reasonMessages.join(
					'\n'
				)}`
			);
			setLoading(false);
			return;
		}

		// Step 3: Apply application
		try {
			if (!context) {
				setError(t('DETAILS_CONTEXT_UNAVAILABLE_ERROR'));
				setLoading(false);
				return;
			}
			const result = await applyApplication({ id, context });

			const url = (result as { data: { responses: Array<any> } }).data
				?.responses?.[0]?.message?.order?.items?.[0]?.xinput?.form?.url;

			// If the application is resubmit, merge `authUser` and `applicationData`
			// Priority is given to keys from `applicationData`, but any extra keys
			// from `authUser` that are not present in `applicationData` will be included.
			// Otherwise, use `authUser` as the formData.

			const isEditableStatus = [
				'application resubmit',
				'application pending',
				'submitted',
			].includes(applicationStatus?.toLowerCase() || '');

			const baseFormData = isEditableStatus
				? {
						...(authUser || {}),
						...(applicationData?.application_data || {}),
						external_application_id:
							applicationData?.external_application_id,
						remark: applicationData?.remark,
					}
				: (authUser ?? undefined);

			// Calculate age from dob if present
			let formData = baseFormData?.dob
				? {
						...baseFormData,
						age: calculateAge(baseFormData.dob) || baseFormData.age,
				}
				: baseFormData;

			// Filter out expired documents from form data if user has documents
			if (formData?.docs && item?.document) {
				const filteredDocs = filterExpiredDocuments(
					formData.docs,
					item.document
				);
				formData = {
					...formData,
					docs: filteredDocs,
				};
			}

			if (url) {
				setWebFormProp({
					url,
					formData,
				});
			} else {
				setError(t('DETAILS_URL_NOT_FOUND_ERROR'));
			}
		} catch (error) {
			console.error('Error during confirmation:', error);
			setError(t('DETAILS_GENERAL_ERROR'));
		}

		setLoading(false);
	};
	useEffect(() => {
		// Access localStorage only on client
		try {
			setIsAuthenticated(!!localStorage.getItem('authToken'));
		} catch {
			setIsAuthenticated(false);
		}
	}, []);
	const handleBack = () => {
		navigate(-1);
	};
	const extractResultItem = (result) => {
		return (
			(result as { data: { responses: Array<any> } }).data?.responses?.[0]
				?.message?.catalog?.providers?.[0]?.items?.[0] || {}
		);
	};

	/**
	 * Extracts and merges required and eligibility document items from the result item.
	 *
	 * @param resultItem - An object containing tags with document metadata.
	 * @returns A list of merged and formatted DocumentItem objects.
	 */
	const extractRequiredDocs = (resultItem): DocumentItem[] => {
		// Find the tag with code 'required-docs'
		const requiredDocsTag = resultItem?.tags?.find(
			(e: any) => e?.descriptor?.code === 'required-docs'
		);

		// Find the tag with code 'eligibility'
		const eligibilityTag = resultItem?.tags?.find(
			(e: any) => e?.descriptor?.code === 'eligibility'
		);

		// Parse the list of required documents (isRequired = false)
		const requiredList = parseDocList(requiredDocsTag?.list ?? [], false);

		// Parse the list of eligibility documents (isRequired = true)
		const eligibilityList = parseDocList(eligibilityTag?.list ?? [], true);

		// Combine both required and eligibility documents
		const allDocs = [...requiredList, ...eligibilityList];

		// Create a map to merge documents based on their allowedProofs
		const mergedMap = new Map<string, DocumentItem>();

		allDocs.forEach((doc) => {
			// Use a stringified version of allowedProofs as a unique key
			const key = doc.allowedProofs.join(',');

			if (mergedMap.has(key)) {
				// If document with same key exists, merge with the existing entry
				const existing = mergedMap.get(key);

				// Normalize codes to arrays
				const existingCodes = Array.isArray(existing.code)
					? existing.code
					: [existing.code];

				// Merge current doc with existing one

				mergedMap.set(key, {
					...existing,
					code: [...existingCodes, doc.code], // Merge codes ( evidence)

					isRequired: existing.isRequired || doc.isRequired, // Keep true if any is required
				});
			} else {
				// If it's a new document group, add to the map
				mergedMap.set(key, {
					...doc,
					code: doc.code,
				});
			}
		});

		// Convert merged map to array and format each document with label
		return Array.from(mergedMap.values()).map((doc) => ({
			...doc,
			label: formatLabel(
				doc.allowedProofs,
				Array.isArray(doc.code) ? doc.code : [doc.code],
				doc.isRequired
			),
		}));
	};

	const extractContext = (result) => {
		return (result as { data: { responses: Array<any> } }).data
			?.responses?.[0]?.context as FinancialSupportRequest;
	};

	const handleAuthenticatedFlow = async (resultItem, id, user) => {
		if (user?.data?.dob) {
			const age = calculateAge(user.data.dob);
			user.data.age = `${age}`;
		}
		/* const eligibilityArr = checkEligibility(resultItem, user);
		setIsEligible(eligibilityArr.length > 0 ? eligibilityArr : undefined); */ // NOSONAR
		const customFields = user?.data?.customFields || [];
		const customFieldValues = customFields.reduce(
			(acc, field) => {
				acc[field.name] = field.value;
				return acc;
			},
			{} as Record<string, any>
		);
		const combinedData = {
			...user.data,
			...customFieldValues,
		};
		setAuthUser(combinedData || {});

		const appResult = await getApplication({
			user_id: user?.data?.user_id,
			benefit_id: id,
		});

		if (appResult?.data?.applications?.length > 0) {
			const status = appResult.data.applications[0].status;
			setApplicationData(appResult.data.applications[0]);
			setApplicationStatus(status); // Can be 'submitted', 'resubmit', etc.
		}
	};

	/* 	const checkEligibility = (resultItem, user) => {
		const eligibilityArr: string[] = [];

		const eligibilityTag = resultItem?.tags?.find(
			(tag: any) => tag?.descriptor?.code === 'eligibility'
		);

		if (!eligibilityTag?.list || !Array.isArray(eligibilityTag.list)) {
			return eligibilityArr;
		}

		eligibilityTag.list.forEach((item: any) => {
			const code = item?.descriptor?.code;
			const eligibilityObj = JSON.parse(item.value);
			try {
				const payload = {
					condition: eligibilityObj?.criteria?.condition,
					conditionValues: eligibilityObj?.criteria?.conditionValues,
					value: user?.data?.[code],
				};

				const result = checkEligibilityCriteria(payload);

				if (!result) {
					eligibilityArr.push(code);
				}
			} catch (error) {
				console.error(`Failed to parse eligibility criteria:`, error);
				eligibilityArr.push(code);
			}
		});

		return eligibilityArr;
	}; */

	useEffect(() => {
		let mounted = true;
		const init = async () => {
			try {
				const result = await getOne({ id });
				const resultItem = extractResultItem(result);
				const token = localStorage.getItem('authToken');
				let user;
				if (token) {
					try {
						user = await getUser();
						setUserDocuments(user.data.docs ?? []);
					} catch (err) {
						console.error('Failed to fetch user', err);
						user = { data: { docs: [] } };
					}
				}

				const docs = extractRequiredDocs(resultItem);

				setContext(extractContext(result));

				if (mounted) {
					setItem({ ...resultItem, document: docs });

					if (token) {
						await handleAuthenticatedFlow(resultItem, id, user);
					}

					setLoading(false);
				}
			} catch (e: unknown) {
				handleError(e);
			}
		};
		const handleError = (e) => {
			if (mounted) {
				if (e instanceof Error) {
					setError(`Error: ${e.message}`);
				} else {
					setError('An unexpected error occurred');
				}
				setLoading(false);
			}
		};
		init();
		return () => {
			mounted = false;
		};
	}, [id]);

	const submitConfirm = async (payload) => {
		const confirmPayload = {
			item_id: payload?.submit.application.id,
			rawContext: context,
		};

		setLoading(true);
		try {
			const result = await confirmApplication(confirmPayload);
			const orderId = (
				result as {
					data: {
						responses: { message: { order: { id: string } } }[];
					};
				}
			)?.data?.responses?.[0]?.message?.order?.id;
			if (orderId) {
				const payloadCreateApp = {
					user_id: authUser?.user_id,
					benefit_id: id,
					benefit_provider_id: context?.bpp_id,
					benefit_provider_uri: context?.bpp_uri,
					external_application_id: orderId,
					application_name: item?.descriptor?.name,
					status: 'application pending',
					application_data: payload?.userData,
				};

				await createApplication(payloadCreateApp);
				setSubmitDialouge({ orderId, name: item?.descriptor?.name });
				setWebFormProp({});
			} else {
				setError(t('DETAILS_APPLICATION_CREATE_ERROR'));
			}
		} catch (e) {
			if (e instanceof Error) {
				setError(`${t('DETAILS_ERROR_MODAL_TITLE')}: ${e.message}`);
			} else {
				setError(t('DETAILS_GENERAL_ERROR'));
			}
		}
		setLoading(false);
	};

	if (loading) {
		return <Loader />;
	}

	if (error) {
		return (
			<Modal isOpen={true} onClose={() => setError('')}>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>{t('DETAILS_ERROR_MODAL_TITLE')}</ModalHeader>
					<ModalBody>
						<Text>{error}</Text>
					</ModalBody>
					<ModalFooter>
						<CommonButton
							onClick={() => setError('')}
							label={t('DETAILS_CLOSE_BUTTON')}
						/>
					</ModalFooter>
				</ModalContent>
			</Modal>
		);
	}
	if (webFormProp?.url && webFormProp?.formData) {
		return (
			<WebViewFormSubmitWithRedirect
				{...webFormProp}
				submitConfirm={submitConfirm}
			/>
		);
	}
	const closeDialog = async () => {
		try {
			await sendConsent(
				authUser?.user_id,
				`${id}`,
				`Application for ${id}`
			);

			setConfirmationConsent(false);
			navigate('/applicationStatus');
		} catch {
			console.log('Error sending consent');
		}
	};
	const handleRedirect = () => {
		navigate('/applicationStatus');
	};
	const getActionLabel = (
		status: string | null,
		t: (key: string) => string
	): string => {
		if (!status) {
			return t('BENEFIT_DETAILS_PROCEED_TO_APPLY');
		} else if (
			status === 'application resubmit' ||
			status === 'application pending' ||
			status === 'submitted'
		) {
			return t('BENEFIT_DETAILS_RESUBMIT_APPLICATION');
		} else {
			return t('BENEFIT_DETAILS_APPLICATION_SUBMITTED');
		}
	};

	return (
		<Layout
			_heading={{ heading: item?.descriptor?.name || '', handleBack }}
			isMenu={Boolean(localStorage.getItem('authToken'))}
		>
			<Box className="card-scroll invisible-scroll">
				<Box maxW="2xl" m={4}>
					<Heading size="md" mt={6} color="#484848" fontWeight={500}>
						{t('BENEFIT_DETAILS_HEADING_DETAILS')}
					</Heading>

					{item?.descriptor?.long_desc !== '' && (
						<Text mt={4}>{item?.descriptor?.long_desc}</Text>
					)}

					<Heading size="md" mt={6} color="#484848" fontWeight={500}>
						{t('BENEFIT_DETAILS_BENEFIT_DETAILS')}
					</Heading>
					<UnorderedList mt={4}>
						{item?.tags
							?.filter(
								(tag) => tag.descriptor?.code === 'benefits'
							) // Filter to find the 'eligibility' object
							.map((tag, index) =>
								tag.list?.map(
									(
										benefitItem,
										innerIndex // Access list inside descriptor and map through it
									) => (
										<ListItem
											key={`benefit-${index}-${innerIndex}`}
										>
											{(() => {
												let parsedValue;
												try {
													parsedValue = JSON.parse(
														benefitItem.value
													);
												} catch {
													parsedValue = {};
												}
												return (
													<>
														<strong>
															{parsedValue.title}
														</strong>
														{parsedValue.description
															? `: ${parsedValue.description}`
															: ''}
													</>
												);
											})()}
										</ListItem>
									)
								)
							)}
					</UnorderedList>

					{/* <Heading size="md" color="#484848" fontWeight={500}>
						{t('BENEFIT_DETAILS_HEADING_TITLE')}
					</Heading>
					<HStack mt={2}>
						<Icon
							as={MdCurrencyRupee}
							boxSize={5}
							color="#484848"
						/>
						<Text>{item?.price?.value}</Text>
					</HStack> */}

					<Heading size="md" mt={6} color="#484848" fontWeight={500}>
						{t('BENEFIT_DETAILS_ELIGIBILITY_DETAILS')}
					</Heading>
					<UnorderedList mt={4}>
						{item?.tags
							?.filter(
								(tag) => tag.descriptor?.code === 'eligibility'
							) // Filter to find the 'eligibility' object
							.map((tag, index) =>
								tag.list?.map(
									(
										eligibilityItem,
										innerIndex // Access list inside descriptor and map through it
									) => (
										<ListItem
											key={`eligibility-${index}-${innerIndex}`}
										>
											{
												eligibilityItem?.descriptor
													?.short_desc
											}{' '}
											{/* Render the short_desc from each item in the list */}
										</ListItem>
									)
								)
							)}
					</UnorderedList>

					<Heading size="md" mt={6} color="#484848" fontWeight={500}>
						{t('BENEFIT_DETAILS_DOCUMENTS_REQUIRED')}
					</Heading>

					<UnorderedList mt={4}>
						{item?.document?.map((document) => (
							<Box
								key={document.label}
								display="flex"
								alignItems="center"
								justifyContent="space-between"
								width="100%"
								mb={4} // spacing between document rows
							>
								<Box width="70%">
									<ListItem>{document.label}</ListItem>
								</Box>
								{isAuthenticated && (
									<Box
										width="30%"
										display="flex"
										flexDirection="column"
										alignItems="flex-end"
										justifyContent="flex-start"
										pt="2px"
										gap={1} // vertical spacing between DocumentActions
									>
										{document.allowedProofs.map((proof) => (
											<DocumentActions
												key={proof}
												status={proof}
												userDocuments={userDocuments}
												isDelete={false}
											/>
										))}
									</Box>
								)}
							</Box>
						))}
					</UnorderedList>

					{isAuthenticated ? (
						<CommonButton
							mt={6}
							onClick={handleConfirmation}
							label={getActionLabel(applicationStatus, t)}
							isDisabled={
								!!applicationStatus &&
								![
									'application pending',
									'submitted',
									'application resubmit',
								].includes(
									(applicationStatus || '').toLowerCase()
								)
							}
						/>
					) : (
						<CommonButton
							mt={6}
							onClick={() => {
								localStorage.setItem(
									'redirectUrl',
									window.location.href
								);
								navigate('/signin');
							}}
							label={t('BENEFIT_DETAILS_LOGIN_TO_APPLY')}
						/>
					)}
				</Box>
			</Box>
			<CommonDialogue
				isOpen={confirmationConsent}
				onClose={closeDialog}
				termsAndConditions={termsAndConditions}
				handleDialog={handleConfirmation}
			/>
			<CommonDialogue
				isOpen={submitDialouge}
				onClose={handleRedirect}
				handleDialog={handleRedirect}
			/>
		</Layout>
	);
};

export default BenefitsDetails;
