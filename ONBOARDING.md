# Intern Onboarding Guide for Build.io

This guide is for **Team Leads** to prepare interns before they can deploy apps using the template.

Complete this checklist with each intern before they attempt their first deployment.

---

## Pre-Onboarding Setup (Team Lead Tasks)

### 1. Build.io Team Access
- [ ] Invite intern to your Build.io team/workspace
- [ ] Give them appropriate permissions (typically "Developer" role)
- [ ] Confirm they can run `bld login` and `bld whoami`

### 2. GitHub Access (if using GitHub)
- [ ] Add intern to your GitHub organization
- [ ] Give them repository creation permissions (or a template to fork)
- [ ] Confirm they have GitHub account and SSH keys setup

### 3. Local Machine Requirements
Verify intern's machine has:
- [ ] Node.js 18+ (run `node -v`)
- [ ] npm installed (run `npm -v`)
- [ ] Git installed (run `git --version`)
- [ ] VS Code (or preferred IDE) installed

---

## Onboarding Checklist (Do This Together)

### Phase 1: Build.io Setup

```bash
# 1. Verify bld CLI is installed
bld --version

# 2. Login to Build.io
bld login
# (Browser will open, click "Authorize")

# 3. Confirm login worked
bld whoami
# Should show: "You are logged in as: <email>"

# 4. List available apps
bld apps:list
# Should see your team's apps
```

**If any of these fail:**
- `bld` not found: Read "Installing bld CLI" section below
- Login fails: Contact team lead to verify account invitation
- No apps shown: Ask team lead to add you to the team

### Phase 2: Git Setup

```bash
# 1. Configure Git identity
git config --global user.name "Intern Name"
git config --global user.email "intern@company.com"

# 2. Verify Git is configured
git config --list | grep user

# 3. Test GitHub access (if using GitHub)
git clone <test-repo-url>
```

### Phase 3: Local Development Environment

```bash
# 1. Test Node.js
node -v
# Should show v18.x.x or higher

# 2. Test npm
npm -v
# Should show v9.x.x or higher

# 3. Test running the template
cd /tmp  # Use temp directory for test
git clone https://github.com/aiand-atul/web-app-template.git test-app
cd test-app
npm install
npm run dev
# (In browser, visit: http://localhost:3000)
# (Press Ctrl+C to stop)
cd ..
rm -rf test-app
```

### Phase 4: First Deployment (Guided)

**Choose an app name first:** Must be unique, use hyphens, no spaces.
Example: `intern-john-todo-app`

```bash
# 1. Copy template
cp -r /path/to/web-app-template my-first-app
# Or: git clone https://github.com/aiand-atul/web-app-template.git my-first-app
cd my-first-app

# 2. Customize package.json
# - change: name
# - change: description
# - change: author

# 3. Git init
git init
git add .
git commit -m "Initial commit from template"

# 4. Create Build.io app
bld apps:create my-first-app

# 5. Add remotes
git remote add build https://git.build.io/my-first-app.git
# (Optional: git remote add origin https://github.com/your-org/my-first-app.git)

# 6. Deploy!
git push build main

# 7. Check logs (if issues)
bld logs --tail

# 8. Get URL
bld apps:info my-first-app
# (Save the Web URL!)
```

---

## Installing Prerequisites

### Install Node.js & npm

**macOS (using Homebrew):**
```bash
brew install node
```

**Windows:**
1. Download from https://nodejs.org (LTS version)
2. Run installer
3. Restart terminal
4. Verify: `node -v`

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

### Install Git

**macOS:**
```bash
xcode-select --install  # Or download from git-scm.com
```

**Windows:**
Download https://git-scm.com/download/win

**Linux:**
```bash
sudo apt-get install git
```

### Install bld CLI

**macOS:**
```bash
brew install build-io/tap/bld
```

**Windows/Linux:**
1. Download from https://build.io/docs/getting-started/installation
2. Follow platform-specific instructions

### Configure Git for GitHub

