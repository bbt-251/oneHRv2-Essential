# Phase 3 — Data Model and Migration Tooling

This document records implementation status for **Phase 3** tasks from `FIREBASE_TO_MANUAL_SERVER_MIGRATION_PLAN.md`.

## Status Summary

| ID  | Task                                                               | Status      | Artifact(s) |
| --- | ------------------------------------------------------------------ | ----------- | ----------- |
| 3.1 | Define collection schemas and validation rules for core modules    | ✅ Complete | `lib/backend/manual/migration/types.ts` |
| 3.2 | Implement migration ID strategy (`legacyId`, checksum, migratedAt) | ✅ Complete | `lib/backend/manual/migration/metadata.ts` |
| 3.3 | Build Firestore export parser for core entities                    | ✅ Complete | `lib/backend/manual/migration/firestore-export-parser.ts` |
| 3.4 | Build transform mappers for employee and role data                 | ✅ Complete | `lib/backend/manual/migration/mappers-employee-role.ts` |
| 3.5 | Build transform mappers for attendance and leave data              | ✅ Complete | `lib/backend/manual/migration/mappers-attendance-leave.ts` |
| 3.6 | Build transform mappers for payroll-related entities               | ✅ Complete | `lib/backend/manual/migration/mappers-payroll.ts` |
| 3.7 | Build idempotent import runner with batch/retry controls           | ✅ Complete | `lib/backend/manual/migration/import-runner.ts` |
| 3.8 | Build migration validation checks (counts, sampling, invariants)   | ✅ Complete | `lib/backend/manual/migration/validation.ts` |
| 3.9 | Build migration dry-run report generator                           | ✅ Complete | `lib/backend/manual/migration/validation.ts` |

## Notes

- Tooling is designed as pure TypeScript modules so migration scripts can run in CLI/batch contexts without route coupling.
- The parser supports both JSON bundle (`{ documents: [...] }`) and line-delimited JSON exports for flexibility.
- Import runner enforces idempotency based on `legacyId` and supports configurable batch size and retry attempts.
- Validation output is reusable for CI quality gates and dry-run signoff reports.
