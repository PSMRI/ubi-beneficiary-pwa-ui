import { Box, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@chakra-ui/react";
import Layout from '../../components/common/layout/Layout';
import { Theme as ChakraTheme } from "@rjsf/chakra-ui";
import { withTheme } from "@rjsf/core";
import { SubmitButtonProps, getSubmitButtonOptions } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { JSONSchema7 } from "json-schema";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import  CommonButton from "../../components/common/button/SubmitButton";
import Button from "../../components/common/button/Button";
import Loading from "../../components/common/Loading";
import FormAccessibilityProvider from "../../components/common/form/FormAccessibilityProvider";
import CommonDialogue from "../../components/common/Dialogue";
import { submitForm, confirmApplication, createApplication } from "../../services/benefit/benefits";
import {
  convertApplicationFormFields,
  convertDocumentFields,
  extractUserDataForSchema,
  getDocumentFieldNames,
  getPersonalFieldNames,
  isFileUploadField,
  extractDocumentSubtype,
  extractDocumentMetadataFromSelection,
} from "./ConvertToRJSF";

// Interface for VC document structure
interface VCDocument {
  document_submission_reason: string;
  document_type: string;
  document_subtype: string;
  document_format: string;
  document_imported_from: string;
  document_content: string;
}

// Interface for file upload structure
interface FileUpload {
  [fieldName: string]: string;
}

// Interface for form submission data structure
interface FormSubmissionData {
  [key: string]: unknown;
  files?: FileUpload[];
  vc_documents?: VCDocument[];
  benefitId: string;
  providerId?: string;
}
interface DocumentMetadata {
  doc_data: string;
  doc_datatype: string;
  doc_id: string;
  doc_name: string;
  doc_path: string;
  doc_subtype: string;
  doc_type: string;
  doc_verified: boolean;
  imported_from: string;
  is_uploaded: boolean;
  uploaded_at: string;
  user_id: string;
}

const Form = withTheme(ChakraTheme);
const SubmitButton: React.FC<SubmitButtonProps> = (props) => {
  const { uiSchema } = props;
  const { norender } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }
  return <button type="submit" style={{ display: "none" }}></button>;
};

interface EligibilityItem {
  value: string;
  descriptor?: {
    code?: string;
    name?: string;
    short_desc?: string;
  };
  display?: boolean;
}

interface BenefitApplicationFormProps {
  selectApiResponse: any;
  userData: any;
  benefitId: string | undefined;
  bppId: string | undefined;
  context: any;
  isResubmit?: boolean;
}

