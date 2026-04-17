# Phase 5 — Storage Migration (Firebase Storage Replacement)

This document records implementation status for **Phase 5** tasks from `FIREBASE_TO_MANUAL_SERVER_MIGRATION_PLAN.md`.

## Status Summary

| ID  | Task                                                      | Status      | Artifact(s) |
| --- | --------------------------------------------------------- | ----------- | ----------- |
| 5.1 | Define object key naming convention and metadata schema   | ✅ Complete | `lib/backend/manual/storage/types.ts`, `lib/backend/manual/storage/service.ts` |
| 5.2 | Implement signed upload URL endpoint                      | ✅ Complete | `app/api/manual/storage/upload-url/route.ts`, `lib/backend/manual/storage/service.ts` |
| 5.3 | Implement signed download URL endpoint with auth policy   | ✅ Complete | `app/api/manual/storage/download-url/route.ts`, `lib/backend/manual/storage/service.ts`, `lib/backend/manual/policy-matrix.ts` |
| 5.4 | Implement storage metadata persistence and linkage        | ✅ Complete | `lib/backend/manual/storage/service.ts`, `lib/backend/manual/storage/types.ts` |
| 5.5 | Build file integrity and MIME validation checks           | ✅ Complete | `lib/backend/manual/storage/validation.ts` |
| 5.6 | Build file migration utility from Firebase Storage export | ✅ Complete | `lib/backend/manual/storage/migration.ts` |
| 5.7 | Validate migrated object accessibility with policy tests  | ✅ Complete | `lib/backend/manual/phase-5-tests.ts` |

## Notes

- Signed URL generation currently uses HMAC signatures and local metadata persistence for migration-phase testing. Production wiring to cloud object storage can swap the URL signer while preserving the route contract.
- Metadata persistence captures ownership (`ownerUid`) and domain linkage (`module`, `entityId`, `field`) to support policy-aware download authorization.
- Migration utility accepts both `{ objects: [...] }` and array-shaped exports and stamps migrated records with `legacyPath`, checksum metadata, and migration provenance.
