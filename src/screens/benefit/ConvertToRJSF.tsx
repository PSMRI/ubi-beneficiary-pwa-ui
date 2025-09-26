import { JSONSchema7 } from "json-schema";

// Define the structure for application form fields
interface ApplicationFormField {
  type: string;
  name: string;
  label: string;
  required: boolean;
  options?: { value: string; label: string }[];
  multiple?: boolean;
}

// Define the structure for document objects
interface Doc {
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

// Define the structure for eligibility items
interface EligItem {
  allowedProofs: string[];
  criteria: { name: string };
  isRequired?: boolean;
}

// Add interface for required docs items
interface RequiredDoc {
  allowedProofs: string[];
  isRequired?: boolean;
  documentType: string; // Added to track document type
}

// Interface for VC document metadata
interface VCDocumentMeta {
  submissionReasons: string[];
  documentType: string;
  documentSubtype?: string;
  format: string;
  issuer: string;
  isFileUpload?: boolean;
}

// Convert application form fields to RJSF schema with fieldset support
export const convertApplicationFormFields = (
  groupedFields:
    | Record<string, { label: string; fields: ApplicationFormField[] }>
    | ApplicationFormField[]
) => {
  // Initialize the RJSF schema object
  const rjsfSchema: any = {
    title: "",
    type: "object",
    properties: {},
  };

  // Handle both grouped and flat field structures for backward compatibility
  if (Array.isArray(groupedFields)) {
    // Flat structure - process fields directly
    groupedFields.forEach((field) => {
      const fieldSchema = createFieldSchema(field);
      rjsfSchema.properties[field.name] = fieldSchema;
    });
  } else {
    // Grouped structure - process each group
    Object.entries(groupedFields).forEach(([groupName, groupData]) => {
      // Add group metadata to uiSchema for rendering fieldsets
      groupData.fields.forEach((field) => {
        const fieldSchema = createFieldSchema(field);
        // Add group metadata to field schema for UI rendering
        fieldSchema.fieldGroup = {
          groupName,
          groupLabel: groupData.label,
        };
        rjsfSchema.properties[field.name] = fieldSchema;
      });
    });
  }

  return rjsfSchema;
};

// Helper function to create individual field schema with enhanced validation
const createFieldSchema = (field: ApplicationFormField) => {
  // Build the schema for each field
  const fieldSchema: any = {
    type: "string",
    title: field.label,
  };

  // Enhanced validation patterns
  if (field.name === "bankAccountNumber") {
    fieldSchema.minLength = 9;
    fieldSchema.maxLength = 18;
    fieldSchema.pattern = "^[0-9]+$";
    fieldSchema.title =
      field.label || "Enter valid bank account number (9-18 digits)";
  } else if (field.name === "bankIfscCode") {
    fieldSchema.pattern = "^[A-Z]{4}0[A-Z0-9]{6}$";
    fieldSchema.title =
      field.label || "Enter valid IFSC code (e.g., SBIN0001234)";
  } else if (field.name === "email") {
    fieldSchema.pattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
    fieldSchema.title = field.label || "Enter valid email address";
  } else if (field.name === "phone" || field.name === "mobileNumber") {
    fieldSchema.pattern = "^\\+91[6-9]\\d{9}$";
    fieldSchema.title =
      field.label || "Enter valid phone number (+91XXXXXXXXXX)";
  } else if (field.name === "dateOfBirth") {
    fieldSchema.type = "string";
    fieldSchema.format = "date";
    fieldSchema.title = field.label || "Date of Birth";
  } else if (field.name === "panCard") {
    fieldSchema.pattern = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$";
    fieldSchema.title =
      field.label || "Enter valid PAN card (e.g., ABCDE1234F)";
  } else if (field.name === "aadharCard" || field.name === "uidai") {
    fieldSchema.pattern = "^[0-9]{12}$";
    fieldSchema.title = field.label || "Enter valid Aadhar number (12 digits)";
  } else if (field.name === "pincode" || field.name === "postalCode") {
    fieldSchema.pattern = "^[0-9]{6}$";
    fieldSchema.title = field.label || "Enter valid PIN code (6 digits)";
  }

  // Handle radio/select fields with options
  if (field.type === "radio" || field.type === "select") {
    fieldSchema.enum = field.options?.map((option) => option.value);
    fieldSchema.enumNames = field.options?.map((option) => option.label);
  }

  // Mark field as required if applicable
  if (field.required) {
    fieldSchema.required = true;
  }

  return fieldSchema;
};

// Helper function to determine if a field is a file upload based on patterns
export const isFileUploadField = (fieldName: string): boolean => {
  const fileUploadPatterns = [
    "photo",
    "image",
    "picture",
    "pic",
    "icard",
    "passport",
    "signature",
    "selfie",
    "upload",
  ];

  const lowerFieldName = fieldName.toLowerCase();
  return fileUploadPatterns.some((pattern) => lowerFieldName.includes(pattern));
};

// Helper function to create enum values and names from documents
const createDocumentEnums = (docs: Doc[]): [string[], string[]] => {
  if (!docs || docs.length === 0) return [[], []];

  return docs.reduce(
    ([values, names]: [string[], string[]], doc: Doc): [string[], string[]] => {
      values.push(doc.doc_data);
      names.push(doc.doc_subtype);
      return [values, names];
    },
    [[], []]
  );
};

// Helper function to create a document field schema with VC metadata
const createDocumentFieldSchema = (
  title: string,
  isRequired: boolean,
  enumValues: string[],
  enumNames: string[],
  vcMeta: VCDocumentMeta,
  proof?: string
): any => {
  // Add document type to the title if provided
  if (proof) {
    proof = proof
      .split("/")
      .map((segment) =>
        segment
          .trim()
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/\b\w/g, (char) => char.toUpperCase())
      )
      .join(" / "); // Join back

    title = `${title} (${proof})`;
  }

