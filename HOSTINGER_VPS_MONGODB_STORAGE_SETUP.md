# Hostinger VPS MongoDB + Storage Setup Guide

## Purpose

This guide shows how to deploy the current `oneHR` backend shape on a Hostinger VPS with:

- the full Next.js app running on the VPS
- MongoDB on the VPS
- local filesystem storage for uploaded files
- Next.js app served behind Nginx
- PM2 for process management

This guide is based on the current repo implementation, not the old Firebase setup.

## Deployment Mode Assumed In This Guide

This guide assumes:

- the full app is hosted on the VPS
- the frontend pages and backend API routes both run from the same Next.js deployment
- MongoDB runs locally on the same VPS
- storage writes to the VPS filesystem

This is currently the simplest production path for this repo because the backend is still embedded in the Next.js app under:

- `/api/auth/*`
- `/api/data/*`
- `/api/storage/*`

If you later split the frontend onto Vercel and the backend onto the VPS, that should be treated as a separate deployment architecture.

## Important Architecture Note

The current storage implementation is filesystem-backed.

- Upload/download requests go through [app/api/storage/object/route.ts](/c:/Users/XD/Desktop/Work/oneHRv2-Essential/app/api/storage/object/route.ts)
- Files are written to the directory defined by `MANUAL_STORAGE_ROOT`
- `MANUAL_OBJECT_STORAGE_BUCKET` is still used as metadata/logical naming, but this repo is not currently writing to S3/Spaces/MinIO directly

So for production today, your VPS needs:

- MongoDB
- a persistent directory for uploaded files
- good disk backup strategy

If you later want true object storage, that would be a separate backend change.

---

## 1. Recommended Production Layout

Use something like:

- App code: `/var/www/onehr`
- Uploaded files: `/var/lib/onehr/storage/dev`
- Nginx config: `/etc/nginx/sites-available/onehr`
- PM2 process name: `onehr`
- Domain: `api-dev-onehr.yourdomain.com`

---

## 2. Prepare the VPS

Assumption:

- Ubuntu 22.04 or 24.04 on Hostinger VPS
- You have SSH access as a sudo-enabled user

Update packages:

```bash
sudo apt update && sudo apt upgrade -y
```

Install common tools:

```bash
sudo apt install -y curl git unzip build-essential nginx ufw
```

Enable firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 3. Install Node.js and pnpm

Install Node 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
node -v
npm -v
```

Install pnpm:

```bash
sudo npm install -g pnpm
```

Install PM2:

```bash
sudo npm install -g pm2
```

---

## 4. Install MongoDB

For a Hostinger VPS running **Ubuntu 24.04.2 LTS**, use **MongoDB 8.0**.

Important:

- MongoDB 7.0 does **not** officially support Ubuntu 24.04
- MongoDB 8.0 **does** officially support Ubuntu 24.04 (`Noble`)

Install MongoDB Community Edition from MongoDB’s official repository.

Import the GPG key:

```bash
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | \
sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
```

Add the repository for Ubuntu 24.04 (`Noble`):

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | \
sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
```

Install MongoDB:

```bash
sudo apt update
sudo apt install -y mongodb-org
```

Start and enable it:

```bash
sudo systemctl enable mongod
sudo systemctl start mongod
sudo systemctl status mongod
```

If `mongod` is active, MongoDB is installed correctly.

---

## 5. Create the Application Database and User

Open Mongo shell:

```bash
mongosh
```

Create a DB user:

```javascript
use admin

db.createUser({
  user: "onehr_user",
  pwd: "REPLACE_WITH_A_STRONG_PASSWORD",
  roles: [
    { role: "readWrite", db: "onehr_dev" }
  ]
})
```

Expected result:

```javascript
{
    ok: 1;
}
```

Then exit:

```javascript
exit;
```

Then test login before enabling auth:

```bash
mongosh "mongodb://onehr_user:REPLACE_WITH_A_STRONG_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin"
```

If your password contains special characters like `%`, URL-encode them in the connection string.

Example:

- password: `abc%123`
- connection string form: `abc%25123`

Recommended MongoDB URI:

```text
mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin
```

Use `127.0.0.1`, not a public IP, unless you intentionally want external access.

---

