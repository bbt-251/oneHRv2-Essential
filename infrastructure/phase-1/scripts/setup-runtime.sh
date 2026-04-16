#!/usr/bin/env bash
set -euo pipefail

# Phase 1.2, 1.9, 1.10 - Reverse proxy, TLS/HSTS-ready config, environment domains
API_DOMAIN="${API_DOMAIN:-api.onehr.example.com}"
UPSTREAM_HOST="${UPSTREAM_HOST:-127.0.0.1}"
UPSTREAM_PORT="${UPSTREAM_PORT:-3001}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root." >&2
  exit 1
fi

apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

install -d /etc/nginx/snippets
cat > /etc/nginx/snippets/onehr-security-headers.conf <<'NGINX'
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
NGINX

cat > /etc/nginx/sites-available/onehr-api <<NGINX
server {
  listen 80;
  server_name ${API_DOMAIN};
  location /.well-known/acme-challenge/ { root /var/www/html; }
  location / { return 301 https://\$host\$request_uri; }
}

server {
  listen 443 ssl http2;
  server_name ${API_DOMAIN};
  ssl_certificate /etc/letsencrypt/live/${API_DOMAIN}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${API_DOMAIN}/privkey.pem;
  include /etc/nginx/snippets/onehr-security-headers.conf;
  location / {
    proxy_pass http://${UPSTREAM_HOST}:${UPSTREAM_PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NGINX

ln -sf /etc/nginx/sites-available/onehr-api /etc/nginx/sites-enabled/onehr-api
nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "Runtime and reverse proxy setup complete for ${API_DOMAIN}."
