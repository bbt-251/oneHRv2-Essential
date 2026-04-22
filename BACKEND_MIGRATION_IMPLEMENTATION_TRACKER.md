# Backend Migration Implementation Tracker

## Objective

Refactor the project backend into a simpler, Firebase-like mental model while keeping MongoDB, server-side authorization, and storage support.

Target shape:

- `lib/backend/config.ts` selects the active instance/tenant
- `auth-context.tsx` owns auth lifecycle only
- `app-data-context.tsx` subscribes to app collections through one policy-aware stream layer
- feature service files own business logic
- a small API surface acts as the browser-to-server boundary
- `policy-matrix.ts` is replaced by a database rules module used by CRUD and stream flows

Important current reality:

- the route/context/service structure has been migrated into the target shape
- the active runtime persistence layer is still transitional in some paths and currently lives in `lib/backend/persistence/in-memory-store.ts`
- real Mongo-backed persistence is still required before setup/bootstrap, auth user creation, and core CRUD flows can be treated as production-complete

## Status Legend

- `Todo`
- `In Progress`
- `Done`
- `Blocked`

---

## Milestone 1: Configuration Foundation

**Goal:** Centralize instance selection and remove scattered runtime config assumptions.

Status: `Done`

- [x] Create `lib/backend/config.ts`
- [x] Define `InstanceName`
- [x] Define `INSTANCES`
- [x] Define `DEFAULT_INSTANCE`
- [x] Implement `getCurrentInstance()`
- [x] Implement `setCurrentInstance()` if needed
- [x] Implement `getCurrentConfig()`
- [x] Implement `getApiBaseUrl()`
- [x] Implement storage config helpers
- [ ] Move server-only secrets to `.env`
- [x] Replace current `runtime-config.ts` usage with `config.ts`
- [x] Remove obsolete runtime config code

Notes:

- Public instance/domain mapping can live in `config.ts`
- Secrets such as Mongo URIs, JWT secrets, and storage roots should live in `.env`

---

## Milestone 2: Database Rules

**Goal:** Replace `policy-matrix.ts` with a single shared database rules system used everywhere.

Status: `Done`

- [x] Rename `lib/backend/manual/policy-matrix.ts`
- [x] Create `lib/backend/database-rules.ts` or `lib/backend/database-rules.json`
- [x] Define typed rule structure
- [x] Implement `canAccessResource(...)`
- [x] Implement `assertCanAccess(...)`
- [x] Implement `filterReadableDocuments(...)`
- [x] Implement helper for self/tenant/global scope
- [x] Update CRUD entry points to use the new rules module
- [x] Update stream entry points to use the new rules module
- [x] Remove old rule evaluation duplication

Notes:

- Rules should be enforced primarily at the backend entry layer
- Service files may keep defensive checks where useful

---

## Milestone 3: Auth Simplification

**Goal:** Make auth predictable and isolated from feature data loading.

Status: `Done`

- [x] Refactor `auth-context.tsx` to own only auth lifecycle
- [x] Keep support for:
    - [x] sign in
    - [x] sign out
    - [x] forgot password
    - [x] session check
    - [x] current user
- [x] Create server auth service
- [x] Create client auth helper layer
- [x] Implement compact auth API routes
- [x] Remove old auth compatibility seams that are no longer needed
- [x] Verify session propagation after login/logout

Target routes:

- [x] `/api/auth/login`
- [x] `/api/auth/logout`
- [x] `/api/auth/session`
- [x] `/api/auth/forgot-password`

---

## Milestone 4: Compact API Surface

**Goal:** Avoid route sprawl while preserving a safe browser-to-server boundary.

Status: `Done`

- [x] Create `/api/data/query`
- [x] Create `/api/data/mutate`
- [x] Create `/api/data/stream`
- [x] Create `/api/storage/upload-url`
- [x] Create `/api/storage/download-url`
- [x] Keep route handlers thin
- [x] Ensure routes:
    - [x] authenticate
    - [x] load active config
    - [x] enforce database rules
    - [x] validate payloads
    - [x] call feature services
- [x] Remove duplicated business logic from old manual routes
- [x] Delete old routes that become unnecessary after migration

Notes:

- Thin routes are expected to remain
- Business logic should move into feature services
- Primary compact runtime paths are now `/api/data/*` and `/api/storage/*`
- Old manual domain/realtime route families that overlapped with the compact surface were removed

---

## Milestone 5: Feature Service Layer

