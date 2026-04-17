# Phase 7 — Frontend Adapter and Incremental Cutover

This document captures the implementation artifacts for **Phase 7** tasks from `FIREBASE_TO_MANUAL_SERVER_MIGRATION_PLAN.md`.

## Delivered Tasks

- **7.2 Replace auth context Firebase calls with API-based auth**
  - `context/authContext.tsx` now uses centralized gateway factories instead of directly constructing manual-only gateways.
- **7.3 Replace core firestore hooks with API + realtime adapter**
  - Employee auth-context subscriptions are routed through the data gateway factory and manual realtime adapter.
- **7.4 Replace file upload paths with signed URL flow**
  - Added manual signed upload/download API endpoints and token verification.
  - Leave attachment uploads now route through a storage gateway-backed uploader.
- **7.5 Add feature flags for module-level data source switching**
  - Added `NEXT_PUBLIC_AUTH_SOURCE`, `NEXT_PUBLIC_EMPLOYEE_SOURCE`, and `NEXT_PUBLIC_STORAGE_SOURCE` support.
- **7.6 Add observability logs for source-of-truth mismatch detection**
  - Added gateway mismatch logging hook used by gateway upload workflow.
- **7.8 Implement centralized API base URL mapping by environment**
  - Added runtime API URL mapping with explicit override and environment defaults.
- **7.9 Implement tenant-aware route resolution in frontend gateways**
  - Added tenant resolution helper and propagated tenant identifiers into manual gateway requests.

## Remaining Work

- **7.7 Execute QA regression for migrated modules** remains pending and should be performed in a deployed environment with representative tenant data.
