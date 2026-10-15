# Neighborly marketplace

Neighborly is a mobile-first service marketplace with separate End User, Client, Agent, Admin and Super Admin workspaces. This implementation uses **React**, **Node.js + Express**, **PostgreSQL**, and **JWT sessions**. It lives in this marketplace repository, separate from the Ticketing Platform repository.

## Structure

```text
backend/
  src/
    db/                  PostgreSQL pool, schema and Super Admin bootstrap
    middleware/          JWT authentication and role checks
    routes/              OTP, marketplace, operations and payment APIs
    services/             Twilio / MSG91 delivery adapter
    server.js             Express API
database/
  schema.sql             PostgreSQL schema and starter plans
frontend/
  src/                   React portals, responsive UI
  vite.config.js         Dev server and API proxy
.env.example
```

## Local setup

Requires Node.js 20+ and PostgreSQL 14+.

1. Create a PostgreSQL database and user, then copy `.env.example` to `.env`. Set `DATABASE_URL`, `JWT_SECRET`, `OTP_PEPPER`, and `BOOTSTRAP_SUPER_ADMIN_MOBILE`. The JWT secret and OTP pepper must be different random values; use at least 32 characters for `JWT_SECRET`.

   Example SQL to run as a PostgreSQL administrator (choose a new local password):

   ```sql
   CREATE USER neighborly WITH PASSWORD 'replace-this-local-password';
   CREATE DATABASE neighborly OWNER neighborly;
   ```
2. Install the dependencies from this repository:

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

## Login and OTP

The login page has one **Admin portal** choice. The signed-in database role decides whether an Admin or Super Admin dashboard is shown. Client, End User and Agent accounts also use mobile OTP. Newly verified Client accounts can fill out their profile; an Admin must approve the business before it can go online and receive orders.

OTP codes expire after 5 minutes, allow at most 3 verification attempts, and can be resent after 30 seconds. Only a hash of each OTP is stored. JWTs expire after 12 hours; every JWT is backed by a revocable database session. In development, when no SMS provider is configured, the API logs a demo OTP and returns it to the UI. Production requires Twilio or MSG91 credentials and never returns the OTP in the API response.

Configure either Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`) or MSG91 (`MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `MSG91_SENDER_ID`) in `.env`.

## Roles and included workflows

- **Super Admin:** manage Admin accounts and permissions, subscription plans, platform settings, payment history, refunds, and revenue reports.
- **Admin:** create/edit/block clients, end users and agents; approve Client businesses; inspect all orders and customer map coordinates; assign agents and track order statuses.
- **Client:** maintain its business details and map coordinates, configure its radius (3 km by default), go online after approval, and accept nearest-first requests inside that radius.
- **End User:** find nearby approved Clients, place an order with latitude, longitude and address, track/cancel requests, and open the saved map location.
- **Agent:** see assigned orders, update progress, and open turn-by-turn directions to the customer's coordinates.

The 3 km order filter uses the Haversine formula in PostgreSQL and reads each Client's `radius_km` value. Orders outside that distance are omitted from that Client's nearby list.

## Payment setup

Plans and payment records are stored in PostgreSQL. Configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to enable Razorpay checkout and refunds. The webhooks/production payment reconciliation path still needs to be configured for the live account before accepting real payments.

## Main API routes

All protected endpoints require `Authorization: Bearer <JWT>`.

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