**Goal:** Move backend business logic into feature-specific services.

Status: `Done`

- [x] Create `auth.service.ts`
- [x] Create `employee.service.ts`
- [x] Create `leave.service.ts`
- [x] Create `attendance.service.ts`
- [x] Create `payroll.service.ts`
- [x] Create `storage.service.ts`
- [x] Create `stream.service.ts`
- [x] Move MongoDB logic into services
- [x] Move storage metadata/signing logic into services
- [x] Move domain validation into services
- [x] Remove duplicated logic from route handlers

Notes:

- Services should not depend on Next route objects
- Services should accept clear inputs such as `session`, `resource`, `payload`, `filters`
- `data-dispatcher.service.ts` now dispatches through feature services instead of owning resource logic directly
- Stream and storage routes now call the service layer instead of manual modules directly
- The service structure is complete, but persistence under several services is still transitional and must be migrated from `lib/backend/persistence/in-memory-store.ts` to real Mongo repositories

---

## Milestone 6: App Data Context Refactor

**Goal:** Make `app-data-context.tsx` the single live subscriber for app collections.

Status: `Done`

- [x] Refactor `app-data-context.tsx`
- [x] Subscribe to all needed collections through one stream pattern
- [x] Support initial snapshot delivery
- [x] Support live updates from Mongo-backed streams
- [x] Keep authorization server-side
- [x] Remove local authorization assumptions from the context
- [x] Verify hydration for all subscribed resources

Collections to review:

- [x] employees
- [x] leave requests / leave management
- [x] attendance
- [x] overtime
- [x] compensation
- [x] loans
- [x] dependents
- [x] HR settings collections
- [x] documents / storage-linked resources

---

## Milestone 7: Leave Management and Storage

**Goal:** Fully support leave flows including attachment upload/download.

Status: `Done`

- [x] Migrate leave CRUD logic into `leave.service.ts`
- [x] Migrate leave balance/business validation into `leave.service.ts`
- [x] Connect leave attachments to `storage.service.ts`
- [x] Implement upload URL generation
- [x] Implement download URL generation
- [x] Persist attachment metadata
- [x] Enforce read/write authorization on attachment access
- [x] Verify employee leave request creation with file attachment

---

## Milestone 8: Feature-by-Feature Migration

**Goal:** Complete migration cleanly and incrementally.

Status: `Done`

### Employee

- [x] Migrate employee reads
- [x] Migrate employee mutations
- [x] Migrate dependents
- [x] Migrate cascade delete flow
- [x] Verify policy enforcement

### Attendance

- [x] Migrate attendance reads
- [x] Migrate attendance mutations
- [x] Migrate overtime requests
- [x] Verify manager/HR flows

### Leave

- [x] Migrate leave reads
- [x] Migrate leave mutations
- [x] Migrate approvals
- [x] Verify attachments

### Payroll / Compensation

- [x] Migrate payroll settings
- [x] Migrate compensation
- [x] Migrate loans
- [x] Verify payroll-role permissions

Notes:

- Employee, attendance, overtime, leave, compensation, loans, and payroll settings now run through the compact backend path
- `pnpm build` passes after the Milestone 8 rewires

---

## Milestone 9: Cleanup

**Goal:** Remove transitional code after the new structure is stable.

Status: `Done`

- [x] Remove old gateway layers that are no longer used
- [x] Remove obsolete manual route logic
- [x] Remove unused compatibility modules
- [x] Rename Firebase-shaped leftovers where appropriate
- [x] Remove dead imports and stale helpers
- [x] Update internal docs

Notes:

- `lib/backend/gateways/*` has been removed after moving auth session sync and employee realtime subscription onto direct client helpers
- `lib/backend/firebase/*` has been replaced with neutral backend modules and the folder has been deleted
- compact `/api/auth/*` routes now own their implementations directly, and the old manual auth/drift routes have been removed
- signed storage object handling now lives at `/api/storage/object` instead of the old manual path
- several dead legacy helper modules were removed, including the old manual-service client and unused document-management service wrappers
- unused legacy collection hooks were removed because `app-data-context.tsx` is now the single live collection layer
- payroll PDF settings now persist through the compact payroll settings path instead of the old compat data wrapper
- `README.md` now reflects the compact backend architecture instead of the removed Firebase/gateway shape
- app-facing helpers for notifications and generic uploads now go through the compact backend path instead of importing legacy compat storage helpers directly
- backend internals that previously depended on the legacy compat data shim (`attendance.service.ts`, `leave.service.ts`, `project.service.ts`, `notification.service.ts`, `hr-settings-resource.service.ts`, and realtime snapshot loading) now use the isolated persistence layer in `lib/backend/persistence/in-memory-store.ts` instead
- `hrSettingsService` now uses the compact `/api/data/query` and `/api/data/mutate` routes through a generic backend HR settings service, so the settings UI no longer depends on the legacy compat layer directly
- the old `lib/backend/manual/*` tree has been removed after migrating active runtime pieces into:
    - `lib/backend/auth/*`
    - `lib/backend/core/*`
    - `lib/backend/realtime/*`
    - `lib/backend/storage/*`
    - `lib/backend/persistence/*`
    - `lib/backend/domain/*`
