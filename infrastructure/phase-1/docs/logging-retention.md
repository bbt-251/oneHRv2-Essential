# Centralized Logging and Retention (Phase 1.6)

## Stack

- App logs: structured JSON to stdout
- Collection: Promtail/Fluent Bit (host agent)
- Storage: Loki or managed log platform
- Dashboards: Grafana

## Retention Policy

- Security/audit logs: 180 days
- API access logs: 30 days
- Application debug logs: 14 days
- Background worker logs: 30 days

## Minimum Log Fields

- `timestamp`
- `level`
- `service`
- `env`
- `requestId`
- `tenantId`
- `userId` (if authenticated)
- `eventType`
- `message`

## Guardrails

- Never log secrets or raw tokens.
- Redact PII fields unless explicitly required for audit events.
- Enforce clock sync via NTP on all nodes.
