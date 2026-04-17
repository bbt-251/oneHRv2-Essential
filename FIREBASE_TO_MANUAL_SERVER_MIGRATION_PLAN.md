# Firebase to Manual Server Migration Plan

## Context

- Current stack uses Firebase Authentication, Firestore, Firestore Rules, and Firebase Storage.
- Target direction is a manually managed backend hosted on Hostinger KVM1.
- Realtime parity with Firestore `onSnapshot` is required.

## Execution Status

| Phase | Name                                                           | Status         |
| ----- | -------------------------------------------------------------- | -------------- |
| 0     | Discovery, Scope Lock, and Security Baseline                  | ✅ Complete    |
| 1     | Environment and Infrastructure Setup                           | ✅ Complete    |
| 2     | Backend Foundation (Auth, API Skeleton, Authorization)        | ✅ Complete    |
| 3     | Data Model and Migration Tooling                              | ✅ Complete    |
| 4     | Realtime Layer (`onSnapshot` Equivalent)                      | ⏳ In Progress |
| 5     | Storage Migration (Firebase Storage Replacement)              | ⏳ In Progress |
| 6     | Domain-by-Domain API Migration (Core Operations First)        | ⏳ In Progress |
| 7     | Frontend Adapter and Incremental Cutover                      | ⏳ In Progress |
| 8     | Dual-Run, Verification, and Cutover                           | ⏳ In Progress |
| 9     | Post-Cutover Hardening and Firebase Decommission              | ⏳ In Progress |

## Estimation Rules

- **Every task in this document is estimated at 4 hours or less.**
- Estimates are implementation-focused elapsed engineering time, not calendar time.
- Parallelization is possible for some tasks and can reduce calendar duration.

---

## Phase 0 — Discovery, Scope Lock, and Security Baseline

**Objective:** Build a complete migration inventory and non-functional baseline before implementation.

| ID  | Task                                                                                    | Estimate |
| --- | --------------------------------------------------------------------------------------- | -------: |
| 0.1 | Create architecture decision record (ADR) for auth, DB, storage, realtime transport     |       2h |
| 0.2 | Inventory all Firebase touchpoints (auth, firestore, rules, storage, admin SDK)         |       3h |
| 0.3 | Produce endpoint and module dependency map (employee, attendance, leave, payroll, etc.) |       3h |
| 0.4 | Define target RBAC/ABAC authorization matrix from Firestore rules                       |       4h |
| 0.5 | Define data privacy classification (PII, payroll-sensitive fields)                      |       2h |
| 0.6 | Define migration acceptance criteria and rollback triggers                              |       2h |

**Phase estimate:** 16h

---

## Phase 1 — Environment and Infrastructure Setup

**Objective:** Provision secure runtime foundations on KVM1 and supporting managed services.

| ID   | Task                                                                 | Estimate |
| ---- | -------------------------------------------------------------------- | -------: |
| 1.1  | Provision Ubuntu VM baseline hardening (users, SSH policy, firewall) |       3h |
| 1.2  | Configure reverse proxy (Nginx/Caddy), TLS, HSTS                     |       3h |
| 1.3  | Set up MongoDB environment (managed or replica set)                  |       4h |
| 1.4  | Set up Redis for queues, rate limiting, and cache                    |       2h |
| 1.5  | Configure object storage bucket and IAM/policy for signed URL usage  |       3h |
| 1.6  | Configure centralized log collection and retention                   |       3h |
| 1.7  | Configure backup routines (DB + object storage metadata snapshots)   |       3h |
| 1.8  | Configure monitoring/alerts (CPU, memory, error rate, auth failures) |       3h |
| 1.9  | Define stable API domain strategy for dev/int/staging/prod           |       2h |
| 1.10 | Configure DNS and reverse-proxy routing for environment API domains  |       3h |
| 1.11 | Define tenant routing strategy (subdomain/path/header) and standards |       3h |

**Phase estimate:** 32h

---

## Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization)

