import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query"; 
import useLoader from "./useLoader";

import useToast from "./useToast";
import { config, multipartConfig,Network } from "@/src/api";
import { useState } from "react";
import { PostDataParams, PostResponse } from "../types";


const usePostData = ({
  URL,
  mode,
  link,
  formData = false,
  isNavigate = true
}: PostDataParams) => {

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { successToast, errorToast } = useToast();
  const [refresh, setRefresh] = useState<boolean>(false);
  

  // Define the mutation function
  const postData = async (data: any): Promise<PostResponse> => {
    let headers = undefined;
    
    // Only add special headers for multipart requests
    if (formData) {
      const multipartHeaders = (await multipartConfig()).headers;
      headers = multipartHeaders;
    }
    setIsLoading(true);
    const response = await Network[mode](URL, data, headers as any);
    setIsLoading(false);
    if (!response.ok) return { data: { error: (response.data as any)?.error }, status: 0 };

    return { data: response.data as any, status: 1 };
  };

  // Use useMutation hook
  const { mutate, mutateAsync } = useMutation({
    mutationFn: postData,
    onSuccess: (data: PostResponse) => {
      // Handle success here, if needed
      if (data?.status === 1) {
        isNavigate && router.push(link);
        successToast(data?.data?.message || 'Success');
        setRefresh(true);
      } else if (data?.status === 0) {
        errorToast(data?.data?.message || 'Error occurred');
      }
    },
    onError: (error: Error) => {
      console.log("Error:", error?.message);
    },
    onMutate: () => {

      setIsLoading(true);
    },
    onSettled: () => {

      setIsLoading(false);
    },
  });

  return { mutate, mutateAsync, isLoading, refresh };
};

export default usePostData;
