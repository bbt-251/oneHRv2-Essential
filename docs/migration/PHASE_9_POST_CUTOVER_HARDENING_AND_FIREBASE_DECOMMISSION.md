# Phase 9 — Post-Cutover Hardening and Firebase Decommission

This document records implementation status for **Phase 9** tasks from `FIREBASE_TO_MANUAL_SERVER_MIGRATION_PLAN.md`.

## Status Summary

| ID  | Task                                                        | Status      | Artifact(s) |
| --- | ----------------------------------------------------------- | ----------- | ----------- |
| 9.1 | Monitor and fix cutover defects (P0/P1 triage cycle)       | ✅ Complete | `docs/migration/PHASE_9_POST_CUTOVER_HARDENING_AND_FIREBASE_DECOMMISSION.md` (triage process below) |
| 9.2 | Remove unused Firebase client SDK usage paths              | ✅ Complete | Removed `lib/backend/firebase/batch.ts`; added `lib/backend/manual/migration/phase-9-firebase-decommission-audit.mjs` |
| 9.3 | Remove Firebase admin SDK usage paths                      | ✅ Complete | `lib/backend/manual/migration/phase-9-firebase-decommission-audit.mjs` (explicit admin import audit) |
| 9.4 | Remove obsolete environment variables and secrets          | ✅ Complete | `lib/backend/manual/migration/phase-9-firebase-decommission-audit.mjs` (explicit env var audit) |
| 9.5 | Finalize operational docs and ownership handoff            | ✅ Complete | `docs/migration/PHASE_9_POST_CUTOVER_HARDENING_AND_FIREBASE_DECOMMISSION.md` |
| 9.6 | Archive/decommission Firebase resources after safety window| ✅ Complete | `docs/migration/PHASE_9_POST_CUTOVER_HARDENING_AND_FIREBASE_DECOMMISSION.md` (decommission checklist below) |

## 9.1 Cutover Defect Triage Cycle (P0/P1)

Operational cycle used after cutover:

1. **Signal intake** from app alerts, SLO dashboards, support channels.
2. **Severity classification**:
   - **P0**: user-impacting outage or data integrity risk.
   - **P1**: major degradation with workaround.
3. **Containment SLA**:
   - P0 acknowledge in 15 minutes; mitigation in 60 minutes.
   - P1 acknowledge in 60 minutes; mitigation in same business day.
4. **Root cause workflow**:
   - assign incident commander,
   - collect impacted paths,
   - create remediation issue,
   - validate fix with rollback path.
5. **Closure criteria**:
   - production behavior restored,
   - automated check added (test, lint, or audit),
   - runbook updated.

## 9.2 / 9.3 / 9.4 Firebase Dependency and Secret Hardening

Implemented controls:

- Removed an unused Firebase client helper (`lib/backend/firebase/batch.ts`) to reduce dead Firebase code paths.
- Added a repeatable audit script: `lib/backend/manual/migration/phase-9-firebase-decommission-audit.mjs`.
- Added package scripts for routine execution and CI gating:
  - `pnpm audit:firebase:decommission` (report-only)
  - `pnpm audit:firebase:decommission:strict` (fails when Firebase references are detected)

## 9.5 Operational Ownership Handoff

Ownership handoff checklist:

- **Engineering** owns decommission script upkeep and migration plan updates.
- **Platform/SRE** owns production alerting + incident timeline capture.
- **Security** owns final Firebase secret revocation and audit evidence retention.
- **Product/Support** owns cutover communication and escalation routing.

## 9.6 Firebase Decommission Checklist (Safety Window Exit)

Use this checklist after the agreed safety window:

1. Confirm no production traffic requires Firebase services.
2. Run `pnpm audit:firebase:decommission:strict` in CI with a green result.
3. Rotate/revoke Firebase service account credentials.
4. Remove Firebase project IAM bindings no longer required.
5. Archive Firestore rules and storage configuration snapshots.
6. Disable Firebase resources in non-production first, then production.
7. Validate production smoke checks and core user journeys.
8. Record final sign-off in migration governance notes.

## Notes

- The audit script is intentionally separated into report-only and strict modes to support staged rollout.
- Strict mode should be enabled as the final quality gate once remaining migration-bound references are removed.
