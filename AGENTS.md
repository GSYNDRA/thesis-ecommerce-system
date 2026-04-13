# AGENTS.md

## Source of Truth
- **README.md** is the authoritative reference for this project. `md/CLAUDE.md` is outdated do not rely on it.
- When in doubt, trust executable config (`package.json`, `vite.config.ts`, `config.sequelize.js`) over prose.

## Architecture
- **Backend**: Node.js + Express (ESM), entry point `server.js` → `src/app.js`
- **Frontend**: React + TypeScript + Vite + Tailwind + shadcn/ui, in `front-end from Lovable/`
- **Real-time**: Socket.IO (initialized in `server.js`, exposed as `globalThis.io`)
- **Database**: PostgreSQL (Sequelize ORM, singleton pattern) + Redis
- **AI**: OpenAI or OpenRouter (configured via `AI_PROVIDER` env var)

## Module System (Critical)
- Package uses **ES Modules** (`"type": "module"` in `package.json`)
- All `import`/`export` statements **must include the `.js` extension**
- Wrong: `import foo from './bar'`
- Correct: `import foo from './bar.js'`

## Key Commands

### Backend (root directory)
```bash
yarn install
yarn start        # nodemon dev server (auto-restart)
yarn watch        # node --watch (native watch mode)
```

### Frontend (`front-end from Lovable/`)
```bash
cd "front-end from Lovable"
npm install
npm run dev       # Vite dev server
npm run build     # Production build
npm run test      # Vitest unit tests
```

### Database
```bash
psql -U <user> -d ecommerce -f md/ecommerce.sql
docker run -d --name redis-server -p 6379:6379 redis:7 redis-server --notify-keyspace-events Ex
```

## Environment Setup
- Backend `.env` is **required** and validated by Zod at startup. Missing it throws `Error: .env file not found`.
- Frontend uses `VITE_API_BASE_URL` and `VITE_WS_URL` (not `.env` in root).
- See `README.md` for full env var documentation.

## Repo Structure
```
thesis-ecommerce-system/
|- src/api/v1/           # Backend source (routes, controllers, services, repos, models, websocket)
|- server.js             # Backend bootstrap
|- md/ecommerce.sql      # PostgreSQL schema
|- front-end from Lovable/  # Frontend (React + Vite + TS)
|- chat-test-client/     # Standalone Socket.IO chat test UI (npx serve chat-test-client -l 5501)
```

## Notable Implementation Details
- `globalThis.redisClient` and `globalThis.io` are exposed at startup for use across services
- MoMo payment IPN callback: `POST /api/v1/payment/momo/ipn`
- Redis pub/sub subscribers run on startup (`reservationExpirySubscriber`, `staffHeartbeatExpirySubscriber`)
- `CHAT_ENABLED` env var toggles the entire chat/AI system
- The frontend directory name contains a space — always quote paths: `cd "front-end from Lovable"`

## What NOT to Trust
- `md/CLAUDE.md` — contains stale info (claims auth/cart/checkout/chat/payment are "not implemented" when they are fully implemented)
