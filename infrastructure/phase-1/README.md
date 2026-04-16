# Phase 1 Infrastructure Implementation

This directory contains implementation artifacts for **Phase 1 — Environment and Infrastructure Setup** from `FIREBASE_TO_MANUAL_SERVER_MIGRATION_PLAN.md`.

## What's Included

- `scripts/bootstrap-vm.sh` — Ubuntu baseline hardening (users, SSH policy, UFW).
- `scripts/setup-runtime.sh` — installs runtime packages, configures Nginx reverse proxy, and enables TLS/HSTS-ready config scaffolding.
- `scripts/setup-datastores.sh` — provisions MongoDB and Redis with baseline secure settings.
- `scripts/setup-observability.sh` — installs and configures Prometheus Node Exporter and Uptime Kuma.
- `scripts/backup.sh` — backup routine for MongoDB and object-storage metadata snapshots.
- `nginx/api.conf` — reverse-proxy and API domain routing template.
- `docs/domain-strategy.md` — stable API domain strategy for environments.
- `docs/tenant-routing.md` — tenant routing strategy and standards.
- `docs/object-storage-policy.md` — object-storage bucket and IAM policy model for signed URL flows.
- `docs/logging-retention.md` — centralized logging and retention recommendations.
- `monitoring/alerts.yml` — baseline alert definitions.

## Execution Order

1. `bootstrap-vm.sh`
2. `setup-runtime.sh`
3. `setup-datastores.sh`
4. `setup-observability.sh`
5. Configure cloud object storage using `docs/object-storage-policy.md`
6. Schedule `backup.sh` via systemd timer or cron

## Notes

- Scripts are designed for Ubuntu 24.04 LTS and should be run with root privileges.
- Values are configurable via environment variables and `.env` exports before execution.
