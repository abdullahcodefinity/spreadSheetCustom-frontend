import { createContext } from "react";

interface AuthContextType {
  token?: string;
  setToken: (token: string) => void;
  currentUser?: any;
  setCurrentUser: (user: any) => void;
}

interface LoaderContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({
  token: undefined,
  setToken: () => {},
  currentUser: undefined,
  setCurrentUser: () => {}
});

export const LoaderContext = createContext<LoaderContextType>({
  loading: false,
  setLoading: () => {}
});