  const fieldSchema: any = {
    type: "string",
    title,
    required: isRequired,
    enum: enumValues.length > 0 ? enumValues : [""],
    enumNames: enumNames || [],
    default: enumValues[0] || "",
    // Add VC metadata for later use in form submission
    vcMeta: {
      submissionReasons: vcMeta.submissionReasons,
      documentType: vcMeta.documentType,
      documentSubtype: vcMeta.documentSubtype,
      format: vcMeta.format,
      issuer: vcMeta.issuer,
      isFileUpload: vcMeta.isFileUpload,
    },
  };

  return fieldSchema;
};

// Helper function to filter documents by proof types
const filterDocsByProofs = (docs: Doc[], proofs: string[]): Doc[] => {
  return docs?.filter((doc: Doc) => proofs.includes(doc.doc_subtype)) || [];
};

// Helper function to extract document type from the selected document in docs array
export const extractDocumentTypeFromSelection = (
  selectedDocumentId: string,
  docsArray: Doc[]
): string => {
  if (!selectedDocumentId || !docsArray || docsArray.length === 0) {
    return "unknown";
  }

  // Find the document by matching the doc_data (which contains the document ID/content)
  const selectedDoc = docsArray.find(
    (doc) =>
      doc.doc_data === selectedDocumentId || doc.doc_id === selectedDocumentId
  );

  return selectedDoc?.doc_type || "unknown";
};
// Helper function to extract complete document metadata from selection
export const extractDocumentMetadataFromSelection = (
  selectedDocumentId: string,
  docsArray: Doc[]
): {
  documentType: string;
  documentIssuer: string;
  selectedDoc: Doc | null;
} => {
  if (!selectedDocumentId || !docsArray || docsArray.length === 0) {
    return {
      documentType: "unknown",
      documentIssuer: "https://provider.example.org",
      selectedDoc: null,
    };
  }

  // Find the document by matching the doc_data (which contains the document ID/content)
  const selectedDoc = docsArray.find(
    (doc) =>
      doc.doc_data === selectedDocumentId || doc.doc_id === selectedDocumentId
  );

  return {
    documentType: selectedDoc?.doc_type || "unknown",
    documentIssuer:
      selectedDoc?.imported_from || "https://provider.example.org",
    selectedDoc: selectedDoc || null,
  };
};

