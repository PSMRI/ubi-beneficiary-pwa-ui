import React, { useEffect, useState } from 'react';
import {
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Input,
    FormControl,
    Box,
    Text,
} from '@chakra-ui/react';

interface Language {
    code: string;
    label: string;
    nativeLabel: string;
}

interface MultilingualLabelInputProps {
    value: Record<string, string>;
    languages: Language[];
    defaultLanguage?: string;
    required?: boolean;
    isInvalid?: boolean;
    errorMessage?: string;
    onChange: (value: Record<string, string>) => void;
    onValidationChange?: (isValid: boolean) => void;
    placeholder?: string;
    maxLength?: number;
}

const MultilingualLabelInput: React.FC<MultilingualLabelInputProps> = ({
    value,
    languages,
    defaultLanguage = 'en',
    required = false,
    isInvalid = false,
    errorMessage,
    onChange,
    onValidationChange,
    placeholder,
    maxLength,
}) => {
    const [tabIndex, setTabIndex] = useState(0);

    // Set initial tab based on defaultLanguage
    useEffect(() => {
        const index = languages.findIndex((lang) => lang.code === defaultLanguage);
        if (index !== -1) {
            setTabIndex(index);
        }
    }, [defaultLanguage, languages]);

    // Check validity
    useEffect(() => {
        if (onValidationChange) {
            const allValid = languages.every((lang) => {
                const val = value[lang.code];
                return val && val.trim().length > 0;
            });
            onValidationChange(allValid);
        }
    }, [value, languages, onValidationChange]);


    const handleInputChange = (langCode: string, text: string) => {
        onChange({
            ...value,
            [langCode]: text,
        });
    };

    const isLanguageInvalid = (langCode: string) => {
        if (!isInvalid) return false;
        const val = value[langCode];
        return required && (!val || val.trim() === '');
    };

    return (
        <Box
            borderWidth="1px"
            borderRadius="md"
            borderColor={isInvalid ? "red.300" : "gray.200"}
            bg="gray.50"
            p={4}
        >
            <Tabs
                index={tabIndex}
                onChange={setTabIndex}
                variant="soft-rounded"
                colorScheme="blue"
                isLazy
            >
                <TabList mb={4} flexWrap="wrap" gap={2}>
                    {languages.map((lang) => {
                        const hasError = isLanguageInvalid(lang.code);
                        return (
                            <Tab
                                key={lang.code}
                                fontWeight="bold"
                                fontSize="sm"
                                _selected={{ color: 'white', bg: '#06164B' }}
                                bg="white"
                                color="#06164B"
                                border="1px solid"
                                borderColor="gray.200"
                                boxShadow="sm"
                            >
                                {lang.nativeLabel}
                                {hasError && (
                                    <Box
                                        as="span"
                                        ml={2}
                                        w={2}
                                        h={2}
                                        borderRadius="full"
                                        bg="red.500"
                                        display="inline-block"
                                    />
                                )}
                            </Tab>
                        );
                    })}
                </TabList>
                <TabPanels>
                    {languages.map((lang) => (
                        <TabPanel key={lang.code} px={0} py={0}>
                            <FormControl isInvalid={isLanguageInvalid(lang.code)}>

                                <Input
                                    value={value[lang.code] || ''}
                                    onChange={(e) => handleInputChange(lang.code, e.target.value)}
                                    placeholder={placeholder}
                                    maxLength={maxLength}
                                    borderWidth="2px"
                                    bg="white"
                                    size="lg"
                                    borderRadius="md"
                                    _focus={{
                                        borderColor: 'blue.400',
                                        boxShadow: '0 0 0 2px #06164B33',
                                    }}
                                />
                                {isLanguageInvalid(lang.code) && (
                                    <Text color="red.500" fontSize="xs" mt={1}>
                                        {errorMessage || `${lang.label} is required`}
                                    </Text>
                                )}
                            </FormControl>
                        </TabPanel>
                    ))}
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default MultilingualLabelInput;
