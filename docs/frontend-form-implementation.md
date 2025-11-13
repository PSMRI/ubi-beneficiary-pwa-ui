# Frontend Form Implementation Guide

## Overview
This document outlines the frontend implementation for VC (Verifiable Credential) form creation using React JSON Schema Form (RJSF). The implementation uses a simplified approach where the `issue_vc` flag in the upload response determines whether to show the form and populate it with extracted data.

## Key Features
- **Simplified Logic**: Uses `issue_vc` flag directly from upload response
- **Conditional Data Population**: Only populates form data when `issue_vc` is "yes"
- **Dynamic Form Loading**: Fetches VC configuration based on document type
- **Multi-step Process**: Upload → Form (if required) → Complete
- **Error Handling**: Comprehensive error handling with user feedback

## Implementation Flow

1. **Document Upload**: User uploads a document
2. **Response Processing**: Check `issue_vc` flag in response
3. **Conditional Form Display**: 
   - If `issue_vc` === "yes": Show form with pre-filled `mapped_data`
   - If `issue_vc` === "no": Skip form, go directly to completion
4. **Configuration Fetch**: Dynamically fetch VC configuration for form schema
5. **Form Submission**: Submit form data to create VC
6. **Completion**: Show success message and options for next steps

## Architecture Overview

### Component Structure
```
src/
├── components/
│   ├── forms/
│   │   ├── VCForm.tsx              # Main VC form component
│   │   ├── VCFormWrapper.tsx       # Wrapper with data fetching
│   │   └── FormFieldComponents/    # Custom field components
│   ├── document/
│   │   ├── DocumentUpload.tsx      # Document upload component
│   │   └── DocumentPreview.tsx     # Document preview component
├── services/
│   ├── vcService.ts               # VC-related API calls
│   ├── documentService.ts         # Document-related API calls
│   └── configService.ts           # Configuration API calls
├── hooks/
│   ├── useVCForm.ts              # VC form logic hook
│   ├── useDocumentUpload.ts      # Document upload hook
│   └── useVCConfiguration.ts     # Configuration fetching hook
├── types/
│   ├── vc.types.ts               # VC-related type definitions
│   └── document.types.ts         # Document-related types
└── utils/
    ├── schemaTransformer.ts      # Transform VC config to RJSF schema
    └── formValidation.ts         # Custom validation utilities
```

## API Response Format

The upload document API now returns a simplified response format:

```json
{
  "statusCode": 201,
  "message": "Document uploaded successfully",
  "data": {
    "doc_id": "a0390e8d-2c42-4389-a9f8-ee2392d735d6",
    "user_id": "82192ec3-6897-4288-ab8e-f8a191b0445c",
    "doc_type": "marksProof",
    "doc_subtype": "marksheet",
    "doc_name": "Marksheet",
    "imported_from": "Manual Upload",
    "doc_datatype": "Application/JSON",
    "uploaded_at": "2025-11-12T11:24:05.427Z",
    "is_update": false,
    "download_url": "https://...",
    "issue_vc": "yes",
    "mapped_data": {
      "firstname": "MD ARSH",
      "middlename": "HUMAYUN",
      "schoolname": "ANITA INTERMEDIATE COLLEGE KANKE RANCHI",
      "currentclass": 11,
      "markstotal": 166,
      "result": "PROMOTED",
      "academicyear": "2024",
      "issuedby": "PRINCIPAL",
      "issuerauthority": "Jharkhand Academic Council, Ranchi",
      "issueddate": "17-05-2024",
      "issuingauthorityaddress": "Kanke, Ranchi",
      "issuingauthoritystate": "Jharkhand"
    }
  }
}
```

## Type Definitions

```typescript
// types/document.types.ts
export interface DocumentUploadResponse {
  doc_id: string;
  user_id: string;
  doc_type: string;
  doc_subtype: string;
  doc_name: string;
  imported_from: string;
  doc_datatype: string;
  uploaded_at: string;
  is_update: boolean;
  download_url: string;
  issue_vc: "yes" | "no";
  mapped_data?: Record<string, any>;
}

// types/vc.types.ts
export interface VCField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  label: string;
  required: boolean;
  format?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
  };
}

export interface VCConfiguration {
  id: string;
  name: string;
  label: string;
  doc_type: string;
  doc_subtype: string;
  issue_vc: boolean;
  vc_fields: Record<string, VCField>;
  ui_schema?: Record<string, any>;
}

export interface VCFormData {
  doc_id: string;
  form_data: Record<string, any>;
}
```

