# Auth Migration Plan

## Objective

Replace the current mixed employee-based login and fallback registry flow with a dedicated `authUsers` collection, while keeping `employee` as the source of truth for shared identity fields and Better Auth as the active auth/session system.

Target auth shape:

- `authUsers` stores auth/session/policy fields only
- `employee` stores HR/business profile data
- session roles come from `authUsers.roles`
- `instanceKey` is **not** persisted in auth records or session records
- active instance/tenant continues to come from `lib/backend/config.ts`

This checklist is intentionally scoped to a **Phase 1 implementation under 4 hours**.

Estimated implementation time: **3h 15m to 3h 45m**

## Status Legend

- `Todo`
- `In Progress`
- `Done`
- `Blocked`

---

## Scope

Status: `Done`

- [x] Add Mongo-backed `authUsers` persistence
- [x] Sync `employee` mutations into `authUsers`
- [x] Move login/session reads fully onto `authUsers`
- [x] Clean up `authContext` to expose the correct auth/session data
- [x] Expand employee cascade delete to remove all auth/user-owned records
- [x] Remove old fallback registry from active runtime auth paths
- [x] Verify setup, login, session, and delete cascade behavior

Out of scope for this phase:

- [x] Full password reset token persistence flow
- [x] Replacing the current custom signed-cookie session mechanism
- [ ] Full persistence migration for every non-auth domain

---

## Target Data Model

Status: `Done`

`authUsers` document:

- [x] `uid: string`
- [x] `email: string`
- [x] `passwordHash: string`
- [x] `roles: Role[]`
- [x] `firstName: string`
- [x] `surname: string`
- [x] `active: boolean`
- [x] `lastLoginAt: string | null`

Rules:

- [x] `companyEmail` is the canonical login email
- [x] `instanceKey` is not stored in auth records
- [x] `active = false` blocks login
- [x] `active` is derived from employee `contractStatus`
- [x] raw passwords are never persisted

---

## Step 1: Repository And Schema

Status: `Done`

Estimate: **35 minutes**

- [x] Create `lib/backend/persistence/auth-user.repository.ts`
- [x] Add `getAuthUserByEmail(...)`
- [x] Add `getAuthUserByUid(...)`
- [x] Add `createAuthUser(...)`
- [x] Add `updateAuthUser(...)`
- [x] Add `deleteAuthUser(...)`
- [x] Add `upsertAuthUserFromEmployee(...)`
- [x] Add employee -> auth user mapper
- [x] Ensure repository uses `config.ts` and current Mongo config

Definition of done:

- [x] `authUsers` can be created, read, updated, and deleted through Mongo-backed repository functions

---

## Step 2: Sync Employee Mutations Into Auth Users

Status: `Done`

Estimate: **45 minutes**

- [x] On employee create, create matching `authUsers` record
- [x] On employee update, sync changed auth fields
- [x] On employee delete, delete matching `authUsers` record
- [x] Sync `companyEmail -> email`
- [x] Sync `firstName`
- [x] Sync `surname`
- [x] Sync `role -> roles`
- [x] Sync `contractStatus -> active`
- [x] Hash password before persisting to `authUsers`

Definition of done:

- [x] Employee create/update/delete keeps the matching `authUsers` record in sync

---

## Step 3: Move Login And Session Fully Onto Auth Users

Status: `Done`

Estimate: **45 minutes**

- [x] Update login flow to read from `authUsers`
- [x] Verify password against `passwordHash`
- [x] Block login when `active = false`
- [x] Update `lastLoginAt` on successful login
- [x] Build session claims from `uid`, `email`, `roles`
- [x] Derive instance/tenant from `config.ts`
- [x] Remove login dependency on employee password lookup
- [x] Remove login dependency on fallback in-memory registry

Definition of done:

- [x] Successful login depends only on persisted `authUsers` state plus `config.ts`

---

## Step 4: Clean Up Auth Context

Status: `Done`

Estimate: **30 minutes**

- [x] Update `auth-session-context` to read the real session shape
- [x] Update `authContext` to expose the correct auth/session identity
- [x] Keep employee profile resolution separate from session identity
- [x] Ensure stream/data consumers depend on the real session state
- [x] Remove old transient/fallback auth assumptions

Definition of done:

- [x] Frontend auth state matches the persisted session/auth identity cleanly

---

## Step 5: Employee Cascade Delete Completion

Status: `Done`

Estimate: **45 minutes**

- [x] Delete matching `authUsers` record
- [x] Delete employee record
- [x] Delete attendance records
- [x] Delete dependents
- [x] Delete employee loans
- [x] Delete compensations
- [x] Delete notifications owned by the user
- [x] Delete or clean request modifications for that user
- [x] Delete or clean overtime records for that user
- [x] Delete or clean storage/document metadata owned by that user
- [x] Keep deletion logic server-side in one cascade path

Definition of done:

- [x] Deleting an employee removes both auth identity and known owned records

---

## Step 6: Build And Verification

Status: `In Progress`

Estimate: **30 minutes**

- [x] Run `pnpm build`
- [x] Verify `/setup` creates employee + auth user
- [x] Verify password is hashed in Better Auth credential storage
- [x] Verify login succeeds with `companyEmail`
- [x] Verify login fails with wrong password
- [x] Verify login fails when `active = false`
- [x] Verify `/api/auth/session` returns `uid`, `email`, `roles`
- [x] Verify session does not depend on persisted `instanceKey`
- [x] Verify `app-data-context` stream requests no longer fail for a valid HR user
- [x] Verify employee delete cascade removes `authUsers` and attendance records

Definition of done:

- [x] Build passes and the critical auth/setup/login/delete path works end to end

---

## Follow-Up After Phase 1

Status: `In Progress`

- [x] Add password reset token persistence
- [x] Add reset token hashing + expiry storage
- [x] Clean leftover auth registry compatibility code completely
- [ ] Continue replacing transitional in-memory persistence in non-auth domains
- [ ] Revisit whether the Better Auth integration should be hardened further

---

## Notes

- `instanceKey` should not be stored in `authUsers`; active instance/tenant is handled by `lib/backend/config.ts`
- `roles` must use `Role[]`
- `active = false` means the user cannot log in
- `employee` remains the source of truth for shared identity fields that sync into `authUsers`
- Better Auth is now the active auth/session system for runtime login, session, and password reset flows
