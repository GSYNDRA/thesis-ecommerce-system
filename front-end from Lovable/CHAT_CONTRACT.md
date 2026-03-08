# Feature 3 Chat Contract (Frozen)

This file is the source of truth for frontend implementation of the AI support chat.
Do not add or rename endpoints, events, or payload fields unless backend contract is changed first.

## Auth and Roles

- All REST APIs require `Authorization: Bearer <accessToken>`.
- WebSocket token source can be one of:
  - `auth.token`
  - `Authorization` header
  - query `token`
- Frontend role map for this feature:
  - `customer`: backend role id `1` or role name `customer`
  - `staff`: any authenticated non-customer role

## REST APIs (exact)

1. `GET /api/v1/chat/session/active` (customer only)
2. `GET /api/v1/chat/session/:sessionUuid/history?limit=&offset=` (customer owner or currently assigned staff only)
3. `POST /api/v1/chat/session/:sessionUuid/request-human` with optional body field `reason` (customer only)
4. `POST /api/v1/chat/session/:sessionUuid/close` (customer owner or assigned staff)
5. `POST /api/v1/chat/staff/availability` with body field `isAvailable` (staff only)
6. `GET /api/v1/chat/staff/workload?limit=` (staff only)

## WebSocket Client Emits (exact)

- `chat:init`
- `chat:send` with `{sessionUuid, content}`
- `chat:request_human` with `{sessionUuid, reason}`
- `chat:close` with `{sessionUuid}`
- `staff:availability` with `{isAvailable}`
- `ws:heartbeat` (staff)

## WebSocket Server Emits (exact)

- `ws:connected`
- `chat:initialized`
- `chat:new_message`
- `chat:ai_token`
- `chat:ai_message_complete`
- `chat:assigned`
- `chat:reassigning`
- `chat:closed`
- `staff:availability_updated`

## Behavioral Constraints (must keep)

- Customer may start with `chat:init` without `sessionUuid`.
- Staff `chat:init` requires `sessionUuid`.
- Staff connected is not equal to available; availability must be explicitly set true.
- If no staff is available, session stays in waiting/escalation pending state.
- Heartbeat expiry or disconnect can trigger reassignment.
- Closed sessions cannot continue sending messages.

