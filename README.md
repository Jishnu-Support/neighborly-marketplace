# Neighborly

Neighborly is a standalone local discovery marketplace for finding products and services from nearby, subscribed businesses. It has separate discovery, business, agent and company-administration views.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use the workspace switcher in the left sidebar to move between portals.

## Demo behavior

- Search the sample directory by product, service, business name, category and subcategory; adjust the radius and explicitly request device location access. Without permission, distances are sample values around a demo Bengaluru area. With permission, the app uses the device coordinates in memory to filter the directory's clearly synthetic sample coordinates; neither coordinate is saved or sent to a server.
- Save favorite businesses, recent searches, product enquiries, catalogue edits, checkout previews and minimized demo activity records in this browser's local storage. They are not synced, transmitted or linked to a verified account.
- Preview business registration, product/service catalogue management, referral tools, company reporting and subscription checkout.
- The sign-in and OTP forms are UI demonstrations only. No account, credential or phone number is stored and no OTP is delivered.
- Checkout previews do not contact a payment gateway, accept payment details, charge money or activate a subscription.
- The SOS demo does not dispatch an emergency message. It can open the phone/SMS app for the user to review and send. For immediate danger in India, call 112.
- To clear local demo data, remove the `neighborly-demo-v1` entry from this browser's local storage.

## Before production

This repository is a frontend MVP, not a production service. Before launch, connect and test:

- A secure backend and database with role-based access controls for customers, business owners, agents and company administrators.
- A trusted identity provider for phone verification, OTP delivery, passcode/password handling, account recovery and session management.
- A geospatial business directory and search API, including verified business locations, subscription eligibility and distance calculations.
- A payment provider with server-created orders, signed webhook verification, subscription lifecycle handling, invoices and refunds.
- Consent-aware, access-controlled audit events with data minimization, retention limits and user-facing privacy controls.
- Business-document review, agent referral attribution and payout rules.
- A regionally verified emergency workflow and emergency-contact management. Do not represent an SOS as delivered unless dispatch has been confirmed.

Keep provider secrets and sensitive customer data on the server; do not place them in client-side code.
