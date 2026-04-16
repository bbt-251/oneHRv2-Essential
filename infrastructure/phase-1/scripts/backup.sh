#!/usr/bin/env bash
set -euo pipefail

# Phase 1.7 - Backup routines for DB + storage metadata snapshots
BACKUP_DIR="${BACKUP_DIR:-/var/backups/onehr}"
MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27017}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STORAGE_METADATA_DIR="${STORAGE_METADATA_DIR:-/var/lib/onehr/storage-metadata}"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET_DIR="${BACKUP_DIR}/${TIMESTAMP}"
mkdir -p "${TARGET_DIR}"

mongodump --uri "${MONGO_URI}" --archive="${TARGET_DIR}/mongo.archive.gz" --gzip
if [[ -d "${STORAGE_METADATA_DIR}" ]]; then
  tar -czf "${TARGET_DIR}/storage-metadata.tar.gz" -C "${STORAGE_METADATA_DIR}" .
fi

find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d -mtime +"${RETENTION_DAYS}" -exec rm -rf {} +

echo "Backup completed at ${TARGET_DIR}"
