# Bizearch marketplace

Bizearch is a mobile-first service marketplace with End User, Client, Agent, Admin and Super Admin workspaces. The existing platform uses **React**, **Node.js + Express**, **PostgreSQL** and **JWT sessions**. This repository also includes a separate local **Next.js marketplace demo** in `app/`; it does not connect to the Express API or PostgreSQL backend. The intended public domain is <https://bizearch.in>; DNS and hosting must be configured before production.

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

### Demo behavior

- Opening the Next.js app requires sign-in. The home page redirects signed-out visitors to the login page, where they can choose Customer, Business, Agent or Company access; demo credentials are shown on each login form.
- Search the synthetic directory by product, service, business name, category and subcategory; adjust the radius and explicitly request device location access. Without permission, distances are sample values around a demo Bengaluru area. With permission, the app uses device coordinates in memory to filter synthetic sample coordinates; neither coordinate is saved or sent to a server.
- Save favorites, recent searches, product enquiries, catalogue edits, checkout previews and activity records in this browser's local storage. They are not synced or linked to a verified account.
- Preview business registration, product/service catalogue management, referral tools, company reporting and subscription checkout.
- Company Admins can upload PNG, JPEG, or WebP manufacturer logos (up to 2 MB) in the category manager; the images and category-logo mapping are stored locally by the Next.js demo server and appear in category browsing and selection trees. Configure a shared persistent media store before deploying multiple instances.
- Manufacturer tiles use the TVS horse mark and Hero “H” mark from their official sites by default; custom Company Admin uploads override these defaults. The marks are trademarks of their respective owners.
- The sign-in and OTP forms are demonstrations; no active customer account is created and no OTP is delivered. Registration requests and consented location are stored in local demo files. Two emergency contact numbers are kept in the browser's local storage until an SOS is submitted.
- Checkout previews do not contact a payment gateway, accept payment details, charge money or activate a subscription.
- The SOS demo records an alert and shared device coordinates in a local server file visible to Super Admins. Call links open the user's phone app, and SMS links prepare messages with coordinates; the user must confirm every call and message. Bizearch does not automatically dispatch or confirm them. For immediate danger in India, call 112.
- To clear local demo data, remove the `neighborly-demo-v1` entry from this browser's local storage.

Before connecting this demo to production, implement and test secure account/session management, verified business onboarding, consent-aware geospatial search, payment-provider integrations, access-controlled audit records and verified emergency dispatch. Keep secrets and sensitive customer data on the server.

## Login and OTP

The existing React app has one **Admin portal** choice. The signed-in database role decides whether an Admin or Super Admin dashboard is shown. Client, End User and Agent accounts also use mobile OTP. Newly verified Client accounts can fill out their profile; an Admin must approve the business before it can go online and receive orders.

OTP codes expire after 5 minutes, allow at most 3 verification attempts and can be resent after 30 seconds. Only a hash of each OTP is stored. JWTs expire after 12 hours; every JWT is backed by a revocable database session. In development, when no SMS provider is configured, the API logs a demo OTP and returns it to the UI. Production requires Twilio or MSG91 credentials and never returns the OTP in the API response.

Configure either Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`) or MSG91 (`MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `MSG91_SENDER_ID`) in `.env`.

## Roles and included workflows

- **Super Admin:** manage Admin accounts and permissions, subscription plans, platform settings, payment history, refunds and revenue reports.
- **Admin:** create/edit/block clients, end users and agents; approve Client businesses; inspect orders and customer map coordinates; assign agents and track order statuses.
- **Client:** capture and save the business map pin to PostgreSQL with the business name and products/services description, configure a radius (3 km by default), go online after approval and accept nearest-first requests within that radius.
- **End User:** search nearby approved providers by business name or products/services description, view a provider's saved location in an in-app map popup, open turn-by-turn directions, place an order with latitude, longitude and address, and track/cancel requests.
- **Agent:** see assigned orders, update progress and open turn-by-turn directions to the customer's coordinates.

The 3 km order filter uses the Haversine formula in PostgreSQL and reads each Client's `radius_km` value. Orders outside that distance are omitted from that Client's nearby list.

The React/Express marketplace stores provider coordinates in the `clients` table. Customers can search the nearby results by provider name or saved products/services description and open the provider pin in a map popup. The separate Next.js demo remains browser-local and does not share these database records.

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
