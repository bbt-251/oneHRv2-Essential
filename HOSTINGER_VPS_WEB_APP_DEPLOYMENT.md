# Hostinger VPS Web App Deployment Guide

## Purpose

This guide is for deploying the `oneHR` web app to a Hostinger VPS when your server foundation is already in place.

It assumes you have already completed the infrastructure setup covered in:

- [HOSTINGER_VPS_MONGODB_STORAGE_SETUP.md](/c:/Users/XD/Desktop/Work/oneHRv2-Essential/HOSTINGER_VPS_MONGODB_STORAGE_SETUP.md)

That means this guide assumes the following already exist:

- a working Hostinger VPS
- Ubuntu configured and reachable over SSH
- Node.js, `pnpm`, `pm2`, and `nginx` installed
- MongoDB installed and configured
- your storage directory created
- your domain or subdomain already pointed at the VPS

This guide focuses only on deploying and updating the web app itself.

---

## Instance Model

This repo already supports multiple instances of the same app through instance-specific environment variables in:

- [lib/shared/config.ts](/c:/Users/XD/Desktop/Work/oneHRv2-Essential/lib/shared/config.ts:1)

Right now:

- `dev`, `int`, and `val` are defined
- `DEFAULT_INSTANCE` is currently `dev`

Reference:

- [lib/shared/config.ts](/c:/Users/XD/Desktop/Work/oneHRv2-Essential/lib/shared/config.ts:93)

That means you can host more than one logical environment for the same app, each with its own:

- MongoDB database
- storage root
- object storage bucket name
- public domain
- auth secret values

For now, this guide assumes you are deploying `dev`.

Later, if you deploy `int`, you will add a second set of `*_INT` environment variables and typically give it a different subdomain and different storage/database targets.

---

## Deployment Model

This repo is a full-stack `Next.js` app.

That means:

- frontend pages are served by `Next.js`
- backend routes under `/api/*` are also served by the same app
- the app should run as a Node.js process behind `nginx`
- the app is not deployed as static hosting

The production flow is:

1. pull or copy the repo to the VPS
2. install dependencies
3. create the production `.env`
4. build the app
5. run it with `pm2`
6. proxy traffic through `nginx`

If `nginx` cannot be used immediately because another service already owns port `80`, you can also run the app directly on another public port such as `8080`.

---

## Recommended App Layout

Use a layout like:

- app code: `/var/www/onehr`
- environment file: `/var/www/onehr/.env`
- process name: `onehr`
- app runtime port: `3000`

---

## 1. Connect to the VPS

SSH into the server:

```bash
ssh your-user@YOUR_VPS_IP
```

Move into the app directory if it already exists:

```bash
cd /var/www/onehr
```

If this is the first deployment and the folder does not exist yet:

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone <YOUR_REPO_URL> onehr
cd onehr
```

---

## 2. Pull the Latest Code

If the repo is already on the server:

```bash
cd /var/www/onehr
git pull origin <YOUR_BRANCH>
```

Example:

```bash
git pull origin main
```

If you deploy from a different branch such as `dev`, use that branch instead.

Confirm you are on the expected branch:

```bash
git branch --show-current
```

---

## 3. Install Dependencies

Install using the lockfile:

```bash
cd /var/www/onehr
pnpm install --frozen-lockfile
```

If you intentionally want to allow lockfile updates on the server, use:

```bash
pnpm install
```

In most cases, `--frozen-lockfile` is the safer production choice.

---

## 4. Create or Update the Production `.env`

This repo reads its deployment config from:

- [lib/shared/config.ts](/c:/Users/XD/Desktop/Work/oneHRv2-Essential/lib/shared/config.ts)

For the current setup, `dev` is the default active instance.

Minimum practical `.env` example:

```env
NEXT_PUBLIC_API_DOMAIN_DEV=https://your-domain.com
NEXT_PUBLIC_STORAGE_DOMAIN_DEV=https://your-domain.com

