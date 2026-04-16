#!/usr/bin/env bash
set -euo pipefail

# Phase 1.3 and 1.4 - MongoDB + Redis baseline setup
MONGO_BIND_IP="${MONGO_BIND_IP:-127.0.0.1}"
REDIS_BIND_IP="${REDIS_BIND_IP:-127.0.0.1}"
REDIS_PASSWORD="${REDIS_PASSWORD:-change-me-strong-password}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root." >&2
  exit 1
fi

apt-get update
apt-get install -y gnupg curl redis-server

if ! command -v mongod >/dev/null 2>&1; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt-get update
  apt-get install -y mongodb-org
fi

sed -i "s/^  bindIp: .*/  bindIp: ${MONGO_BIND_IP}/" /etc/mongod.conf
sed -i "s/^bind .*/bind ${REDIS_BIND_IP} ::1/" /etc/redis/redis.conf
sed -i 's/^#\?protected-mode .*/protected-mode yes/' /etc/redis/redis.conf
if grep -q '^# requirepass ' /etc/redis/redis.conf; then
  sed -i "s/^# requirepass .*/requirepass ${REDIS_PASSWORD}/" /etc/redis/redis.conf
elif grep -q '^requirepass ' /etc/redis/redis.conf; then
  sed -i "s/^requirepass .*/requirepass ${REDIS_PASSWORD}/" /etc/redis/redis.conf
else
  echo "requirepass ${REDIS_PASSWORD}" >> /etc/redis/redis.conf
fi

systemctl enable --now mongod
systemctl enable --now redis-server

echo "MongoDB and Redis setup complete."
