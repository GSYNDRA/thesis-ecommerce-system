# Chat Test Client (Standalone)

This folder is a standalone mini frontend for testing chat features without building your real FE.

## 1) Run backend first

Your backend must be running at `http://localhost:3030` (or update URL in UI).

## 2) Serve this folder as static site

You can use any static server. Example:

```bash
npx serve chat-test-client -l 5501
```

Open:

```text
http://localhost:5501
```

## 3) CORS requirement

WebSocket server currently uses `APP_URL` from backend env as allowed origin.
So set:

```env
APP_URL=http://localhost:5501
```

Then restart backend.

## 4) Test flow

1. Paste `accessToken` (customer or staff).
2. Click `Connect Socket`.
3. Click `GET session/active` (customer) or fill `Session UUID` manually (staff).
4. Test both HTTP and WS buttons.
5. Watch event + ack in logs panel.

## Notes

- This client is only for demo/testing.
- It is safe to keep this folder separate when you build your real frontend later.

