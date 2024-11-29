import React, { createContext, useState, useEffect, ReactNode } from "react";
import { getToken } from "../../services/auth/asyncStorage";

// Define types for the context
interface AuthContextType {
  isLoggedIn: boolean;
  checkToken: () => Promise<void>;
  setIsLoggedIn: (status: boolean) => void;
  userData: UserData | null;
  documents: string[];
  updateUserData: (user: UserData, docs: string[]) => void;
  updateApplicationId: (id: string) => void;
  applicationId: string | null;
  removeContextData: () => void;
}

// Define UserData type
interface UserDocument {
  doc_id: string;
  user_id: string;
  doc_type: string;
  doc_subtype: string;
  doc_name: string;
  imported_from: string;
  doc_path: string;
  doc_data: string; // You can parse this JSON string into an object when needed
  doc_datatype: string;
  doc_verified: boolean;
  uploaded_at: string;
  is_uploaded: boolean;
  length?: number;
}
interface UserData {
  docs: UserDocument;
  user_id?: string;
  name?: string;
  class?: string;
  previousYearMarks?: string;
  phoneNumber?: string;
  fatherName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  // Add any other fields that your user data object might have
}

// Initial default value for context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [documents, setDocuments] = useState<string[]>([]);

  // Function to check token and update login status
  const checkToken = async () => {
    try {
      const token = await getToken();
      setIsLoggedIn(!!token?.token);
    } catch (error) {
      console.error("Error retrieving token:", error);
      setIsLoggedIn(false);
    }
  };

  const updateUserData = (user: UserData, docs: string[]) => {
    setUserData(user);
    setDocuments(docs);
  };

  const updateApplicationId = (id: string) => {
    setApplicationId(id);
  };

  const removeContextData = () => {
    setApplicationId(null);
    setDocuments([]);
    setUserData(null);
  };

  useEffect(() => {
    checkToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        checkToken,
        setIsLoggedIn,
        userData,
        documents,
        updateUserData,
        updateApplicationId,
        applicationId,
        removeContextData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easier usage of context
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, AuthContext };
