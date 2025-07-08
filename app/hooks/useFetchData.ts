import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Network } from "@/src/api";

import { useState } from "react";
import { FetchDataParams, FetchResponse } from "../types";


const useFetchData = ({ URL, key, page, enabled }: FetchDataParams): FetchResponse => {
  const [status, setStatus] = useState<number | null>(null)
  const getData = async () => {
    const response = await Network.get(URL);
    if (!response.ok) {
      setStatus(response.status || null)
      throw new Error((response.data as { error?: string })?.error || 'Something went wrong');
    }
    return {
      data: response.data,
      status: response.status
    };
  };
  const { isLoading, error, data,refetch } = useQuery({
    queryKey: [key, page],
    queryFn: getData,
    enabled
  });
  if (error) {
    console.log(error);
  }
  return {
    data: data?.data,
    isLoading,
    status: status,
    refetch
  };
};

export default useFetchData;
