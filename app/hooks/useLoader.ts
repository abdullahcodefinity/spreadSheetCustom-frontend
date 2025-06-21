import { useContext } from "react";
import { LoaderContext } from "../context";

interface LoaderContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const useLoader = () => {
  try {
    const { loading, setLoading } = useContext(LoaderContext) as LoaderContextType;

    const toggleLoader = (loadingState: boolean) => {
    return null
    };

    return { toggleLoader, loading };
  } catch (error) {
    // Return default values if hook is called outside React component
    console.error("useLoader must be used within a React component");
    return {
      toggleLoader: () => {},
      loading: false
    };
  }
};

export default useLoader;
