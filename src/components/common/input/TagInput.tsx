import React, { useState } from 'react';
import {
    Box,
    Input,
    Wrap,
    WrapItem,
    Tag,
    TagLabel,
    TagCloseButton,
    useToast,
} from '@chakra-ui/react';

interface TagInputProps {
    tags: string[];
    onTagsChange: (newTags: string[]) => void;
    placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({
    tags,
    onTagsChange,
    placeholder,
}) => {
    const [inputValue, setInputValue] = useState('');
    const toast = useToast();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmedInput = inputValue.trim();
            if (!trimmedInput) return;

            if (tags.includes(trimmedInput)) {
                toast({
                    title: 'Duplicate Keyword',
                    description: 'This keyword already exists.',
                    status: 'warning',
                    duration: 2000,
                });
                return;
            }

            onTagsChange([...tags, trimmedInput]);
            setInputValue('');
        }
    };

    const removeTag = (indexToRemove: number) => {
        onTagsChange(tags.filter((_, index) => index !== indexToRemove));
    };

    return (
        <Box
            border="2px solid"
            borderColor="gray.200"
            borderRadius="md"
            p={2}
            display="flex"
            flexWrap="wrap"
            alignItems="center"
            gap={2}
            _focusWithin={{
                borderColor: 'blue.400',
                boxShadow: '0 0 0 2px #06164B33',
            }}
            bg="white"
        >
            {tags.map((tag, index) => (
                <Tag
                    key={index}
                    size="md"
                    borderRadius="full"
                    colorScheme="blue"
                >
                    <TagLabel>{tag}</TagLabel>
                    <TagCloseButton onClick={() => removeTag(index)} />
                </Tag>
            ))}

            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? placeholder || 'Type and press Enter' : ''}
                variant="unstyled"
                minW="120px"
                flex="1"
            />
        </Box>
    );
};

export default TagInput;
