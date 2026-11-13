export const backendUrl =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const cmsUrl = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:1337";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const EVENT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80";
