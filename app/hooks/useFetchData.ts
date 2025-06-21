import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Network } from "@/src/api";
import useLoader from "./useLoader";
import useToast from "./useToast";
import { useState } from "react";

interface FetchDataParams {
  URL: string;
  key: (string | object | boolean)[];
  page?: number;
  enabled?: boolean;
}

interface FetchResponse {
  data: any;
  isLoading: boolean;
  status?: number | null;
}

const useFetchData = ({ URL, key, page, enabled }: FetchDataParams): FetchResponse => {


  const [status, setStatus] = useState<number | null>(null)

  const getData = async () => {

    const response = await Network.get(URL);

    if (!response.ok) {
      setStatus(response.status || null)
      throw new Error(response.data.error || 'Something went wrong');
    }
    return {
      data: response.data,
      status: response.status
    };
  };

  const { isLoading, error, data } = useQuery({

    queryKey: [key, page],
    queryFn: getData,
    enabled,
    onSettled: () => {
      return null
    }
  });



  if (error) {
    console.log(error);
  }

  console.log(data, 'llllll')

  return {
    data: data?.data,
    isLoading,
    status: status
  };
};

export default useFetchData;
