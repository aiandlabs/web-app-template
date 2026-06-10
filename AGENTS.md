# AGENTS.md — Web App Template for Build.io

This file captures everything learned while building, deploying, and troubleshooting the `aiandlabs/web-app-template` project on Build.io.  Read this before editing the template.

---

## Project Overview

A GitHub Template Repository for interns to quickly deploy Node.js apps to Build.io.  Supports two modes:

- **Phase 1 (zero-dependency):** Uses Node's built-in `http` module.  Deploys instantly with no `npm install`.
- **Phase 2 (full stack):** After interns run `npm install express mongoose` locally, the app auto-upgrades to Express + MongoDB CRUD.

---

## Build.io Deployment Learnings (CRITICAL)

### 1. `npm ci` vs `npm install`

Build.io uses Heroku's Node.js buildpack.  It runs `npm ci` **first** if `package-lock.json` exists.  If `package-lock.json` is malformed or generated without npm, `npm ci` **fails the whole build**.

**What happened to us:**
- Commit a legitimate `package-lock.json` (generated via `npm install` somewhere else).
- Buildpack sees it → runs `npm ci` → works ✅

**What happens if you push a FAKE lockfile (hand-written or empty one):**
```bash
# BAD — do NOT do this
npm init -y  # creates package.json
echo '{}' > package-lock.json  # ←  FAKE, npm ci will fail
git add -A && git commit -m "add lockfile"
git push build main
```
**Result:** Build fails → no `node_modules` → app crashes with `Cannot find module 'express'`. ❌

**Solution:**
- **Option A:** Generate a real lockfile locally with `npm install` (requires Node.js on your machine).
- **Option B:** Don't commit `package-lock.json` at all.  Then `npm install` runs instead of `npm ci`, but Heroku buildpack may still require a lockfile for caching.  **Option A is safer.**
- **Option C (what we use):** Start with zero dependencies.  No lockfile needed.  Interns generate it locally after cloning. Then it deploys fine.

### 2. Build Succeeds but App Still Crashes

Build pack saves the Docker image successfully, but Build.io does **not always immediately release** it.

**What happened:**
- Build 9-11 all saved successfully (logs show `Saving registry...` → `*** Images`).
- Dynos kept running **Build 6's image** (the old crashing one).
- `curl` returned HTTP 000 or connection reset.

**Fix:**
```bash
bld ps:restart --app web-app-template
```
After restarting, the dyno picks up the new image and the app starts working.

### 3. Heroku Buildpack Caches Empty `node_modules`

The `heroku/nodejs` buildpack aggressively caches the `node_modules` layer.  If your **first build** had no dependencies (zero-dep mode), the cache is empty.  When you later add deps to `package.json`, the buildpack **skips `npm install`** because it thinks the cache is still valid.

**Build 15 and 16:**
```
heroku/nodejs   5.3.4
procfile        4.2.1
- web: node server.js
- Done (finished in < 0.1s)   ← SKIPPED npm install
Saving registry...
```
Build finished in 0.1s — no compilation happened. It used a stale cached layer.

**Solution — Invalidate the cache by providing a REAL `package-lock.json`:**

```bash
# On a machine with Node.js (or download it):
mkdir -p /tmp/node
curl -sL "https://nodejs.org/dist/v18.20.5/node-v18.20.5-linux-x64.tar.xz" \
  | tar xJf - -C /tmp/node --strip-components=1
export PATH="/tmp/node/bin:$PATH"

# Now generate a real lockfile
npm install express mongoose

# Commit it
git add package.json package-lock.json
git commit -m "add real package-lock with deps"
git push build main
```

With a **genuine** `package-lock.json`, the buildpack sees a new cache key and runs `npm ci` properly.

**Result — Build 17:**
```
npm install ran successfully
node_modules installed
🚀  my-app (Express) on port 8080
```

### 4. Two Sequential Pushes Don't Guarantee Two Releases

We pushed 3 times in a row. Build.io queued builds 7→11, but even after the builds saved:
```
*** Images (sha256:...): registry.us-east-1.builddns.com/.../web-app-template:30fb007...
```
...the live dynos did not automatically restart.

**Fix:**
- Wait for the build to fully finish.
- Run `bld ps:restart` manually.

Or check `bld logs --app web-app-template | tail -10` — if there's a `(zero-dep mode)` in the log, restart succeeded.

### 5. How to Verify the Live App

