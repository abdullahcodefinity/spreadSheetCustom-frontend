import { createContext } from "react";
import { AuthContextType, LoaderContextType } from "../types";


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