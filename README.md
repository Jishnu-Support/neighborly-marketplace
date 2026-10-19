# Neighborly marketplace

Neighborly is a mobile-first service marketplace with End User, Client, Agent, Admin and Super Admin workspaces. The existing platform uses **React**, **Node.js + Express**, **PostgreSQL** and **JWT sessions**. This repository also includes a separate local **Next.js marketplace demo** in `app/`; it does not connect to the Express API or PostgreSQL backend. This repository is separate from the Ticketing Platform repository.

## Structure

```text
backend/
  src/
    db/                  PostgreSQL pool, schema and Super Admin bootstrap
    middleware/          JWT authentication and role checks
    routes/              OTP, marketplace, operations and payment APIs
    services/            Twilio / MSG91 delivery adapter
    server.js            Express API
database/
  schema.sql             PostgreSQL schema and starter plans
frontend/
  src/                   React portals, responsive UI
  vite.config.js         Dev server and API proxy
app/                     Next.js marketplace demo
.env.example
```

## Local setup

The original React/Express platform requires Node.js 20+ and PostgreSQL 14+.

1. Create a PostgreSQL database and user, then copy `.env.example` to `.env`. Set `DATABASE_URL`, `JWT_SECRET`, `OTP_PEPPER` and `BOOTSTRAP_SUPER_ADMIN_MOBILE`. The JWT secret and OTP pepper must be different random values; use at least 32 characters for `JWT_SECRET`.

   Example SQL to run as a PostgreSQL administrator (choose a new local password):

   ```sql
   CREATE USER neighborly WITH PASSWORD 'replace-this-local-password';
   CREATE DATABASE neighborly OWNER neighborly;
   ```
2. Install the dependencies:

   ```powershell
   npm install
   ```

3. Apply the schema and create the first Super Admin account:

   ```powershell
   npm run db:schema
   npm run db:bootstrap-admin
   ```

4. Start the Express API and React app:

   ```powershell
   npm run dev
   ```

5. Open <http://127.0.0.1:5173>. The API listens on <http://127.0.0.1:4180>.

For a production-style single server, build the React app with `npm run build`, set `NODE_ENV=production`, then run `npm start`. Express serves the `dist` directory when it exists.

## Next.js marketplace demo

The separate Next.js demo runs on <http://localhost:3000>:

```powershell
npm run dev:next
```

Use `npm run build:next` and `npm run start:next` to build and run it in production mode. The original React/Vite app remains available through `npm run dev`; its Express API, database and authentication flows are separate from this demo.

The Next.js demo searches a synthetic local directory and stores favorites, searches, enquiries, catalogue edits, checkout previews and activity in this browser's local storage. Its sign-in/OTP, checkout and SOS flows are demonstrations; it does not authenticate with the Express backend, send OTPs, process payments or dispatch emergency messages. Device location is requested only after the user chooses to use it and is not sent to a server. For immediate danger in India, call 112.

Before connecting this demo to production, implement and test secure account/session management, verified business onboarding, consent-aware geospatial search, payment-provider integrations, access-controlled audit records and verified emergency dispatch. Keep secrets and sensitive customer data on the server.

## Login and OTP

The existing React app has one **Admin portal** choice. The signed-in database role decides whether an Admin or Super Admin dashboard is shown. Client, End User and Agent accounts also use mobile OTP. Newly verified Client accounts can fill out their profile; an Admin must approve the business before it can go online and receive orders.

OTP codes expire after 5 minutes, allow at most 3 verification attempts and can be resent after 30 seconds. Only a hash of each OTP is stored. JWTs expire after 12 hours; every JWT is backed by a revocable database session. In development, when no SMS provider is configured, the API logs a demo OTP and returns it to the UI. Production requires Twilio or MSG91 credentials and never returns the OTP in the API response.

Configure either Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`) or MSG91 (`MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `MSG91_SENDER_ID`) in `.env`.

## Roles and included workflows

- **Super Admin:** manage Admin accounts and permissions, subscription plans, platform settings, payment history, refunds and revenue reports.
- **Admin:** create/edit/block clients, end users and agents; approve Client businesses; inspect orders and customer map coordinates; assign agents and track order statuses.
- **Client:** maintain business details and map coordinates, configure a radius (3 km by default), go online after approval and accept nearest-first requests within that radius.
- **End User:** find nearby approved Clients, place an order with latitude, longitude and address, track/cancel requests and open the saved map location.
- **Agent:** see assigned orders, update progress and open turn-by-turn directions to the customer's coordinates.

The 3 km order filter uses the Haversine formula in PostgreSQL and reads each Client's `radius_km` value. Orders outside that distance are omitted from that Client's nearby list.

## Payment setup

Plans and payment records are stored in PostgreSQL. Configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to enable Razorpay checkout and refunds. The webhooks/production payment reconciliation path still needs to be configured for the live account before accepting real payments.

## Main API routes

Protected endpoints require a valid JWT in the `Authorization` header.

| Area | Routes |
| --- | --- |
| Auth | `POST /api/auth/otp/request`, `POST /api/auth/otp/verify`, `GET /api/auth/me`, `POST /api/auth/logout` |
| End User | `GET /api/clients/nearby`, `POST /api/orders`, `GET /api/orders`, `PATCH /api/orders/:id/cancel` |
| Client | `GET/PATCH /api/client/profile`, `PATCH /api/client/online`, `GET /api/client/orders/nearby`, `POST /api/client/orders/:id/accept` |
| Admin | `GET /api/admin/dashboard`, `GET/POST /api/admin/users`, `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/assign` |
| Super Admin | `/api/super-admin/admins`, `/api/super-admin/plans`, `/api/super-admin/settings` |
| Payments | `/api/payments/plans`, `/api/payments/client/checkout`, `/api/payments/super-admin/transactions` |

## Notes

Map coordinates are stored explicitly in PostgreSQL and opened on OpenStreetMap from the role workspaces. Browser GPS is requested only after the user presses the location button. Do not commit `.env` or real provider/payment credentials.