## 6. Enable MongoDB Authentication

Once the DB user works, enable authentication in MongoDB.

Edit the config:

```bash
sudo nano /etc/mongod.conf
```

Make sure this block exists:

```yaml
security:
    authorization: enabled
```

In this repo’s deployment model, the expected production config also keeps MongoDB local-only:

```yaml
net:
    port: 27017
    bindIp: 127.0.0.1
```

That means:

- MongoDB listens only on the VPS itself
- the app can connect locally
- the database is not exposed publicly

Save and exit `nano`:

```text
Ctrl + X
Y
Enter
```

Restart MongoDB:

```bash
sudo systemctl restart mongod
sudo systemctl status mongod
```

You want to see:

```text
Active: active (running)
```

Then test authenticated access again:

```bash
mongosh "mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin"
```

If that works after restart, MongoDB authentication is enabled correctly and your app DB user is ready.

Example restart and verification flow:

```bash
sudo systemctl restart mongod
sudo systemctl status mongod
mongosh "mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin"
```

You want:

- `mongod.service` to show `active (running)`
- authenticated `mongosh` login to succeed

### 6.1 Clean Up Old MongoDB Repositories

If you previously added an older MongoDB repo, remove it so your package source stays clean.

List Mongo repo files:

```bash
ls /etc/apt/sources.list.d | grep mongodb
```

If you see an old `7.0` repo file, remove it:

```bash
sudo rm /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
```

On Ubuntu 24.04, keep the `8.0` / `noble` repo only.

---

## 6.2 Enable Replica Set For Realtime Change Streams

This repo’s realtime update path uses MongoDB Change Streams.

Important:

- Change Streams require MongoDB to run as a **replica set**
- a **single-node replica set** is enough
- this is required even when MongoDB is installed on one VPS only

### 6.2.1 Add Replica Set Config

Edit MongoDB config:

```bash
sudo nano /etc/mongod.conf
```

Make sure these sections exist:

```yaml
net:
    port: 27017
    bindIp: 127.0.0.1

security:
    authorization: enabled
    keyFile: /etc/mongo-keyfile/keyfile

replication:
    replSetName: rs0
```

### 6.2.2 Create the MongoDB Keyfile

When `authorization` and `replication` are both enabled, MongoDB requires a keyfile for internal replica set authentication.

Run:

```bash
sudo mkdir -p /etc/mongo-keyfile
openssl rand -base64 756 | sudo tee /etc/mongo-keyfile/keyfile > /dev/null
sudo chmod 400 /etc/mongo-keyfile/keyfile
sudo chown mongodb:mongodb /etc/mongo-keyfile/keyfile
```

Verify:

```bash
sudo ls -l /etc/mongo-keyfile/keyfile
```

You want something like:

```text
-r-------- 1 mongodb mongodb ...
```

### 6.2.3 Restart MongoDB

```bash
sudo systemctl restart mongod
sudo systemctl status mongod
```

If MongoDB fails at this stage, inspect:

```bash
sudo journalctl -u mongod -n 100 --no-pager
sudo tail -n 100 /var/log/mongodb/mongod.log
```

### 6.2.4 Fix the Stale Unix Socket Problem If It Happens

In our setup, MongoDB failed once because of a stale socket file:

```text
/tmp/mongodb-27017.sock
```

If you see an error like:

```text
Failed to unlink socket file ... Operation not permitted
```

run:

```bash
sudo systemctl stop mongod
sudo ls -l /tmp/mongodb-27017.sock
sudo rm -f /tmp/mongodb-27017.sock
sudo systemctl start mongod
sudo systemctl status mongod
```

### 6.2.5 Initialize `rs0`

Because `authorization` is enabled, the cleanest recovery flow we used was:

1. temporarily disable the `security` block
2. start MongoDB without auth
3. run `rs.initiate(...)`
4. restore the `security` block
5. restart MongoDB with auth enabled again

#### Temporarily disable auth

Edit the config:

```bash
sudo nano /etc/mongod.conf
```

Temporarily remove or comment out:

```yaml
security:
    authorization: enabled
    keyFile: /etc/mongo-keyfile/keyfile
```

Keep:

```yaml
replication:
    replSetName: rs0
```

Then restart:

