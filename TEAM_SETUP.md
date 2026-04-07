# Jira Stories & Bugs Dashboard — Team Setup Guide

## Prerequisites

- Access to the Jira instance at `locumtenens.atlassian.net`
- The Forge app must be installed on your site by a Jira admin (app name: **Stories & Bugs Dashboard**)

## Adding the Gadget to Your Dashboard

1. Go to **Dashboards** in the left sidebar
2. Click **+ Create dashboard** (or open an existing one you own)
3. Click **Edit** (pencil icon) in the top-right of the dashboard
4. Click **Add gadget**
5. Search for **"Stories & Bugs Dashboard"**
6. Click **Add** — the gadget will appear on your dashboard
7. Click **Done** to exit edit mode

## Using the Dashboard

| Feature | How |
|---------|-----|
| **Switch projects** | Use the **Project** dropdown at the top-right |
| **Filter issues** | Use **Type**, **Status**, **Priority**, **Assignee**, **Age**, **Label** dropdown filters |
| **Sort table** | Click any column header |
| **Export to Excel** | Click the green **Export Excel** button (downloads filtered issues as `.xls`) |
| **Refresh** | Click **Refresh** button, or wait for auto-refresh every 5 minutes |

## What You'll See

- **Stats cards** — Color-coded breakdown by Status, Priority, and Age
- **Due Dates** — Overdue, due soon, has due date, no due date counts
- **Issues table** — Full list with key, type, summary, status, priority, assignee, age, due date, labels, and latest comment
- **Filters** — Multi-select dropdowns to narrow the table view

## For Jira Admins — Installing the App

If the app isn't installed yet, a Jira site admin needs to:

1. Go to **Settings** (gear icon) > **Apps** > **Manage apps**
2. Search for the Forge app or use the installation link provided by the developer
3. Approve the required permissions:
   - `read:jira-work`
   - `read:jira-user`
   - `read:project:jira`
   - `read:issue-details:jira`
4. Once installed, all users on the site can add the gadget to their dashboards

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Gadget not found in "Add gadget" | Ask your Jira admin to install the Forge app first |
| "Error loading data" | Refresh the page; if persistent, check that your account has project access |
| Export not downloading | Your browser may be blocking downloads from the iframe — allow popups/downloads for Atlassian |
| Filters not responding | Hard-refresh the page (Cmd+Shift+R / Ctrl+Shift+R) to load the latest version |
