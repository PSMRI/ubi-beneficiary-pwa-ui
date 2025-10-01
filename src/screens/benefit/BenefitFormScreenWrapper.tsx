import React from "react";
import { useLocation, useParams } from "react-router-dom";
import BenefitFormScreen from "./BenefitFormScreen";
import Loading from "../../components/common/Loading";

const BenefitFormScreenWrapper: React.FC = () => {
  const { id, bpp_id } = useParams<{ id: string; bpp_id: string }>();
  const location = useLocation();
  const state = location.state || {};

  // Fallback loading if data is missing
  if (!state.selectApiResponse && !state.schemaData) {
    // Fetch schema or user payload here
    return <Loading />;
  }
  if (!state.userData) {
    // Fetch user data here
    return <Loading />;
  }

  // Use either selectApiResponse or schemaData as per your data structure
  return (
    <BenefitFormScreen
      selectApiResponse={state.selectApiResponse || state.schemaData}
      userData={state.userData}
      benefitId={id}
      bppId={state.bppId || bpp_id}
      context={state.context}
    />
  );
};

export default BenefitFormScreenWrapper;
