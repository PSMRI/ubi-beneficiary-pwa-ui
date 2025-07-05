import React, { useContext, useEffect, useRef, useState } from 'react';
import { uploadUserDocuments } from '../../services/user/User';
import { getDocumentsList, getUser } from '../../services/auth/auth';
import { AuthContext } from '../../utils/context/checkToken';
import CommonButton from './button/Button';
import { useTranslation } from 'react-i18next';
import { Box, Text, Alert, AlertIcon, IconButton, useToast, Progress } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';

const VITE_EWALLET_ORIGIN = import.meta.env.VITE_EWALLET_ORIGIN;
const VITE_EWALLET_IFRAME_SRC = import.meta.env.VITE_EWALLET_IFRAME_SRC;

const UploadDocumentEwallet = () => {
	const { t } = useTranslation();
	const { updateUserData } = useContext(AuthContext);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [isIframeVisible, setIsIframeVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);
	const toast = useToast();

	// Function to open the iframe and load the document selector
	const init = async () => {
		try {
			setIsLoading(true);
			const result = await getUser();

			const data = await getDocumentsList();
			updateUserData(result.data, data.data);
			setError('');
		} catch (error) {
			console.error('Error fetching user data or documents:', error);
			setError('Failed to fetch user data or documents. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	// Function to open wallet UI
	const openWalletUI = () => {
		localStorage.setItem('embeddedMode', 'true');

		const walletToken = localStorage.getItem('walletToken');
		const user = localStorage.getItem('user');

		if (!walletToken || !user) {
			setError('Wallet authentication data not found. Please ensure wallet is properly configured.');
			return;
		}

		if (!VITE_EWALLET_IFRAME_SRC) {
			setError('Wallet configuration is missing. Please check your environment variables.');
			return;
		}

		// Validate the URL configuration
		try {
			new URL(VITE_EWALLET_IFRAME_SRC);
		} catch (error) {
			console.error('Invalid wallet URL configuration:', error);
			setError('Invalid wallet URL configuration. Please check your environment variables.');
			return;
		}

		setIsIframeVisible(true);
		setError('');
	};

	// Function to close wallet UI
	const closeWalletUI = () => {
		setIsIframeVisible(false);
	};

	// Send authentication data to iframe
	const sendAuthToIframe = () => {
		if (!iframeRef.current) return;
		
		// Get specific wallet authentication data
		const walletToken = localStorage.getItem('walletToken');
		const user = JSON.parse(localStorage.getItem('user'));
		
		if (!walletToken || !user) {
			setError('Wallet authentication data not found. Please ensure wallet is properly configured.');
			return;
		}

		// Create message data with authentication info
		const messageData = {
			type: 'WALLET_AUTH', // Add a type to identify the message
			data: {
				walletToken: walletToken,
				user: user,
				embeddedMode: true
			}
		};

		try {
			// Only use postMessage for communication
			iframeRef.current.contentWindow?.postMessage(messageData, VITE_EWALLET_IFRAME_SRC);
		} catch (error) {
			console.error('Failed to send message to iframe:', error);
			setError('Failed to communicate with wallet. Please try again.');
		}
	};

	// Prepare payload for document upload
	const preparePayload = async (data: any) => {
		// Parse the stringified JSON if it's a string
		const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
		console.log('Parsed data:', parsedData);
		
		const documentsResponse = await getDocumentsList();
		// Ensure we have an array of documents, assuming documents are in data property
		let documents: any[] = [];
		if (Array.isArray(documentsResponse)) {
			documents = documentsResponse;
		} else if (Array.isArray(documentsResponse.data)) {
			documents = documentsResponse.data;
		}

		console.log('Available documents:', documents);

		const availableDocTypes = documents.map((doc: any) => doc.name).join(', ');
		const matchedDocument = documents.find((doc: any) => parsedData?.credentialSchema?.title?.includes(doc.name));

		if (!matchedDocument) {
			throw new Error(
				`The uploaded document does not match any of the accepted document types: ${availableDocTypes}. ` +
				`Please select a valid document from your wallet.`
			);
		}

		return [{
			doc_name: matchedDocument.name,
			doc_type: matchedDocument.docType,
			doc_subtype: matchedDocument.documentSubType,
			doc_data: parsedData,
			uploaded_at: new Date().toISOString(),
			imported_from: 'e-wallet',
			doc_datatype: 'Application/JSON',
		}];
	};

	// Helper to show upload status toast
	const showUploadStatusToast = (results: any[]) => {
		const successDocs = results.filter(r => r.success);
		const failedDocs = results.filter(r => !r.success);

		const statusMessage = (
			<Box bg="white" p={3} borderRadius="md" boxShadow="sm">
				{successDocs.length > 0 && (
					<Box mb={3} bg="green.50" p={2} borderRadius="md">
						<Text fontWeight="bold" color="green.700" mb={2}>
							Successfully Uploaded:
						</Text>
						{successDocs.map((doc, idx) => (
							<Text key={doc.docName} ml={2} color="green.600">
								• {doc.docName}
							</Text>
						))}
					</Box>
				)}
				{failedDocs.length > 0 && (
					<Box bg="red.50" p={2} borderRadius="md">
						<Text fontWeight="bold" color="red.700" mb={2}>
							Failed to Upload:
						</Text>
						{failedDocs.map((doc, idx) => {
							const showFullError = doc.fullError && doc.error === 'Document type not accepted';
							return (
								<Box key={doc.docName ?? idx} ml={2} mb={2}>
									<Text color="red.700" fontWeight="semibold">
										• {doc.docName}
									</Text>
									{showFullError ? (
										<Text ml={4} fontSize="sm" mt={1} color="red.600">
											{doc.fullError}
										</Text>
									) : (
										<Text ml={4} fontSize="sm" color="red.600">
											{doc.error}
										</Text>
									)}
								</Box>
							);
						})}
					</Box>
				)}
			</Box>
		);

		toast({
			title: 'Document Upload Status',
			description: statusMessage,
			status: 'info',
			duration: 10000,
			isClosable: true,
			position: 'top',
		});
	};

	// Helper to process a single document
	const processDocument = async (vc: any) => {
		if (!vc.json) return null;
		try {
			const payload = await preparePayload(vc.json);
			await uploadUserDocuments(payload);
			return {
				success: true,
				docName: payload[0].doc_name,
				docType: payload[0].doc_type
			};
		} catch (docError: any) {
			console.error('Error processing document:', docError);
			const documentName = vc.json?.credentialSchema?.title ?? 'Unknown document';
			let errorMessage;
			if (docError instanceof Error && docError.message.includes('does not match any of the accepted document types')) {
				errorMessage = 'Document type not accepted';
			} else if (docError?.response?.data?.message) {
				errorMessage = docError.response.data.message;
			} else if (docError instanceof Error) {
				errorMessage = docError.message;
			} else {
				errorMessage = 'Document upload failed. Please try again.';
			}
			return {
				success: false,
				docName: documentName,
				error: errorMessage,
				fullError: docError instanceof Error ? docError.message : undefined
			};
		}
	};

	// Helper to handle VC_SHARED type
	const handleVCShared = async (data: any, processingToastIdRef: { current: string | number | undefined }) => {
		setIsProcessing(true);
		if (!data?.vcs || !Array.isArray(data.vcs)) {
			throw new Error('No valid documents received from wallet');
		}
		setIsLoading(true);

		processingToastIdRef.current = toast({
			title: 'Processing Documents',
			description: (
				<Box>
					<Text mb={2}>Please wait while your documents are being processed...</Text>
					<Progress size="xs" isIndeterminate />
				</Box>
			),
			status: 'info',
			duration: null,
			isClosable: false,
			position: 'top',
		});

		const results = [];
		for (const vc of data.vcs) {
			const result = await processDocument(vc);
			if (result) results.push(result);
		}

		if (processingToastIdRef.current) {
			toast.close(processingToastIdRef.current);
		}

		if (results.length > 0) {
			showUploadStatusToast(results);
		}

		await init();
		closeWalletUI();
		setIsLoading(false);
		setIsProcessing(false);
	};

	// Listen for messages from the iframe
	useEffect(() => {
		const processingToastIdRef = { current: undefined as string | number | undefined };

		const handleMessage = async (event: MessageEvent) => {
			if (event.origin !== VITE_EWALLET_ORIGIN) return;

			try {
				const { type, data } = event.data;
				console.log('Received message from wallet:', type, data);

				if (!type) {
					console.warn('Received message without type:', event.data);
					return;
				}

				if (processingToastIdRef.current) {
					toast.close(processingToastIdRef.current);
				}

				if (type === 'VC_SHARED') {
					try {
						await handleVCShared(data, processingToastIdRef);
					} catch (error: any) {
						console.error('Error handling VC_SHARED:', error);
						if (processingToastIdRef.current) {
							toast.close(processingToastIdRef.current);
						}
						toast({
							title: 'Error',
							description: error.message ?? 'Failed to process documents',
							status: 'error',
							duration: 5000,
							isClosable: true,
							position: 'top',
						});
						setIsLoading(false);
						setIsProcessing(false);
						closeWalletUI();
					}
				}
			} catch (error) {
				console.error('Error handling wallet message:', error);
				setIsLoading(false);
				setIsProcessing(false);
			}
		};

		window.addEventListener('message', handleMessage);
		return () => {
			window.removeEventListener('message', handleMessage);
			if (processingToastIdRef.current) {
				toast.close(processingToastIdRef.current);
			}
		};
	}, [init, updateUserData, toast]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (isIframeVisible) {
				closeWalletUI();
			}
		};
	}, []);

	return (
		<Box>
			{/* Error Display */}
			{error && (
				<Alert status="error" mb={4} borderRadius="md">
					<AlertIcon />
					<Text>{error}</Text>
				</Alert>
			)}

			{/* Upload Button */}
			<CommonButton
				onClick={openWalletUI}
				label={t('UPLOAD_DOCUMENT_EWALLET')}
				mt={2}
				variant="outline"
				isDisabled={isLoading ?? isIframeVisible}
				loading={isLoading}
				loadingLabel="Loading..."
			/>

			{/* Wallet UI Container with Back Button and Iframe */}
			{isIframeVisible && (
				<Box
					position="fixed"
					top={0}
					left={0}
					width="100%"
					height="100%"
					zIndex={1000}
					backgroundColor="white"
					display="flex"
					flexDirection="column"
				>
					{/* Back Button Header */}
					<Box
						p={3}
						borderBottom="1px solid"
						borderColor="gray.200"
						display="flex"
						alignItems="center"
						backgroundColor="white"
						zIndex={1001}
					>
						<IconButton
							icon={<ArrowBackIcon />}
							onClick={closeWalletUI}
							aria-label="Go back"
							size="md"
							variant="ghost"
							colorScheme="blue"
							mr={2}
						/>
						<Text fontSize="lg" fontWeight="semibold">
							{t('WALLET_INTERFACE')}
						</Text>
					</Box>

					{/* Iframe Content */}
					<Box flex={1} overflow="hidden" position="relative">
						<iframe
							ref={iframeRef}
							src={VITE_EWALLET_IFRAME_SRC}
							title="Wallet Interface"
							onLoad={() => {
								// Send auth data once iframe loads
								setTimeout(() => sendAuthToIframe());
							}}
							onError={() => {
								setError('Failed to load wallet interface. Please check your connection and try again.');
							}}
							allow="camera"
							style={{
								width: '100%',
								height: '100%',
								border: 'none',
								backgroundColor: 'white',
							}}
						/>
						{/* Processing Overlay */}
						{isProcessing && (
							<Box
								position="absolute"
								top={0}
								left={0}
								right={0}
								bottom={0}
								bg="blackAlpha.50"
								backdropFilter="blur(2px)"
								display="flex"
								flexDirection="column"
								alignItems="center"
								justifyContent="center"
								zIndex={2}
							>
								<Box
									bg="white"
									p={6}
									borderRadius="lg"
									boxShadow="lg"
									textAlign="center"
									maxW="sm"
								>
									<Text mb={4} fontSize="lg" fontWeight="medium">
										Processing Documents...
									</Text>
									<Progress
										size="md"
										isIndeterminate
										colorScheme="blue"
										borderRadius="full"
										width="100%"
										max={100}
									/>
								</Box>
							</Box>
						)}
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default UploadDocumentEwallet;
