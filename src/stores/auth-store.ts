"use client";

import { create } from "zustand";
import { decodeAccessToken } from "@/lib/jwt";
import { tokenStore } from "@/lib/api/client";
import { loginRequest } from "@/lib/api/services";
import { apiClient } from "@/lib/http/axios-client";
import type { AuthUser, UserRole } from "@/lib/types";

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  hydrate: () => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  setSession: (accessToken: string, refreshToken: string, email?: string) => AuthUser | null;
  logout: () => void;
}

function userFromToken(accessToken: string, email?: string): AuthUser | null {
  const payload = decodeAccessToken(accessToken);
  if (!payload) return null;
  return {
    id: payload.userId,
    role: payload.role as UserRole,
    organizationId: payload.organizationId,
    email: email ?? payload.email ?? "signed-in@eventhub",
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  hydrate: () => {
    const access = tokenStore.getAccess();
    const user = access ? userFromToken(access) : null;
    set({ user, hydrated: true });
  },
  login: async (email, password) => {
    const tokens = await loginRequest(email, password);
    tokenStore.setTokens(tokens.accessToken, tokens.refreshToken);
    const user = userFromToken(tokens.accessToken, email);
    if (!user) throw new Error("Could not read session");
    set({ user, hydrated: true });
    return user;
  },
  setSession: (accessToken, refreshToken, email) => {
    tokenStore.setTokens(accessToken, refreshToken);
    const user = userFromToken(accessToken, email);
    set({ user, hydrated: true });
    return user;
  },
  logout: () => {
    void apiClient.post("/auth/logout").catch(() => undefined);
    tokenStore.clear();
    set({ user: null, hydrated: true });
  },
}));
