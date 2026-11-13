# EventHub architecture

```
                  ┌──────────────────────┐
                  │ React / Next.js      │
                  │ Customer + Admin UI  │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Node.js / Express    │
                  │ REST APIs            │
                  └──────────┬───────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
     ┌─────────┐        ┌──────────┐       ┌─────────┐
     │ Redis   │        │ MongoDB  │       │ MySQL   │
     │ Cache   │        │ Events   │       │Payment  │
     └─────────┘        │ Bookings │       │Records  │
                        └──────────┘       └─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐   ┌────────────┐  ┌──────────┐
        │ Worker   │   │ Notification│  │ AWS S3   │
        │ Threads  │   │ Service     │  │ Files    │
        └──────────┘   └─────┬──────┘  └──────────┘
                             │
                             ▼
                         Nodemailer

                       ┌───────────┐
                       │ Strapi CMS│
                       └───────────┘
```

## Frontend responsibilities

- Customer and admin surfaces
- Zustand session (JWT payload) and checkout cart
- Idempotent Pay Now
- CMS reads (FAQ, banners) from Strapi
- Graceful demo mode if Express health is down

## Data ownership

| Store | Owns |
|-------|------|
| MongoDB | Users, organizations, events, tickets, bookings (holds) |
| MySQL | Payment rows, webhook events |
| Redis | Event list cache, rate limits, idempotency keys (intended) |
| S3 | Large CSV uploads and streamed reports |
| Strapi | FAQ, banners, static pages, guidelines, terms |

## Auth

Register → OTP email verify → login. Access JWT 12m, refresh 1d. Roles: `customer`, `organization_admin`, `event_manager`, `support_agent`, `super_admin`.
