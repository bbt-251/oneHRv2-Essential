# Firebase Resource Archive & Decommission Log (Phase 9.6)

## Safety Window
- Cutover complete: **2026-04-17**
- Safety window policy: 30 days minimum before irreversible deletion.
- Earliest irreversible decommission date: **2026-05-17**.

## Archive Inventory
| Resource Class | Archive Status | Location | Notes |
| --- | --- | --- | --- |
| Firestore export snapshots | Archived | Secure backup vault | Retained for policy window |
| Firebase Auth user export | Archived | Secure backup vault | Used by migration verification |
| Storage object metadata map | Archived | Internal object storage + checksum manifest | Required for traceability |
| Rules / policy snapshots | Archived | Repo history + release artifacts | Used for parity audit |

## Decommission Checklist
- [x] Export artifacts captured and retention owners assigned.
- [x] Decommission audit command available to block regressions.
- [x] Runtime ownership switched to manual backend components.
- [ ] Permanent Firebase project deletion scheduled after safety window.

## Approval Record
| Date | Action | Approved By |
| --- | --- | --- |
| 2026-04-17 | Phase 9 archive checklist initialized | Platform/API Team |
