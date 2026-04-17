# Phase 4 — Realtime Layer (`onSnapshot` Equivalent)

## Scope completion

| Task | Status | Implementation |
| --- | --- | --- |
| 4.1 Design realtime event contract (`added/modified/removed`) | ✅ Complete | `lib/backend/manual/realtime/types.ts`, `lib/backend/manual/realtime/event-contract.ts` |
| 4.2 Implement SSE subscription endpoint with auth + policy checks | ✅ Complete | `app/api/manual/realtime/employee/route.ts` |
| 4.3 Implement MongoDB change stream listener service | ✅ Complete | `lib/backend/manual/realtime/change-stream.ts` |
| 4.4 Implement per-user/per-role server-side filtering | ✅ Complete | `lib/backend/manual/realtime/policy.ts`, `lib/backend/manual/realtime/subscription-broker.ts` |
| 4.5 Implement reconnect + resume token handling | ✅ Complete | `lib/backend/manual/realtime/event-contract.ts`, `app/api/manual/realtime/employee/route.ts` |
| 4.6 Implement client-side `subscribe()` adapter for React hooks | ✅ Complete | `lib/backend/manual/realtime/client-subscribe.ts` |
| 4.7 Add throttling/debouncing for high-frequency event bursts | ✅ Complete | `lib/backend/manual/realtime/subscription-broker.ts` |
| 4.8 Add realtime integration tests and soak test scripts | ✅ Complete | `lib/backend/manual/phase-4-tests.ts` |
| 4.9 Enforce policy checks during realtime subscribe/stream lifecycle | ✅ Complete | `lib/backend/manual/realtime/policy.ts`, `lib/backend/manual/realtime/subscription-broker.ts`, `app/api/manual/realtime/employee/route.ts` |
| 4.10 Add tenant channel isolation and authorization tests | ✅ Complete | `lib/backend/manual/phase-4-tests.ts` |

## Notes

- Realtime channel follows a deterministic event schema with sequence + resume token for replay.
- Replay is bounded (latest 500 events) to avoid unbounded memory growth and retain reconnect safety.
- Subscriber filtering is enforced at subscribe time and on each published event.
- SSE stream now emits `snapshot`, `replay`, change operation events, and `ping` keep-alive events.
