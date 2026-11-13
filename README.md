# EventHub frontend

Next.js 16 customer and organizer UI for EventHub. Talks to the Express API (`backend-node`), Strapi CMS (`event-cms`), and falls back to demo data when those services are down.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Axios (CSR via `/api/v1` BFF) + `fetch` (SSR / ISR / SSG)
- Zustand, Tailwind CSS 4, SASS tokens (`src/styles/tokens.scss`)
- `react.memo` event cards/grid, debounced search (400ms)
- Vitest, Recharts (lazy-loaded)

## Rendering

| Mode | Routes | How |
|------|--------|-----|
| **SSG** | `/about`, `/terms` | Static metadata, no request data |
| **ISR** | `/`, FAQ/banners | `'use cache'` + `cacheLife('hours')` + Strapi `fetch` revalidate |
| **SSR** | `/events`, `/events/[id]` | Server `fetch` to Express with session cookie, `generateMetadata` |
| **CSR** | checkout, payment, bookings, admin, auth | Axios → Next BFF → Express |

Search on `/events` debounces, then updates the URL so the SSR page refetches with `q`, `city`, `sort`, `page`.

## Folder structure

```
src/
  app/                 routes, sitemap, robots, BFF `/api/v1/[...path]`
  components/events    memoized cards, filters, pagination
  components/screens   CSR checkout / admin / auth
  hooks/               useDebouncedValue
  lib/http             axios-client, server-fetch, BFF path map
  lib/server           SSR events, ISR CMS
  lib/api              domain calls + mock fallback
  stores/              Zustand
  styles/              SASS tokens
```

## Screens

**Customer:** login, register, OTP verify, OAuth callback, event list/detail, ticket selection, checkout, payment, confirmation, my bookings, notifications, profile, FAQ.

**Admin:** dashboard, event management, bookings, customers, payment reports, notification monitoring, analytics.

Responsive breakpoints cover mobile, iPad, iPad Pro, laptop, and desktop (`sm` 640, `md` 768, `lg` 1024, `xl` 1280).

## Setup

```bash
cd EventHub/frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without the API running, health check fails and the app uses in-memory demo data. Sign in with any email and an 8+ character password. Use an email containing `admin` (for example `ops@admin.test`) for organizer screens.

With the API:

1. Start Mongo + MySQL and `backend-node` on port 5000.
2. Optionally start Strapi on 1337.
3. Keep `NEXT_PUBLIC_USE_MOCKS=false`.

Google/LinkedIn go through `GET /api/v1/auth/google` (BFF) which proxies Express. Express still redirects to `/oauth-success?token=`.

The BFF maps `/api/v1/events` → Express `/api/events` (same for tickets, bookings, payments). Login sets httpOnly `eh_access` / `eh_refresh` cookies for SSR.

## Rendering

| Mode | Routes |
|------|--------|
| SSR | `/events`, home event rail |
| ISR | `/faq`, homepage banners (Strapi) |
| SSG | `/about`, `/terms` |
| CSR + Axios | auth, checkout, payment, bookings, admin |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint |

## Docs in this folder

- [Architecture](./docs/ARCHITECTURE.md)
- [Production failure scenarios](./docs/FAILURE_SCENARIOS.md)
- [API map](./docs/API.md)
- [ER diagram](./docs/ER_DIAGRAM.md)
- [Postman collection](./postman/EventHub.postman_collection.json)

## Performance notes (frontend)

- Debounced catalogue search; pagination/sort/filter as query params
- `react.memo` on `EventCard` / `EventGrid`
- App Router code splitting; `next/dynamic` for Recharts
- `next/image`, sitemap.xml, robots.txt, Event JSON-LD, Open Graph
- ISR cache tags `cms-faqs` / `cms-banners`; event SSR is `cache: no-store` so ticket inventory is not served stale
- Axios interceptors refresh JWT; BFF attaches `x-request-id`