**Objective:** Stand up secure API platform and authentication system.

| ID   | Task                                                                             | Estimate |
| ---- | -------------------------------------------------------------------------------- | -------: |
| 2.1  | Bootstrap backend app structure and environment config management                |       3h |
| 2.2  | Implement authentication module (email/password, hash, token/session)            |       4h |
| 2.3  | Implement refresh token flow + secure cookie policy                              |       3h |
| 2.4  | Implement login rate limiting + lockout policy                                   |       3h |
| 2.5  | Implement RBAC middleware and policy guard interface                             |       4h |
| 2.6  | Implement audit logging middleware for sensitive endpoints                       |       3h |
| 2.7  | Implement standardized error model and request validation                        |       3h |
| 2.8  | Write API auth integration tests (happy path + abuse path)                       |       4h |
| 2.9  | Translate `firebase.rules.txt` into backend policy matrix (resource/action/role) |       4h |
| 2.10 | Implement policy evaluator middleware for API authorization                      |       4h |
| 2.11 | Implement tenant-scoped query guards for read/write endpoints                    |       4h |
| 2.12 | Build rule-parity test suite for critical permission scenarios                   |       4h |

**Phase estimate:** 43h

---

## Phase 3 — Data Model and Migration Tooling

**Objective:** Build MongoDB schema, migration scripts, and verification framework.

| ID  | Task                                                               | Estimate |
| --- | ------------------------------------------------------------------ | -------: |
| 3.1 | Define collection schemas and validation rules for core modules    |       4h |
| 3.2 | Implement migration ID strategy (`legacyId`, checksum, migratedAt) |       2h |
| 3.3 | Build Firestore export parser for core entities                    |       4h |
| 3.4 | Build transform mappers for employee and role data                 |       4h |
| 3.5 | Build transform mappers for attendance and leave data              |       4h |
| 3.6 | Build transform mappers for payroll-related entities               |       4h |
| 3.7 | Build idempotent import runner with batch/retry controls           |       4h |
| 3.8 | Build migration validation checks (counts, sampling, invariants)   |       4h |
| 3.9 | Build migration dry-run report generator                           |       3h |

**Phase estimate:** 33h

---

## Phase 4 — Realtime Layer (`onSnapshot` Equivalent)

**Objective:** Deliver server-driven realtime update channel with strict authorization.

| ID   | Task                                                             | Estimate |
| ---- | ---------------------------------------------------------------- | -------: |
| 4.1  | Design realtime event contract (`added/modified/removed`)        |       2h |
| 4.2  | Implement SSE subscription endpoint with auth + policy checks    |       4h |
| 4.3  | Implement MongoDB change stream listener service                 |       4h |
| 4.4  | Implement per-user/per-role server-side filtering                |       4h |
| 4.5  | Implement reconnect + resume token handling                      |       4h |
| 4.6  | Implement client-side `subscribe()` adapter for React hooks      |       4h |
| 4.7  | Add throttling/debouncing for high-frequency event bursts        |       3h |
| 4.8  | Add realtime integration tests and soak test scripts             |       4h |
| 4.9  | Enforce policy checks during realtime subscribe/stream lifecycle |       4h |
| 4.10 | Add tenant channel isolation and authorization tests             |       4h |

**Phase estimate:** 37h

---

## Phase 5 — Storage Migration (Firebase Storage Replacement)

**Objective:** Replace Firebase Storage with signed URL object storage architecture.

| ID  | Task                                                      | Estimate |
| --- | --------------------------------------------------------- | -------: |
| 5.1 | Define object key naming convention and metadata schema   |       2h |
| 5.2 | Implement signed upload URL endpoint                      |       3h |
| 5.3 | Implement signed download URL endpoint with auth policy   |       3h |
| 5.4 | Implement storage metadata persistence and linkage        |       3h |
| 5.5 | Build file integrity and MIME validation checks           |       3h |
| 5.6 | Build file migration utility from Firebase Storage export |       4h |
| 5.7 | Validate migrated object accessibility with policy tests  |       3h |

