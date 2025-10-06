import React from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import BenefitFormScreen from "./BenefitFormScreen";
import Loading from "../../components/common/Loading";

const BenefitFormScreenWrapper: React.FC = () => {
  const { id, bpp_id } = useParams<{ id: string; bpp_id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  // Fallback loading if data is missing
  if (!state.selectApiResponse && !state.schemaData) {
    // Redirect to benefits list for cold loads
    navigate("/explorebenefits");
    return <Loading />;
  }
  if (!state.userData) {
    // Redirect to benefits list for cold loads
    navigate("/explorebenefits");
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
