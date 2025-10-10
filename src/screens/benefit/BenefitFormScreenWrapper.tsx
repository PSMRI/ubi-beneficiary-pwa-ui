import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import BenefitFormScreen from "./BenefitFormScreen";
import Loading from "../../components/common/Loading";
import { getUser } from "../../services/auth/auth";
import { getOne } from "../../services/benefit/benefits";

const BenefitFormScreenWrapper: React.FC = () => {
  const { id, bpp_id } = useParams<{ id: string; bpp_id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const [data, setData] = useState(state);

  useEffect(() => {
    // Guard: redirect if required params are missing
    if (!id || !bpp_id) {
      navigate("/explorebenefits");
      return;}
    const fetchData = async () => {
      if (!data.selectApiResponse && !data.schemaData && id) {
        try {
          const [selectResponse, userResponse] = await Promise.all([
            getOne({ id, bpp_id }),
            getUser()
          ]);
          setData({
            selectApiResponse: selectResponse,
            userData: userResponse,
            context: state.context || { bpp_id, bpp_uri: import.meta.env.VITE_BPP_URL }
          });
        } catch (error) {
          console.error('Error fetching data:', error);
          navigate("/explorebenefits");
        }
      }
    };

    fetchData();
  }, [id, bpp_id, navigate, data.selectApiResponse, data.schemaData, state.context]);

  if (!data.selectApiResponse && !data.schemaData) return <Loading />;
  if (!data.userData) return <Loading />;

  return (
    <BenefitFormScreen
      selectApiResponse={data.selectApiResponse || data.schemaData}
      userData={data.userData}
      benefitId={id}
      bppId={state.bppId || bpp_id}
      context={data.context}
			isResubmit={state.isResubmit || false}
			applicationId={state.applicationId}
    />
  );
};

export default BenefitFormScreenWrapper;
