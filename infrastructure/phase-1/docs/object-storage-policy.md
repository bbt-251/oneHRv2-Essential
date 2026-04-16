# Object Storage Bucket and IAM Policy (Phase 1.5)

## Bucket Layout

- Bucket: `onehr-files-{env}`
- Object key format: `{tenantId}/{module}/{entityId}/{yyyy}/{mm}/{uuid}-{filename}`

## IAM Policy Model

1. Application service account can generate signed upload/download URLs only.
2. Direct public reads are disabled.
3. Signed URL expiry:
   - Upload: 10 minutes
   - Download: 5 minutes (extendable to 15 for large files)
4. Enforce server-side encryption at rest.
5. Enable object versioning for recovery and audit.

## Metadata Requirements

Persist and validate on upload:

- `tenantId`
- `module`
- `entityId`
- `uploadedBy`
- `mimeType`
- `sha256`
- `sizeBytes`
- `createdAt`

## Security Constraints

- Only accept uploads with whitelisted MIME types.
- Reject payloads above per-module size limits.
- Enforce tenant ownership checks before issuing download URLs.