```bash
sudo systemctl restart mongod
sudo systemctl status mongod
```

#### Connect and initialize the replica set

```bash
mongosh "mongodb://127.0.0.1:27017/admin"
```

Then run:

```javascript
rs.initiate({
    _id: "rs0",
    members: [{ _id: 0, host: "127.0.0.1:27017" }],
});
```

Verify:

```javascript
rs.status();
```

You want:

- `set: "rs0"`
- `stateStr: "PRIMARY"`

#### Re-enable auth

Restore the `security` block in `/etc/mongod.conf`:

```yaml
security:
    authorization: enabled
    keyFile: /etc/mongo-keyfile/keyfile
```

Then restart:

```bash
sudo systemctl restart mongod
sudo systemctl status mongod
```

### 6.2.6 Final Login Test With Replica Set URI

Test authenticated access using the replica set parameter:

```bash
mongosh "mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin&replicaSet=rs0"
```

If your password contains `%`, URL-encode it.

Example:

- raw password: `1q2w3e4r%T`
- URI form: `1q2w3e4r%25T`

If login succeeds and the prompt shows something like:

```text
rs0 [primary] onehr_dev>
```

then MongoDB is correctly configured for change streams.

### 6.2.7 Why This Matters For This Repo

The app’s realtime layer now depends on MongoDB Change Streams for live read updates.

Without the replica set:

- initial snapshots still load
- but live change notifications from MongoDB do **not** work

With `rs0` enabled:

- Mongo-backed realtime updates work correctly
- employee and leave changes can flow into the app without manual refresh

---

## 7. Create the Storage Directory

Create a persistent storage location:

```bash
sudo mkdir -p /var/lib/onehr/storage/dev
sudo mkdir -p /var/lib/onehr/storage/int
sudo mkdir -p /var/lib/onehr/storage/val
```

Set ownership so the app user can write files:

```bash
sudo chown -R $USER:$USER /var/lib/onehr
chmod -R 750 /var/lib/onehr
```

If you are still provisioning as `root` and just want the base directories created first, this also works:

```bash
sudo mkdir -p /var/lib/onehr/storage/dev
sudo mkdir -p /var/lib/onehr/storage/int
sudo mkdir -p /var/lib/onehr/storage/val
sudo chown -R root:root /var/lib/onehr
sudo chmod -R 755 /var/lib/onehr
```

Later, once you know which Linux user will run the app process, you can tighten ownership to that runtime user.

Important:

- `MANUAL_STORAGE_ROOT` should point to a real writable path
- use an absolute path in production
- do not leave it as `.manual-storage` on the VPS

---

## 8. Clone and Install the App

Choose an app directory:

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone <YOUR_REPO_URL> onehr
cd onehr
pnpm install
```

Build once to confirm:

```bash
pnpm build
```

---

## 9. Create the Production `.env`

This repo reads config from [lib/backend/config.ts](/c:/Users/XD/Desktop/Work/oneHRv2-Essential/lib/backend/config.ts).

For the current `DEFAULT_INSTANCE = dev`, the important variables are:

```env
NEXT_PUBLIC_API_DOMAIN_DEV=https://api-dev-onehr.yourdomain.com
NEXT_PUBLIC_STORAGE_DOMAIN_DEV=https://api-dev-onehr.yourdomain.com

MANUAL_MONGODB_URI_DEV=mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin&replicaSet=rs0
MANUAL_MONGODB_DB_DEV=onehr_dev
MANUAL_AUTH_JWT_SECRET_DEV=REPLACE_WITH_A_LONG_RANDOM_SECRET
MANUAL_STORAGE_ROOT_DEV=/var/lib/onehr/storage/dev
MANUAL_OBJECT_STORAGE_BUCKET_DEV=onehr-manual-dev
MANUAL_REDIS_URL_DEV=redis://127.0.0.1:6379
```

### 9.1 What `NEXT_PUBLIC_API_DOMAIN_DEV` and `NEXT_PUBLIC_STORAGE_DOMAIN_DEV` Mean

These are the public URLs the browser uses to reach your deployed app.

Example:

```env
NEXT_PUBLIC_API_DOMAIN_DEV=https://api-dev-onehr.yourdomain.com
NEXT_PUBLIC_STORAGE_DOMAIN_DEV=https://api-dev-onehr.yourdomain.com
```

Why they are the same in this repo:

- API routes are served by the Next.js app
- storage upload/download routes are also served by the same Next.js app
- so both point to the same public origin

### 9.2 Why `MANUAL_MONGODB_URI_DEV` Uses `127.0.0.1`

This variable is server-side only.

The browser does **not** connect to MongoDB directly.

The actual flow is:

1. browser calls `https://api-dev-onehr.yourdomain.com/api/...`
2. the Next.js backend on the VPS receives the request
3. the backend reads `MANUAL_MONGODB_URI_DEV`
4. the backend connects locally to MongoDB at `127.0.0.1:27017`

