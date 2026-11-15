# SkyKart Commerce MVP

A modular monolith starter for a responsive storefront and REST API. The React client talks to an Express API; Mongoose models and the database connection live in the root `database/` layer.

## Architecture

- `client/`: Vite, React, Tailwind, React Router and Axios.
- `server/`: Express REST API, validation, auth/RBAC, services, API docs and tests.
- `database/`: MongoDB connection, Mongoose models, indexes, seed data and ER diagram.
- Orders use price snapshots, a sandbox payment outcome and MongoDB transactions. Checkout requires an `Idempotency-Key` header.

## Setup

Requirements: Node.js 20+, npm, and MongoDB running as a replica set. Transactions do not work on a standalone MongoDB server. For local development, configure a single-node replica set (`rs0`) in MongoDB and connect with `mongodb://127.0.0.1:27017/skykart?replicaSet=rs0`. A MongoDB Atlas cluster supports transactions; use its connection string as `MONGODB_URI`. The API checks for replica-set support at startup and exits with setup guidance if it is missing.

```sh
npm install
cp server/.env.example server/.env
# Edit server/.env with a long random JWT_SECRET and your MongoDB URI.
npm run setup:data
npm run dev
```

The client is at `http://localhost:5173`, the API is at `http://localhost:4000`, and Swagger UI is at `http://localhost:4000/api-docs`.

Client-only setup: `cp client/.env.example client/.env`, then `npm --workspace client run dev`. Build with `npm run build`. Start the API for production with `npm start`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default 4000) |
| `NODE_ENV` | Runtime mode |
| `MONGODB_URI` | MongoDB replica-set connection string |
| `JWT_SECRET` | Secret used to sign access tokens |
| `JWT_EXPIRES_IN` | Access-token lifetime |
| `CLIENT_ORIGIN` | Allowed browser origin(s), comma-separated |
| `VITE_API_URL` | API base URL used by the client |
| `DEMO_MODE` | Allows simulated payment failure in production; otherwise it is limited to development and test environments. |

## Demo accounts

Seed-only credentials: `admin@example.com` / `AdminPass123!` and `customer@example.com` / `CustomerPass123!`. Change or remove these accounts before exposing a seeded database.

## Scripts

- `npm run dev`: run API and client concurrently.
- `npm start`: start the API.
- `npm run generate:images`: generate deterministic local SVG product, category, hero, and fallback images in `client/public/images/`.
- `npm run setup:data`: generate the local SVG images, then safely upsert the demo records. Generated SVGs are committed to the repository, so they are available without running this command again.
- `npm run seed`: safely upsert the demo records (run `npm run generate:images` first when starting from an empty checkout).
- `npm test`: run server Jest tests.
- `npm run build`: build the client.

The seed creates a default customer address and the `WELCOME10` and `FLAT100` demo coupons. Checkout uses cosmetic sandbox card fields only; card numbers and CVVs are never sent to or stored by the server. A demo card number ending in `0000` simulates a failed card payment.

## Known limitations

This MVP uses sandbox payment outcomes only and does not connect to a payment provider. The OpenAPI file documents core routes; additional endpoint schemas can be added as the API stabilizes. Image upload and email delivery are not included. Configure MongoDB replica-set backups and production secrets outside the repository before deployment.
