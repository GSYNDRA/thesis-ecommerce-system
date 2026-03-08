# Chat Feature QA Matrix

Date: 2026-03-06

## Results Summary

- Automated build: pass
- Static route/guard verification: pass
- Manual browser E2E: pending (needs live backend + user accounts)

## Checklist

| Area | Check | Result | Notes |
|---|---|---|---|
| Customer screens | Launcher, AI chat, waiting, assigned, reassigning, closed render states | PASS | Implemented in `/support/chat` with state-driven UI |
| Staff screens | Dashboard, availability/workload, assigned room, lost-session overlay | PASS | Implemented in `/staff/support` and `/staff/support/room/:sessionUuid` |
| Role access | Customer-only and staff-only routes enforced | PASS | `CustomerOnlyRoute`, `StaffOnlyRoute`, `/staff/*` guard |
| Forbidden role | Wrong role redirected to `/403` | PASS | Route guard behavior |
| Auth expiry REST | Unauthorized API triggers logout redirect | PASS | Hooks clear auth session on `UNAUTHORIZED` |
| Auth expiry socket | Unauthorized socket connect forces logout flow | PASS | `onConnectError` -> clear session + unauthorized state |
| Pagination customer | History paging with `limit/offset` | PASS | `Load More History` via REST |
| Pagination staff | History paging with `limit/offset` | PASS | `Load More History` via REST |
| History access denial | Non-owner/non-assigned handling | PASS | customer blocked notice on `/support/chat`, staff redirected to `/staff/support` |
| No staff available | Persistent waiting message | PASS | `waiting_human` banner maintained |
| Reassignment | Reassigning transition on socket events | PASS | `chat:reassigning` and `chat:assigned` transitions |
| Closed chat safety | Sending disabled when closed | PASS | Composer disabled for closed state |
| Restart flow | Closed -> new session via active session + init | PASS | `restartSession()` triggers GET active + reconnect/init |
| Listener cleanup | Prevent duplicate listeners on navigation | PASS | Hooks unsubscribe + disconnect on unmount |
| Production compile | Frontend build | PASS | `npm run build` successful |

## Known Gaps (Manual Verification Needed)

1. End-to-end payment unrelated flows not re-verified in this pass.
2. Real multi-actor chat race conditions require manual two-browser tests:
   - staff disconnect while customer typing
   - multiple staff availability toggles
3. Browser-specific socket header mode behavior should be validated if using `Authorization` header transport in browser runtime.