MANUAL_MONGODB_URI_DEV=mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin&replicaSet=rs0
MANUAL_MONGODB_DB_DEV=onehr_dev
MANUAL_AUTH_JWT_SECRET_DEV=REPLACE_WITH_A_LONG_RANDOM_SECRET
BETTER_AUTH_SECRET=REPLACE_WITH_ANOTHER_LONG_RANDOM_SECRET
MANUAL_STORAGE_ROOT_DEV=/var/lib/onehr/storage/dev
MANUAL_OBJECT_STORAGE_BUCKET_DEV=onehr-manual-dev
DEFAULT_TZ=Africa/Nairobi
```

Optional environment variables used by this repo:

- `MANUAL_REDIS_URL_DEV`
- `TELEGRAM_BOT_TOKEN`
- `NEXT_PUBLIC_ERROR_BOT_URL`

### How This Scales to More Than One Instance

Because [lib/shared/config.ts](/c:/Users/XD/Desktop/Work/oneHRv2-Essential/lib/shared/config.ts:78) reads per-instance variables, you should keep each instance separate.

Example approach:

- `dev` domain: `dev.your-domain.com`
- `int` domain: `int.your-domain.com`
- `dev` DB: `onehr_dev`
- `int` DB: `onehr_int`
- `dev` storage: `/var/lib/onehr/storage/dev`
- `int` storage: `/var/lib/onehr/storage/int`

Example future `int` values:

```env
NEXT_PUBLIC_API_DOMAIN_INT=https://int.your-domain.com
NEXT_PUBLIC_STORAGE_DOMAIN_INT=https://int.your-domain.com

