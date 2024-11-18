import React from "react";
import { Box, Text, HStack, VStack } from "@chakra-ui/react";

// Define common styles for Text and Input components
const labelStyles = {
  fontSize: "12px",
  fontWeight: "500",
  mb: 1,
  color: "#06164B",
};

const valueStyles = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#1F1B13",
};

interface UserData {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  father_name?: string;
  mother_name?: string;
  date_of_birth?: string | null;
  gender?: string;

  // Contact Information
  email?: string;
  phone_number?: string;

  // Educational Information
  current_class?: string;
  current_school_name?: string | null;
  current_school_address?: string | null;
  current_school_district?: string | null;
  previous_year_marks?: string;

  // Demographic Information
  caste?: string;
  disability?: string | null;
  income?: string;
  student_type?: string;

  // System Information
  user_id?: string;
  sso_id?: string;
  sso_provider?: string;
  samagra_id?: string;
  aadhaar?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  image?: string | null;
}

interface UserDetailsProps {
  userData: UserData;
}
type FieldValue = string | number | null | undefined;
interface FieldProps {
  label: string;
  value?: FieldValue;
  defaultValue?: string;
}

const Field: React.FC<FieldProps> = ({ label, value, defaultValue = "__" }) => (
  <Box flex={1}>
    <Text {...labelStyles}>{label}</Text>
    <Text {...valueStyles}>{value ?? defaultValue}</Text>
  </Box>
);

const UserDetails: React.FC<UserDetailsProps> = ({ userData }) => {
  return (
    <Box
      borderRadius="5px"
      boxShadow="0px 2px 4px rgba(0, 0, 0, 0.1)"
      bg="white"
      w="100%"
      borderWidth={1}
      p={6}
    >
      {/* First group of fields: one field per line */}
      <VStack spacing={6} align="stretch" mb={6}>
        <Field label="Father’s Name" value={userData?.father_name} />
        <Field label="Mother’s Name" value={userData?.mother_name} />
        <Field label="DoB (DD/MM/YYYY)" value={userData?.date_of_birth} />
      </VStack>

      {/* Second group of fields: two fields per line */}
      <VStack spacing={6} align="stretch">
        <HStack spacing={4}>
          <Field label="Gender" value={userData?.gender} />
          <Field label="Caste" value={userData?.caste} />
        </HStack>

        <HStack spacing={4}>
          <Field label="Disability" value={userData?.disability} />
          <Field label="Class" value={userData?.current_class} />
        </HStack>

        <HStack spacing={4}>
          <Field label="Annual Income" value={userData?.income} />
          <Field label="Day Scholar/Hostler" value={userData?.student_type} />
        </HStack>
      </VStack>
    </Box>
  );
};

export default UserDetails;
