import React from "react";
import { useLocation, useParams } from "react-router-dom";
import BenefitFormScreen from "./BenefitFormScreen";
import Loading from "../../components/common/Loading";

const BenefitFormScreenWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state || {};

  // Fallback loading if data is missing
  if (!state.selectApiResponse && !state.schemaData) return <Loading />;
  if (!state.userData) return <Loading />;

  // Use either selectApiResponse or schemaData as per your data structure
  return (
    <BenefitFormScreen
      selectApiResponse={state.selectApiResponse || state.schemaData}
      userData={state.userData}
      benefitId={id}
    />
  );
};

export default BenefitFormScreenWrapper;