MANUAL_MONGODB_URI_INT=mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_int?authSource=admin&replicaSet=rs0
MANUAL_MONGODB_DB_INT=onehr_int
MANUAL_AUTH_JWT_SECRET_INT=REPLACE_WITH_A_LONG_RANDOM_SECRET
MANUAL_STORAGE_ROOT_INT=/var/lib/onehr/storage/int
MANUAL_OBJECT_STORAGE_BUCKET_INT=onehr-manual-int
```

Important:

- if `DEFAULT_INSTANCE` stays `dev`, the app will use the `*_DEV` values by default
- if you later want a separately deployed `int` app, the cleanest path is usually a second deployment target with its own `.env`, domain, and PM2 process
- do not reuse the same Mongo DB or storage root between `dev` and `int`

Create or edit the file:

```bash
nano /var/www/onehr/.env
```

Then lock down its permissions:

```bash
chmod 600 /var/www/onehr/.env
```

### Important Notes

- `NEXT_PUBLIC_API_DOMAIN_DEV` should be your public HTTPS domain
- `NEXT_PUBLIC_STORAGE_DOMAIN_DEV` can usually be the same value
- `MANUAL_MONGODB_URI_DEV` should stay pointed at `127.0.0.1` if MongoDB is on the same VPS
- `MANUAL_STORAGE_ROOT_DEV` must point to a real writable directory outside the repo

---

## 5. Build the App

This repo’s `package.json` defines:

```json
"build": "pnpm run format && pnpm run lint:fix && pnpm run lint && next build"
```

That script is fine during development, but on a production VPS it is usually better to avoid formatting and auto-fixing files during deployment.

Use:

```bash
cd /var/www/onehr
npx next build
```

If you intentionally want the full repo script, you can still run:

```bash
pnpm build
```

But the safer deployment default is `npx next build`.

---

## 6. Start or Restart the App with PM2

If this is the first deployment:

```bash
cd /var/www/onehr
pm2 start "pnpm start" --name onehr
pm2 save
pm2 startup
```

If the app already exists in PM2 and you are deploying an update:

```bash
cd /var/www/onehr
pm2 restart onehr
pm2 save
```

Check status:

```bash
pm2 status
```

View logs:

```bash
pm2 logs onehr
```

By default, `next start` serves the app on port `3000`.

### Direct-Port Fallback Without Nginx

If you do not want to use `nginx` yet, or if port `80` is already occupied by another service such as Docker, you can expose the app directly on another port like `8080`.

Important:

- do not use `pnpm start -- --hostname 0.0.0.0 --port 8080` for this repo
- that form can be interpreted incorrectly and cause `Invalid project directory provided`
- use `npx next start` directly instead

Correct PM2 command:

```bash
cd /var/www/onehr
pm2 delete onehr-dev
pm2 start "npx next start -p 8080 -H 0.0.0.0" --name onehr-dev
pm2 save
```

Verify:

```bash
pm2 logs onehr-dev
curl -I http://127.0.0.1:8080
```

If that works, open the firewall port:

```bash
sudo ufw allow 8080/tcp
sudo ufw status
```

In that deployment mode, your public app URL becomes:

```text
http://YOUR_VPS_IP:8080
```

Because the app uses `NEXT_PUBLIC_*` values at build time, update `.env` first, then rebuild, then restart PM2.

Example:

```env
NEXT_PUBLIC_API_DOMAIN_DEV=http://195.35.24.110:8080
NEXT_PUBLIC_STORAGE_DOMAIN_DEV=http://195.35.24.110:8080
```

---

## 7. Nginx Reverse Proxy

If your Nginx site is already configured, confirm it proxies traffic to:

```text
http://127.0.0.1:3000
```

Example config:

```nginx
server {
    listen 80;
    server_name your-domain.com;

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

After any config change:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL

If SSL is not already configured:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Test renewal:

```bash
sudo certbot renew --dry-run
```

---

## 8.1 Where the Final URL Comes From

The deployed URL does not get auto-generated by the app.

You choose it during DNS and Nginx setup.

The final public URL is whichever domain or subdomain:

1. points to your VPS public IP in DNS
2. is configured in Nginx as `server_name`
3. is set in your `.env` as `NEXT_PUBLIC_API_DOMAIN_DEV`

Example for `dev`:

```env
NEXT_PUBLIC_API_DOMAIN_DEV=https://dev.your-domain.com
NEXT_PUBLIC_STORAGE_DOMAIN_DEV=https://dev.your-domain.com
```

That means your app URL after deployment will be:

```text
https://dev.your-domain.com
```

Example for a future `int` deployment:

```env
NEXT_PUBLIC_API_DOMAIN_INT=https://int.your-domain.com
NEXT_PUBLIC_STORAGE_DOMAIN_INT=https://int.your-domain.com
```

That means the `int` app URL would be:

```text
https://int.your-domain.com
```

### If You Do Not Yet Have a Domain

You can temporarily reach the app using the VPS public IP:

```text
http://YOUR_VPS_IP
```

or, if Nginx is not in front yet:

```text
http://YOUR_VPS_IP:3000
```

But for normal production use, you should use a real domain or subdomain with HTTPS.

If you are using the direct-port fallback instead of `nginx`, the app may also be exposed like:

```text
http://YOUR_VPS_IP:8080
```

### Practical Recommendation

For your current setup, use something simple like:

- `dev.your-domain.com` for the current deployment
- `int.your-domain.com` for the later integration deployment

Then set each one in:

- DNS
- Nginx `server_name`
- the matching `NEXT_PUBLIC_API_DOMAIN_*` and `NEXT_PUBLIC_STORAGE_DOMAIN_*` values

Once those three match, that is your final URL.

---

## 9. Verify the Deployment

After restarting the app, check:

```bash
pm2 status
pm2 logs onehr
curl -I http://127.0.0.1:3000
curl -I https://dev.your-domain.com
```

Then verify app routes in a browser or with `curl`:

- `https://dev.your-domain.com/`
- `https://dev.your-domain.com/api/auth/session`
- `https://dev.your-domain.com/api/data/query`
- `https://dev.your-domain.com/api/storage/upload-url`

Things to confirm:

- the site loads
- `pm2` shows the process as online
- there are no missing environment variable errors in logs
- MongoDB connection succeeds
- uploads write to your storage directory

To verify storage writes:

```bash
ls -R /var/lib/onehr/storage/dev
```

---

## 10. Standard Update Workflow

For future app updates, use this sequence:

```bash
cd /var/www/onehr
git pull origin <YOUR_BRANCH>
pnpm install --frozen-lockfile
npx next build
pm2 restart onehr
pm2 save
```

Then verify:

```bash
pm2 status
pm2 logs onehr
```

---

## 11. Common Problems

### Build fails because of missing environment variables

Check:

```bash
cat /var/www/onehr/.env
```

Make sure the required values exist, especially:

- `MANUAL_MONGODB_URI_DEV`
- `MANUAL_MONGODB_DB_DEV`
- `MANUAL_AUTH_JWT_SECRET_DEV`
- `BETTER_AUTH_SECRET`
- `MANUAL_STORAGE_ROOT_DEV`

### App starts but the site does not load

Check:

```bash
pm2 logs onehr
sudo nginx -t
sudo systemctl status nginx
```

Also confirm the domain points to the VPS public IP.

### App loads but API or realtime features fail

Check MongoDB:

```bash
sudo systemctl status mongod
mongosh "mongodb://onehr_user:YOUR_PASSWORD@127.0.0.1:27017/onehr_dev?authSource=admin&replicaSet=rs0"
```

If realtime features are not updating, confirm the replica set was initialized correctly.

### Uploads fail

Check the storage path:

```bash
ls -ld /var/lib/onehr/storage/dev
```

Confirm the app process user can write there.

### Port 3000 works directly, but the domain does not

That usually means the Node app is healthy but Nginx or DNS is the problem.

Check:

```bash
curl -I http://127.0.0.1:3000
sudo nginx -t
sudo systemctl status nginx
```

### Nginx fails with `bind() to 0.0.0.0:80 failed (98: Address already in use)`

That means another service already owns port `80`.

Check what is listening:

```bash
sudo ss -ltnp | grep :80
sudo lsof -i :80
```

If you see `docker-proxy`, then Docker is already publishing port `80`.

In that case you have two paths:

1. stop or reconfigure the Docker container so `nginx` can use port `80`
2. skip `nginx` temporarily and run the app directly on another port such as `8080`

If you choose the direct-port approach, use:

```bash
cd /var/www/onehr
pm2 delete onehr-dev
pm2 start "npx next start -p 8080 -H 0.0.0.0" --name onehr-dev
pm2 save
sudo ufw allow 8080/tcp
```

Then update `.env` so the public URL matches:

```env
NEXT_PUBLIC_API_DOMAIN_DEV=http://YOUR_VPS_IP:8080
NEXT_PUBLIC_STORAGE_DOMAIN_DEV=http://YOUR_VPS_IP:8080
```

Then rebuild and restart:

```bash
npx next build
pm2 restart onehr-dev --update-env
```

Your temporary live URL will then be:

```text
http://YOUR_VPS_IP:8080
```

### PM2 shows old errors even after the app is fixed

`pm2 logs` includes previous log lines unless the log files are cleared, so older startup errors may still appear even after the current process is healthy.

What matters most is the newest startup output.

For example, lines like:

```text
▲ Next.js ...
- Local:   http://localhost:8080
- Network: http://0.0.0.0:8080
✓ Ready
```

mean the app is currently running correctly on that port.

---

## 12. Rollback Approach

If a deployment fails after pulling new code:

1. inspect the logs
2. move back to the previous known-good commit
3. rebuild
4. restart PM2

Example:

```bash
cd /var/www/onehr
git log --oneline -n 5
git checkout <PREVIOUS_COMMIT_SHA>
pnpm install --frozen-lockfile
npx next build
pm2 restart onehr
```

If you use rollback often, consider deploying from tagged releases or a dedicated release branch.

---

## 13. Recommended Production Routine

For each deployment:

1. confirm the branch you want to deploy
2. pull latest code
3. install dependencies with the lockfile
4. build with `npx next build`
5. restart `pm2`
6. check logs
7. verify the main site and a few API routes

That gives you a repeatable deployment flow without redoing the full VPS setup each time.

---

## 14. Quick Deploy Command Set

If your VPS is already fully configured, this is the shortest practical deploy flow:

```bash
cd /var/www/onehr
git pull origin main
pnpm install --frozen-lockfile
npx next build
pm2 restart onehr
pm2 save
pm2 logs onehr
```

If this is the very first deployment, replace the restart step with:

```bash
pm2 start "pnpm start" --name onehr
pm2 save
pm2 startup
```
