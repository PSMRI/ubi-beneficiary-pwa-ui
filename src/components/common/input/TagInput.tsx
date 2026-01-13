import React, { useState } from 'react';
import {
    Box,
    Input,
    Wrap,
    WrapItem,
    Tag,
    TagLabel,
    TagCloseButton,
} from '@chakra-ui/react';

interface TagInputProps {
    tags: string[];
    onTagsChange: (newTags: string[]) => void;
    placeholder?: string;
    isDisabled?: boolean;
    onValidate?: (tag: string) => { isValid: boolean; errorMessage?: string };
    onError?: (errorMessage: string | null) => void;
    caseSensitive?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({
    tags,
    onTagsChange,
    placeholder,
    isDisabled = false,
    onValidate,
    onError,
    caseSensitive = true,
}) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const processedInput = caseSensitive ? inputValue.trim() : inputValue.trim().toLowerCase();
            if (!processedInput) return;

            if (tags.includes(processedInput)) {
                if (onError) {
                    onError('This keyword already exists.');
                }
                return;
            }

            // Validate the tag if onValidate is provided
            if (onValidate) {
                const validation = onValidate(processedInput);
                if (!validation.isValid) {
                    if (onError) {
                        onError(validation.errorMessage || 'This field is not valid.');
                    }
                    return;
                }
            }

            // Clear error on successful add
            if (onError) {
                onError(null);
            }

            onTagsChange([...tags, processedInput]);
            setInputValue('');
        }
    };

    const removeTag = (indexToRemove: number) => {
        onTagsChange(tags.filter((_, index) => index !== indexToRemove));
        // Clear error when removing tags
        if (onError) {
            onError(null);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        // Clear error when user starts typing
        if (onError && e.target.value !== inputValue) {
            onError(null);
        }
    };

    return (
        <Box
            border="2px solid"
            borderColor={isDisabled ? "gray.100" : "gray.200"}
            borderRadius="md"
            p={2}
            display="flex"
            flexWrap="wrap"
            alignItems="center"
            gap={2}
            _focusWithin={{
                borderColor: isDisabled ? 'gray.100' : 'blue.400',
                boxShadow: isDisabled ? 'none' : '0 0 0 2px #06164B33',
            }}
            bg={isDisabled ? "gray.50" : "white"}
            opacity={isDisabled ? 0.6 : 1}
            cursor={isDisabled ? "not-allowed" : "default"}
        >
            {tags.map((tag, index) => (
                <Tag
                    key={index}
                    size="md"
                    borderRadius="full"
                    colorScheme="blue"
                >
                    <TagLabel>{tag}</TagLabel>
                    <TagCloseButton onClick={() => removeTag(index)} isDisabled={isDisabled} />
                </Tag>
            ))}

            <Input
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? placeholder || 'Type and press Enter' : ''}
                variant="unstyled"
                minW="120px"
                flex="1"
                isDisabled={isDisabled}
            />
        </Box>
    );
};

export default TagInput;
