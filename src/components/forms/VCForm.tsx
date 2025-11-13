import React from 'react';
import { Box } from '@chakra-ui/react';
import { Theme as ChakraTheme } from '@rjsf/chakra-ui';
import { withTheme, IChangeEvent } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';
import { VCConfiguration } from '../../types/vc.types';
import { transformToRJSFSchema, mergeUISchema } from '../../utils/schemaTransformer';
import { validateFormData } from '../../utils/formValidation';
import SubmitButton from '../common/button/SubmitButton';

const Form = withTheme(ChakraTheme);

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
  const schema = transformToRJSFSchema(configuration) as JSONSchema7;
  const uiSchema = mergeUISchema(configuration, customUISchema);

  console.log('VCForm - Configuration:', configuration);
  console.log('VCForm - Schema:', schema);
  console.log('VCForm - UI Schema:', uiSchema);
  console.log('VCForm - Initial Data:', initialData);

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
    <Box 
      maxW="800px" 
      mx="auto" 
      p={5}
      height="100%"
      overflowY="auto"
      sx={{
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#CBD5E0',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#A0AEC0',
        },
      }}
    >
      <style>
        {`
          .vc-form-container .chakra-form__group {
            margin-bottom: 8px !important;
          }
          .vc-form-container .chakra-form__label {
            margin-bottom: 2px !important;
            font-size: 14px !important;
          }
          .vc-form-container .chakra-input,
          .vc-form-container .chakra-select,
          .vc-form-container .chakra-textarea {
            margin-bottom: 0 !important;
          }
          .vc-form-container .field {
            margin-bottom: 8px !important;
          }
          .vc-form-container .form-group {
            margin-bottom: 8px !important;
          }
          .vc-form-container div[role="group"] {
            margin-bottom: 8px !important;
          }
          .vc-form-container .chakra-form-control {
            margin-bottom: 8px !important;
          }
        `}
      </style>
      <Box className="vc-form-container">
        <Form
          schema={schema}
          uiSchema={uiSchema}
          formData={initialData}
          validator={validator}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
          showErrorList="top"
          liveValidate={true}
        >
          <Box mt={4} mb={4} textAlign="center">
            <SubmitButton
              label={isSubmitting ? 'Creating VC...' : 'Create Verifiable Credential'}
              isDisabled={isSubmitting}
            />
          </Box>
        </Form>
      </Box>
    </Box>
  );
};