So this is correct and expected:

```env
MANUAL_MONGODB_URI_DEV=mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin&replicaSet=rs0
```

The distinction is:

- `NEXT_PUBLIC_*` values are browser-facing
- `MANUAL_*` database values are backend-only

This is the secure production pattern for a VPS deployment.

If you also want `int` and `val`, add:

```env
NEXT_PUBLIC_API_DOMAIN_INT=https://api-int-onehr.yourdomain.com
NEXT_PUBLIC_STORAGE_DOMAIN_INT=https://api-int-onehr.yourdomain.com
MANUAL_MONGODB_URI_INT=mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_int?authSource=admin&replicaSet=rs0
MANUAL_MONGODB_DB_INT=onehr_int
MANUAL_AUTH_JWT_SECRET_INT=ANOTHER_LONG_RANDOM_SECRET
MANUAL_STORAGE_ROOT_INT=/var/lib/onehr/storage/int
MANUAL_OBJECT_STORAGE_BUCKET_INT=onehr-manual-int
MANUAL_REDIS_URL_INT=redis://127.0.0.1:6379
```

And similarly for `VAL`.

Create the file:

```bash
nano /var/www/onehr/.env
```

Paste the values and save.

## 8.1 Secrets Guidance

Use strong secrets for:

- `MANUAL_AUTH_JWT_SECRET_DEV`
- `MANUAL_AUTH_JWT_SECRET_INT`
- `MANUAL_AUTH_JWT_SECRET_VAL`

Generate a strong value:

```bash
openssl rand -base64 48
```

## 8.2 Redis Note

The config supports `MANUAL_REDIS_URL`.

- If you already use Redis on the VPS, set it
- if not, leave it planned and add it later if a feature actually needs it

The core deployment focus here is MongoDB + filesystem storage.

---

## 10. Run the App with PM2

From the app directory:

```bash
cd /var/www/onehr
pnpm build
pm2 start "pnpm start" --name onehr
pm2 save
pm2 startup
```

The `startup` command will print another command. Run that command too.

Check the app:

```bash
pm2 status
pm2 logs onehr
```

By default, `next start` uses port `3000`.

---

## 11. Configure Nginx Reverse Proxy

Create the Nginx site config:

```bash
sudo nano /etc/nginx/sites-available/onehr
```

Use:

```nginx
server {
    listen 80;
    server_name api-dev-onehr.yourdomain.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/onehr /etc/nginx/sites-enabled/onehr
sudo nginx -t
sudo systemctl reload nginx
```

---

## 12. Add SSL with Let’s Encrypt

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Issue the cert:

```bash
sudo certbot --nginx -d api-dev-onehr.yourdomain.com
```

Test renewal:

```bash
sudo certbot renew --dry-run
```

---

## 13. DNS Setup

In Hostinger DNS:

- create an `A` record for `api-dev-onehr.yourdomain.com`
- point it to your VPS public IP

If you also use `int` or `val`, create:

- `api-int-onehr.yourdomain.com`
- `api-val-onehr.yourdomain.com`

If all environments are hosted on the same VPS, you can still route them to the same app and switch behavior through `DEFAULT_INSTANCE` plus environment configuration.

---

## 14. Verify the Deployment

On the server:

```bash
cd /var/www/onehr
pnpm build
pm2 logs onehr
```

Check these routes:

- `https://api-dev-onehr.yourdomain.com/api/auth/session`
- `https://api-dev-onehr.yourdomain.com/api/data/query`
- `https://api-dev-onehr.yourdomain.com/api/storage/upload-url`