**Phase estimate:** 21h

---

## Phase 6 — Domain-by-Domain API Migration (Core Operations First)

**Objective:** Migrate critical business modules with phased rollout.

### 6A. Employee and Identity Domain

| ID   | Task                                                  | Estimate |
| ---- | ----------------------------------------------------- | -------: |
| 6A.1 | Implement employee CRUD + query endpoints             |       4h |
| 6A.2 | Implement employee-role linkage and permission checks |       3h |
| 6A.3 | Implement employee profile read model for dashboard   |       3h |
| 6A.4 | Write integration tests for employee domain           |       4h |

### 6B. Attendance Domain

| ID   | Task                                                | Estimate |
| ---- | --------------------------------------------------- | -------: |
| 6B.1 | Implement attendance read/write endpoints           |       4h |
| 6B.2 | Implement attendance correction/adjustment workflow |       4h |
| 6B.3 | Implement overtime request API and approvals        |       4h |
| 6B.4 | Write attendance/overtime domain tests              |       4h |

### 6C. Leave Domain

| ID   | Task                                                 | Estimate |
| ---- | ---------------------------------------------------- | -------: |
| 6C.1 | Implement leave request create/list/update endpoints |       4h |
| 6C.2 | Implement manager/HR leave approval policy checks    |       4h |
| 6C.3 | Implement leave balance consistency checks           |       4h |
| 6C.4 | Write leave domain tests                             |       4h |

### 6D. Payroll and Compensation Domain

| ID   | Task                                 | Estimate |
| ---- | ------------------------------------ | -------: |
| 6D.1 | Implement payroll settings endpoints |       4h |
| 6D.2 | Implement compensation endpoints     |       4h |
| 6D.3 | Implement employee loan endpoints    |       4h |
| 6D.4 | Write payroll/compensation tests     |       4h |

**Phase estimate (6A-6D):** 58h

---

## Phase 7 — Frontend Adapter and Incremental Cutover

**Objective:** Switch frontend data flows from Firebase SDK to backend APIs/realtime.

| ID  | Task                                                                           | Estimate |
| --- | ------------------------------------------------------------------------------ | -------: |
| 7.1 | Add gateway abstraction layer (`AuthGateway`, `DataGateway`, `StorageGateway`) |       4h |
| 7.2 | Replace auth context Firebase calls with API-based auth                        |       4h |
| 7.3 | Replace core firestore hooks with API + realtime adapter                       |       4h |
| 7.4 | Replace file upload paths with signed URL flow                                 |       3h |
| 7.5 | Add feature flags for module-level data source switching                       |       3h |
| 7.6 | Add observability logs for source-of-truth mismatch detection                  |       3h |
| 7.7 | Execute QA regression for migrated modules                                     |       4h |
| 7.8 | Implement centralized API base URL mapping by environment                      |       3h |
| 7.9 | Implement tenant-aware route resolution in frontend gateways                   |       3h |

**Phase estimate:** 31h

---

## Phase 8 — Dual-Run, Verification, and Cutover

**Objective:** De-risk production switchover with objective validation gates.

| ID  | Task                                                           | Estimate |
| --- | -------------------------------------------------------------- | -------: |
| 8.1 | Enable shadow reads and compare old/new responses              |       4h |
| 8.2 | Enable controlled dual writes for critical entities            |       4h |
| 8.3 | Build drift report dashboard (count and field mismatch)        |       4h |
| 8.4 | Run production readiness checklist and incident runbook review |       3h |
| 8.5 | Execute data freeze + final backfill + consistency checks      |       4h |
| 8.6 | Execute cutover with rollback timer and monitoring war room    |       4h |

**Phase estimate:** 23h

---

## Phase 9 — Post-Cutover Hardening and Firebase Decommission

**Objective:** Stabilize platform and safely remove Firebase dependencies.

