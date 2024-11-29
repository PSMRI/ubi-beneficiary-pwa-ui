import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  UnorderedList,
  ListItem,
  useDisclosure,
  HStack,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import "../../assets/styles/App.css";
import { useNavigate, useParams } from "react-router-dom";
import CommonButton from "../../components/common/button/Button";
import Layout from "../../components/common/layout/Layout";
import { getUser } from "../../services/auth/auth";
import {
  applyApplication,
  confirmApplication,
  createApplication,
  getApplication,
  getOne,
} from "../../services/benefit/benefits";
import { MdCurrencyRupee } from "react-icons/md";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import WebViewFormSubmitWithRedirect from "../../components/WebView";
import SubmitDialog from "../../components/SubmitDialog";
import { useTranslation } from "react-i18next";

// Define types for benefit item and user
interface BenefitItem {
  descriptor?: {
    name?: string;
    long_desc?: string;
  };
  price?: {
    value?: number;
    currency?: string;
  };
  document?: string[];
  tags?: Array<{
    descriptor?: { code?: string; short_desc: string };
    list?: Array<{ value?: string }>;
  }>;
}

interface AuthUser {
  user_id?: string;
  name?: string;
  class?: string;
  previousYearMarks?: string;
  phoneNumber?: string;
  username: string;
  email: string;
}

interface WebFormProps {
  url?: string;
  formData?: AuthUser;
}
interface Context {
  bpp_id?: string;
  bap_uri?: string;
  // Add other fields as necessary
}

