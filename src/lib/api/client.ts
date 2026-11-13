import { isTokenExpired } from "../jwt";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:1337";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function readToken(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function writeToken(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(key, value);
  else window.localStorage.removeItem(key);
}

export const tokenStore = {
  getAccess: () => readToken("eh_access"),
  getRefresh: () => readToken("eh_refresh"),
  setTokens: (access: string, refresh: string) => {
    writeToken("eh_access", access);
    writeToken("eh_refresh", refresh);
  },
  clear: () => {
    writeToken("eh_access", null);
    writeToken("eh_refresh", null);
  },
};

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken() {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const json = await res.json();
        const access = json?.data?.accessToken ?? json?.accessToken;
        const refresh = json?.data?.refreshToken ?? refreshToken;
        if (!access) return false;
        tokenStore.setTokens(access, refresh);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const hdrs = new Headers(headers);
  hdrs.set("Content-Type", "application/json");

  if (auth) {
    let access = tokenStore.getAccess();
    if (access && isTokenExpired(access)) {
      const ok = await refreshAccessToken();
      if (!ok) tokenStore.clear();
      access = tokenStore.getAccess();
    }
    if (access) hdrs.set("Authorization", `Bearer ${access}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers: hdrs });
  const json = await res.json().catch(() => ({}));

  if (res.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, init);
    }
  }

  if (!res.ok) {
    throw new ApiError(json.message ?? "Request failed", res.status);
  }
  return json as T;
}

export async function cmsFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${CMS_URL}${path}`);
  if (!res.ok) throw new ApiError("CMS request failed", res.status);
  return res.json() as Promise<T>;
}

/** Browser-only health check. Do not call from Server Components. */
export async function pingApi() {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch(`${API_URL}/api/health`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const endpoints = {
  events: "/api/events",
  tickets: "/api/tickets",
  bookings: "/api/bookings",
  auth: "/api/auth",
  users: "/api/users",
  organizations: "/api/organizations",
  payments: "/api/payments",
};
