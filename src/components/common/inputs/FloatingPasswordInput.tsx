import {
  Box,
  FormControl,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Icon,
  BoxProps,
  FormErrorMessage,
  Stack,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";

interface FloatingSelectProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isInvalid?: boolean;
  errorMessage?: string;
  name: string;
}

const FloatingPasswordInput: React.FC<FloatingSelectProps> = ({
  label,
  value,
  onChange,
  isInvalid = false,
  errorMessage,
  name,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [show, setShow] = useState(false); // State for showing/hiding password
  const [touched, setTouched] = useState(false);
  const handleClick = () => setShow(!show); // Toggle show/hide

  // Common styles for the label
  const labelStyles: BoxProps = {
    position: "absolute",
    left: "12px",
    bg: "white",
    px: 1,
    zIndex: 100,
    transition: "all 0.2s ease-out",
    pointerEvents: "none",
    top: isFocused ? "-10px" : "40%",
    color: isFocused ? "blue.500" : "gray.500",
    fontSize: isFocused ? "0.85rem" : "1rem",
    transform: isFocused ? "scale(0.85)" : "translateY(-50%)",
  };

  return (
    <FormControl
      height="80px"
      position="relative"
      mt={2}
      isInvalid={isInvalid && touched}
    >
      <Box as="label" htmlFor="password" {...labelStyles}>
        {label}
      </Box>
      <InputGroup size="md">
        <Input
          id="password"
          name={name}
          placeholder={isFocused ? "" : label}
          type={show ? "text" : "password"} // Toggle between text and password
          onFocus={() => {
            setIsFocused(true);
            setTouched(true);
          }}
          onBlur={() => {
            setIsFocused(value !== "");
          }}
          value={value}
          onChange={onChange}
          size="md"
          height="60px"
          pl="12px"
          borderColor="gray.300"
          borderWidth="2px"
          _focus={{
            borderColor: "blue.500",
          }}
        />
        <InputRightElement
          width="4.5rem"
          top="50%"
          transform="translateY(-50%)"
        >
          <Button h="1.75rem" size="sm" onClick={handleClick}>
            {show ? <Icon as={ViewOffIcon} /> : <Icon as={ViewIcon} />}
          </Button>
        </InputRightElement>
      </InputGroup>
      {isInvalid && touched && (
        <Box mt={1} sx={{ mb: 2 }}>
          <FormErrorMessage>
            {errorMessage || "This field is required."}
          </FormErrorMessage>
        </Box>
      )}
    </FormControl>
  );
};

export default FloatingPasswordInput;
