import React, { useContext, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Flex,
  HStack,
  // IconButton,
  Text,
  // Tooltip,
  VStack,
} from "@chakra-ui/react";

import { getUser, getDocumentsList } from "../services/auth/auth";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/layout/Layout";
import { AuthContext } from "../utils/context/checkToken";
import DocumentList from "../components/DocumentList";

import ProgressBar from "../components/common/ProgressBar";
import UserDetails from "../components/common/UserDetails";

import UploadDocumentEwallet from "../components/common/UploadDocumentEwallet";
import CommonButton from "../components/common/button/Button";
// import { EditIcon } from "@chakra-ui/icons";

const UserProfile: React.FC = () => {
  const [showIframe, setShowIframe] = useState(true);
  const { userData, documents, updateUserData } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-2);
  };
  // Function to fetch user data and documents
  const init = async () => {
    try {
      const result = await getUser();
      const data = await getDocumentsList();
      updateUserData(result?.data, data?.data);
    } catch (error) {
      console.error("Error fetching user data or documents:", error);
    }
  };

  useEffect(() => {
    if (!userData || !documents || documents.length === 0) {
      init();
    }
  }, [userData, documents]);

  return (
    <Layout
      _heading={{
        heading: "My Profile",
        handleBack: () => {
          handleBack();
        },
      }}
    >
      <HStack m={5} mt={0} p={0} h={82}>
        <Avatar
          variant="solid"
          name={`${userData?.firstName || ""} ${userData?.lastName || ""}`}
          mr={2}
        />
        <VStack mt={8}>
          <Text
            fontSize="16px"
            fontWeight="500"
            lineHeight="24px"
            color="#433E3F"
            textAlign={"start"}
          >
            {userData?.firstName || ""} {userData?.lastName || ""}
          </Text>
          <Text
            fontSize="11px"
            fontWeight="500"
            lineHeight="24px"
            color="#433E3F"
            alignSelf={"flex-start"}
          >
            +91 {userData?.phoneNumber || "Phone No"}
          </Text>
        </VStack>
      </HStack>

      <Box shadow="md" borderWidth="1px" borderRadius="md" p={2}>
        <ProgressBar
          totalDocuments={10}
          presentDocuments={userData?.docs?.length}
        />
        <Flex alignItems="center" justifyContent="space-between" mt={3} ml={4}>
          <Text
            fontSize="16px"
            fontWeight="500"
            lineHeight="24px"
            color="#433E3F"
            mr={2} // Adds spacing between Text and IconButton
          >
            Basic Details
          </Text>
          {/* <Tooltip label="Edit" aria-label="Edit tooltip">
            <IconButton
              icon={<EditIcon />}
              variant="ghost"
              aria-label="Edit"
              _hover={{ bg: "transparent" }}
              onClick={() => navigate("/editProfile")}
            />
          </Tooltip> */}
        </Flex>

        <UserDetails userData={{ ...userData }} />
        <Box
          p={5}
          shadow="md"
          borderWidth="1px"
          borderRadius="md"
          className="card-scroll invisible_scroll"
        >
          <VStack spacing={4} align="stretch">
            <DocumentList documents={documents} userData={userData?.docs} />
            {showIframe ? (
              <UploadDocumentEwallet userId={userData?.user_id} />
            ) : (
              <CommonButton
                onClick={() => setShowIframe(true)}
                label="Upload  Document"
              />
            )}
          </VStack>
        </Box>
      </Box>
    </Layout>
  );
};

export default UserProfile;
