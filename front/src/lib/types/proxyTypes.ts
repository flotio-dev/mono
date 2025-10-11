export type ProxyRequest = {
  route: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
};

export type ProxyRequestBody = Record<string, ProxyRequest>;

export type ProxyResponseItem = {
  status: number;
  headers: Record<string, string[]>;
  body: unknown;
  success: boolean;
  details?: any;
  error?: any;
};

export type ProxyResponseBody = Record<string, ProxyResponseItem>;