## Service Layer

### 1. Document Service

```typescript
// services/documentService.ts
import { api } from './api';
import { DocumentUploadResponse } from '../types/document.types';

export class DocumentService {
  static async uploadDocument(
    file: File,
    docType: string,
    docSubtype: string
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    formData.append('docSubtype', docSubtype);

    try {
      const response = await api.post('/users/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Document upload failed:', error);
      throw new Error('Failed to upload document. Please try again.');
    }
  }

  static async getDocumentById(docId: string) {
    try {
      const response = await api.get(`/users/documents/${docId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch document:', error);
      throw new Error('Failed to fetch document details.');
    }
  }
}
```

### 2. VC Configuration Service

```typescript
// services/configService.ts
import { api } from './api';
import { VCConfiguration } from '../types/vc.types';

export class ConfigService {
  static async getVCConfiguration(
    docType: string,
    docSubtype: string
  ): Promise<VCConfiguration> {
    try {
      // First try to get specific configuration
      const response = await api.get(
        `/admin/config/vcConfiguration/${docType}/${docSubtype}`
      );
      
      return response.data.data;
    } catch (error) {
      // If specific config not found, try to get from general configuration
      try {
        const allConfigs = await this.getAllVCConfigurations();
        const config = allConfigs.find(
          c => c.doc_type === docType && c.doc_subtype === docSubtype
        );
        
        if (!config) {
          throw new Error(`No configuration found for ${docType}/${docSubtype}`);
        }
        
        return config;
      } catch (fallbackError) {
        console.error('Failed to fetch VC configuration:', error);
        throw new Error('Failed to load form configuration.');
      }
    }
  }

  static async getAllVCConfigurations(): Promise<VCConfiguration[]> {
    try {
      const response = await api.get('/admin/config/vcConfiguration');
      return response.data.data.configurations;
    } catch (error) {
      console.error('Failed to fetch VC configurations:', error);
      throw new Error('Failed to load configurations.');
    }
  }
}
```

### 3. VC Service

```typescript
// services/vcService.ts
import { api } from './api';
import { VCFormData } from '../types/vc.types';

export class VCService {
  static async createVC(formData: VCFormData) {
    try {
      const response = await api.post('/vc/create', formData);
      return response.data.data;
    } catch (error) {
      console.error('VC creation failed:', error);
      throw new Error('Failed to create verifiable credential.');
    }
  }

