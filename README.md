# Thesis E-commerce System

Full-stack e-commerce platform with:
- JWT authentication and session management
- Product catalog and product detail pages
- Cart and checkout pipeline
- Voucher/discount handling
- MoMo payment integration (create payment + IPN callback)
- Real-time customer support chat with AI + staff handoff (Socket.IO)
- Redis-based reservation/expiry flows for stock and voucher safety

## Tech Stack
- Backend: Node.js, Express, Sequelize (ESM), PostgreSQL
- Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui
- Realtime: Socket.IO
- Cache/coordination: Redis
- AI provider: OpenAI or OpenRouter (configurable)

## Repository Structure
```text
thesis-ecommerce-system/
|- src/                               # Backend source
|  |- api/v1/
|  |  |- routes/                      # REST endpoints
|  |  |- controllers/                 # Request handlers
|  |  |- services/                    # Business logic
|  |  |- reponsitories/               # Data access layer
|  |  |- models/                      # Sequelize models
|  |  `- websocket/                   # Socket.IO handlers
|  |- monitor/
|  `- app.js
|- server.js                          # Backend bootstrap
|- md/ecommerce.sql                   # PostgreSQL schema
|- front-end from Lovable/            # Main React frontend
|- chat-test-client/                  # Standalone chat test UI
`- README.md
```

## Core Features
- Auth: register, verify email, login, refresh token, logout, forgot/reset password.
- Catalog: list products, product detail by slug, filter metadata.
- Cart: add item, update quantity, remove item, get user cart.
- Checkout: preview totals and discounts, place order, poll order status.
- Payment: MoMo create payment flow, IPN verification, redirect relay.
- Chat: active session, history, request human support, staff workload/availability.
- Realtime: customer/staff socket rooms, heartbeat, session assignment.

## Prerequisites
- Node.js 18+ and Yarn
- PostgreSQL 14+
- Redis 7+

## Backend Setup
1. Install dependencies:
```bash
yarn install
```

2. Create PostgreSQL database (example name: `ecommerce`).

3. Import schema:
```bash
psql -U <db_user> -d ecommerce -f md/ecommerce.sql
```

4. Create `.env` in the project root.

5. Start Redis:
```bash
docker run -d --name redis-server -p 6379:6379 redis:7 redis-server --notify-keyspace-events Ex
```

6. Run backend:
```bash
yarn start
```

Alternative (native watch mode):
```bash
yarn watch
```

Backend default API base: `http://localhost:3030/api/v1`

## Frontend Setup
The primary frontend is in `front-end from Lovable`.

1. Install frontend dependencies:
```bash
cd "front-end from Lovable"
npm install
```

2. Create frontend `.env` (or `.env.local`):
```env
VITE_API_BASE_URL=http://localhost:3030/api/v1
VITE_WS_URL=http://localhost:3030
```

3. Start frontend:
```bash
npm run dev
```

## Required Backend Environment Variables
Minimum variables required by config validation:

```env
NODE_ENV=development

DEV_APP_PORT=3030
PRO_APP_PORT=3030

DEV_DB_USER=postgres
DEV_DB_PASSWORD=your_password
DEV_DB_NAME=ecommerce
DEV_DB_HOST=127.0.0.1
DEV_DB_PORT=5432

PRO_DB_USER=postgres
PRO_DB_PASSWORD=your_password
PRO_DB_NAME=ecommerce
PRO_DB_HOST=127.0.0.1
PRO_DB_PORT=5432

JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=30d
JWT_ACCESS_TOKEN_SECRET=replace_me
JWT_REFRESH_TOKEN_SECRET=replace_me
ALGORITHM=HS256

EMAIL_ADMIN=your_email@example.com
EMAIL_APP_PASSWORD=your_email_app_password

APP_URL=http://localhost:5173
```

Chat/AI options:
```env
CHAT_ENABLED=true
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=upstage/solar-pro-3:free

# or OpenAI
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```

Payment options (MoMo):
```env
BACKEND_PUBLIC_URL=http://localhost:3030
MOMO_API_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_PARTNER_CODE=...
MOMO_ACCESS_KEY=...
MOMO_SECRET_KEY=...
MOMO_PARTNER_NAME=Thesis Ecommerce
MOMO_STORE_ID=ThesisStore
MOMO_REQUEST_TYPE=captureWallet
MOMO_REDIRECT_URL=http://localhost:5173/checkout/result
MOMO_IPN_URL=http://localhost:3030/api/v1/payment/momo/ipn
MOMO_AMOUNT_MULTIPLIER=1000
```

## Main API Modules
Base path: `/api/v1`

- Auth: `/auth/*`
  - `POST /register`
  - `GET /verify-email`
  - `POST /login`
  - `POST /refresh-token`
  - `POST /logout`
  - `POST /forgot-password`
  - `POST /verify-otp`
  - `POST /reset-password`
- Catalog: `/catalog/*`
  - `GET /products`
  - `GET /products/:slug`
  - `GET /filters`
- Cart: `/cart/*`
  - `POST /add`
  - `GET /`
  - `PATCH /items/:cartItemId`
  - `DELETE /items/:cartItemId`
- Checkout: `/checkout/*`
  - `GET /preview`
  - `POST /place-order`
  - `GET /order-status/:orderId`
- Payment: `/payment/*`
  - `POST /momo/ipn`
  - `GET /momo/redirect`
- Chat: `/chat/*`
  - `GET /session/active`
  - `GET /session/:sessionUuid/history`
  - `POST /session/:sessionUuid/request-human`
  - `POST /session/:sessionUuid/close`
  - `POST /staff/availability`
  - `GET /staff/workload`

## Socket.IO Notes
- Socket server is initialized in `server.js`.
- CORS origin uses `APP_URL`.
- Staff heartbeat and auto-assignment are enabled.
- Keep Redis running for reservation and chat-related state handling.

## Optional Chat Test Client
For quick socket/API chat testing without running the main frontend:

```bash
npx serve chat-test-client -l 5501
```

Then set backend:
```env
APP_URL=http://localhost:5501
```

Open: `http://localhost:5501`

## Useful Commands
- Start backend: `yarn start`
- Start backend (watch mode): `yarn watch`
- Frontend dev: `npm run dev` (inside `front-end from Lovable`)
- Frontend build: `npm run build` (inside `front-end from Lovable`)
- Frontend tests: `npm run test` (inside `front-end from Lovable`)

## Troubleshooting
- `Invalid environment variables`: check `.env` keys and types against config requirements.
- CORS/socket connection blocked: ensure `APP_URL` matches your frontend origin exactly.
- Checkout fails at reservation/payment: ensure Redis is running and reachable at `redis://localhost:6379`.
- Payment callback issues: verify `MOMO_IPN_URL` is publicly reachable when testing real callbacks.
