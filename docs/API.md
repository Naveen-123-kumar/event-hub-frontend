# EventHub API map

Base: `http://localhost:5000`

The Next.js BFF at `/api/v1/*` proxies these paths and sets `eh_access` / `eh_refresh` httpOnly cookies on login.

## Auth (`/api/auth`)

| Method | Path | Auth |
|--------|------|------|
| POST | /register | no |
| POST | /login | no |
| POST | /refresh-token and /refresh | no |
| POST | /logout | no |
| POST | /forgot-password | no |
| POST | /reset-password | no |
| POST | /generate-otp | no |
| POST | /validate-otp | no |
| POST | /verify-email | no |
| GET | /google, /google/callback | no |
| GET | /linkedin, /linkedin/callback | no |

## Events `/api/events`

Public GET lists **published** events with `page`, `limit`, `q`, `city`, `sort`.
Org users see their drafts too. POST/PATCH/PUT/DELETE require JWT + RBAC.

## Tickets `/api/tickets`

GET `/events/:eventId` is public. Writes require organizer roles.

## Bookings `/api/bookings`

POST `/`, GET `/` and `/me`, GET `/:id`, PATCH or POST `/:id/cancel`.

## Payments `/api/payments`

POST `/create`, `/verify` (JWT). POST `/webhook` is unauthenticated and **idempotent** on Razorpay `eventId`.

## CMS (Strapi :1337)

GET `/api/faqs`, `/api/promotional-banners?populate=image`, `/api/static-pages`, `/api/event-guidelines`, `/api/terms-and-conditions`.
