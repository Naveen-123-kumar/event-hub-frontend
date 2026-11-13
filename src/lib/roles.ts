import type { UserRole } from "./types";

export const ADMIN_ROLES: UserRole[] = [
  "super_admin",
  "organization_admin",
  "event_manager",
  "support_agent",
];

export function isAdminRole(role?: UserRole) {
  return !!role && ADMIN_ROLES.includes(role);
}

export function roleLabel(role: UserRole) {
  return role.replaceAll("_", " ");
}
