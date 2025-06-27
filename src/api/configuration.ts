import { create, ApiResponse, ApisauceInstance } from "apisauce";
import keys from "@/app/common/keys";
import { Config } from "@/app/types";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

const client: ApisauceInstance = create({
  baseURL,
});

// Automatically add bearer token to all requests except authentication endpoints
client.addAsyncRequestTransform(async (request) => {
  const token = localStorage.getItem(keys.jwttoken);
  
  // Don't add bearer token for authentication endpoints
  const authEndpoints = [
    '/auth/login',
    '/auth/admin/sign-in',
    '/auth/reset-password',
    '/auth/admin/reset-password'
  ];
  
  const isAuthEndpoint = authEndpoints.some(endpoint => 
    request.url?.includes(endpoint)
  );

  if (token && request.headers && !isAuthEndpoint) {
    request.headers["Authorization"] = `Bearer ${token}`;
  }
});


export const config = async (): Promise<Config> => {
  const token = localStorage.getItem(keys.jwttoken);

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  };
};

export const authConfig = async (token: string): Promise<Config> => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  };
};

export const multipartConfig = async (): Promise<Config> => {
  const token = localStorage.getItem(keys.jwttoken);

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "multipart/form-data",
    },
  };
};

export const blobConfig = async (): Promise<Config> => {
  const token = localStorage.getItem(keys.jwttoken);

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
      responseType: "arraybuffer",
    },
  };
};

const responseMonitor = (response: ApiResponse<any>): void => {
  if (response.status === 401) {
    localStorage.clear();
    window.location.href = "/login";
  }
};

client.addMonitor(responseMonitor);

export default client;
