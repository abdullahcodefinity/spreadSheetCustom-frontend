// import { NavRoutes } from "../../common";
import { useQuery } from "@tanstack/react-query";
import useLoader from "./useLoader";
import { Network } from "@/src/api";


interface GetByIdParams {
  URL: string;
  key: string[];
  enabled?: boolean;
}

interface GetByIdResponse {
  data: any;
  isLoading: boolean;
}

const useGetById = ({ URL, key, enabled = true }: GetByIdParams): GetByIdResponse => {
  const { toggleLoader } = useLoader();

  const getData = async (): Promise<any> => {
    const response = await Network.get(URL);
    return response.data;
  };

  const { isLoading, error, data } = useQuery({
    queryKey: [key],
    queryFn: () => getData(),
    enabled
  });

  if (isLoading) {
    toggleLoader(true);
  }

  if (!isLoading && !error) {
    toggleLoader(false);
  }

  return { data, isLoading };
};

export default useGetById;
