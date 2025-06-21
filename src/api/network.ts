import client from "./configuration";

interface Headers {
  [key: string]: string;
}

interface Config {
  [key: string]: any;
}

export default {
  get: async (url: string, headers?: Headers, data?: any, config: Config = {}) => {
    if (headers) client.setHeaders(headers);

    return await client.get(url, data, config);
  },
  post: async (url: string, data: any, headers?: Headers, config: Config = {}) => {
    if (headers) client.setHeaders(headers);

    return await client.post(url, data, config);
  },
  put: async (url: string, data: any, headers?: Headers) => {
    if (headers) client.setHeaders(headers);

    return await client.put(url, data);
  },
  delete: async (url: string, data: any, headers?: Headers) => {
    if (headers) client.setHeaders(headers);

    return await client.delete(url, data);
  },
  patch: async (url: string, data: any, headers?: Headers) => {
    if (headers) client.setHeaders(headers);

    return await client.patch(url, data);
  },
};
