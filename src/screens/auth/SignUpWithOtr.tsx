import React, { useState } from 'react';
import {
    Box,
    Text,
    useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/layout/Layout';
import { useTranslation } from 'react-i18next';
import ScanOTR from '../../components/ScanOTR';
import { loginUser, registerWithPassword, setUserRequiredAction } from '../../services/auth/auth';
import { uploadDocument, uploadUserDocuments } from '../../services/user/User';

interface OTRData {
    firstname?: string;
    lastname?: string;
    phoneNumber?: string;
    otr_number?: string;
    username?: string;
    vc_mapping?: {
        mapped_data?: {
            firstname?: string;
            lastname?: string;
            phoneNumber?: string;
            otr_number?: string;
            username?: string;
        };
    };
}

const SignUpWithOtr: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const toast = useToast();

    const [isProcessing, setIsProcessing] = useState(false);

    const handleBack = () => navigate(-1);

    const handleOTRProcessed = async (response: any, file: File) => {
        try {
            setIsProcessing(true);
            console.log('response++++++++', response);
            console.log('file++++++++', file);

            const extractedData: OTRData = response?.data || response;
            const mapped = extractedData.vc_mapping?.mapped_data || extractedData;

            const firstName = mapped.firstname || '';
            const lastName = mapped.lastname || '';
            const phoneNumber = mapped.phoneNumber || '';
            const otrNumber = mapped.otr_number || '';

            // ✅ Validate required fields
            const missingFields: string[] = [];
            if (!firstName) missingFields.push('First Name');
            if (!lastName) missingFields.push('Last Name');
            if (!phoneNumber) missingFields.push('Phone Number');
            if (!otrNumber) missingFields.push('Username / OTR Number');

            if (missingFields.length > 0) {
                toast({
                    title: 'Incomplete OTR Data',
                    description: `${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'
                        } missing in the OTR certificate. Please re-upload the OTR certificate.`,
                    status: 'error',
                    duration: 7000,
                    isClosable: true,
                });
                return;
            }

            // ✅ 1. Register the user
            const payload = {
                firstName,
                lastName,
                username: `${otrNumber}_09`,
                phoneNumber: '9878665984',
                password: 'Digivrtti@1234', // default password pattern
            };

            await registerWithPassword(payload);

            // ✅ 2. Login to Keycloak to get token
            const loginResponse = await loginUser({
                username: `${otrNumber}_09`,
                password: 'Digivrtti@1234',
            });


            if (!loginResponse?.data?.access_token) {
                throw new Error('Failed to login to Keycloak after registration.');
            }

            const authToken = loginResponse.data.access_token;

            // ✅ 3. Upload OTR file to backend
            if (file) {
                const uploadResponse = await uploadDocument(file, 'idProof', 'otrCertificate', 'OTR Certificate', 'Manual Upload', authToken);
                const setUserRequiredActionResponse = await setUserRequiredAction(`${otrNumber}_09`, ['UPDATE_PASSWORD']);
                console.log('uploadResponse++++++++', uploadResponse);
                console.log('setUserRequiredActionResponse++++++++', setUserRequiredActionResponse);
                toast({
                    title: 'OTR Uploaded',
                    description: 'Your OTR certificate has been successfully uploaded.',
                    status: 'success',
                    duration: 6000,
                    isClosable: true,
                });
            }

            // ✅ 4. Final toast + redirect
            toast({
                title: 'Registration Successful',
                description: 'Your account has been created successfully. Please sign in.',
                status: 'success',
                duration: 8000,
                isClosable: true,
            });

            navigate('/signin');
        } catch (error: any) {
            console.error('Registration or upload error:', error);
            toast({
                title: 'Registration Failed',
                description:
                    error?.message ||
                    error?.data?.error ||
                    'Failed to register or upload OTR certificate.',
                status: 'error',
                duration: 7000,
                isClosable: true,
            });
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <Layout
            isMenu={false}
            _heading={{
                heading: t('LOGIN_REGISTER_BUTTON'),
                handleBack,
            }}
            isBottombar={false}
        >
            <Box p={5}>
                <Text mb={4} fontSize="md" color="gray.600">
                    Please upload your OTR certificate to auto-register your account.
                </Text>

                <ScanOTR
                    onOTRProcessed={handleOTRProcessed}
                    onError={(error) => {
                        console.error('OTR processing error:', error);
                        toast({
                            title: 'Processing Failed',
                            description: 'Failed to extract data from OTR certificate',
                            status: 'error',
                            duration: 5000,
                            isClosable: true,
                        });
                    }}
                />
            </Box>
        </Layout>
    );
};

export default SignUpWithOtr;