const BenefitApplicationForm: React.FC<BenefitApplicationFormProps> = ({ selectApiResponse, userData, benefitId, bppId, context, isResubmit = false }) => {
  // State variables for form schema, data, refs, etc.
  const [formSchema, setFormSchema] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const formRef = useRef<any>(null);
  const [docSchema, setDocSchema] = useState<any>(null);
  const [extraErrors, setExtraErrors] = useState<any>(null);
  const [disableSubmit, setDisableSubmit] = useState(false);
  const [uiSchema, setUiSchema] = useState({});
  const [reviewerComment, setReviewerComment] = useState<string | null>(null);
  const [documentFieldNames, setDocumentFieldNames] = useState<string[]>([]);
  const [docsArray, setDocsArray] = useState<DocumentMetadata[]>([]);
  const [error, setError] = useState<string>('');
  const [submitDialouge, setSubmitDialouge] = useState<boolean | object>(false);
  const [item, setItem] = useState<any>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Helper function to group form fields by fieldsGroupName
  const groupFieldsByGroup = (benefit: any) => {
    const groups: Record<string, { label: string; fields: any[] }> = {};

    benefit.forEach((field: any) => {
      const groupName = field.fieldsGroupName || "default";
      const groupLabel = field.fieldsGroupLabel || "Form Fields";

      if (!groups[groupName]) {
        groups[groupName] = {
          label: groupLabel,
          fields: [],
        };
      }

      groups[groupName].fields.push(field);
    });

    return groups;
  };

  useEffect(() => {
    // Process selectApiResponse and userData from props
    if (!selectApiResponse) return;

    // Extract context and item from the select API response
    const itemData = selectApiResponse?.data?.responses?.[0]?.message?.catalog?.providers?.[0]?.items?.[0];
    if (!itemData) return;

    setItem(itemData);

    const schemaTag = itemData.tags?.find((tag: any) => tag?.descriptor?.code === "applicationForm");
    const documentTag = itemData.tags?.find((tag: any) => tag?.descriptor?.code === "required-docs");
    const eligibilityTag = itemData.tags?.find((tag: any) => tag?.descriptor?.code === "eligibility");

    // Parse application form fields
    const parsedValues = schemaTag?.list?.map((item: EligibilityItem) => JSON.parse(item.value)) || [];

    // Reviewer comment and docs array from userData
    if (userData?.remark) {
      setReviewerComment(userData.remark);
    }
    if (userData?.docs && Array.isArray(userData.docs)) {
      setDocsArray(userData.docs);
    }

    // Helper to process schema and set form data
    const getApplicationSchemaData = (
      receivedData: any,
      benefit: any,
      documentTag: any,
      eligibilityTag: any
    ) => {
      if (benefit) {
        const groupedFields = groupFieldsByGroup(benefit);
        const applicationFormSchema = convertApplicationFormFields(groupedFields);
        const prop = applicationFormSchema?.properties;
        Object.keys(prop).forEach((item: string) => {
          if (receivedData?.[item] && receivedData?.[item] !== "") {
            prop[item] = {
              ...prop[item],
            };
          }
        });
        const userDataFields = extractUserDataForSchema(receivedData, prop);
        setFormData(userDataFields);
        getEligibilitySchemaData(receivedData, documentTag, eligibilityTag, {
          ...applicationFormSchema,
          properties: prop,
        });
      }
    };

    getApplicationSchemaData(userData, parsedValues, documentTag, eligibilityTag);
  }, [selectApiResponse, userData]);

  // Process eligibility and document schema, merge with application schema
  const getEligibilitySchemaData = (
    formData: any,
    documentTag: any,
    eligibilityTag: any,
    applicationFormSchema: any
  ) => {
    // Parse eligibility and document schema arrays
    const eligSchemaStatic = eligibilityTag?.list?.map((item: EligibilityItem) =>
      JSON.parse(item.value)
    ) ?? []
    const docSchemaStatic =
      documentTag?.list
        ?.filter(
          (item: any) =>
            item?.descriptor?.code === "mandatory-doc" ||
            item?.descriptor?.code === "optional-doc"
        )
        ?.map((item: any) => JSON.parse(item.value)) ?? [];

    const docSchemaArr = [...eligSchemaStatic, ...docSchemaStatic];

    // Convert eligibility and document fields to RJSF schema
    const docSchemaData = convertDocumentFields(docSchemaArr, formData?.docs);

    setDocSchema(docSchemaData);

    // Merge application and document schemas
    const properties = {
      ...(applicationFormSchema?.properties ?? {}),
      ...(docSchemaData?.properties || {}),
    };

    // Extract document field names for later classification
    const extractedDocFieldNames = getDocumentFieldNames(docSchemaData);
    setDocumentFieldNames(extractedDocFieldNames);

    // Collect required fields
    const required = Object.keys(properties).filter((key) => {
      const isRequired = properties[key].required;
      if (isRequired !== undefined) {
        delete properties[key].required;
      }
      return isRequired;
    });
    // Build the final schema
    const allSchema = {
      ...applicationFormSchema,
      required,
      properties,
    };

    setFormSchema(allSchema);

    // --- CONSOLIDATED FIELDSET GROUPING ---
    const appFieldNames = Object.keys(applicationFormSchema?.properties ?? {});
    const docSchemaFieldNames = Object.keys(docSchemaData?.properties ?? {});
    const allFieldNames = [...appFieldNames, ...docSchemaFieldNames];

    // Consolidate all field groups to avoid nesting conflicts
    const consolidatedFieldGroups: Record<
      string,
      { label: string; fields: string[] }
    > = {};
    const ungroupedFields: string[] = [];

    allFieldNames.forEach((fieldName) => {
      const fieldSchema = allSchema.properties[fieldName];

      // Check if field has grouping metadata from schema
      if (fieldSchema?.fieldGroup) {
        const groupName = fieldSchema.fieldGroup.groupName;
        const groupLabel = fieldSchema.fieldGroup.groupLabel;

        if (!consolidatedFieldGroups[groupName]) {
          consolidatedFieldGroups[groupName] = {
            label: groupLabel,
            fields: [],
          };
        }
        consolidatedFieldGroups[groupName].fields.push(fieldName);
      } else {
        // Fields without explicit grouping go to ungrouped
        ungroupedFields.push(fieldName);
      }
    });

    // Create logical field ordering: personal fields first, then documents
    let uiOrder: string[] = [];

    // Step 1: Add personal information groups (non-document groups)
    const personalGroups = Object.keys(consolidatedFieldGroups).filter(
      (groupName) => groupName !== "documents"
    );

    personalGroups.forEach((groupName) => {
      if (consolidatedFieldGroups[groupName]) {
        uiOrder = uiOrder.concat(consolidatedFieldGroups[groupName].fields);
      }
    });

    // Step 2: Add ungrouped personal fields
    const ungroupedPersonalFields = ungroupedFields.filter(
      (fieldName) => !extractedDocFieldNames.includes(fieldName)
    );
    uiOrder = uiOrder.concat(ungroupedPersonalFields);

    // Step 3: Add document groups (sorted by mandatory first, then optional)
    if (consolidatedFieldGroups["documents"]) {
      const documentFields = consolidatedFieldGroups["documents"].fields;

      // Sort documents: mandatory first, then optional
      const sortedDocumentFields = [...documentFields].sort((a, b) => {
        const fieldSchemaA = allSchema.properties[a];
        const fieldSchemaB = allSchema.properties[b];

        const isRequiredA =
          fieldSchemaA?.required || allSchema.required?.includes(a) || false;
        const isRequiredB =
          fieldSchemaB?.required || allSchema.required?.includes(b) || false;

        // Mandatory documents first (true comes before false when sorted in descending order)
        if (isRequiredA !== isRequiredB) {
          return isRequiredB ? 1 : -1; // Required fields come first
        }

        // If both have same required status, maintain original order
        return documentFields.indexOf(a) - documentFields.indexOf(b);
      });

      // Update the consolidated group with sorted fields
      consolidatedFieldGroups["documents"].fields = sortedDocumentFields;
      uiOrder = uiOrder.concat(sortedDocumentFields);
    }

    // Step 4: Add any remaining ungrouped document fields (excluding already grouped ones)
    const groupedDocFields = consolidatedFieldGroups["documents"]?.fields || [];
    const ungroupedDocFields = ungroupedFields.filter(
      (fieldName) =>
        extractedDocFieldNames.includes(fieldName) &&
        !groupedDocFields.includes(fieldName)
    );
    uiOrder = uiOrder.concat(ungroupedDocFields);

    // Remove duplicates from uiOrder
    const uniqueUiOrder = Array.from(new Set(uiOrder));

    // Build the uiSchema with proper fieldset configuration
    const uiSchema: any = {
      "ui:order": uniqueUiOrder,
    };

    // Add fieldset configuration only for grouped fields
    Object.entries(consolidatedFieldGroups).forEach(([groupName, group]) => {
      // For documents group, fields are already sorted by mandatory/optional
      // For other groups, sort by UI order
      let orderedFields;
      if (groupName === "documents") {
        orderedFields = group.fields; // Already sorted by mandatory first, then optional
      } else {
        orderedFields = [...group.fields].sort((a, b) => {
          const indexA = uniqueUiOrder.indexOf(a);
          const indexB = uniqueUiOrder.indexOf(b);
          return indexA - indexB;
        });
      }

      orderedFields.forEach((fieldName, index) => {
        uiSchema[fieldName] = {
          ...uiSchema[fieldName],
          "ui:group": groupName,
          "ui:groupLabel": group.label,
          "ui:groupFirst": index === 0, // Mark first field in group
        };
      });

      // Update the group fields with the ordered version
      consolidatedFieldGroups[groupName].fields = orderedFields;
    });

    // Fallback: Ensure at least one field in each group has groupFirst: true
    Object.keys(consolidatedFieldGroups).forEach((groupName) => {
      const groupFields = consolidatedFieldGroups[groupName].fields;
      const hasGroupFirst = groupFields.some(
        (fieldName) => uiSchema[fieldName]?.["ui:groupFirst"] === true
      );

      if (!hasGroupFirst && groupFields.length > 0) {
        const firstField = groupFields[0];
        uiSchema[firstField] = {
          ...uiSchema[firstField],
          "ui:groupFirst": true,
        };
      }
    });

    setUiSchema(uiSchema);
    // --- END CONSOLIDATED GROUPING ---
  };

  // Helper function to create VC document with actual document type and issuer from selection
  const createVCDocument = (
    fieldName: string,
    encodedContent: string,
    fieldSchema: any
  ): VCDocument => {
    const vcMeta = fieldSchema?.vcMeta;
    const formValue = (formData as any)[fieldName];

    // Extract complete document metadata from the selected document
    const { documentType, documentIssuer } =
      extractDocumentMetadataFromSelection(formValue, docsArray);
    const documentSubtype = extractDocumentSubtype(formValue, fieldSchema);

    return {
      document_submission_reason: JSON.stringify(
        vcMeta?.submissionReasons || [fieldName]
      ),
      document_type: documentType, // Real doc_type from selected document
      document_subtype: documentSubtype,
      document_format: vcMeta?.format || "json",
      document_imported_from: documentIssuer, // Real imported_from from selected document
      document_content: encodedContent,
    };
  };

  // Handle form data change
  const handleChange = ({ formData }: any) => {
    setFormData(formData);
  };

  // Enhanced form submit handler with structured output
  const handleFormSubmit = async () => {
    setDisableSubmit(true);

    try {
      const formDataNew: FormSubmissionData = { benefitId, providerId: bppId };
      const allFieldNames = Object.keys(formData);
      const systemFields = ["benefitId", "docs", "orderId"];

      // Get personal field names (non-document, non-system fields)
      const personalFieldNames = getPersonalFieldNames(
        allFieldNames,
        documentFieldNames,
        systemFields
      );

      // Extract personal information
      personalFieldNames.forEach((fieldName) => {
        const value = (formData as any)[fieldName];
        if (value !== undefined && value !== null) {
          formDataNew[fieldName] = value;
        }
      });

      // Process document fields
      const files: FileUpload[] = [];
      const vcDocuments: VCDocument[] = [];

      documentFieldNames.forEach((fieldName) => {
        const fieldValue = (formData as any)[fieldName];
        if (!fieldValue) {
          return;
        }

        const fieldSchema = formSchema?.properties?.[fieldName];
        const encodedContent = encodeToBase64(fieldValue);

        // Determine if this is a file upload or VC document based on field pattern and metadata
        const isFileUpload =
          fieldSchema?.vcMeta?.isFileUpload || isFileUploadField(fieldName);

        if (isFileUpload) {
          // Add to files array
          files.push({ [fieldName]: encodedContent });
        } else {
          // Create VC document with metadata, actual document type and issuer
          const vcDocument = createVCDocument(
            fieldName,
            encodedContent,
            fieldSchema
          );
          vcDocuments.push(vcDocument);
        }
      });

      // Add arrays to submission data only if they have content
      if (files.length > 0) {
        formDataNew.files = files;
      }

      if (vcDocuments.length > 0) {
        formDataNew.vc_documents = vcDocuments;
      }
      if (formData?.orderId) {
        formDataNew.orderId = formData.orderId;
      }
     
      // Mark form data as resubmission for existing applications
      if (isResubmit) {
        formDataNew.isResubmission = true;
      }

      // Submit the form
      const response = await submitForm(formDataNew, context);
      if (response) {
        // Create confirmation payload - extract applicationId from init and update response structure
        const applicationId = response?.responses?.[0]?.message?.order?.items?.[0]?.applicationId;
        
        if (!applicationId) {
          console.error('Application ID not found in response. Status:', response?.status || 'unknown');
          setError(t('DETAILS_APPLICATION_ID_NOT_FOUND'));
          return;
        }
        
        const confirmPayload = {
          item_id: applicationId,
          rawContext: context,
        };

        // Call confirmApplication
        const result = await confirmApplication(confirmPayload);
        const orderId = (
          result as {
            data: {
              responses: { message: { order: { id: string } } }[];
            };
          }
        )?.data?.responses?.[0]?.message?.order?.id;

        if (orderId) {
          if (isResubmit) {
            // Resubmission completed successfully, no additional action needed
          } else {
            // For new applications, create the application record
            const payloadCreateApp = {
              user_id: userData?.user_id,
              benefit_id: benefitId,
              benefit_provider_id: context?.bpp_id,
              benefit_provider_uri: context?.bpp_uri,
              external_application_id: orderId,
              application_name: item?.descriptor?.name,
              status: 'application pending',
              application_data: formDataNew,
            };

            await createApplication(payloadCreateApp);
          }
          
          setSubmitDialouge({ 
            orderId, 
            name: item?.descriptor?.name,
            isResubmit 
          });
        } else {
          setError(t('DETAILS_APPLICATION_CREATE_ERROR'));
        }
      }
    } catch (error) {
      console.error("Form submission error:", error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof Error) {
        setError(`${t('DETAILS_ERROR_MODAL_TITLE')}: ${error.message}`);
      } else {
        setError(t('DETAILS_GENERAL_ERROR'));
      }
    } finally {
      setDisableSubmit(false);
    }
  };

  // Show loading spinner if schema is not ready
  if (!formSchema) {
    return <Loading />;
  }

  const getMarginTop = () => {
    return reviewerComment?.trim() ? "25%" : "0";
  };

  // Render the form with common header and layout
  // Get benefit name for header
  const benefitName = item?.descriptor?.name || t('DETAILS_APPLICATION_FORM_TITLE');

  return (
    <Layout
      _heading={{ heading: benefitName }}
      isMenu={Boolean(localStorage.getItem('authToken'))}
    >
      <Box p={4} mt={getMarginTop()}>
        {reviewerComment?.trim() && (
          <>
            {/* Backdrop to hide background content */}
            <Box
              position="fixed"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bgColor="rgba(255, 255, 255, 0.6)" // semi-transparent white
              backdropFilter="blur(10px)" // apply blur to what's behind
              zIndex={9}
              height={"18%"}
              mb={"10%"}
            />

            {/* Fixed Reviewer Comment Box */}
            <Box
              position="fixed"
              top={0}
              left={0}
              right={0}
              zIndex={10}
              bg="orange.50"
              border="1px"
              borderColor="orange.300"
              p={4}
              borderRadius="md"
              mx={4}
              mt={4}
            >
              <Text as="p" fontWeight="bold" color="orange.800">
                Reviewer Comment:
              </Text>
              <Text as="p" mt={2} color="orange.700">
                {reviewerComment}
              </Text>
            </Box>
          </>
        )}

        <FormAccessibilityProvider
          formRef={formRef}
          uiSchema={uiSchema}
          formSchema={formSchema}
        >
          <Form
            ref={formRef}
            showErrorList={false}
            focusOnFirstError
            noHtml5Validate
            schema={formSchema as JSONSchema7}
            validator={validator}
            formData={formData}
            onChange={handleChange}
            onSubmit={handleFormSubmit}
            templates={{ ButtonTemplates: { SubmitButton } }}
            extraErrors={extraErrors}
            uiSchema={uiSchema}
          />
        </FormAccessibilityProvider>
        <CommonButton
          label="Submit Form"
          isDisabled={disableSubmit}
          onClick={() => {
            const error: any = {};
            Object.keys(docSchema?.properties ?? {}).forEach((e: any) => {
              const field = docSchema?.properties[e];
              if (field?.enum && field.enum.length === 0) {
                error[e] = {
                  __errors: [`${e} does not have a document`],
                };
              }
            });
            if (Object.keys(error).length > 0) {
              setExtraErrors(error);
            } else if (formRef.current?.validateForm()) {
              formRef?.current?.submit();
            }
          }}
        />
        {/* Error Modal */}
        {error && (
          <Modal isOpen={true} onClose={() => setError('')}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>{t('DETAILS_ERROR_MODAL_TITLE')}</ModalHeader>
              <ModalBody>
                <Text>{error}</Text>
              </ModalBody>
              <ModalFooter>
                <Button
                  onClick={() => setError('')}
                  label={t('DETAILS_CLOSE_BUTTON')}
                />
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
        {/* Submit Success Dialog */}
        <CommonDialogue
          isOpen={submitDialouge}
          onClose={() => {
            setSubmitDialouge(false);
            navigate('/applicationstatus');
          }}
          handleDialog={() => {
            setSubmitDialouge(false);
            navigate('/applicationstatus');
          }}
        />
      </Box>
    </Layout>
  );
};

export default BenefitApplicationForm;

function encodeToBase64(str: string) {
  try {
      const utf8 = new TextEncoder().encode(str);
      let binary = "";
      utf8.forEach((byte) => {
      binary += String.fromCharCode(byte);
      });
      return `base64,${btoa(binary)}`;
  } catch (error) {
      console.error("Failed to encode string to base64:", error);
      throw new Error("Failed to encode string to base64");
  }
}
