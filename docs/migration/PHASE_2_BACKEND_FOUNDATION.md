# Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization)

This document records implementation status for **Phase 2** tasks from `FIREBASE_TO_MANUAL_SERVER_MIGRATION_PLAN.md`.

## Status Summary

| ID   | Task                                                                             | Status      | Artifact(s)                                                                                                          |
| ---- | -------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| 2.1  | Bootstrap backend app structure and environment config management                | ✅ Complete | `lib/backend/manual/env.ts`                                                                                          |
| 2.2  | Implement authentication module (email/password, hash, token/session)            | ✅ Complete | `lib/backend/manual/auth-credentials.ts`, `lib/backend/manual/auth-service.ts`, `app/api/manual/auth/login/route.ts` |
| 2.3  | Implement refresh token flow + secure cookie policy                              | ✅ Complete | `lib/backend/manual/auth-session.ts`, `app/api/manual/auth/refresh/route.ts`                                         |
| 2.4  | Implement login rate limiting + lockout policy                                   | ✅ Complete | `lib/backend/manual/rate-limit.ts`, `lib/backend/manual/auth-service.ts`                                             |
| 2.5  | Implement RBAC middleware and policy guard interface                             | ✅ Complete | `lib/backend/manual/policy-evaluator.ts`, `lib/backend/manual/authorization.ts`                                      |
| 2.6  | Implement audit logging middleware for sensitive endpoints                       | ✅ Complete | `lib/backend/manual/audit.ts`, `app/api/manual/realtime/employee/route.ts`                                           |
| 2.7  | Implement standardized error model and request validation                        | ✅ Complete | `lib/backend/manual/errors.ts`, `lib/backend/manual/validation.ts`                                                   |
| 2.8  | Write API auth integration tests (happy path + abuse path)                       | ✅ Complete | `lib/backend/manual/phase-2-tests.ts`                                                                                |
| 2.9  | Translate `firebase.rules.txt` into backend policy matrix (resource/action/role) | ✅ Complete | `lib/backend/manual/policy-matrix.ts`                                                                                |
| 2.10 | Implement policy evaluator middleware for API authorization                      | ✅ Complete | `lib/backend/manual/policy-evaluator.ts`, `lib/backend/manual/authorization.ts`                                      |
| 2.11 | Implement tenant-scoped query guards for read/write endpoints                    | ✅ Complete | `lib/backend/manual/tenant-guard.ts`, `app/api/manual/realtime/employee/route.ts`                                    |
| 2.12 | Build rule-parity test suite for critical permission scenarios                   | ✅ Complete | `lib/backend/manual/phase-2-tests.ts`                                                                                |

## Notes

- This phase establishes baseline manual-backend authz/authn foundation and route guards with in-process token stores suitable for migration iteration.
- Persistent session/refresh backing store, distributed rate-limiting, and production-grade audit sinks are intentionally deferred to later infrastructure hardening phases.
