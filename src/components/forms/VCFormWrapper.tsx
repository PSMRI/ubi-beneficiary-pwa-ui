import React, { useEffect, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { VCForm } from './VCForm';
import { useVCConfiguration } from '../../hooks/useVCConfiguration';
import { useVCForm } from '../../hooks/useVCForm';
import { DocumentUploadResponse } from '../../types/document.types';
import Loader from '../common/Loader';
import ToasterMessage from '../common/ToasterMessage';

interface VCFormWrapperProps {
  uploadedDocument: DocumentUploadResponse;
  onVCCreated?: (vc: any) => void;
}

export const VCFormWrapper: React.FC<VCFormWrapperProps> = ({
  uploadedDocument,
  onVCCreated,
}) => {
  const [showForm, setShowForm] = useState(false);

  // Only fetch configuration if VC is required
  const shouldFetchConfig = uploadedDocument.issue_vc === 'yes';
  const { configuration, isLoading, error } = useVCConfiguration(
    shouldFetchConfig ? uploadedDocument.doc_type : undefined,
    shouldFetchConfig ? uploadedDocument.doc_subtype : undefined
  );

  const { submitForm, isSubmitting, submitError, createdVC } = useVCForm();

  useEffect(() => {
    // Only show form if VC is required
    setShowForm(uploadedDocument.issue_vc === 'yes');
  }, [uploadedDocument]);

  useEffect(() => {
    if (createdVC && onVCCreated) {
      onVCCreated(createdVC);
    }
  }, [createdVC, onVCCreated]);

  const handleFormSubmit = async (formData: Record<string, any>) => {
    try {
      // If doc_id is not present, use doc_type and doc_subtype instead
      await submitForm(
        uploadedDocument.doc_id,
        formData,
        uploadedDocument.doc_type,
        uploadedDocument.doc_subtype
      );
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  if (!showForm) {
    return (
      <Box p={5}>
        <Box
          bg="blue.50"
          border="1px"
          borderColor="blue.200"
          borderRadius="md"
          p={4}
        >
          <Text color="blue.800" fontSize="md">
            Document uploaded successfully. No additional form required.
          </Text>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Box p={5}>
        <ToasterMessage type="error" message={error} />
      </Box>
    );
  }

  if (!configuration) {
    return (
      <Box p={5}>
        <ToasterMessage
          type="error"
          message="Form configuration not found for this document type."
        />
      </Box>
    );
  }

  return (
    <Box>
      {submitError && (
        <Box p={5}>
          <ToasterMessage type="error" message={submitError} />
        </Box>
      )}

      {createdVC && (
        <Box p={5}>
          <ToasterMessage
            type="success"
            message="Verifiable credential created successfully!"
          />
        </Box>
      )}

      <VCForm
        configuration={configuration}
        initialData={
          uploadedDocument.issue_vc === 'yes'
            ? uploadedDocument.mapped_data || {}
            : {}
        }
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </Box>
  );
};

