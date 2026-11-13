/**
 * Express mounts the app at `/api`, then events/tickets/bookings again at `/api/...`.
 * The Next BFF (`/api/v1`) hides that double prefix from the UI.
 */
export function mapBffPathToBackend(segments: string[]) {
  const [head, ...rest] = segments;
  const suffix = rest.length ? `/${rest.join("/")}` : "";

  switch (head) {
    case "health":
      return "/api/health";
    case "auth":
      return `/api/auth${suffix}`;
    case "users":
      return `/api/users${suffix}`;
    case "organizations":
      return `/api/organizations${suffix}`;
    case "events":
      return `/api/events${suffix}`;
    case "tickets":
      return `/api/tickets${suffix}`;
    case "bookings":
      return `/api/bookings${suffix}`;
    case "payments":
      return `/api/payments${suffix}`;
    default:
      return `/api/${segments.join("/")}`;
  }
}

export const bff = {
  health: "/api/v1/health",
  auth: "/api/v1/auth",
  events: "/api/v1/events",
  tickets: "/api/v1/tickets",
  bookings: "/api/v1/bookings",
  users: "/api/v1/users",
  organizations: "/api/v1/organizations",
  payments: "/api/v1/payments",
};
