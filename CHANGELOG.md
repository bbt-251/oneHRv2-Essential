# Changelog

## v0.0.1

### Added
- Added a manual backend stack for auth, data access, persistence, storage, and realtime under `lib/backend/`.
- Added route-aware app data subscriptions through `context/app-data-routes.ts`.
- Added a shared realtime protocol in `lib/realtime/protocol.ts`.
- Added a multiplexed realtime endpoint at `app/api/data/realtime/route.ts`.
- Added MongoDB change stream support for realtime read updates in `lib/backend/services/stream.service.ts`.
- Added development setup and migration guides including `HOSTINGER_VPS_MONGODB_STORAGE_SETUP.md` and `REALTIME-UPDATE-IMPLEMENTATION.md`.

### Changed
- Migrated the app from Firebase-backed APIs and client flows to a manual MongoDB-backed server running on a VPS.
- Reworked `context/app-data-context.tsx` to use one app-level realtime stream for route data instead of opening one browser stream per resource.
- Updated auth and employee subscription flow so employee-scoped data like `balanceLeaveDays` stays in sync with live employee updates.
- Updated setup, seeding, and environment configuration to work against the manual MongoDB backend and replica set connections.
- Updated route rendering and auth-loading behavior to prevent navigation stalls after login.

### Fixed
- Fixed Firebase-era navigation and loading issues exposed during the backend migration.
- Fixed dashboard and route navigation getting stuck on loading or rendering states.
- Fixed repeated subscription teardown and reconnect loops caused by unstable effect dependencies.
- Fixed intermittent auth route request-body handling during sign-in.
- Fixed employee realtime parsing so single-document Mongo delta events update the UI correctly.
- Fixed missing live updates for `leaveManagements` by wiring the Mongo collection into the realtime watcher set.

### Notes
- This release represents the initial Firebase-to-manual-server migration baseline.
- Realtime is read-only: writes still go through the existing mutation APIs and then fan out to subscribers.
- MongoDB change streams now require the database to run as a replica set, including local and VPS environments.
