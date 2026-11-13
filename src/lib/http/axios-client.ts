"use client";

import axios, { type AxiosError } from "axios";
import { tokenStore } from "@/lib/api/client";
import { isTokenExpired } from "@/lib/jwt";

/** Browser CSR client. Goes through the Next BFF so cookies + JWT stay on our origin. */
export const apiClient = axios.create({
  baseURL: "/api/v1",
  timeout: 12_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  let access = tokenStore.getAccess();
  if (access && isTokenExpired(access)) {
    access = tokenStore.getAccess();
  }
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config;
    if (!original || error.response?.status !== 401 || original.headers["x-retry"] === "1") {
      return Promise.reject(error);
    }
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) return Promise.reject(error);
    try {
      const { data } = await axios.post(
        "/api/v1/auth/refresh-token",
        { refreshToken },
        { withCredentials: true },
      );
      const access = data?.data?.accessToken ?? data?.accessToken;
      const nextRefresh = data?.data?.refreshToken ?? refreshToken;
      if (access) {
        tokenStore.setTokens(access, nextRefresh);
        original.headers.Authorization = `Bearer ${access}`;
        original.headers["x-retry"] = "1";
        return apiClient(original);
      }
    } catch {
      tokenStore.clear();
    }
    return Promise.reject(error);
  },
);

export function axiosMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Request failed";
}
