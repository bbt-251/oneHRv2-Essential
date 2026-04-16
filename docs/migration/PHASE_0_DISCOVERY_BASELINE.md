# Phase 0 — Discovery, Scope Lock, and Security Baseline

This document records the initial baseline required by Phase 0 of `FIREBASE_TO_MANUAL_SERVER_MIGRATION_PLAN.md`.

## 0.1 ADR (Architecture Decision Record)

### Decision Summary
- **Authentication:** move from Firebase Auth client/admin flows to server-managed session auth with HttpOnly cookies, short-lived access context, and refresh-session rotation.
- **Primary data store:** move operational data from Firestore to MongoDB.
- **Realtime transport:** standardize on **SSE** (first) for Firestore `onSnapshot` parity with server-side authorization filtering.
- **File storage:** move from Firebase Storage to object storage with signed upload/download URLs.

### Why this decision
- Existing app already centralizes most Firebase access through service layers and context hooks, making adapter-based migration viable.
- SSE fits current one-way update need and aligns with migration plan risks around fanout and policy filtering.
- Cookie-based server auth avoids exposing token validation complexity to the client and supports centralized audit/rate-limit middleware.

### Consequences
- Requires an authorization policy engine that reproduces Firestore rules behavior.
- Requires change-stream/event fanout layer and replay/reconnect strategy for realtime parity.
- Requires explicit metadata layer for objects (path ownership, tenancy, retention).

---

## 0.2 Firebase touchpoint inventory

### Inventory method
- Searched for all imports/usages of Firebase client/admin SDKs and internal `lib/backend/firebase/*` wrappers.
- Command used:
  - `rg -n "@/lib/backend/firebase|from \"firebase|from 'firebase" app context hooks lib components`

### Inventory summary (current)
- **Total files with Firebase touchpoints:** `216`
- **By top-level area:**
  - `components`: 108
  - `lib`: 77
  - `hooks`: 16
  - `app`: 14
  - `context`: 1

### Touchpoint categories
1. **Auth SDK usage**
   - `firebase/auth` in auth context and selected pages/services.
2. **Firestore SDK usage**
   - Broad CRUD/query usage across `lib/backend/api/*` and hooks.
3. **Storage SDK usage**
   - Upload/download/delete flows in HR settings, talent acquisition, employee docs.
4. **Admin SDK usage**
   - `app/api/*` server routes for privileged operations.
5. **Rules dependency**
   - Centralized authorization behavior in `lib/backend/firebase/firebase.rules.txt`.

---

## 0.3 Endpoint and module dependency map

### Domain module map (service layer)
Primary domain service roots under `lib/backend/api`:
- attendance
- employee-management
- leave-management (inside employee-management services)
- compensation-benefit
- payroll settings
- talent-acquisition
- performance-management
- competence
- training
- objective
- succession-planning
- announcement
- auth
- notifications
- delegation
- manager-swap
- hr-settings

### API route map (Next.js server routes)
Current high-impact routes under `app/api` include:
- employee provisioning/mutations (`create-employee`, `register-user`, `employees/delete`)
- attendance generation (`generate-attendance`)
- auth utility (`change-password`)
- setup/migration routes (`setup-database`, `setup-career-path`, `migrate-hourly-wages`)
- AI/recruiter/talent routes (`recruiter-assistant`, sync/evaluation endpoints)

### Dependency pattern
- UI Components/Hooks
  -> Context/hooks (`useFirestore`, `useAuth`)
  -> `lib/backend/api/*` domain services
  -> Firebase collections/init/admin wrappers
  -> Firestore/Storage/Auth SDK

Migration implication:
- Replace terminal Firebase dependencies first with gateway/adapters,
- then swap service internals domain-by-domain.

---

## 0.4 Target authorization matrix (RBAC/ABAC baseline)

### Roles found in rules
- HR Manager
- Manager
- Payroll Officer
- Employee

### Baseline role model
- **HR Manager:** global write authority for HR core modules.
- **Manager:** scoped read/write authority for managed population + selected process modules.
- **Payroll Officer:** payroll and read-centric authority for attendance/employee financial context.
- **Employee:** self-service write/read on own records + broad read for configured module data.

### ABAC constraints to enforce in manual backend
- Subject constraints: authenticated user, role list, active employment state.
- Resource constraints: module/collection, ownership (`employee.uid == subject.uid`), manager-reporting relationship.
- Action constraints: operation type (`read/create/update/delete`) aligned to rules matrix.
- Context constraints: route sensitivity (payroll/security endpoints), environment, and audit requirements.

### Source of truth used for baseline
- `lib/backend/firebase/firebase.rules.txt` grouped permission mappings (`allowedActionsGroup0..7`).

---

## 0.5 Data privacy classification baseline

### Classification levels
1. **Public/Internal (L1)**
   - Non-sensitive config/metadata (e.g., non-personal module configs).
2. **Confidential PII (L2)**
   - Name, email, phone, address, emergency contact, birth details, geolocation.
3. **Restricted Financial/Identity (L3)**
   - Bank account, tax/TIN, passport/national ID, salary/compensation, loan data, payroll docs.
4. **Highly Restricted Security (L4)**
   - Password/token fields, auth recovery artifacts, signatures/access credentials, audit events with sensitive payloads.

### Initial field mapping examples
- From `EmployeeModel`:
  - L2: `firstName`, `surname`, `personalEmail`, `personalPhoneNumber`, `birthDate`, `currentLocation`
  - L3: `bankAccount`, `tinNumber`, `passportNumber`, `nationalIDNumber`, `salary`
  - L4: `password`, `passwordRecovery.token`, `signature`

### Required controls by class
- L2+: encryption in transit + strict least-privilege read.
- L3+: masked logs, enhanced audit, retention controls.
- L4: no plaintext persistence in logs/responses; additional access approvals for admin operations.

---

## 0.6 Migration acceptance criteria and rollback triggers

### Acceptance criteria (pre-cutover gate)
1. Auth parity: login/session/role resolution pass integration tests for all 4 roles.
2. Authorization parity: policy test matrix passes for all migrated modules.
3. Realtime parity: SSE updates match Firestore behavior for required screens (added/modified/removed semantics).
4. Data quality: migration validation reports show acceptable drift threshold (target: 0 critical mismatches).
5. Storage parity: signed URL upload/download policy tests pass.
6. Operability: monitoring/alerts, backup restore check, and incident runbook signed off.

### Rollback triggers
- P0 auth/authz incident affecting production access controls.
- Realtime delivery degradation causing sustained stale UI for critical workflows.
- Data drift threshold breached for payroll/attendance/leave entities.
- Elevated error budget burn after cutover (e.g., 5xx spike above agreed threshold for >15 minutes).
- Inability to restore from latest verified backup during drill.

### Rollback actions (high level)
1. Freeze manual writes.
2. Re-enable Firebase source-of-truth path for affected modules.
3. Replay reconciliation scripts for partially migrated entities.
4. Publish incident notice and postmortem timeline.