const BenefitsDetails: React.FC = () => {
  const { isOpen, onClose } = useDisclosure();
  const [context, setContext] = useState<Context | null>(null);
  const [item, setItem] = useState<BenefitItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isApplied, setIsApplied] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [webFormProp, setWebFormProp] = useState<WebFormProps>({});
  const [confirmationConsent, setConfirmationConsent] =
    useState<unknown>(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const handleConfirmation = async () => {
    setLoading(true);

    try {
      const result = await applyApplication({ id, context });
      const url = (result as { data: { responses: Array<any> } }).data
        ?.responses?.[0]?.message?.order?.items?.[0]?.xinput?.form?.url;
      const formData = authUser ?? undefined; // Ensure authUser is used or fallback to undefined

      // Only set WebFormProps if the url exists
      if (url) {
        setWebFormProp({
          url,
          formData,
        });
      } else {
        setError("URL not found in response");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Failed to apply application: ${error.message}`);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitConfirm = async (submission_id: string) => {
    setLoading(true);
    try {
      const result = await confirmApplication({
        submission_id,
        item_id: id,
        context: context ?? {},
      });
      const orderId = (
        result as {
          data: { responses: { message: { order: { id: string } } }[] };
        }
      )?.data?.responses?.[0]?.message?.order?.id;

      //  const orderId = result?.data?.responses?.[0]?.message?.order?.id;
      if (orderId) {
        const payload = {
          user_id: authUser?.user_id,
          benefit_id: id,
          benefit_provider_id: context?.bpp_id,
          benefit_provider_uri: context?.bap_uri,
          external_application_id: orderId,
          application_name: item?.descriptor?.name,
          status: "submitted",
          application_data: authUser,
        };
        await createApplication(payload);
        setWebFormProp({});
        onClose();
        setConfirmationConsent({ orderId, name: item?.descriptor?.name });
      } else {
        setError("Error while creating application. Please try again later");
      }
    } catch (e: unknown) {
      setError(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const user = await getUser();

        const result = await getOne({ id });
        const resultItem =
          (result as { data: { responses: Array<any> } }).data?.responses?.[0]
            ?.message?.order?.items?.[0] || {};
        setContext(
          (result as { data: { responses: Array<any> } }).data?.responses?.[0]
            ?.context as Context
        );

        const docs =
          resultItem?.tags
            ?.find(
              (e: { descriptor: { code: string } }) =>
                e?.descriptor?.code === "required-docs"
            )
            ?.list?.filter((e: { value: unknown }) => e.value)
            .map((e: { value: unknown }) => e.value) || [];

        if (mounted) {
          setItem({ ...resultItem, document: docs });

          const formData: AuthUser = {
            ...(user?.data || {}),
            class: user?.data?.class || "",
            marks_previous_class: user?.data?.previousYearMarks || "",
            phoneNumber: user?.data?.phoneNumber || "",
          };
          setAuthUser(formData);

          const appResult = await getApplication({
            user_id: formData.user_id,
            benefit_id: id,
          });

          if (appResult?.data?.applications?.length > 0) {
            setIsApplied(true);
          }
          setLoading(false);
        }
      } catch (e: unknown) {
        if (mounted) {
          if (e instanceof Error) {
            setError(`Error: ${e.message}`);
          } else {
            setError("An unexpected error occurred");
          }
        }
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <Layout loading={true} />;
  }

  if (error) {
    return (
      <Modal isOpen={true} onClose={() => setError("")}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Error</ModalHeader>
          <ModalBody>
            <Text>{error}</Text>
          </ModalBody>
          <ModalFooter>
            <CommonButton onClick={() => setError("")} label="Close" />
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  if (webFormProp?.url && webFormProp?.formData) {
    return (
      <WebViewFormSubmitWithRedirect
        {...webFormProp}
        setPageContent={submitConfirm}
      />
    );
  }

  return (
    <Layout _heading={{ heading: item?.descriptor?.name || "", handleBack }}>
      <Box className="card-scroll invisible_scroll">
        <Box maxW="2xl" m={4}>
          <Heading size="md" color="#484848" fontWeight={500}>
            {t("BENEFIT_DETAILS_HEADING_TITLE")}
          </Heading>
          <HStack mt={2}>
            <Icon as={MdCurrencyRupee} boxSize={5} color="#484848" />
            <Text>{item?.price?.value}</Text>
            {/* <Text>{item?.price?.currency}</Text> */}
          </HStack>
          <Heading size="md" mt={6} color="#484848" fontWeight={500}>
            {t("BENEFIT_DETAILS_HEADING_DETAILS")}
          </Heading>

          {item?.descriptor?.long_desc !== "" && (
            <Text mt={4}>{item?.descriptor?.long_desc}</Text>
          )}

          <Heading size="md" mt={6} color="#484848" fontWeight={500}>
            {t("BENEFIT_DETAILS_KEYPOINT_DETAILS")}
          </Heading>
          <UnorderedList mt={4}>
            {item?.tags
              ?.filter((tag) =>
                [
                  "educational-eligibility",
                  "personal-eligibility",
                  "economical-eligibility",
                  "geographical-eligibility",
                ].includes(tag.descriptor?.code)
              )
              .map((tag, index) => (
                <ListItem key={tag?.descriptor?.code}>
                  {tag.descriptor?.short_desc}
                </ListItem>
              ))}
          </UnorderedList>
          <Heading size="md" mt={6} color="#484848" fontWeight={500}>
            {t("BENEFIT_DETAILS_MANDATORY_DOCUMENTS")}
          </Heading>
          <UnorderedList mt={4}>
            {item?.document?.map((document) => (
              <ListItem key={document}>{document}</ListItem>
            ))}
          </UnorderedList>
          <CommonButton
            mt={6}
            onClick={handleConfirmation}
            label={
              isApplied
                ? t("BENEFIT_DETAILS_APPLICATION_SUBMITTED")
                : t("BENEFIT_DETAILS_PROCEED_TO_APPLY")
            }
            isDisabled={isApplied}
          />
        </Box>
      </Box>

      <ConfirmationDialog
        dialogVisible={isOpen}
        closeDialog={onClose}
        handleConfirmation={handleConfirmation}
        // documents={item?.document}
      />

      <SubmitDialog
        dialogVisible={
          confirmationConsent as { name?: string; orderId?: string }
        }
        closeSubmit={setConfirmationConsent}
      />
    </Layout>
  );
};

export default BenefitsDetails;