// Helper function to extract document subtype from form data
export const extractDocumentSubtype = (
  formValue: string,
  fieldSchema: any
): string => {
  if (!formValue || !fieldSchema?.enumNames || !fieldSchema?.enum) {
    return fieldSchema?.vcMeta?.documentSubtype || "unknown";
  }

  const valueIndex = fieldSchema.enum.indexOf(formValue);
  if (valueIndex >= 0 && fieldSchema.enumNames[valueIndex]) {
    return fieldSchema.enumNames[valueIndex];
  }

  return fieldSchema?.vcMeta?.documentSubtype || "unknown";
};

// Convert eligibility and document fields to RJSF schema with VC metadata
export const convertDocumentFields = (
  schemaArr: any[],
  userDocs: Doc[]
): JSONSchema7 => {
  // Initialize the RJSF schema object for documents
  const schema: any = {
    type: "object",
    properties: {},
  };

  // Track required fields for the root schema
  const requiredFields: string[] = [];

  // Track created fields to prevent duplicates across all creation paths
  const createdFields = new Set<string>();

  // Separate eligibility and required-docs (mandatory/optional)
  const eligibilityArr = schemaArr.filter(
    (item) => item.criteria && item.allowedProofs
  );
  const requiredDocsArr = schemaArr.filter(
    (item) => !item.criteria && item.allowedProofs
  ) as RequiredDoc[];

  type ProofEntry = {
    documentType: string;
    proof: string;
  };

  // Build sets for optional-docs and mandatory-docs for quick lookup
  const optionalDocsProofs: ProofEntry[] = [];
  const mandatoryDocsProofs: ProofEntry[] = [];

  requiredDocsArr.forEach((doc) => {
    if (!Array.isArray(doc.allowedProofs)) return;

    const targetArray =
      doc.isRequired === true ? mandatoryDocsProofs : optionalDocsProofs;

    doc.allowedProofs.forEach((proof: string) => {
      const entry = { documentType: doc.documentType, proof };
      if (
        !targetArray.some(
          (e) =>
            e.documentType === entry.documentType && e.proof === entry.proof
        )
      ) {
        targetArray.push(entry);
      }
    });
  });

  // Group eligibility criteria by their allowedProofs set
  const eligProofGroups: Record<
    string,
    { criteriaNames: string[]; allowedProofs: string[]; eligs: EligItem[] }
  > = {};

  eligibilityArr.forEach((elig) => {
    const { allowedProofs, criteria } = elig;
    if (!Array.isArray(allowedProofs) || !criteria?.name) return;

    // Use sorted allowedProofs as key for grouping
    const key = JSON.stringify(
      [...allowedProofs].sort((a, b) => a.localeCompare(b))
    );

    if (!eligProofGroups[key]) {
      eligProofGroups[key] = { criteriaNames: [], allowedProofs, eligs: [] };
    }
    eligProofGroups[key].criteriaNames.push(criteria.name);
    eligProofGroups[key].eligs.push(elig);
  });

  // Helper function to check if proofs are present in required docs
  const checkProofsPresence = (allowedProofs: string[]) => {
    const matchedProofs: ProofEntry[] = [];
    const allPresent = allowedProofs.every((proof: string) => {
      const optionalMatch = optionalDocsProofs.find(
        (entry) => entry.proof === proof
      );
      if (optionalMatch) {
        matchedProofs.push(optionalMatch);
        return true;
      }

      const mandatoryMatch = mandatoryDocsProofs.find(
        (entry) => entry.proof === proof
      );
      if (mandatoryMatch) {
        matchedProofs.push(mandatoryMatch);
        return true;
      }

      return false;
    });
    return { allPresent, matchedProofs };
  };

  // Helper function to add document field to schema
  const addDocumentFieldToSchema = (fieldName: string, documentField: any) => {
    if (!documentField.fieldGroup) {
      documentField.fieldGroup = {
        groupName: "documents",
        groupLabel: "Documents",
      };
    }

    if (!createdFields.has(fieldName)) {
      createdFields.add(fieldName);
      schema.properties![fieldName] = documentField;
      requiredFields.push(fieldName);
    } else {
      console.warn(`Skipped duplicate field creation: ${fieldName}`);
    }
  };

  // Helper function to process grouped eligibility field
  const processGroupedEligibilityField = (group: any) => {
    const { criteriaNames, allowedProofs, eligs } = group;
    const { allPresent, matchedProofs } = checkProofsPresence(allowedProofs);
    
    const matchingDocs = filterDocsByProofs(userDocs, allowedProofs);
    const [enumValues, enumNames] = createDocumentEnums(matchingDocs);
    const allowedProofsLabel = allowedProofs.join(" / ");

    if (allPresent && criteriaNames.length > 0) {
      processAllPresentCase(criteriaNames, allowedProofs, matchedProofs, enumValues, enumNames, allowedProofsLabel);
    } else {
      processFallbackCase(eligs, userDocs);
    }
  };

  // Helper function to process when all proofs are present
  const processAllPresentCase = (criteriaNames: string[], allowedProofs: string[], matchedProofs: ProofEntry[], enumValues: string[], enumNames: string[], allowedProofsLabel: string) => {
    const fieldName = (criteriaNames.length === 1 ? criteriaNames[0] : criteriaNames.join("_")) + "_doc";
    const documentTypes = matchedProofs
      .map((entry) => entry.documentType)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    
    const documentType = documentTypes.length === 1 ? documentTypes[0] : "eligibilityCriteria";
    const fieldLabel = documentType && documentType !== "eligibilityCriteria"
      ? `Choose document for ${criteriaNames.join(", ")}, ${documentType}`
      : `Choose document for ${criteriaNames.join(", ")}`;

    const vcMeta: VCDocumentMeta = {
      submissionReasons: criteriaNames,
      documentType: documentType,
      documentSubtype: allowedProofs[0],
      format: "json",
      issuer: "https://provider.example.org",
      isFileUpload: isFileUploadField(fieldName),
    };

    const documentField = createDocumentFieldSchema(fieldLabel, true, enumValues, enumNames, vcMeta, allowedProofsLabel);
    addDocumentFieldToSchema(fieldName, documentField);
  };

  // Helper function to process fallback cases
  const processFallbackCase = (eligs: EligItem[], userDocs: Doc[]) => {
    eligs.forEach((elig) => {
      const { allowedProofs } = elig;
      
      if (allowedProofs.length > 1) {
        processMultiProofEligibility(elig, userDocs);
      } else {
        processSingleProofEligibility(elig, userDocs);
      }
    });
  };

  // Helper function to process eligibility with multiple proofs
  const processMultiProofEligibility = (elig: EligItem, userDocs: Doc[]) => {
    const { allowedProofs, criteria } = elig;
    const matchingDocs = filterDocsByProofs(userDocs, allowedProofs);
    const [enumValues, enumNames] = createDocumentEnums(matchingDocs);
    const allowedProofsLabel = allowedProofs.join(" / ");
    const fieldName = `${criteria.name}_doc`;

    const vcMeta: VCDocumentMeta = {
      submissionReasons: [criteria.name],
      documentType: "eligibilityCriteria",
      documentSubtype: allowedProofs[0],
      format: "json",
      issuer: "https://provider.example.org",
      isFileUpload: isFileUploadField(fieldName),
    };

    const documentField = createDocumentFieldSchema(
      `Choose document for ${criteria.name}`,
      true,
      enumValues,
      enumNames,
      vcMeta,
      allowedProofsLabel
    );
    addDocumentFieldToSchema(fieldName, documentField);
  };

  // Helper function to process eligibility with single proof
  const processSingleProofEligibility = (elig: EligItem, userDocs: Doc[]) => {
    const { allowedProofs, criteria } = elig;
    allowedProofs.forEach((proof: string) => {
      const proofDocs = filterDocsByProofs(userDocs, [proof]);
      const [proofEnumValues, proofEnumNames] = createDocumentEnums(proofDocs);
      const fieldName = `${criteria.name}_${proof}_doc`;

      const vcMeta: VCDocumentMeta = {
        submissionReasons: [criteria.name],
        documentType: "eligibilityCriteria",
        documentSubtype: proof,
        format: "json",
        issuer: "https://provider.example.org",
        isFileUpload: isFileUploadField(fieldName),
      };

      const documentField = createDocumentFieldSchema(
        `Choose document for ${criteria.name}`,
        true,
        proofEnumValues,
        proofEnumNames,
        vcMeta,
        proof
      );
      addDocumentFieldToSchema(fieldName, documentField);
    });
  };

  // Render grouped eligibility fields with VC metadata
  Object.values(eligProofGroups).forEach(processGroupedEligibilityField);

  // Add required-docs (mandatory/optional) that are not already handled
  const sortedRequiredDocsArr = [...requiredDocsArr].sort(
    (a, b) => Number(b.isRequired) - Number(a.isRequired)
  );

  sortedRequiredDocsArr.forEach((doc) => {
    if (!Array.isArray(doc.allowedProofs)) return;

    doc.allowedProofs.forEach((proof: string) => {
      // Check if this proof should be shown as a separate document field
      const showAsSeparateDocField = Object.values(eligProofGroups).some(
        (group) =>
          group.allowedProofs.length > 1 && group.allowedProofs.includes(proof)
      );

      // If not mandatory, or not in eligibility, skip if already handled
      if (!showAsSeparateDocField) {
        const alreadyHandled = Object.values(eligProofGroups).some((group) =>
          group.allowedProofs.includes(proof)
        );
        if (alreadyHandled) return;
      }

      const fieldName = proof;

      // Check if field already exists in schema to prevent duplicates
      if (createdFields.has(fieldName)) {
        console.warn(`Skipped duplicate required-doc field: ${fieldName}`);
        return;
      }

      // Prepare select options from userDocs for this proof
      const proofDocs = filterDocsByProofs(userDocs, [proof]);
      const [enumValues, enumNames] = createDocumentEnums(proofDocs);

      // Create VC metadata
      const vcMeta: VCDocumentMeta = {
        submissionReasons: [doc.documentType],
        documentType: doc.documentType,
        documentSubtype: proof,
        format: "json",
        issuer: "https://provider.example.org",
        isFileUpload: isFileUploadField(fieldName),
      };

      // Include the document type in the label for fields coming from requiredDocsArr
      const documentField = createDocumentFieldSchema(
        `Choose document for ${doc.documentType}`,
        !!doc.isRequired,
        enumValues,
        enumNames,
        vcMeta,
        proof
      );

      // Only add fieldGroup if it's not already set - avoid nested grouping
      if (!documentField.fieldGroup) {
        documentField.fieldGroup = {
          groupName: "documents",
          groupLabel: "Documents",
        };
      }

      // Prevent duplicate field creation
      if (!createdFields.has(fieldName)) {
        createdFields.add(fieldName);
        schema.properties![fieldName] = documentField;
        if (doc.isRequired) requiredFields.push(fieldName);
      } else {
        console.warn(
          `Skipped duplicate required-doc field creation: ${fieldName}`
        );
      }
    });
  });

  // Set the required fields at the root of the schema
  schema.required = requiredFields;

  return schema;
};