| ID  | Task                                                        | Estimate |
| --- | ----------------------------------------------------------- | -------: |
| 9.1 | Monitor and fix cutover defects (P0/P1 triage cycle)        |       4h |
| 9.2 | Remove unused Firebase client SDK usage paths               |       4h |
| 9.3 | Remove Firebase admin SDK usage paths                       |       3h |
| 9.4 | Remove obsolete environment variables and secrets           |       2h |
| 9.5 | Finalize operational docs and ownership handoff             |       3h |
| 9.6 | Archive/decommission Firebase resources after safety window |       3h |

**Phase estimate:** 19h

---

## Program Totals

- **Total engineering estimate:** 313h
- **Tasks exceeding 4h:** **0**
- **Recommended team shape:** 2–4 engineers + 1 QA + 1 DevOps/SRE (part-time)

### Calendar Projection (Example)

- 2 engineers full-time (~70h/week combined): ~4–6 weeks
- 3 engineers full-time (~105h/week combined): ~3–5 weeks
- Add contingency buffer: +20% for unknowns and production issues

---

## Risk Register (Top)

| Risk                                             | Impact | Mitigation                                 |
| ------------------------------------------------ | ------ | ------------------------------------------ |
| Authorization parity gap vs Firestore rules      | High   | Build policy test matrix before cutover    |
| Realtime fanout overload                         | High   | SSE first, server-side filtering, batching |
| Data drift during dual-run                       | High   | Drift checks + reconciliation scripts      |
| File permission regressions                      | Medium | Signed URL policy tests + audit logs       |
| Underestimated edge cases in payroll/leave logic | High   | Business invariants + stakeholder UAT      |

---

## Definition of Done

Migration is complete when all of the following are true:

1. All critical modules run on manual backend in production.
2. Realtime updates meet functional parity for required screens.
3. Security controls (authN/authZ/audit/rate limiting) are enforced and tested.
4. Data validation and reconciliation reports are clean.
5. Firebase services are no longer required for runtime operations.

## Phase 1 Implementation Artifacts

- `infrastructure/phase-1/scripts/bootstrap-vm.sh`
- `infrastructure/phase-1/scripts/setup-runtime.sh`
- `infrastructure/phase-1/scripts/setup-datastores.sh`
- `infrastructure/phase-1/scripts/setup-observability.sh`
- `infrastructure/phase-1/scripts/backup.sh`
- `infrastructure/phase-1/nginx/api.conf`
- `infrastructure/phase-1/docs/domain-strategy.md`
- `infrastructure/phase-1/docs/tenant-routing.md`
- `infrastructure/phase-1/docs/object-storage-policy.md`
- `infrastructure/phase-1/docs/logging-retention.md`
- `infrastructure/phase-1/monitoring/alerts.yml`

## Task Status Summary Table

**Status options:** `Todo`, `In Progress`, `Completed`.

