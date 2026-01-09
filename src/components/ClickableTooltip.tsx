import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    useDisclosure,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';

interface ClickableTooltipProps {
    label: string;
    placement?: 'top' | 'right' | 'left' | 'bottom';
    fontSize?: string;
    zIndex?: number;
    children: React.ReactElement;
    scrollContainerRef?: React.RefObject<HTMLElement>;
    closeOnScroll?: boolean;
}

const ClickableTooltip: React.FC<ClickableTooltipProps> = ({
    label,
    placement,
    fontSize = 'sm',
    zIndex = 1100,
    children,
    scrollContainerRef,
    closeOnScroll = true,
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    /**
     * Close tooltip on scroll
     */
    useEffect(() => {
        const container = scrollContainerRef?.current || window;

        const handleScroll = () => {
            if (isOpen) {
                onClose();
            }
        };

        container.addEventListener('scroll', handleScroll, {
            passive: true,
        });

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [scrollContainerRef, isOpen, onClose]);
    const getArrowShadow = (placement: string) => {
        if (placement.startsWith('right')) {
            // should look like: <
            return '-1px 1px 0 0 #CBCBCB';
        }

        if (placement.startsWith('left')) {
            // should look like: >
            return '1px -1px 0 0 #CBCBCB';
        }

        if (placement.startsWith('top')) {
            // should look like: \/
            return '1px 1px 0 0 #CBCBCB';
        }

        if (placement.startsWith('bottom')) {
            // should look like: /\
            return '-1px -1px 0 0 #CBCBCB';
        }

        return '-1px 1px 0 0 #CBCBCB';
    };


    return (
        <Popover
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
            placement={placement}
            closeOnBlur={true}
            closeOnEsc={true}
            isLazy
        >
            <PopoverTrigger>
                {React.cloneElement(children, {
                    onClick: (e: React.MouseEvent) => {
                        e.stopPropagation();
                        onOpen();
                        // Call original onClick if it exists
                        if (children.props.onClick) {
                            children.props.onClick(e);
                        }
                    },
                })}
            </PopoverTrigger>

            <PopoverContent
                maxW="260px"
                fontSize={fontSize}
                bg="#DEDED1"
                _focus={{ boxShadow: 'none' }}
                zIndex={zIndex}
                overflow="visible"
            >
                <PopoverArrow
                    bg="#DEDED1"

                />
                <PopoverCloseButton />
                <PopoverBody color="gray.700" pt={6} fontWeight={400}>
                    {label}
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
};

export default ClickableTooltip;
