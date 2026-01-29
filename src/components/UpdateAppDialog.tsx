import * as React from 'react';
import {
    Text,
    IconButton,
    VStack,
    Modal,
    ModalOverlay,
    ModalHeader,
    ModalContent,
    ModalBody,
    ModalFooter,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import CommonButton from './common/button/Button';

interface UpdateAppDialogProps {
    isOpen: boolean;
    onUpdate: () => void;
    onClose?: () => void;
}

const UpdateAppDialog: React.FC<UpdateAppDialogProps> = ({
    isOpen,
    onUpdate,
    onClose,
}) => {
    const { t } = useTranslation();

    return (
        <VStack>
            <Modal
                isOpen={isOpen}
                onClose={() => { }}
                closeOnOverlayClick={false}
                closeOnEsc={false}
                size="lg"
            >
                <ModalOverlay />

                <ModalContent bg="white" borderRadius="md" p={5}>
                    <ModalHeader
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        borderBottomWidth="1px"
                        borderBottomColor="gray.200"
                    >
                        <Text fontSize="lg" fontWeight="medium" color="gray.700">
                            {t('APP_UPDATE_TITLE')}
                        </Text>

                        {/* Optional close */}
                        {onClose && (
                            <IconButton
                                icon={<CloseIcon />}
                                onClick={onClose}
                                variant="ghost"
                                aria-label="Close modal"
                            />
                        )}
                    </ModalHeader>

                    <ModalBody py={4}>
                        <Text fontSize="md" color="gray.700">
                            {t('APP_UPDATE_MESSAGE')}
                        </Text>

                        <Text fontSize="sm" color="gray.500" mt={3}>
                            {t('APP_UPDATE_SUB_MESSAGE')}
                        </Text>
                    </ModalBody>

                    <ModalFooter display="flex" justifyContent="center">
                        <CommonButton
                            onClick={onUpdate}
                            width={'45%'}
                            label={t('APP_UPDATE_BUTTON')}
                        />
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </VStack>
    );
};

export default UpdateAppDialog;
