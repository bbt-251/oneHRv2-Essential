#!/usr/bin/env bash
set -euo pipefail

# Phase 1.1 - Ubuntu VM baseline hardening (users, SSH policy, firewall)
DEPLOY_USER="${DEPLOY_USER:-onehr}"
SSH_PORT="${SSH_PORT:-22}"
ALLOWED_CIDR="${ALLOWED_CIDR:-0.0.0.0/0}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root." >&2
  exit 1
fi

apt-get update
apt-get install -y ufw fail2ban unattended-upgrades

if ! id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "${DEPLOY_USER}"
  usermod -aG sudo "${DEPLOY_USER}"
fi

mkdir -p "/home/${DEPLOY_USER}/.ssh"
chmod 700 "/home/${DEPLOY_USER}/.ssh"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"

SSHD_CONFIG="/etc/ssh/sshd_config"
cp "${SSHD_CONFIG}" "${SSHD_CONFIG}.bak.$(date +%s)"
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' "${SSHD_CONFIG}"
sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' "${SSHD_CONFIG}"
sed -i 's/^#\?PubkeyAuthentication .*/PubkeyAuthentication yes/' "${SSHD_CONFIG}"

if grep -q '^#\?Port ' "${SSHD_CONFIG}"; then
  sed -i "s/^#\?Port .*/Port ${SSH_PORT}/" "${SSHD_CONFIG}"
else
  echo "Port ${SSH_PORT}" >> "${SSHD_CONFIG}"
fi

systemctl restart ssh || systemctl restart sshd

ufw default deny incoming
ufw default allow outgoing
ufw allow from "${ALLOWED_CIDR}" to any port "${SSH_PORT}" proto tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

systemctl enable --now fail2ban

echo "VM hardening completed."