export const extractUserDataForSchema = (
  formData: Record<string, any>,
  properties: Record<string, any>
): Record<string, string> => {
  const result: Record<string, string> = {};

  // Handle null/undefined formData or properties
  if (!formData || !properties) {
    return result;
  }

  for (const key of Object.keys(properties)) {
    if (Object.hasOwn(formData, key)) {
      result[key] = String(formData[key]);
    }
  }

  // Ensure external_application_id is added if it exists in formData
  if ("external_application_id" in formData) {
    result["orderId"] = String(formData["external_application_id"]);
  }

  return result;
};

// Helper function to get all document field names from schema
export const getDocumentFieldNames = (schema: any): string[] => {
  const documentFields: string[] = [];

  if (schema?.properties) {
    Object.keys(schema.properties).forEach((fieldName) => {
      const fieldSchema = schema.properties[fieldName];
      if (
        fieldSchema?.vcMeta ||
        fieldSchema?.fieldGroup?.groupName === "documents"
      ) {
        documentFields.push(fieldName);
      }
    });
  }

  return documentFields;
};

// Helper function to get personal field names (non-document, non-system fields)
export const getPersonalFieldNames = (
  allFieldNames: string[],
  documentFieldNames: string[],
  systemFields: string[] = ["benefitId", "docs", "orderId"]
): string[] => {
  return allFieldNames.filter(
    (fieldName) =>
      !documentFieldNames.includes(fieldName) &&
      !systemFields.includes(fieldName)
  );
};
