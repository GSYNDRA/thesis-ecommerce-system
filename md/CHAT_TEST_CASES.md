# Chat Feature Test Cases (Backend + Standalone Client)

Use `chat-test-client/` with 3 accounts:
- `customer_1`
- `staff_A`
- `staff_B`

## Prerequisites

1. Backend running.
2. Redis + PostgreSQL running.
3. `APP_URL` equals the frontend test origin (example: `http://localhost:5501`).
4. Valid access token for each test account.

## TC01 - Customer socket connection

1. Open test client as customer.
2. Paste customer token.
3. Click `Connect Socket`.

Expected:
- Receive `ws:connected`.
- Status shows connected.

## TC02 - Create or restore active session

1. In customer tab, click `GET session/active`.
2. Click `chat:init`.

Expected:
- `sessionUuid` auto-filled.
- `chat:initialized` contains mode/status/messages.

## TC03 - AI response path

1. Customer enters message.
2. Click `chat:send`.

Expected:
- `chat:new_message` from customer.
- AI response via `chat:new_message` (and token/complete events if streaming).

## TC04 - Request human when staff available

1. In staff_A tab, connect socket.
2. Click `POST staff available=true`.
3. In customer tab, click `chat:request_human`.

Expected:
- Customer receives `chat:assigned`.
- Staff_A workload increases (`GET staff/workload`).
- Customer/staff can exchange messages in same session.

## TC05 - Auto reassign when assigned staff disconnects

1. Keep staff_B online and available.
2. Force staff_A disconnect (Disconnect button or close tab).

Expected:
- Customer receives `chat:reassigning`.
- Then receives `chat:assigned` with staff_B.
- staff_A workload decreases, staff_B increases.

## TC06 - No staff available

1. Set all staff unavailable or offline.
2. Customer requests human.

Expected:
- Response indicates no staff.
- Receive `chat:reassigning` with reason `NO_STAFF_AVAILABLE`.
- Session keeps running (no crash).

## TC07 - Close and reopen behavior

1. Customer clicks `chat:close` (or HTTP close).
2. Click `GET session/active` then `chat:init` again.

Expected:
- Close event delivered.
- Chat history still retrievable from history endpoint.
- New active session can continue AI flow.

## TC08 - Authorization guard: history

1. Customer_1 session UUID copied.
2. Login as another customer and call history for that UUID.

Expected:
- HTTP: `403 Forbidden`.
- WS init/history fetch blocked by service guard.

## TC09 - Authorization guard: staff endpoint

1. Login as customer.
2. Call `POST /api/v1/chat/staff/availability`.

Expected:
- `403 Forbidden`.

## TC10 - AI provider failure fallback

1. Temporarily set invalid AI key or force timeout.
2. Send customer message.

Expected:
- Backend does not crash.
- Flow returns fallback response and remains usable.

