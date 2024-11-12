import * as React from "react";
import {
  VStack,
  Text,
  Spinner,
  Icon,
  HStack,
  useTheme,
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import Loader from "./common/Loader";

interface StatusIconProps {
  status: boolean;
  size?: number;
  "aria-label"?: string;
}

const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  size = 5,
  "aria-label": ariaLabel,
}) => {
  const theme = useTheme();
  return (
    <Icon
      as={status ? CheckCircleIcon : CheckCircleIcon}
      color={status ? theme.colors.success : theme.colors.success} // Use theme tokens
      boxSize={size}
      aria-label={
        ariaLabel || `Document status: ${status ? "Available" : "Available"}`
      }
    />
  );
};

const DocumentList: React.FC = ({ documents }) => {
  const theme = useTheme();
  return documents && documents.length > 0 ? (
    <VStack
      align="stretch"
      backgroundColor={theme.colors.background}
      padding={0}
      spacing={0}
    >
      {documents.map((document) => (
        <HStack
          key={document.name}
          borderBottomWidth="1px"
          borderBottomColor={theme.colors.border} // Use theme token for border
          paddingY={3}
          alignItems="center"
          spacing={3}
          height={61}
          width="100%"
          pl={2}
        >
          <StatusIcon status={document.status} />
          <Text fontSize="16px" fontWeight="400" color={theme.colors.text}>
            {" "}
            {document.name}
          </Text>
        </HStack>
      ))}
    </VStack>
  ) : (
    <Loader />
  );
};

export default DocumentList;