| Phase                                                            | Task ID | Task                                                                                    | Estimate | Status      |
| ---------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------- | -------: | ----------- |
| Phase 0 — Discovery, Scope Lock, and Security Baseline           | 0.1     | Create architecture decision record (ADR) for auth, DB, storage, realtime transport     |       2h | Completed   |
| Phase 0 — Discovery, Scope Lock, and Security Baseline           | 0.2     | Inventory all Firebase touchpoints (auth, firestore, rules, storage, admin SDK)         |       3h | Completed   |
| Phase 0 — Discovery, Scope Lock, and Security Baseline           | 0.3     | Produce endpoint and module dependency map (employee, attendance, leave, payroll, etc.) |       3h | Completed   |
| Phase 0 — Discovery, Scope Lock, and Security Baseline           | 0.4     | Define target RBAC/ABAC authorization matrix from Firestore rules                       |       4h | Completed   |
| Phase 0 — Discovery, Scope Lock, and Security Baseline           | 0.5     | Define data privacy classification (PII, payroll-sensitive fields)                      |       2h | Completed   |
| Phase 0 — Discovery, Scope Lock, and Security Baseline           | 0.6     | Define migration acceptance criteria and rollback triggers                              |       2h | Completed   |
| Phase 1 — Environment and Infrastructure Setup                   | 1.1     | Provision Ubuntu VM baseline hardening (users, SSH policy, firewall)                    |       3h | Todo        |
| Phase 1 — Environment and Infrastructure Setup                   | 1.2     | Configure reverse proxy (Nginx/Caddy), TLS, HSTS                                        |       3h | Todo        |
| Phase 1 — Environment and Infrastructure Setup                   | 1.3     | Set up MongoDB environment (managed or replica set)                                     |       4h | Todo        |
| Phase 1 — Environment and Infrastructure Setup                   | 1.4     | Set up Redis for queues, rate limiting, and cache                                       |       2h | Todo        |
| Phase 1 — Environment and Infrastructure Setup                   | 1.5     | Configure object storage bucket and IAM/policy for signed URL usage                     |       3h | Todo        |
| Phase 1 — Environment and Infrastructure Setup                   | 1.6     | Configure centralized log collection and retention                                      |       3h | Todo        |
| Phase 1 — Environment and Infrastructure Setup                   | 1.7     | Configure backup routines (DB + object storage metadata snapshots)                      |       3h | Todo        |
| Phase 1 — Environment and Infrastructure Setup                   | 1.8     | Configure monitoring/alerts (CPU, memory, error rate, auth failures)                    |       3h | Todo        |
| Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization) | 2.1     | Bootstrap backend app structure and environment config management                       |       3h | In Progress |
| Phase 0 — Discovery, Scope Lock, and Security Baseline           | 0.1     | Create architecture decision record (ADR) for auth, DB, storage, realtime transport     |       2h | Todo        |
| Phase 0 — Discovery, Scope Lock, and Security Baseline           | 0.2     | Inventory all Firebase touchpoints (auth, firestore, rules, storage, admin SDK)         |       3h | Todo        |
| Phase 0 — Discovery, Scope Lock, and Security Baseline           | 0.3     | Produce endpoint and module dependency map (employee, attendance, leave, payroll, etc.) |       3h | Todo        |
| Phase 0 — Discovery, Scope Lock, and Security Baseline           | 0.4     | Define target RBAC/ABAC authorization matrix from Firestore rules                       |       4h | Todo        |
| Phase 0 — Discovery, Scope Lock, and Security Baseline           | 0.5     | Define data privacy classification (PII, payroll-sensitive fields)                      |       2h | Todo        |
| Phase 0 — Discovery, Scope Lock, and Security Baseline           | 0.6     | Define migration acceptance criteria and rollback triggers                              |       2h | Todo        |
| Phase 1 — Environment and Infrastructure Setup                   | 1.1     | Provision Ubuntu VM baseline hardening (users, SSH policy, firewall)                    |       3h | Completed   |
| Phase 1 — Environment and Infrastructure Setup                   | 1.2     | Configure reverse proxy (Nginx/Caddy), TLS, HSTS                                        |       3h | Completed   |
| Phase 1 — Environment and Infrastructure Setup                   | 1.3     | Set up MongoDB environment (managed or replica set)                                     |       4h | Completed   |
| Phase 1 — Environment and Infrastructure Setup                   | 1.4     | Set up Redis for queues, rate limiting, and cache                                       |       2h | Completed   |
| Phase 1 — Environment and Infrastructure Setup                   | 1.5     | Configure object storage bucket and IAM/policy for signed URL usage                     |       3h | Completed   |
| Phase 1 — Environment and Infrastructure Setup                   | 1.6     | Configure centralized log collection and retention                                      |       3h | Completed   |
| Phase 1 — Environment and Infrastructure Setup                   | 1.7     | Configure backup routines (DB + object storage metadata snapshots)                      |       3h | Completed   |
| Phase 1 — Environment and Infrastructure Setup                   | 1.8     | Configure monitoring/alerts (CPU, memory, error rate, auth failures)                    |       3h | Completed   |
| Phase 1 — Environment and Infrastructure Setup                   | 1.9     | Define stable API domain strategy for dev/int/staging/prod                              |       2h | Completed   |
| Phase 1 — Environment and Infrastructure Setup                   | 1.10    | Configure DNS and reverse-proxy routing for environment API domains                     |       3h | Completed   |
| Phase 1 — Environment and Infrastructure Setup                   | 1.11    | Define tenant routing strategy (subdomain/path/header) and standards                    |       3h | Completed   |
| Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization) | 2.1     | Bootstrap backend app structure and environment config management                       |       3h | Todo        |
| Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization) | 2.2     | Implement authentication module (email/password, hash, token/session)                   |       4h | Todo        |
| Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization) | 2.3     | Implement refresh token flow + secure cookie policy                                     |       3h | In Progress |
| Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization) | 2.4     | Implement login rate limiting + lockout policy                                          |       3h | Todo        |
| Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization) | 2.5     | Implement RBAC middleware and policy guard interface                                    |       4h | Todo        |
| Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization) | 2.6     | Implement audit logging middleware for sensitive endpoints                              |       3h | Todo        |
| Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization) | 2.7     | Implement standardized error model and request validation                               |       3h | Todo        |
| Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization) | 2.8     | Write API auth integration tests (happy path + abuse path)                              |       4h | Todo        |
| Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization) | 2.9     | Translate `firebase.rules.txt` into backend policy matrix (resource/action/role)        |       4h | Todo        |
| Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization) | 2.10    | Implement policy evaluator middleware for API authorization                             |       4h | Todo        |
| Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization) | 2.11    | Implement tenant-scoped query guards for read/write endpoints                           |       4h | Todo        |
| Phase 2 — Backend Foundation (Auth, API Skeleton, Authorization) | 2.12    | Build rule-parity test suite for critical permission scenarios                          |       4h | Todo        |
| Phase 3 — Data Model and Migration Tooling                       | 3.1     | Define collection schemas and validation rules for core modules                         |       4h | Todo        |
| Phase 3 — Data Model and Migration Tooling                       | 3.2     | Implement migration ID strategy (`legacyId`, checksum, migratedAt)                      |       2h | Todo        |
| Phase 3 — Data Model and Migration Tooling                       | 3.3     | Build Firestore export parser for core entities                                         |       4h | Todo        |
| Phase 3 — Data Model and Migration Tooling                       | 3.4     | Build transform mappers for employee and role data                                      |       4h | Todo        |
| Phase 3 — Data Model and Migration Tooling                       | 3.5     | Build transform mappers for attendance and leave data                                   |       4h | Todo        |
| Phase 3 — Data Model and Migration Tooling                       | 3.6     | Build transform mappers for payroll-related entities                                    |       4h | Todo        |
| Phase 3 — Data Model and Migration Tooling                       | 3.7     | Build idempotent import runner with batch/retry controls                                |       4h | Todo        |
| Phase 3 — Data Model and Migration Tooling                       | 3.8     | Build migration validation checks (counts, sampling, invariants)                        |       4h | Todo        |
| Phase 3 — Data Model and Migration Tooling                       | 3.9     | Build migration dry-run report generator                                                |       3h | Todo        |
| Phase 4 — Realtime Layer (`onSnapshot` Equivalent)               | 4.1     | Design realtime event contract (`added/modified/removed`)                               |       2h | Todo        |
| Phase 4 — Realtime Layer (`onSnapshot` Equivalent)               | 4.2     | Implement SSE subscription endpoint with auth + policy checks                           |       4h | In Progress |
| Phase 4 — Realtime Layer (`onSnapshot` Equivalent)               | 4.3     | Implement MongoDB change stream listener service                                        |       4h | Todo        |
| Phase 4 — Realtime Layer (`onSnapshot` Equivalent)               | 4.4     | Implement per-user/per-role server-side filtering                                       |       4h | Todo        |
| Phase 4 — Realtime Layer (`onSnapshot` Equivalent)               | 4.5     | Implement reconnect + resume token handling                                             |       4h | Todo        |
| Phase 4 — Realtime Layer (`onSnapshot` Equivalent)               | 4.6     | Implement client-side `subscribe()` adapter for React hooks                             |       4h | Todo        |
| Phase 4 — Realtime Layer (`onSnapshot` Equivalent)               | 4.7     | Add throttling/debouncing for high-frequency event bursts                               |       3h | Todo        |
| Phase 4 — Realtime Layer (`onSnapshot` Equivalent)               | 4.8     | Add realtime integration tests and soak test scripts                                    |       4h | Todo        |
| Phase 4 — Realtime Layer (`onSnapshot` Equivalent)               | 4.9     | Enforce policy checks during realtime subscribe/stream lifecycle                        |       4h | Todo        |
| Phase 4 — Realtime Layer (`onSnapshot` Equivalent)               | 4.10    | Add tenant channel isolation and authorization tests                                    |       4h | Todo        |
| Phase 5 — Storage Migration (Firebase Storage Replacement)       | 5.1     | Define object key naming convention and metadata schema                                 |       2h | Completed   |
| Phase 5 — Storage Migration (Firebase Storage Replacement)       | 5.2     | Implement signed upload URL endpoint                                                    |       3h | Completed   |
| Phase 5 — Storage Migration (Firebase Storage Replacement)       | 5.3     | Implement signed download URL endpoint with auth policy                                 |       3h | Completed   |
| Phase 5 — Storage Migration (Firebase Storage Replacement)       | 5.4     | Implement storage metadata persistence and linkage                                      |       3h | Completed   |
| Phase 5 — Storage Migration (Firebase Storage Replacement)       | 5.5     | Build file integrity and MIME validation checks                                         |       3h | Completed   |
| Phase 5 — Storage Migration (Firebase Storage Replacement)       | 5.6     | Build file migration utility from Firebase Storage export                               |       4h | Completed   |
| Phase 5 — Storage Migration (Firebase Storage Replacement)       | 5.7     | Validate migrated object accessibility with policy tests                                |       3h | Completed   |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6A.1    | Implement employee CRUD + query endpoints                                               |       4h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6A.2    | Implement employee-role linkage and permission checks                                   |       3h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6A.3    | Implement employee profile read model for dashboard                                     |       3h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6A.4    | Write integration tests for employee domain                                             |       4h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6B.1    | Implement attendance read/write endpoints                                               |       4h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6B.2    | Implement attendance correction/adjustment workflow                                     |       4h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6B.3    | Implement overtime request API and approvals                                            |       4h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6B.4    | Write attendance/overtime domain tests                                                  |       4h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6C.1    | Implement leave request create/list/update endpoints                                    |       4h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6C.2    | Implement manager/HR leave approval policy checks                                       |       4h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6C.3    | Implement leave balance consistency checks                                              |       4h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6C.4    | Write leave domain tests                                                                |       4h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6D.1    | Implement payroll settings endpoints                                                    |       4h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6D.2    | Implement compensation endpoints                                                        |       4h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6D.3    | Implement employee loan endpoints                                                       |       4h | Todo        |
| Phase 6 — Domain-by-Domain API Migration (Core Operations First) | 6D.4    | Write payroll/compensation tests                                                        |       4h | Todo        |
| Phase 7 — Frontend Adapter and Incremental Cutover               | 7.1     | Add gateway abstraction layer (`AuthGateway`, `DataGateway`, `StorageGateway`)          |       4h | Completed   |
| Phase 7 — Frontend Adapter and Incremental Cutover               | 7.2     | Replace auth context Firebase calls with API-based auth                                 |       4h | In Progress |
| Phase 7 — Frontend Adapter and Incremental Cutover               | 7.3     | Replace core firestore hooks with API + realtime adapter                                |       4h | Todo        |
| Phase 7 — Frontend Adapter and Incremental Cutover               | 7.4     | Replace file upload paths with signed URL flow                                          |       3h | Todo        |
| Phase 7 — Frontend Adapter and Incremental Cutover               | 7.5     | Add feature flags for module-level data source switching                                |       3h | Todo        |
| Phase 7 — Frontend Adapter and Incremental Cutover               | 7.6     | Add observability logs for source-of-truth mismatch detection                           |       3h | Todo        |
| Phase 7 — Frontend Adapter and Incremental Cutover               | 7.7     | Execute QA regression for migrated modules                                              |       4h | Todo        |
| Phase 7 — Frontend Adapter and Incremental Cutover               | 7.8     | Implement centralized API base URL mapping by environment                               |       3h | Todo        |
| Phase 7 — Frontend Adapter and Incremental Cutover               | 7.9     | Implement tenant-aware route resolution in frontend gateways                            |       3h | Todo        |
| Phase 8 — Dual-Run, Verification, and Cutover                    | 8.1     | Enable shadow reads and compare old/new responses                                       |       4h | Todo        |
| Phase 8 — Dual-Run, Verification, and Cutover                    | 8.2     | Enable controlled dual writes for critical entities                                     |       4h | Todo        |
| Phase 8 — Dual-Run, Verification, and Cutover                    | 8.3     | Build drift report dashboard (count and field mismatch)                                 |       4h | Todo        |
| Phase 8 — Dual-Run, Verification, and Cutover                    | 8.4     | Run production readiness checklist and incident runbook review                          |       3h | Todo        |
| Phase 8 — Dual-Run, Verification, and Cutover                    | 8.5     | Execute data freeze + final backfill + consistency checks                               |       4h | Todo        |
| Phase 8 — Dual-Run, Verification, and Cutover                    | 8.6     | Execute cutover with rollback timer and monitoring war room                             |       4h | Todo        |
| Phase 9 — Post-Cutover Hardening and Firebase Decommission       | 9.1     | Monitor and fix cutover defects (P0/P1 triage cycle)                                    |       4h | Todo        |
| Phase 9 — Post-Cutover Hardening and Firebase Decommission       | 9.2     | Remove unused Firebase client SDK usage paths                                           |       4h | Todo        |
| Phase 9 — Post-Cutover Hardening and Firebase Decommission       | 9.3     | Remove Firebase admin SDK usage paths                                                   |       3h | Todo        |
| Phase 9 — Post-Cutover Hardening and Firebase Decommission       | 9.4     | Remove obsolete environment variables and secrets                                       |       2h | Todo        |
| Phase 9 — Post-Cutover Hardening and Firebase Decommission       | 9.5     | Finalize operational docs and ownership handoff                                         |       3h | Todo        |
| Phase 9 — Post-Cutover Hardening and Firebase Decommission       | 9.6     | Archive/decommission Firebase resources after safety window                             |       3h | Todo        |

## Phase 2 Implementation Artifacts

- `lib/backend/manual/types.ts`
- `lib/backend/manual/errors.ts`
- `lib/backend/manual/validation.ts`
- `lib/backend/manual/policy-matrix.ts`
- `lib/backend/manual/policy-evaluator.ts`
- `lib/backend/manual/tenant-guard.ts`
- `lib/backend/manual/authorization.ts`
- `lib/backend/manual/audit.ts`
- `lib/backend/manual/rate-limit.ts`
- `lib/backend/manual/auth-credentials.ts`
- `lib/backend/manual/auth-service.ts`
- `lib/backend/manual/auth-session.ts`
- `app/api/manual/auth/login/route.ts`
- `app/api/manual/auth/refresh/route.ts`
- `app/api/manual/auth/session/route.ts`
- `app/api/manual/auth/logout/route.ts`
- `app/api/manual/realtime/employee/route.ts`
- `lib/backend/manual/phase-2-tests.ts`
