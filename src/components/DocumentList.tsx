import * as React from "react";
import {
  VStack,
  Text,
  Icon,
  HStack,
  useTheme,
  Tooltip,
  IconButton,
  Box,
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import Loader from "./common/Loader";
import { findDocumentStatus } from "../utils/jsHelper/helper";
import { FaTrashAlt } from "react-icons/fa";
interface StatusIconProps {
  status: boolean;
  size?: number;
  "aria-label"?: string;
  userData: object;
}

const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  size = 5,
  "aria-label": ariaLabel,
  userData,
}) => {
  const result = findDocumentStatus(userData, status);
  return (
    <Icon
      as={result?.matchFound ? CheckCircleIcon : WarningIcon}
      color={result?.matchFound ? "#0B7B69" : "#EDA145"}
      boxSize={size}
      aria-label={
        ariaLabel || `Document status: ${status ? "Available" : "Incomplete"}`
      }
    />
  );
};
const DeleteDocument: React.FC<StatusIconProps> = ({ status, userData }) => {
  const result = findDocumentStatus(userData, status);

  if (result?.matchFound) {
    return (
      <Tooltip label="Delete" aria-label="Delete Tooltip">
        <IconButton
          icon={<FaTrashAlt />}
          aria-label="Delete"
          size="md"
          color={"grey"}
          onClick={() => handleDelete(result?.doc_id)}
        />
      </Tooltip>
    );
  }
};
const handleDelete = (doc_id) => {
  console.log("userData", doc_id);
};

interface Document {
  name: string;
  code: string;
}
interface UserDocument {
  doc_id: string;
  user_id: string;
  doc_type: string;
  doc_subtype: string;
  doc_name: string;
  imported_from: string;
  doc_path: string;
  doc_data: string; // You can parse this JSON string into an object when needed
  doc_datatype: string;
  doc_verified: boolean;
  uploaded_at: string;
  is_uploaded: boolean;
}
interface DocumentListProps {
  documents: Document[] | string[];
  userData: UserDocument;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, userData }) => {
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
          key={document.code}
          borderBottomWidth="1px"
          borderBottomColor={theme.colors.border}
          paddingY={3}
          alignItems="center"
          spacing={3}
          height={61}
          width="100%"
          pl={2}
        >
          {/* Default status to false if not provided */}
          <StatusIcon status={document.documentSubType} userData={userData} />
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width={"100%"}
          >
            <Text fontSize="16px" fontWeight="400" color={theme.colors.text}>
              {document.name}
            </Text>

            <DeleteDocument
              status={document.documentSubType}
              userData={userData}
            />
          </Box>
        </HStack>
      ))}
    </VStack>
  ) : (
    <Loader />
  );
};

export default DocumentList;