**With SSH (Recommended for interns):**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "intern@company.com"

# Start SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key to clipboard
cat ~/.ssh/id_ed25519.pub
# (Copy the output and paste into GitHub → Settings → SSH Keys)

# Test connection
ssh -T git@github.com
```

**With HTTPS (Alternative):**
```bash
# GitHub will prompt for credentials
git clone https://github.com/org/repo.git

# Or configure Git to remember credentials
git config --global credential.helper cache
```

---

## Troubleshooting Common Setup Issues

### "bld: command not found"
**Fix:** Install bld CLI (see above)

### "Authentication failed" when running `bld login`
**Fix:** Team lead needs to invite you to the Build.io team

### "Cannot find module" when running `node`
**Fix:** Install Node.js (see above)

### "Permission denied" when pushing to GitHub
**Fix:**
1. Check SSH key is in GitHub: `cat ~/.ssh/id_ed25519.pub`
2. Or use HTTPS instead of SSH
3. Or team lead needs to add you to the organization

### "fatal: not a git repository"
**Fix:** Run `git init` first (forgot step 3 in Phase 4)

---

## Verification Script

Run this script to check if everything is ready:

```bash
#!/bin/bash
echo "=== Environment Check ==="
echo ""

echo "1. Checking Node.js..."
if command -v node &> /dev/null; then
    echo "   node: $(node -v)"
else
    echo "   node: NOT FOUND - Install from https://nodejs.org"
fi

echo "2. Checking npm..."
if command -v npm &> /dev/null; then
    echo "   npm: v$(npm -v)"
else
    echo "   npm: NOT FOUND"
fi

echo "3. Checking Git..."
if command -v git &> /dev/null; then
    echo "   git: $(git --version)"
else
    echo "   git: NOT FOUND - Install from https://git-scm.com"
fi

echo "4. Checking bld CLI..."
if command -v bld &> /dev/null; then
    echo "   bld: INSTALLED"
else
    echo "   bld: NOT FOUND - Install from https://build.io"
fi

echo "5. Checking GitHub SSH..."
ssh -T git@github.com 2>/dev/null
if [ $? -eq 1 ]; then
    echo "   GitHub SSH: WORKING"
else
    echo "   GitHub SSH: NOT CONFIGURED"
fi

echo ""
echo "=== Check Complete ==="
```

Save as `check-environment.sh`, run with `bash check-environment.sh`

---

## After Onboarding

### For Interns
- [ ] Successfully deployed first app
- [ ] Knows their app URL
- [ ] Knows how to check logs (`bld logs --tail`)
- [ ] Knows how to restart app (`bld ps:restart`)
- [ ] Bookmarked: [Quick Reference Card](#quick-reference-card)

### For Team Lead
- [ ] Intern confirmed working deployment
- [ ] Has access to team GitHub repos
- [ ] Added to team Slack/Discord for support
- [ ] Knows who to ask for help

---

## Quick Reference Card

| Command | What it does |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Run app locally |
| `bld login` | Login to Build.io |
| `bld whoami` | Show logged-in user |
| `bld apps:create <name>` | Create new app |
| `git push build main` | Deploy to Build.io |
| `bld apps:info <name>` | Show app details & URL |
| `bld logs --tail` | Stream app logs |
| `bld ps:restart` | Restart app |
| `bld config:set KEY=val` | Set environment variable |

---

## Resources for Interns

- **Template Repo:** https://github.com/aiand-atul/web-app-template
- **Build.io Docs:** https://docs.build.io
- **Express.js Docs:** https://expressjs.com
- **Node.js Docs:** https://nodejs.org/docs

---

## Questions?

**Interns:** Ask in #dev-support or ping @tean-lead

**Team Leads:** Update this guide as your team processes evolve

---

## Template Update History

| Date | Version | Changes |
|------|---------|---------|
| 2026-06-10 | 1.0.0 | Initial template with DEPLOYMENT_GUIDE.md |

---

**Last Updated:** 2026-06-10
