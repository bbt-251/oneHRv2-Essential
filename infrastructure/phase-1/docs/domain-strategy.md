# API Domain Strategy (Phase 1.9)

## Environment Domain Convention

- Development: `api-dev.onehr.example.com`
- Integration: `api-int.onehr.example.com`
- Staging: `api-staging.onehr.example.com`
- Production: `api.onehr.example.com`

## Standards

1. Every environment gets a unique TLS certificate and DNS A/AAAA record.
2. `api.onehr.example.com` is production only and never reused for pre-production traffic.
3. DNS TTL should be 60 seconds during migration windows and 300 seconds otherwise.
4. Health endpoint standard: `/healthz`.
5. Readiness endpoint standard: `/readyz`.

## Rollout

- Create records in lower environments first (`api-dev`, `api-int`), then `api-staging`, then production.
- Validate TLS handshake and HSTS behavior before exposing clients.
