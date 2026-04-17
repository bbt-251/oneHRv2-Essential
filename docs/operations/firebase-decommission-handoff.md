# Firebase Decommission Handoff (Phase 9.5)

## Objective
Finalize operational ownership after migration cutover.

## Scope
- Manual auth/data/storage backends are the runtime source of truth.
- Firebase is retained only as historical/rollback artifact during safety window.

## Ownership
| Area | Owner | Backup | Notes |
| --- | --- | --- | --- |
| Manual API uptime and incidents | Platform/API Team | SRE On-Call | `/api/manual/*` routes and backend services |
| MongoDB backup/restore | Data Platform | SRE On-Call | Runbooks in infrastructure docs |
| Redis health / rate-limit behavior | Platform/API Team | SRE On-Call | Track auth throttling and queue health |
| Storage signed URL policy | Security + Platform/API Team | SRE | Enforce MIME, max size, access policy |
| Migration audits | Platform/API Team | QA | Run `pnpm run phase9:audit` before release |

## Runbook Checklist
- [x] Incident route for manual backend documented.
- [x] On-call ownership moved away from Firebase console operations.
- [x] Firebase decommission audit command defined and automated.
- [x] Known residual Firebase references tracked via audit output until removed.

## Operational Commands
- `pnpm run phase9:audit`
- `pnpm run audit:firebase:decommission:strict`
- `pnpm run phase9:env:check`
