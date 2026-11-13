import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/lib/config";
import { mapBffPathToBackend } from "@/lib/http/endpoints";

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const targetPath = mapBffPathToBackend(path);
  const url = new URL(targetPath, backendUrl);
  req.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("x-request-id", req.headers.get("x-request-id") ?? crypto.randomUUID());

  const incomingAuth = req.headers.get("authorization");
  const cookieToken = req.cookies.get("eh_access")?.value;
  if (incomingAuth) headers.set("authorization", incomingAuth);
  else if (cookieToken) headers.set("authorization", `Bearer ${cookieToken}`);

  const method = req.method;
  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await req.text() : undefined;

  const isOauthRedirect =
    method === "GET" &&
    (targetPath.endsWith("/auth/google") ||
      targetPath.endsWith("/auth/linkedin") ||
      targetPath.includes("/auth/google/callback") ||
      targetPath.includes("/auth/linkedin/callback"));

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: isOauthRedirect ? "manual" : "follow",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Backend unavailable", code: "UPSTREAM_DOWN" },
      { status: 503 },
    );
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get("location");
    if (location) {
      return NextResponse.redirect(location, upstream.status as 302 | 301 | 303 | 307 | 308);
    }
  }

  const text = await upstream.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }

  const res = NextResponse.json(json, { status: upstream.status });

  if (targetPath.endsWith("/login") || targetPath.endsWith("/refresh-token")) {
    const payload = json as { data?: { accessToken?: string; refreshToken?: string } };
    const access = payload.data?.accessToken;
    const refresh = payload.data?.refreshToken;
    if (access) {
      res.cookies.set("eh_access", access, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 12,
      });
    }
    if (refresh) {
      res.cookies.set("eh_refresh", refresh, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }
  }

  if (targetPath.endsWith("/logout")) {
    res.cookies.delete("eh_access");
    res.cookies.delete("eh_refresh");
  }

  return res;
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
