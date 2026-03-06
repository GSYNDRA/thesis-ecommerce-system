type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestHeaders = Record<string, string>;

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: RequestHeaders;
  accessToken?: string | null;
  retryOn401?: boolean;
  _retried?: boolean;
}

export class ApiError extends Error {
  statusCode: number;
  data: unknown;

  constructor(message: string, statusCode: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

const API_BASE_URL_FALLBACK = "http://localhost:3030/api/v1";
const WS_URL_FALLBACK = "http://localhost:3030";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || API_BASE_URL_FALLBACK).replace(/\/+$/, "");
export const WS_URL = (import.meta.env.VITE_WS_URL || WS_URL_FALLBACK).replace(/\/+$/, "");

type UnauthorizedHandler = (params: {
  path: string;
  options: RequestOptions;
}) => Promise<string | null>;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

function createUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function buildHeaders(options: RequestOptions): Headers {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  return headers;
}

async function parseResponseData(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    return text || null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requestInit: RequestInit = {
    method: options.method || "GET",
    headers: buildHeaders(options),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  };

  const response = await fetch(createUrl(path), requestInit);

  if (
    response.status === 401 &&
    options.retryOn401 !== false &&
    !options._retried &&
    unauthorizedHandler
  ) {
    const newAccessToken = await unauthorizedHandler({ path, options });

    if (newAccessToken) {
      return request<T>(path, {
        ...options,
        accessToken: newAccessToken,
        _retried: true,
      });
    }
  }

  const data = await parseResponseData(response);

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}`;
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? ((data as { message: string }).message || fallbackMessage)
        : fallbackMessage;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "POST", body }),

  put: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "PUT", body }),

  patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
