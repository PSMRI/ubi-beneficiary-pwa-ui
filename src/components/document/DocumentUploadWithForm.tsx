import React, { useState } from 'react';
import { Box, Text, VStack, HStack, Button, useTheme } from '@chakra-ui/react';
import { VCFormWrapper } from '../forms/VCFormWrapper';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import { DocumentUploadResponse } from '../../types/document.types';

interface DocumentUploadProps {
  onUpload: (
    file: File,
    docType: string,
    docSubtype: string
  ) => Promise<void>;
  isUploading: boolean;
  error: string | null;
  docType?: string;
  docSubtype?: string;
}

// This is a placeholder component - you should integrate with your existing DocumentUpload component
const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  isUploading,
  error,
  docType,
  docSubtype,
}) => {
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file && docType && docSubtype) {
      await onUpload(file, docType, docSubtype);
    } else {
      console.error('docType and docSubtype are required for upload');
    }
  };

  return (
    <Box p={5}>
      <VStack spacing={4}>
        <Text fontSize="xl" fontWeight="bold">
          Upload Document
        </Text>
        <input
          type="file"
          onChange={handleFileChange}
          disabled={isUploading || !docType || !docSubtype}
          accept=".pdf,.jpg,.jpeg,.png"
        />
        {error && (
          <Text color="red.500" fontSize="sm">
            {error}
          </Text>
        )}
        {isUploading && <Text>Uploading...</Text>}
        {(!docType || !docSubtype) && (
          <Text color="orange.500" fontSize="sm">
            Document type information is required
          </Text>
        )}
      </VStack>
    </Box>
  );
};

interface DocumentUploadWithFormProps {
  docType?: string;
  docSubtype?: string;
}

export const DocumentUploadWithForm: React.FC<DocumentUploadWithFormProps> = ({
  docType: initialDocType,
  docSubtype: initialDocSubtype,
}) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState<
    'upload' | 'form' | 'complete'
  >('upload');
  const [uploadedDocument, setUploadedDocument] =
    useState<DocumentUploadResponse | null>(null);
  const [docType, setDocType] = useState<string | undefined>(initialDocType);
  const [docSubtype, setDocSubtype] = useState<string | undefined>(initialDocSubtype);

  const { uploadDocument, isUploading, uploadError } = useDocumentUpload();

  const handleDocumentUpload = async (
    file: File,
    uploadDocType: string,
    uploadDocSubtype: string
  ) => {
    try {
      const result = await uploadDocument(file, uploadDocType, uploadDocSubtype);
      setUploadedDocument(result);
      
      // Update docType/docSubtype from response if not already set
      if (!docType) setDocType(result.doc_type);
      if (!docSubtype) setDocSubtype(result.doc_subtype);

      // Move to form step if VC is required, otherwise complete
      setCurrentStep(result.issue_vc === 'yes' ? 'form' : 'complete');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleVCCreated = (vc: any) => {
    setCurrentStep('complete');
  };

  const handleStartOver = () => {
    setCurrentStep('upload');
    setUploadedDocument(null);
  };

  const getStepStatus = (step: 'upload' | 'form' | 'complete') => {
    if (step === 'upload') {
      return currentStep === 'upload' ? 'active' : 'completed';
    }
    if (step === 'form') {
      if (currentStep === 'form') return 'active';
      if (currentStep === 'complete') return 'completed';
      return '';
    }
    if (step === 'complete') {
      return currentStep === 'complete' ? 'active' : '';
    }
    return '';
  };

  const getStepBgColor = (status: string) => {
    if (status === 'active') return theme.colors.primary;
    if (status === 'completed') return theme.colors.success;
    return 'gray.100';
  };

  const getStepColor = (status: string) => {
    if (status === 'active' || status === 'completed') return 'white';
    return 'gray.600';
  };

  const uploadStatus = getStepStatus('upload');
  const formStatus = getStepStatus('form');
  const completeStatus = getStepStatus('complete');

  return (
    <Box p={5}>
      <HStack spacing={4} justify="center" mb={8}>
        <Box
          px={5}
          py={2}
          borderRadius="full"
          bg={getStepBgColor(uploadStatus)}
          color={getStepColor(uploadStatus)}
          fontWeight="medium"
        >
          1. Upload Document
        </Box>
        <Box
          px={5}
          py={2}
          borderRadius="full"
          bg={getStepBgColor(formStatus)}
          color={getStepColor(formStatus)}
          fontWeight="medium"
        >
          2. Complete Form
        </Box>
        <Box
          px={5}
          py={2}
          borderRadius="full"
          bg={getStepBgColor(completeStatus)}
          color={getStepColor(completeStatus)}
          fontWeight="medium"
        >
          3. Complete
        </Box>
      </HStack>

      {currentStep === 'upload' && (
        <DocumentUpload
          onUpload={handleDocumentUpload}
          isUploading={isUploading}
          error={uploadError}
          docType={docType}
          docSubtype={docSubtype}
        />
      )}

      {currentStep === 'form' && uploadedDocument && (
        <VCFormWrapper
          uploadedDocument={uploadedDocument}
          onVCCreated={handleVCCreated}
        />
      )}

      {currentStep === 'complete' && (
        <Box textAlign="center" p={8}>
          <VStack spacing={4}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.700">
              Process Complete!
            </Text>
            <Text fontSize="md" color="gray.600">
              Your document has been processed successfully.
            </Text>
            <Button
              onClick={handleStartOver}
              bg="primary"
              color="white"
              _hover={{ bg: 'primary', opacity: 0.9 }}
            >
              Upload Another Document
            </Button>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

