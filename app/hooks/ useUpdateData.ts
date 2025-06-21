import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import useLoader from "./useLoader";
import { Network } from "@/src/api";
import useToast from "./useToast";
import useAuth from "./useAuth";

interface UpdateDataParams {
  URL: string;
  link: string;
  isUpdate?: boolean;
  formData?: boolean;
}

interface UpdateResponse {
  data: {
    message?: string;
    error?: string;
    user?: any;
  };
  status: 0 | 1;
}

const useUpdateData = ({ URL, link, isUpdate = false, formData = false }: UpdateDataParams) => {
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
    
    const response = await Network.put(URL, data, headers);
    if (!response.ok) return { data: { error: (response.data as any)?.error }, status: 0 };
    return { data: response.data as any, status: 1 };
  };

  // Use useMutation hook
  const { mutate, data } = useMutation({
    mutationFn: updateData,
    onSuccess: (data: UpdateResponse) => {
      // Handle success here, if needed
      if (data.status === 1) {
        successToast(data?.data?.message);
        if (isUpdate) {
          updateUser(data?.data?.user);
        }
        router.push(link);
      } else {
        return errorToast(data?.data?.message);
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

  return { mutate, data };
};

export default useUpdateData;
