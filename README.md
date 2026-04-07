# Jira Stories & Bugs Dashboard — Forge App

A Jira dashboard gadget built with Atlassian Forge that shows open Stories and Bugs across projects with stats, filters, pagination, and Excel export. Styled with LocumTenens.com brand colors.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Atlassian Forge CLI](https://developer.atlassian.com/platform/forge/getting-started/)
  ```bash
  npm install -g @forge/cli
  forge login
  ```

## Project Structure

```
├── manifest.yml                 # Forge app config (permissions, modules)
├── src/resolvers/index.js       # Backend — Jira API resolver with pagination
├── static/src/index.html        # Frontend — HTML + JavaScript (no inline styles/handlers)
├── static/src/styles.css        # Frontend — CSS with LocumTenens CDS brand colors
├── static/src/app.js            # Forge bridge module
├── static/package.json          # Frontend build config
├── TEAM_SETUP.md                # End-user guide for adding the gadget
└── README.md                    # This file
```

## Setup & Deploy

### 1. Clone and install dependencies

```bash
git clone https://github.com/vgbalaje/jira-dashboard-forge.git
cd jira-dashboard-forge
npm install
cd static && npm install && cd ..
```

### 2. Build the frontend

```bash
cd static
npm run build
cd ..
```

This bundles `app.js` and copies `index.html` + `styles.css` to `static/build/`.

### 3. Deploy to Forge

```bash
forge deploy --environment production
```

### 4. Install on your Jira site

**First time (requires Jira admin):**
```bash
forge install --site YOUR-SITE.atlassian.net --product jira
```

If you don't have admin access, generate an install link:
```bash
# Go to: https://developer.atlassian.com/console/myapps/<APP_ID>/distribution
# Generate install link and share with your Jira admin
```

**Already installed (after code changes):**
```bash
forge deploy --environment production
# No need to reinstall — deploy updates the running app
```

### 5. Add the gadget to a Jira dashboard

1. Go to **Dashboards** in Jira
2. Click **Edit** on your dashboard
3. Click **Add gadget**
4. Search for **"Stories & Bugs Dashboard"**
5. Click **Add**, then **Done**

## Key Technical Notes

### Forge CSP Restrictions

Forge Custom UI has strict Content Security Policy. **DO NOT use:**
- Inline `<style>` tags — use external `.css` files via `<link>`
- Inline `style=""` attributes — use CSS classes only
- Inline `onclick`/`onchange` handlers — use `addEventListener`

### Pagination

The `/rest/api/3/search/jql` endpoint uses `nextPageToken` (not `startAt`):
- `total` field returns `0` — cannot rely on it
- Token is base64 — encode only `=` signs for URL safety
- Use `assumeTrustedRoute()` from `@forge/api` for pages 2+ to avoid double-encoding
- Always include dedup guard (Set by issue key) as safety net

### JQL Filter

```
project = {KEY} AND issuetype IN (Story, Bug) AND status NOT IN ("Accepted", "Done", "Abandoned") ORDER BY created DESC
```

## Features

- **Project switcher** — dropdown to switch between all accessible projects
- **Stats tiles** — By Status, Priority, Age, and Due Dates with brand-colored cards
- **Filter dropdowns** — Type, Status, Priority, Assignee (with search), Age, Label
- **Sortable table** — click column headers to sort
- **Pagination** — 100 issues per page with Previous/Next
- **Excel export** — downloads ALL filtered issues (not just current page) as `.xls`
- **Auto-refresh** — every 5 minutes

## Permissions

The app requires these Jira scopes:
- `read:jira-work` — read issues, comments, statuses
- `read:jira-user` — read assignee names
- `read:project:jira` — list projects
- `read:issue-details:jira` — read issue fields

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Gadget not in "Add gadget" | App needs to be installed by Jira admin |
| "Error invoking function" | Check `forge logs --environment production` |
| Only 100 issues showing | Pagination issue — check resolver logs |
| Styles not applying | Ensure no inline styles — use CSS classes only |
| Export downloads empty | Refresh dashboard first to load data |