Expected:

- route responds
- app logs do not show missing JWT secret
- MongoDB connection works
- uploads create files inside `/var/lib/onehr/storage/dev`
- authenticated MongoDB login works:

```bash
mongosh "mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin"
```

To verify storage writes:

```bash
ls -R /var/lib/onehr/storage/dev
```

---

## 15. Recommended Production Hardening

### MongoDB

- bind MongoDB to localhost unless you explicitly need remote DB access
- create a dedicated app user
- enable `security.authorization`
- do not expose MongoDB publicly on the VPS firewall

### Storage

- keep uploads outside the repo directory
- back up `/var/lib/onehr/storage`
- watch disk usage

### App

- run through PM2 or systemd
- keep `.env` readable only by the deployment user

Example:

```bash
chmod 600 /var/www/onehr/.env
```

### Nginx

- set `client_max_body_size` high enough for leave attachments
- use HTTPS only in production

---

## 16. Backup Recommendations

At minimum back up:

- MongoDB database
- `/var/lib/onehr/storage`
- `.env`

Mongo backup example:

```bash
mongodump --uri="mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin" --out /var/backups/onehr/mongo
```

Storage backup example:

```bash
rsync -a /var/lib/onehr/storage/ /var/backups/onehr/storage/
```

If this is production, schedule both with cron.

---

## 17. If You Want Multiple Environments on One VPS

Use:

- separate MongoDB DB names
- separate storage roots
- separate subdomains
- separate JWT secrets

Example split:

- `dev` -> DB `onehr_dev`, storage `/var/lib/onehr/storage/dev`
- `int` -> DB `onehr_int`, storage `/var/lib/onehr/storage/int`
- `val` -> DB `onehr_val`, storage `/var/lib/onehr/storage/val`

That matches the instance-driven config model already in this repo.

---

## 18. Current Repo-Specific Notes

- `DEFAULT_INSTANCE` is currently `dev` in [lib/backend/config.ts](/c:/Users/XD/Desktop/Work/oneHRv2-Essential/lib/backend/config.ts)
- build currently passes
- current known non-blocking warnings:
    - Turbopack NFT warning from `app/api/storage/object/route.ts`
    - TypeScript version warning (`5.0.2`)

Neither of those prevents VPS deployment, but both are worth cleaning up later.

---

## 19. Minimum `.env` Example

If you only want the `dev` instance on the VPS, this is the minimum practical starting point:

```env
NEXT_PUBLIC_API_DOMAIN_DEV=https://api-dev-onehr.yourdomain.com
NEXT_PUBLIC_STORAGE_DOMAIN_DEV=https://api-dev-onehr.yourdomain.com

MANUAL_MONGODB_URI_DEV=mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin
MANUAL_MONGODB_DB_DEV=onehr_dev
MANUAL_AUTH_JWT_SECRET_DEV=REPLACE_WITH_A_LONG_RANDOM_SECRET
MANUAL_STORAGE_ROOT_DEV=/var/lib/onehr/storage/dev
MANUAL_OBJECT_STORAGE_BUCKET_DEV=onehr-manual-dev
```

For a dev-only Hostinger VPS, this is the simplest practical interpretation:

- `NEXT_PUBLIC_API_DOMAIN_DEV`
  the public domain that points to your VPS through Nginx
- `NEXT_PUBLIC_STORAGE_DOMAIN_DEV`
  same value as the API domain, because storage routes are served by the same app
- `MANUAL_MONGODB_URI_DEV`
  local MongoDB connection from the VPS backend to MongoDB on `127.0.0.1`

---

## 20. Recommended Next Step After Server Setup

Once the VPS is ready:

1. deploy the app
2. confirm auth/session works
3. confirm a leave attachment upload writes to disk
4. confirm `app-data-context.tsx` subscriptions work against the deployed backend

That will complete the practical deployment verification for MongoDB + storage.

---

## 21. Local Development Against the VPS Database

If you want to run the app locally with:

```bash
pnpm dev
```

and still use the MongoDB instance on the VPS, use an SSH tunnel.

### Why use a tunnel instead of exposing MongoDB publicly

Your production MongoDB config should stay:

