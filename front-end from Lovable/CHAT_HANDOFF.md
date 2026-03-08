# Chat Feature Handoff (React)

## Routes

- Customer: `/support/chat`
- Staff dashboard: `/staff/support`
- Staff assigned room: `/staff/support/room/:sessionUuid`
- Forbidden: `/403`
- Login: `/auth/login`

## Role Guards

- `CustomerOnlyRoute`: restricts `/support/chat` to customer role.
- `StaffOnlyRoute`: restricts `/staff/*` to staff role.
- Unauthorized auth state redirects to `/auth/login`.
- Forbidden role redirects to `/403`.

## Socket Event Map

### Client emits

- `chat:init`
- `chat:send` `{ sessionUuid, content }`
- `chat:request_human` `{ sessionUuid, reason }`
- `chat:close` `{ sessionUuid }`
- `staff:availability` `{ isAvailable }`
- `ws:heartbeat`

### Server listens in frontend

- `ws:connected`
- `chat:initialized`
- `chat:new_message`
- `chat:ai_token`
- `chat:ai_message_complete`
- `chat:assigned`
- `chat:reassigning`
- `chat:closed`
- `staff:availability_updated`

## State Transition Diagram

### Customer

- `loading -> ai_mode`
- `ai_mode -> waiting_human` (human request or no staff available)
- `waiting_human -> assigned` (staff assigned)
- `assigned -> reassigning` (staff disconnect/reassignment)
- `reassigning -> waiting_human | assigned`
- `any -> closed` (chat closed)
- `any -> unauthorized` (token expired/socket unauthorized)
- `any -> forbidden` (role/session forbidden)

### Staff room

- `loading -> active`
- `active -> reassigning` (chat reassigned or pending)
- `reassigning -> active` (new assignment)
- `any -> closed`
- `any -> unauthorized`
- `any -> error` (denied room access redirects dashboard)

## Pagination

- Customer and staff room use REST history pagination with `limit` and `offset`.
- `Load More History` fetches next page and merges messages without duplicates.

## Troubleshooting

### 401 / Unauthorized

- Cause: expired access token or invalid socket auth.
- Handling: hooks call `clearAuthSession()` and redirect to `/auth/login`.

### 403 / Forbidden

- Role mismatch: redirect `/403`.
- Session access denial (not owner/not assigned):
  - customer: stay/redirect `/support/chat` with blocked notice.
  - staff: redirect `/staff/support` with blocked notice.

### Reconnect behavior

- Socket auto-reconnect is enabled.
- On reconnect (`ws:connected`), frontend re-emits `chat:init` to rejoin state/room.
- Hooks unregister listeners and disconnect socket on unmount to avoid duplicates.

