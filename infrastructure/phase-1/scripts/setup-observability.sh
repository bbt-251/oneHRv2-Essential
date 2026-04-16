#!/usr/bin/env bash
set -euo pipefail

# Phase 1.6 and 1.8 - Logging and monitoring baseline
if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root." >&2
  exit 1
fi

apt-get update
apt-get install -y prometheus-node-exporter docker.io docker-compose-plugin
systemctl enable --now prometheus-node-exporter
systemctl enable --now docker

mkdir -p /opt/onehr/monitoring
cat > /opt/onehr/monitoring/compose.yml <<'YAML'
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    restart: unless-stopped
    ports:
      - "127.0.0.1:3002:3001"
    volumes:
      - ./uptime-kuma:/app/data
YAML

cd /opt/onehr/monitoring && docker compose up -d

echo "Observability baseline configured (node_exporter + uptime-kuma)."
