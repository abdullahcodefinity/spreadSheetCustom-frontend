import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import useLoader from "./useLoader";
import { multipartConfig, Network } from "@/src/api";
import useToast from "./useToast";
import useAuth from "./useAuth";
import { useState } from "react";
import { UpdateDataParams, UpdateResponse } from "../types";

const useUpdateData = ({ URL, link, isUpdate = false, formData = false }: UpdateDataParams) => {
  const [refreshUpdate, setRefreshUpdate] = useState(false);
  const { updateUser } = useAuth();
  const { toggleLoader } = useLoader();
  const { successToast, errorToast } = useToast();
  const router = useRouter();

  // Define the mutation function
  const updateData = async (data: any): Promise<UpdateResponse> => {
    let headers = undefined;
    
    // Only add special headers for multipart requests
    if (formData) {
      const multipartHeaders = (await multipartConfig()).headers;
      headers = multipartHeaders;
    }
    
    const response = await Network.put(URL, data, headers as any);
    if (!response.ok) return { data: { error: (response.data as any)?.error }, status: 0 };
    return { data: response.data as any, status: 1 };
  };

  // Use useMutation hook
  const { mutate, data } = useMutation({
    mutationFn: updateData,
    onSuccess: (data: UpdateResponse) => {
      // Handle success here, if needed
      if (data.status === 1) {
        if (data.data.message) {
          successToast(data.data.message);
        }
        if (isUpdate) {
          updateUser(data.data.user);
        }
        setRefreshUpdate(true);
        router.push(link);
      } else {
        // Only call errorToast if message exists
        if (data?.data?.message) {
          errorToast(data.data.message);
        }
      }
    },
    onError: (error: Error) => {
      console.log("Error:", error?.message);
    },
    onMutate: () => {
      toggleLoader(true);
    },
    onSettled: () => {
      toggleLoader(false);
    },
  });

  return { mutate, data ,refreshUpdate};
};

export default useUpdateData;