```yaml
net:
    bindIp: 127.0.0.1
```

That keeps MongoDB private to the VPS.

Instead of opening MongoDB to the internet, create a secure local tunnel from your machine to the VPS.

### 21.1 Open an SSH Tunnel

Run this on your local machine:

```bash
ssh -L 27017:127.0.0.1:27017 root@YOUR_VPS_IP
```

What this does:

- your local machine listens on `127.0.0.1:27017`
- traffic is tunneled through SSH
- MongoDB still remains local-only on the VPS

Leave that SSH session open while testing.

### 21.1.1 If SSH Password Login Fails

If plain SSH fails with `Permission denied`, first test direct SSH:

```bash
ssh root@YOUR_VPS_IP
```

If that fails even after setting a known root password on the VPS, check the SSH config on the VPS:

```bash
sudo grep -E '^(PermitRootLogin|PasswordAuthentication)' /etc/ssh/sshd_config
sudo grep -E '^(PermitRootLogin|PasswordAuthentication)' /etc/ssh/sshd_config.d/* 2>/dev/null
```

You may find a conflict like:

```text
PermitRootLogin yes
PasswordAuthentication yes
PasswordAuthentication no
```

This can happen when one file enables password auth and a later override file disables it.

For example, we found:

- `/etc/ssh/sshd_config` -> `PermitRootLogin yes`
- `/etc/ssh/sshd_config.d/50-cloud-init.conf` -> `PasswordAuthentication yes`
- `/etc/ssh/sshd_config.d/60-cloudimg-settings.conf` -> `PasswordAuthentication no`

In that case, edit the later override file and change it to:

```text
PasswordAuthentication yes
```

Example:

```bash
sudo nano /etc/ssh/sshd_config.d/60-cloudimg-settings.conf
```

Then validate the SSH config before restarting:

```bash
sudo sshd -t
```

If there is no output, the config is valid.

Then restart SSH:

```bash
sudo systemctl restart ssh
```

Do not close your existing VPS terminal session until you have confirmed new SSH logins work from your local machine.

Once plain SSH works:

```bash
ssh root@YOUR_VPS_IP
```

then the tunnel command should also work:

```bash
ssh -L 27017:127.0.0.1:27017 root@YOUR_VPS_IP
```

### 21.1.2 Example Tunnel Workflow

1. Open the tunnel:

```bash
ssh -L 27017:127.0.0.1:27017 root@195.35.24.110
```

2. Leave that terminal open

3. In another local terminal, test the database connection:

```bash
mongosh "mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin"
```

If that works, your local machine can reach the VPS MongoDB safely through SSH.

### 21.2 Local `.env` for Development

Then in your local repo, use:

```env
NEXT_PUBLIC_API_DOMAIN_DEV=http://localhost:3011
NEXT_PUBLIC_STORAGE_DOMAIN_DEV=http://localhost:3011

MANUAL_MONGODB_URI_DEV=mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin
MANUAL_MONGODB_DB_DEV=onehr_dev
MANUAL_AUTH_JWT_SECRET_DEV=YOUR_LOCAL_OR_SHARED_DEV_SECRET
MANUAL_STORAGE_ROOT_DEV=.manual-storage/dev
MANUAL_OBJECT_STORAGE_BUCKET_DEV=onehr-manual-dev
```

Important:

- here `127.0.0.1:27017` means your **local tunnel**
- the actual MongoDB still lives on the VPS
- `NEXT_PUBLIC_API_DOMAIN_DEV` stays local because your Next.js app is running locally on port `3011`

### 21.3 Run the App Locally

With the SSH tunnel open:

```bash
pnpm install
pnpm dev
```

Then open:

```text
http://localhost:3011
```

Now the app runs locally, but it uses the VPS MongoDB through the SSH tunnel.

### 21.4 Local Storage Behavior

When you run the app locally:

- MongoDB can point to the VPS through SSH
- storage writes will still happen locally unless you intentionally point `MANUAL_STORAGE_ROOT_DEV` somewhere else

That means:

- DB data can be shared with the VPS
- uploaded files during local dev will usually be stored on your own machine

This is usually fine for development.

If you want local testing to also use VPS-hosted files, that would require a different storage architecture than the current filesystem-backed implementation.