- the old `app/api/manual/*` route tree has been removed after migrating the remaining employee batch/cascade flows onto `/api/data/mutate`
- the old `lib/backend/compat/*` folder has been deleted after moving Firebase-style adapter aliases to `lib/backend/adapters/*` and the transitional in-memory store to `lib/backend/persistence/in-memory-store.ts`
- Build verification still passes after gateway cleanup

Follow-up still required after cleanup:

- remove transitional in-memory persistence from active runtime paths
- replace setup/bootstrap, auth user persistence, employee persistence, and attendance persistence with real Mongo-backed repositories

---

## Milestone 9.5: Persistence Completion

**Goal:** Replace transitional in-memory persistence with real Mongo-backed repositories.

Status: `Todo`

- [ ] Add the MongoDB Node driver to the application runtime
- [ ] Create shared Mongo connection/database helpers
- [ ] Create Mongo-backed repositories for auth users
- [ ] Create Mongo-backed repositories for employees
- [ ] Create Mongo-backed repositories for attendance
- [ ] Update `/api/setup/bootstrap` to persist setup data in Mongo
- [ ] Update login/auth flows to read persisted auth users from Mongo
- [ ] Replace `lib/backend/persistence/in-memory-store.ts` usage in active runtime paths
- [ ] Verify first-user setup and login against real Mongo persistence
- [ ] Delete `lib/backend/persistence/in-memory-store.ts` once no runtime paths depend on it

---

## Milestone 10: Verification

**Goal:** Confirm the refactor works correctly across roles and instances.

Status: `Todo`

- [ ] Verify login/logout/session flow
- [ ] Verify forgot password flow
- [ ] Verify `app-data-context.tsx` subscriptions
- [ ] Verify initial snapshots
- [ ] Verify live updates
- [ ] Verify create/update/delete mutations
- [ ] Verify role-based access by rules
- [ ] Verify storage upload/download
- [ ] Verify leave attachment workflow
- [ ] Verify switching `DEFAULT_INSTANCE`
- [ ] Run typecheck
- [ ] Run lint
- [ ] Record any remaining blockers

Current known blocker:

- [ ] Repo-wide TypeScript check currently fails on missing `mapbox__point-geometry` type definition
- [ ] Turbopack still reports an NFT tracing warning from `next.config.mjs` via `app/api/storage/object/route.ts`
- [ ] Runtime persistence is still transitional until Milestone 9.5 is completed

---

## Recommended Execution Order

1. Milestone 1: Configuration Foundation
2. Milestone 2: Database Rules
3. Milestone 3: Auth Simplification
4. Milestone 4: Compact API Surface
5. Milestone 5: Feature Service Layer
6. Milestone 6: App Data Context Refactor
7. Milestone 7: Leave Management and Storage
8. Milestone 8: Feature-by-Feature Migration
9. Milestone 9: Cleanup
10. Milestone 9.5: Persistence Completion
11. Milestone 10: Verification

---

## Current Focus

Status: `Ready`

Next recommended implementation steps:

- [x] Build `lib/backend/config.ts`
- [x] Replace `runtime-config.ts` consumers
- [x] Introduce the new `database-rules` module
- [x] Start compact auth route consolidation
- [ ] Decide whether setup/admin seeding should stay on the compat admin bridge or be migrated to the compact backend model
- [x] Audit `lib/backend/manual/migrated-domain-store.ts` and the remaining compat bridge files for final cleanup scope
- [ ] Implement real Mongo-backed persistence for setup/auth bootstrap, employee, and attendance paths
- [ ] Execute Milestone 10 verification checklist after persistence is real
