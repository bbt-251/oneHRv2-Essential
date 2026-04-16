# Tenant Routing Strategy (Phase 1.11)

## Chosen Model

**Primary:** subdomain-per-tenant for web app and custom header for service-to-service API calls.

- Web/API tenant identifier: `tenantSlug` derived from `tenantSlug.onehr.example.com`.
- Internal/service calls: `X-Tenant-Id` header enforced by gateway policy.

## Rules

1. External requests must include tenant context from hostname.
2. Hostname tenant and token tenant claim must match.
3. Missing tenant context returns `400`.
4. Tenant mismatch returns `403`.
5. All datastore queries include tenant scoping in filter criteria.

## Why this approach

- Cleaner isolation and easier customer-facing branding.
- Works with wildcard certs and reverse-proxy routing.
- Header mode keeps job workers and internal APIs simple.
