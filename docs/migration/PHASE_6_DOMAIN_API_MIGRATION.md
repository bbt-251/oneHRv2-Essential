# Phase 6 — Domain-by-Domain API Migration (Core Operations First)

This document records implementation status for **Phase 6** tasks from `FIREBASE_TO_MANUAL_SERVER_MIGRATION_PLAN.md`.

## Status Summary

| ID | Task | Status | Artifact(s) |
| --- | --- | --- | --- |
| 6A.1 | Implement employee CRUD + query endpoints | ✅ Complete | `app/api/manual/domain/employees/route.ts`, `app/api/manual/domain/employees/[employeeUid]/route.ts`, `lib/backend/manual/phase-6-domain-service.ts` |
| 6A.2 | Implement employee-role linkage and permission checks | ✅ Complete | `app/api/manual/domain/employees/route.ts`, `app/api/manual/domain/employees/[employeeUid]/route.ts`, `lib/backend/manual/phase-6-route-helpers.ts` |
| 6A.3 | Implement employee profile read model for dashboard | ✅ Complete | `lib/backend/manual/phase-6-domain-service.ts`, `app/api/manual/domain/employees/[employeeUid]/route.ts` |
| 6A.4 | Write integration tests for employee domain | ✅ Complete | `lib/backend/manual/phase-6-tests.ts` |
| 6B.1 | Implement attendance read/write endpoints | ✅ Complete | `app/api/manual/domain/attendance/route.ts`, `lib/backend/manual/phase-6-domain-service.ts` |
| 6B.2 | Implement attendance correction/adjustment workflow | ✅ Complete | `app/api/manual/domain/attendance/[attendanceId]/route.ts`, `lib/backend/manual/phase-6-domain-service.ts` |
| 6B.3 | Implement overtime request API and approvals | ✅ Complete | `app/api/manual/domain/attendance/overtime/route.ts`, `app/api/manual/domain/attendance/overtime/[requestId]/route.ts`, `lib/backend/manual/phase-6-domain-service.ts` |
| 6B.4 | Write attendance/overtime domain tests | ✅ Complete | `lib/backend/manual/phase-6-tests.ts` |
| 6C.1 | Implement leave request create/list/update endpoints | ✅ Complete | `app/api/manual/domain/leaves/route.ts`, `app/api/manual/domain/leaves/[leaveId]/route.ts` |
| 6C.2 | Implement manager/HR leave approval policy checks | ✅ Complete | `app/api/manual/domain/leaves/[leaveId]/route.ts`, `lib/backend/manual/phase-6-route-helpers.ts` |
| 6C.3 | Implement leave balance consistency checks | ✅ Complete | `lib/backend/manual/phase-6-domain-service.ts` |
| 6C.4 | Write leave domain tests | ✅ Complete | `lib/backend/manual/phase-6-tests.ts` |
| 6D.1 | Implement payroll settings endpoints | ✅ Complete | `app/api/manual/domain/payroll/settings/route.ts`, `lib/backend/manual/phase-6-domain-service.ts` |
| 6D.2 | Implement compensation endpoints | ✅ Complete | `app/api/manual/domain/payroll/compensation/route.ts`, `lib/backend/manual/phase-6-domain-service.ts` |
| 6D.3 | Implement employee loan endpoints | ✅ Complete | `app/api/manual/domain/payroll/loans/route.ts`, `app/api/manual/domain/payroll/loans/[loanId]/route.ts`, `lib/backend/manual/phase-6-domain-service.ts` |
| 6D.4 | Write payroll/compensation tests | ✅ Complete | `lib/backend/manual/phase-6-tests.ts` |

## Notes

- The current Phase 6 implementation uses an in-memory store to provide deterministic behavior while preserving authorization and validation patterns established in Phase 2.
- APIs follow tenant scoping through `tenantId` query handling and centralized authz checks.
- Domain tests are focused end-to-end service behavior checks for CRUD, workflows, approvals, and consistency constraints.