```bash
# Check if the build was saved
curl https://web-app-template-a9d0532f.onbld.com/health
# Expects: {"status":"healthy",...}  HTTP 200

curl https://web-app-template-a9d0532f.onbld.com/
# Expects: Welcome to my-app (zero-dep or Express) JSON

curl -v https://web-app-template-a9d0532f.onbld.com/
# if it says "Connection reset by peer" with 000 → dyno didn't pick up latest build
```

### 5. Dyno Naming Convention

Build.io assigns random IDs to dynos: `web.XXXXX`.  To check the latest active one:
```bash
bld ps:list --app web-app-template
```

---

## File Structure

```
web-app-template/
├── server.js        ← Main entry (zero-dep http OR Express auto-detect)
├── package.json     ← No deps by default
├── Procfile         ← web: node server.js
├── .gitignore       ← ignores node_modules/, .env
├── .env.example     ← example env vars
├── README.md        ← Intern-facing quickstart
├── DEPLOYMENT_GUIDE.md  ← Step-by-step walkthrough
├── ONBOARDING.md    ← Team lead onboarding checklist
└── AGENTS.md        ← This file
```

---

## MongoDB Integration (Donkey To Go)

The template supports the `donkey-to-go` add-on for MongoDB via Mongoose.

### Attach the add-on
```bash
bld addons:create donkey-to-go:standard-0 --app web-app-template
```
This sets `DONKEY_TO_GO_URL` automatically.

### Code:
```javascript
const mongoUrl = process.env.DONKEY_TO_GO_URL;
// server.js already auto-connects when express+mongoose are installed
```

### Verify:
```bash
# Check if add-on attached
bld addons --app web-app-template
# Expected: donkey-to-go-...  (standard-0)  provisioned

# Check env var
bld config --app web-app-template | grep DONKEY
```

---

## How the "Phase" Switching Works

`server.js` uses `try/catch` around `require()`:

```javascript
let express, mongoose;
try {
  express  = require("express");
  mongoose = require("mongoose");
} catch (_) {
  // Not installed yet
}

if (express && mongoose) {
  // Phase 2: full Express app
} else {
  // Phase 1: built-in http
}
```

**Why this pattern?**
- First deploy (no `node_modules`): App starts in Phase 1 ✅
- After `npm install express mongoose` locally + commit + push: App auto-detects and starts Phase 2 ✅
- No manual code changes between phases.

---

## Updating This Repository

When modifying this template:

1. ** ALWAYS test your changes**:
   ```bash
   git add -A && git commit -m "..."
   git push build main
   sleep 60 && bld ps:restart --app web-app-template
   curl -s https://web-app-template-a9d0532f.onbld.com/health | jq
   ```

2. **After verifying on Build.io**, push to GitHub:
   ```bash
   git push origin main
   ```

3. **Update AGENTS.md** if you discover new quirks about Build.io.

---

## Gotchas & Common Errors

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot find module 'express'` | `node_modules` not installed; buildpack skipped install | Run `npm install` locally, commit `package-lock.json` + `node_modules/`, or remove lockfile and restart |
| Build succeeded but HTTP 000 | Build saved but **not released** to dynos | `bld ps:restart --app my-app` |
| `"npm ci" command failed` | Fake/malformed `package-lock.json` | Regenerate it locally via `npm install` |
| `NODE_ENV=development` in prod | Build.io defaults to dev unless we set `NODE_ENV=production` | `bld config:set NODE_ENV=production --app my-app` |
| MongoDB not connecting | Add-on attached but app didn't pick up env var | Restart app after creating add-on: `bld ps:restart` |

---

## Build.io Commands Reference

```bash
# Deploy
git push build main

# Check status
bld apps:info web-app-template
bld ps:list --app web-app-template

# View recent logs
bld logs --app web-app-template | tail -20

# Restart (CRITICAL — must do after fixing code!)
bld ps:restart --app web-app-template

# Add MongoDB
bld addons:create donkey-to-go:standard-0 --app my-app
bld ps:restart --app my-app

# Check env vars
bld config --app my-app

# Scale
bld ps:scale web=2 --app my-app
```

---

## Org & URLs

- **GitHub Template:** https://github.com/aiandlabs/web-app-template
- **GitHub Generation:** https://github.com/aiandlabs/web-app-template/generate
- **Build.io App ID:** `web-app-template` (a9d0532f...)
- **Build.io URL:** https://web-app-template-a9d0532f.onbld.com
- **MongoDB Add-on:** `donkey-to-go-2026-06-10-989564` (standard-0, $50/mo)

---

**Last Updated:** 2026-06-10
