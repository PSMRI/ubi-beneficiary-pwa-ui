import axios from "axios";
import { getToken, removeToken } from "./ayncStorage";
import { API_BASE_URL } from "./env.dev";

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/register`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

/**
 * Login a user
 * @param {Object} loginData - Contains phone_number, password
 */
export const loginUser = async (loginData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, loginData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};
export const logoutUser = async (accessToken, refreshToken) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    await removeToken();
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const getUser = async (userId) => {
  try {
    // Destructure and retrieve the token from getToken()
    const { token } = await getToken();
    // Make the API call to fetch user data
    const response = await axios.get(
      `${API_BASE_URL}/users/get_one/${userId}?decryptData=true`,
      {
        headers: {
          Accept: "application/json", // 'application/json' is more specific and commonly used for APIs
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Return the user data from the response
    return response.data;
  } catch (error) {
    // Log more comprehensive error information
    console.error(`Failed to fetch user with ID ${userId}:`, error.message);

    // Re-throw the error for further handling if needed
    throw error;
  }
};

export const sendConsent = async (user_id) => {
  const { token } = await getToken();
  const data = {
    user_id: user_id,
    purpose: "Confirmation to access documents",
    purpose_text: "Confirmation to access documents",
    accepted: true,
  };

  const headers = {
    Accept: "*/*",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/users/consent`, data, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error:", error);
  }
};
export const getDocumentsList = async () => {
  try {
    const { token } = await getToken();
    const response = await axios.get(`${API_BASE_URL}/content/documents_list`, {
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response, "response from auth");

    // Return the documents list data
    return response;
  } catch (error) {
    console.error("Failed to fetch documents list:", error);
    throw error; // Optionally re-throw the error for further handling
  }
};
export const getApplicationList = async (searchText, user_id) => {
  try {
    // Create the request body, conditionally adding searchText if it's not empty
    const requestBody =
      searchText !== ""
        ? {
            filters: {
              user_id: user_id, // Reference the user_id variable directly
            },
            search: searchText,
          }
        : {
            filters: {
              user_id: user_id, // Reference the user_id variable directly
            },
          };

    // Send the dynamically created requestBody in the axios post request
    const { token } = await getToken();
    const response = await axios.post(
      `${API_BASE_URL}/users/user_applications_list`,
      requestBody, // Use the dynamically created requestBody
      {
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch application list:", error);
    throw error;
  }
};
export const getApplicationDetails = async (applicationId) => {
  try {
    const { token } = await getToken();
    const response = await axios.get(
      `${API_BASE_URL}/users/user_application/${applicationId}`,
      {
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch application details:", error);
    throw error;
  }
};
