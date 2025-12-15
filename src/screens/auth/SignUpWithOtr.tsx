import React, { useState } from 'react';
import { Box, Text, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/layout/Layout';
import { useTranslation } from 'react-i18next';
import ScanOTR from '../../components/ScanOTR';
import { registerWithDocument } from '../../services/auth/auth';

const SignUpWithOtr: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const toast = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleBack = () => navigate(-1);

    const handleOTRProcessed = async (response: any, file: File) => {
        try {
            setIsProcessing(true);

            if (!file) {
                toast({
                    title: 'Missing File',
                    description: 'Please upload a valid OTR certificate.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }

            // ✅ Call single backend endpoint for registration + OTR processing + upload
            const apiResponse = await registerWithDocument(
                file,
                'idProof',
                'otrCertificate',
                'OTR Certificate',
                'otrCertificate'
            );

            toast({
                title: t('SIGNUP_SUCCESSFUL'),
                description: apiResponse?.message || 'Your account has been created successfully.',
                status: 'success',
                duration: 7000,
                isClosable: true,
            });

            navigate('/signin');
        } catch (error: any) {
            console.error('Error in register_with_document:', error);
            toast({
                title: t('SIGNUP_FAILED'),
                description: error?.error || error?.message || error?.response?.data?.error || 'Failed to register user with OTR certificate.',
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
                    {t('SIGN_UP_UPLOAD_OTR')}
                </Text>

                <ScanOTR
                    onOTRProcessed={handleOTRProcessed}
                    onError={(error) => {
                        console.error('OTR processing error:', error);
                        toast({
                            title: 'Processing Failed',
                            description: 'Failed to extract data from OTR certificate.',
                            status: 'error',
                            duration: 5000,
                            isClosable: true,
                        });
                    }}
                    isProcessing={isProcessing}
                />
            </Box>
        </Layout>
    );
};

export default SignUpWithOtr;