  static async getVCById(vcId: string) {
    try {
      const response = await api.get(`/vc/${vcId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch VC:', error);
      throw new Error('Failed to fetch verifiable credential.');
    }
  }
}
```

## Custom Hooks

### 1. Document Upload Hook

```typescript
// hooks/useDocumentUpload.ts
import { useState } from 'react';
import { DocumentService } from '../services/documentService';
import { DocumentUploadResponse } from '../types/document.types';

export const useDocumentUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<DocumentUploadResponse | null>(null);

  const uploadDocument = async (file: File, docType: string, docSubtype: string) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await DocumentService.uploadDocument(file, docType, docSubtype);
      setUploadedDocument(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadedDocument(null);
    setUploadError(null);
  };

  return {
    uploadDocument,
    isUploading,
    uploadError,
    uploadedDocument,
    resetUpload,
  };
};
```

### 2. VC Configuration Hook

```typescript
// hooks/useVCConfiguration.ts
import { useState, useEffect } from 'react';
import { ConfigService } from '../services/configService';
import { VCConfiguration } from '../types/vc.types';

export const useVCConfiguration = (docType?: string, docSubtype?: string) => {
  const [configuration, setConfiguration] = useState<VCConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (docType && docSubtype) {
      fetchConfiguration(docType, docSubtype);
    }
  }, [docType, docSubtype]);

  const fetchConfiguration = async (docType: string, docSubtype: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const config = await ConfigService.getVCConfiguration(docType, docSubtype);
      setConfiguration(config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load configuration';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    configuration,
    isLoading,
    error,
    refetch: () => docType && docSubtype && fetchConfiguration(docType, docSubtype),
  };
};
```

### 3. VC Form Hook

```typescript
// hooks/useVCForm.ts
import { useState } from 'react';
import { VCService } from '../services/vcService';

export const useVCForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdVC, setCreatedVC] = useState<any>(null);

  const submitForm = async (docId: string, formData: Record<string, any>) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await VCService.createVC({ doc_id: docId, form_data: formData });
      setCreatedVC(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Form submission failed';
      setSubmitError(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitForm,
    isSubmitting,
    submitError,
    createdVC,
  };
};
```

## Utility Functions

### 1. Schema Transformer

```typescript
// utils/schemaTransformer.ts
import { VCConfiguration } from '../types/vc.types';

export const transformToRJSFSchema = (vcConfig: VCConfiguration) => {
  const { vc_fields } = vcConfig;
  
  const properties: Record<string, any> = {};
  const required: string[] = [];

  Object.entries(vc_fields).forEach(([fieldName, fieldConfig]) => {
    properties[fieldName] = {
      type: fieldConfig.type,
      title: fieldConfig.label,
      ...(fieldConfig.format && { format: fieldConfig.format }),
      ...(fieldConfig.validation && {
        ...(fieldConfig.validation.pattern && { pattern: fieldConfig.validation.pattern }),
        ...(fieldConfig.validation.minLength && { minLength: fieldConfig.validation.minLength }),
        ...(fieldConfig.validation.maxLength && { maxLength: fieldConfig.validation.maxLength }),
        ...(fieldConfig.validation.minimum && { minimum: fieldConfig.validation.minimum }),
        ...(fieldConfig.validation.maximum && { maximum: fieldConfig.validation.maximum }),
      }),
    };

    if (fieldConfig.required) {
      required.push(fieldName);
    }
  });

  return {
    type: 'object',
    properties,
    required,
  };
};

export const mergeUISchema = (vcConfig: VCConfiguration, customUISchema?: Record<string, any>) => {
  const baseUISchema = vcConfig.ui_schema || {};
  return {
    ...baseUISchema,
    ...customUISchema,
  };
};
```

### 2. Form Validation

```typescript
// utils/formValidation.ts
export const validateFormData = (formData: Record<string, any>, schema: any): string[] => {
  const errors: string[] = [];
  
  // Check required fields
  if (schema.required) {
    schema.required.forEach((field: string) => {
      if (!formData[field] || formData[field] === '') {
        errors.push(`${field} is required`);
      }
    });
  }
  
  // Validate field formats and constraints
  Object.entries(schema.properties).forEach(([fieldName, fieldSchema]: [string, any]) => {
    const value = formData[fieldName];
    
    if (value !== undefined && value !== null && value !== '') {
      // Pattern validation
      if (fieldSchema.pattern && typeof value === 'string') {
        const regex = new RegExp(fieldSchema.pattern);
        if (!regex.test(value)) {
          errors.push(`${fieldName} format is invalid`);
        }
      }
      
      // Length validation
      if (typeof value === 'string') {
        if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
          errors.push(`${fieldName} must be at least ${fieldSchema.minLength} characters`);
        }
        if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
          errors.push(`${fieldName} must not exceed ${fieldSchema.maxLength} characters`);
        }
      }
      
      // Number validation
      if (typeof value === 'number') {
        if (fieldSchema.minimum && value < fieldSchema.minimum) {
          errors.push(`${fieldName} must be at least ${fieldSchema.minimum}`);
        }
        if (fieldSchema.maximum && value > fieldSchema.maximum) {
          errors.push(`${fieldName} must not exceed ${fieldSchema.maximum}`);
        }
      }
    }
  });
  
  return errors;
};
```

## React Components

### 1. Main VC Form Component

```tsx
// components/forms/VCForm.tsx
import React from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { IChangeEvent } from '@rjsf/core';
import { VCConfiguration } from '../../types/vc.types';
import { transformToRJSFSchema, mergeUISchema } from '../../utils/schemaTransformer';
import { validateFormData } from '../../utils/formValidation';

interface VCFormProps {
  configuration: VCConfiguration;
  initialData?: Record<string, any>;
  onSubmit: (formData: Record<string, any>) => void;
  isSubmitting?: boolean;
  customUISchema?: Record<string, any>;
}

export const VCForm: React.FC<VCFormProps> = ({
  configuration,
  initialData = {},
  onSubmit,
  isSubmitting = false,
  customUISchema = {},
}) => {
  const schema = transformToRJSFSchema(configuration);
  const uiSchema = mergeUISchema(configuration, customUISchema);

  const handleSubmit = (data: IChangeEvent<Record<string, any>>) => {
    const formData = data.formData;
    
    // Custom validation
    const validationErrors = validateFormData(formData, schema);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="vc-form-container">
      <div className="form-header">
        <h2>{configuration.label}</h2>
        <p>Please review and complete the form below to create your verifiable credential.</p>
      </div>
      
      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={initialData}
        validator={validator}
        onSubmit={handleSubmit}
        disabled={isSubmitting}
        showErrorList={true}
        liveValidate={true}
      >
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating VC...' : 'Create Verifiable Credential'}
          </button>
        </div>
      </Form>
    </div>
  );
};
```

### 2. VC Form Wrapper

```tsx
// components/forms/VCFormWrapper.tsx
import React, { useEffect, useState } from 'react';
import { VCForm } from './VCForm';
import { useVCConfiguration } from '../../hooks/useVCConfiguration';
import { useVCForm } from '../../hooks/useVCForm';
import { DocumentUploadResponse } from '../../types/document.types';
import { Loader } from '../common/Loader';
import { ToasterMessage } from '../common/ToasterMessage';

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
  const shouldFetchConfig = uploadedDocument.issue_vc === "yes";
  const { configuration, isLoading, error } = useVCConfiguration(
    shouldFetchConfig ? uploadedDocument.doc_type : undefined,
    shouldFetchConfig ? uploadedDocument.doc_subtype : undefined
  );
  
  const { submitForm, isSubmitting, submitError, createdVC } = useVCForm();

  useEffect(() => {
    // Only show form if VC is required
    setShowForm(uploadedDocument.issue_vc === "yes");
  }, [uploadedDocument]);

  useEffect(() => {
    if (createdVC && onVCCreated) {
      onVCCreated(createdVC);
    }
  }, [createdVC, onVCCreated]);

  const handleFormSubmit = async (formData: Record<string, any>) => {
    try {
      await submitForm(uploadedDocument.doc_id, formData);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  if (!showForm) {
    return (
      <div className="vc-form-wrapper">
        <div className="info-message">
          <p>Document uploaded successfully. No additional form required.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="vc-form-wrapper">
        <Loader message="Loading form configuration..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="vc-form-wrapper">
        <ToasterMessage type="error" message={error} />
      </div>
    );
  }

  if (!configuration) {
    return (
      <div className="vc-form-wrapper">
        <ToasterMessage 
          type="error" 
          message="Form configuration not found for this document type." 
        />
      </div>
    );
  }

  return (
    <div className="vc-form-wrapper">
      {submitError && (
        <ToasterMessage type="error" message={submitError} />
      )}
      
      {createdVC && (
        <ToasterMessage 
          type="success" 
          message="Verifiable credential created successfully!" 
        />
      )}
      
      <VCForm
        configuration={configuration}
        initialData={uploadedDocument.issue_vc === "yes" ? uploadedDocument.mapped_data : {}}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
```

### 3. Document Upload with Form Integration

```tsx
// components/document/DocumentUploadWithForm.tsx
import React, { useState } from 'react';
import { DocumentUpload } from './DocumentUpload';
import { VCFormWrapper } from '../forms/VCFormWrapper';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import { DocumentUploadResponse } from '../../types/document.types';

export const DocumentUploadWithForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'form' | 'complete'>('upload');
  const [uploadedDocument, setUploadedDocument] = useState<DocumentUploadResponse | null>(null);
  
  const { uploadDocument, isUploading, uploadError } = useDocumentUpload();

  const handleDocumentUpload = async (file: File, docType: string, docSubtype: string) => {
    try {
      const result = await uploadDocument(file, docType, docSubtype);
      setUploadedDocument(result);
      
      // Move to form step if VC is required, otherwise complete
      setCurrentStep(result.issue_vc === "yes" ? 'form' : 'complete');
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

  return (
    <div className="document-upload-with-form">
      <div className="step-indicator">
        <div className={`step ${currentStep === 'upload' ? 'active' : 'completed'}`}>
          1. Upload Document
        </div>
        <div className={`step ${currentStep === 'form' ? 'active' : currentStep === 'complete' ? 'completed' : ''}`}>
          2. Complete Form
        </div>
        <div className={`step ${currentStep === 'complete' ? 'active' : ''}`}>
          3. Complete
        </div>
      </div>

      {currentStep === 'upload' && (
        <DocumentUpload
          onUpload={handleDocumentUpload}
          isUploading={isUploading}
          error={uploadError}
        />
      )}

      {currentStep === 'form' && uploadedDocument && (
        <VCFormWrapper
          uploadedDocument={uploadedDocument}
          onVCCreated={handleVCCreated}
        />
      )}

      {currentStep === 'complete' && (
        <div className="completion-screen">
          <h2>Process Complete!</h2>
          <p>Your document has been processed successfully.</p>
          <button onClick={handleStartOver} className="btn btn-secondary">
            Upload Another Document
          </button>
        </div>
      )}
    </div>
  );
};
```

## Styling

### 1. Form Styles

```css
/* styles/vc-form.css */
.vc-form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-header {
  margin-bottom: 30px;
  text-align: center;
}

.form-header h2 {
  color: #333;
  margin-bottom: 10px;
}

.form-header p {
  color: #666;
  font-size: 14px;
}

.form-actions {
  margin-top: 30px;
  text-align: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.step-indicator {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.step {
  padding: 10px 20px;
  margin: 0 10px;
  border-radius: 20px;
  background-color: #f8f9fa;
  color: #6c757d;
  font-weight: 500;
}

.step.active {
  background-color: #007bff;
  color: white;
}

.step.completed {
  background-color: #28a745;
  color: white;
}
```

## Simplified Logic Benefits

### Before (Complex Reference Approach)
- Required `vc_config_ref` object in response
- Multiple API calls to determine form requirements
- Complex state management for configuration references

### After (Direct Flag Approach)
- Simple `issue_vc` flag determines form display
- Direct access to `mapped_data` for pre-filling
- Reduced API calls and simplified state management
- Cleaner component logic and easier debugging

### Implementation Comparison

```typescript
// OLD: Complex reference-based approach
const showForm = uploadedDocument.vc_config_ref?.requires_vc === true;
const configId = uploadedDocument.vc_config_ref?.config_id;

// NEW: Simple flag-based approach
const showForm = uploadedDocument.issue_vc === "yes";
const formData = uploadedDocument.issue_vc === "yes" ? uploadedDocument.mapped_data : {};
```

## Performance Optimizations

1. **Lazy Loading**: Lazy load form components to reduce initial bundle size
2. **Memoization**: Use React.memo for form components to prevent unnecessary re-renders
3. **Debounced Validation**: Implement debounced validation for better UX
4. **Caching**: Cache configuration data to avoid repeated API calls
5. **Code Splitting**: Split form-related code into separate chunks
6. **Conditional Loading**: Only fetch VC configuration when `issue_vc` is "yes"

## Accessibility

1. **ARIA Labels**: Ensure all form fields have proper ARIA labels
2. **Keyboard Navigation**: Support full keyboard navigation
3. **Screen Reader Support**: Test with screen readers
4. **Focus Management**: Proper focus management for form interactions
5. **Error Announcements**: Announce validation errors to screen readers

## Error Handling

1. **Network Errors**: Handle API failures gracefully
2. **Validation Errors**: Show clear validation messages
3. **Form State Recovery**: Preserve form data on errors
4. **Retry Mechanisms**: Implement retry for failed operations
5. **User Feedback**: Provide clear feedback for all user actions
