import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    FormControl,
    useToast,
    Text,
    Center,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/layout/Layout';
import CommonButton from '../../components/common/button/Button';
import FloatingPasswordInput from '../../components/common/input/PasswordInput';
import { useTranslation } from 'react-i18next';
import { updatePassword } from '../../services/auth/auth';

const UpdatePassword: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const toast = useToast();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const username = localStorage.getItem('pendingUser');

    // Prefill oldPassword from sessionStorage
    useEffect(() => {
        const prefillPassword = sessionStorage.getItem('prefill_password');
        if (prefillPassword) {
            setOldPassword(prefillPassword);
        }
    }, []);

    const handleUpdatePassword = async () => {
        if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            toast({
                title: t('PASSWORD_REQUIRED') || 'All password fields are required.',
                status: 'warning',
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: t('PASSWORD_MISMATCH') || 'Passwords do not match.',
                status: 'error',
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        try {
            setLoading(true);
            const response = await updatePassword({
                username,
                oldPassword,
                newPassword,
            });

            // If we reach here, the update was successful
            // Replace prefill_password in sessionStorage with the new password
            sessionStorage.setItem('prefill_password', newPassword);

            // Set isFirstTimeLogin flag to true in sessionStorage
            sessionStorage.setItem('isFirstTimeLogin', 'true');

            toast({
                title: response?.message || t('UPDATE_PASSWORD_SUCCESS') || 'Password updated successfully!',
                status: 'success',
                duration: 4000,
                isClosable: true,
            });
            console.log('response<insert>', response.message);

            // Clear pending user & redirect to login
            localStorage.removeItem('pendingUser');
            navigate('/signin');

        } catch (error: any) {
            console.log('error+++', error);

            if (error?.statusCode === 401) {
                console.log('error+++', error);
                toast({
                    title: t('UPDATE_PASSWORD_FAILED') || 'Password update failed',
                    description: error?.message || t('UPDATE_PASSWORD_INVALID_OLD_PASSWORD_MESSAGE') || 'Invalid old password',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
                return;
            }
            toast({
                title: t('UPDATE_PASSWORD_FAILED') || 'Password update failed',
                description:
                    error?.message || error?.error || 'Please try again later.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout
            isMenu={false}
            _heading={{
                heading: t('UPDATE_PASSWORD_TITLE') || 'Update Password',
                handleBack: () => navigate('/'),
            }}
            isBottombar={false}
        >
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
                <VStack align="stretch">
                    <FormControl>
                        <FloatingPasswordInput
                            label={t('UPDATE_PASSWORD_ENTER_OLD_PASSWORD') || 'Enter Old Password'}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                        <FloatingPasswordInput
                            label={t('UPDATE_PASSWORD_ENTER_NEW_PASSWORD') || 'Enter New Password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <FloatingPasswordInput
                            label={t('UPDATE_PASSWORD_CONFIRM_NEW_PASSWORD') || 'Confirm New Password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </FormControl>

                    <CommonButton
                        loading={loading}
                        loadingLabel={t('UPDATE_PASSWORD_UPDATING') || 'Updating...'}
                        onClick={handleUpdatePassword}
                        label={t('UPDATE_PASSWORD_BUTTON') || 'Update Password'}
                    />
                </VStack>

                <Center mt={6}>
                    <Text color="gray.600" fontSize="sm">
                        {t('UPDATE_PASSWORD_NOTE') ||
                            'After updating your password, you will be redirected to login.'}
                    </Text>
                </Center>
            </Box>
        </Layout>
    );
};

export default UpdatePassword;
