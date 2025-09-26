import React from "react";
import { Button } from "@chakra-ui/react";

interface CustomButton {
  onClick?: (event: React.FormEvent<HTMLFormElement>) => void;
  mt?: number;
  width?: string;
  label?: string;
  isDisabled?: boolean;
}

const SubmitButton: React.FC<CustomButton> = ({
  onClick,
  mt,
  width = "100%",
  label = "Submit",
  isDisabled = false,
}) => {
  return (
    <Button
      bgColor={"#3c5fdd"}
      color={"#fff"}
      type="submit"
      mt={mt}
      width={width}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
        onClick?.(event as unknown as React.FormEvent<HTMLFormElement>)
      }
      isDisabled={isDisabled}
    >
      {label}
    </Button>
  );
};

export default SubmitButton;
