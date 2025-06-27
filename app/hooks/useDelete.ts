import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Network } from "@/src/api";
import useToast from "./useToast";
import { useRouter } from "next/navigation";
import useLoader from "./useLoader";
import { useState } from "react";
import { DeleteParams, DeleteResponse } from "../types";


const useDelete = ({ URL, key, link }: DeleteParams) => {
  const { successToast, errorToast } = useToast();
  const [refreshDelete, setRefreshDelete] = useState(false);

  const router = useRouter();
  const { toggleLoader } = useLoader();
  const queryClient = useQueryClient();


  const deleteData = async (id: number | string | null): Promise<DeleteResponse> => {
    const url = id ? `${URL}/${id}` : URL;
    const response = await Network.delete(url, {}, {});
    if (!response.ok) return { data: { error: response.data as string }, status: 0 };
    return { data: { message: response.data as string }, status: 1 };
  };

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: deleteData,
    onSuccess: (data: DeleteResponse) => {
      if (data.status === 1) {
        successToast( "Deleted successfully");
        queryClient.invalidateQueries({ queryKey: key, exact: false });
        if (link) router.push(link);
        setRefreshDelete(true);
      } else {
        errorToast( "Failed to delete");
      }
    },
    onError: (err: any) => {
      errorToast(err?.message || "An error occurred during deletion");
    },
    onMutate: () => {
      toggleLoader(true);
    },
    onSettled: () => {
      toggleLoader(false);
    }
  });

  return { mutate, mutateAsync, isPending, refreshDelete };
};

export default useDelete;