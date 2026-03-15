# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/5e66e9cc-b7d0-4c19-a3f7-a5c164b79f8f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5e66e9cc-b7d0-4c19-a3f7-a5c164b79f8f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5e66e9cc-b7d0-4c19-a3f7-a5c164b79f8f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

## IMPORTANT: External Partner Onboarding Flow — NOT YET IMPLEMENTED

The Estimator KPI system is designed to plug into the CCS Employee Portal's permission system. External partners (attorneys, contractors) register through the Talent Partner Network, get approved, and receive checkbox-based permissions that control what they see in the sidebar.

**What the app needs to do (but doesn't yet):**
1. Expect a user object with `role` and `firm` fields from the portal
2. If `firm` is present (external partner), filter data to that firm's files only
3. If `firm` is absent (internal user), show all files

**The portal already handles:** authentication, approval, sidebar visibility, and permission checkboxes. This app just needs to read the user object and filter accordingly.

**Dev question for Talha:** Does the user profile object include firm/company association when a partner registers through Talent Partner Network? The app needs this field to filter data. Confirm it exists or needs to be added.

See `External_Partner_Onboarding_Flow.md` in this repo for the full developer reference guide.

---

## Estimator KPI Tracking System — User Manual

**Version 2.0 — The Split Clock**
**February 2026**
**Department:** Estimating
**Prepared by:** Frank Dalton
**CONFIDENTIAL — Internal Use Only**

---

### 1. Introduction

The Estimator KPI Tracking System is a web-based performance management tool built for the Coastal Claims Services estimating department. It provides real-time tracking of estimate productivity, blocker analysis, and team performance metrics.

#### 1.1 Purpose

This system replaces the previous spreadsheet-based tracking with a dedicated application that introduces the Split Clock methodology, which separates active work time from blocked time to produce fairer, more actionable performance metrics.

#### 1.2 Who Should Read This Manual

This manual is intended for all users of the system, including estimators, lead estimators, managers, and superadmins within Coastal Claims Services.

#### 1.3 Current Estimator Roster

| Name | Role | Department | Location |
|------|------|------------|----------|
| Eileen "Nell" Dalton | Lead Estimator | Estimating | Florida |
| Brandon Leighton | Estimator | Estimating | Florida |

#### 1.4 How to Access the System

The Estimator KPI Tracking System is embedded within the Coastal Claims Services Employee Portal. When you navigate to the KPI Estimator page in the portal, the system loads automatically and recognizes your identity through URL parameters passed by the portal. No separate login is required.

### 2. The Split Clock — Core Concept

The Split Clock is the foundational concept of the entire system. Understanding it is essential for all users.

#### 2.1 The Problem It Solves

Traditional KPI tracking measures total time on a file without distinguishing between time the estimator was actively working and time the file was stalled waiting on someone else. This means a fast estimator who gets stuck waiting on a scoper for 27 days looks identical to a slow estimator on paper.

#### 2.2 Two Clocks, One File

Every estimate in the system runs two independent timers:

- **Active Time:** The estimator is actually working — writing the estimate in Xactimate, reviewing photos, calculating values. This is the estimator's responsibility.
- **Blocked Time:** The estimator cannot proceed — waiting on a scoper, a PA, a carrier, a contractor, or a client. This is someone else's responsibility.

#### 2.3 The Two Dollar-Per-Hour Numbers

| Metric | Formula | Perspective |
|--------|---------|-------------|
| Raw $/Hour | Total Estimate Value / Total Hours on File | Company: How fast are files moving? |
| Adjusted $/Hour | Total Estimate Value / Active Hours Only | Estimator: How productive when actually working? |

The gap between these two numbers represents the cost of blockers. If Raw $/Hour is $18,000 but Adjusted $/Hour is $47,000, that means blockers are consuming roughly 60% of file time.

#### 2.4 Why This Matters

The Split Clock gives managers the ability to distinguish between an estimator performance problem and a process problem. A file that sat for 31 days with only 1 hour of active time is not a slow estimator — it is a blocker problem. The system identifies where the bottleneck is so action can be taken against the right cause.

### 3. Navigating the System

The system uses a tabbed interface across the top of the screen. Each tab serves a distinct purpose.

#### 3.1 Tab Overview

| Tab | Purpose | Who Uses It |
|-----|---------|-------------|
| Estimator Name Tabs | Data entry for each estimator's active estimates | Estimators (own tab), Managers (all tabs) |
| Scorecards | Individual performance metrics and severity breakdowns | All users |
| Team Dashboard | Aggregate team metrics, rankings, and severity distribution | Managers, Lead Estimators |
| Analysis | Performance insights, red flag alerts, and work assignment recommendations | Managers |
| Liquidity | Settlement tracking and estimate accuracy analysis | All users |
| Docs | Built-in system documentation and version history | All users |

#### 3.2 Role-Based Visibility

The system enforces role-based access. Regular estimators see only their own data entry tab, while managers and superadmins see all estimator tabs and have full access to team-level dashboards.

### 4. Data Entry Tab — Daily Workflow

The Data Entry tab is where estimators spend most of their time. Each estimator has their own dedicated tab showing their active estimates in an editable table.

#### 4.1 Table Columns

| Column | Description | Required? |
|--------|-------------|-----------|
| File # | The CCS file number assigned to the estimate | Yes |
| Client | Client or insured name | Yes |
| Ref. Source | Who referred the claim | No |
| Ref. Source Rep | Specific rep at the referral source | No |
| Carrier | Insurance carrier name (auto-suggests from reference data) | No |
| Peril | Type of loss: Wind, Hail, Hurricane, Flood, Fire, Water, Lightning, Theft, Vandalism, Other | No |
| Sev | Severity level 1-5 (determines SLA targets) | No |
| Hours | Active work hours entered as decimal (e.g., 0.25 = 15 minutes) | No |
| Est. Value | Dollar value of the estimate | No |
| Rev | Number of revisions on this file | No |
| Status | Current lifecycle status (see Section 5) | Auto-set |
| Blocker | Block/Unblock button (see Section 6) | N/A |
| Notes | Free-text notes about the file | No |

#### 4.2 Adding a New Estimate

1. Click the "Add Row" button below the table.
2. A new blank row appears with status Assigned.
3. Click into any cell to begin typing. At minimum, enter the File # and Client Name.
4. All changes save automatically when you click out of a field (on blur).

#### 4.3 Editing Existing Data

Click directly into any cell to edit. Changes are saved to the database automatically when you move to another field. There is no separate "Save" button — the system uses inline editing with auto-save.

#### 4.4 Deleting Rows

1. Check the checkbox on the left side of each row you want to delete.
2. Click the "Delete Selected" button below the table.
3. The selected rows are permanently removed.

#### 4.5 Carrier Auto-Suggest

When typing in the Carrier field, the system shows suggestions from previously entered carriers. If your carrier is not in the list, simply type the full name and move on.

### 5. Status Lifecycle

Every estimate moves through a defined set of statuses. Unlike a simple linear pipeline, the estimating lifecycle is cyclical — files can bounce between statuses multiple times.

#### 5.1 All Statuses

| Status | Color | Meaning |
|--------|-------|---------|
| Assigned | Gray | File received, not yet started |
| In Progress | Blue | Estimator is actively working |
| Blocked | Amber | Waiting on someone else (see Section 6) |
| In Review | Purple | Estimate written, under internal review |
| Sent to Carrier | Cyan | Submitted to insurance carrier |
| Revision Requested | Orange | Carrier wants changes |
| Revised | Indigo | Revision completed, ready to resubmit |
| Settled | Green | Settlement received from carrier |
| Closed | Dark Green | File complete — terminal status |
| Unable to Start | Red | Cannot proceed (can be reopened) |

#### 5.2 Allowed Transitions

| From Status | Can Move To |
|-------------|-------------|
| Assigned | In Progress, Unable to Start |
| In Progress | Blocked, In Review, Sent to Carrier |
| Blocked | In Progress (only) |
| In Review | In Progress, Sent to Carrier |
| Sent to Carrier | Revision Requested, Settled |
| Revision Requested | In Progress |
| Revised | Sent to Carrier |
| Settled | Closed |
| Closed | (Terminal — no further transitions) |
| Unable to Start | Assigned (reopen) |

### 6. The Blocker System

The Blocker System is the core feature of the Estimator KPI Tracker. It is the mechanism that powers the Split Clock. The design goal is three clicks maximum: Blocked -> Who -> Why.

#### 6.1 Marking a File as Blocked

1. In the Blocker column of the row, click the orange "Blocked" button.
2. The Blocker Dialog opens and asks three things:
   - **Who are you waiting on?** — Select from: Waiting on Scoper, Waiting on Public Adjuster, Waiting on Carrier, Waiting on Contractor, Waiting on Client, Internal Hold, Missing Documentation, or Other.
   - **Name (optional)** — Type the specific person or company name.
   - **Why?** — Type a brief reason (e.g., "Need gutter dimensions").
3. Click the "Blocked" button in the dialog to confirm.

When confirmed:
- The estimate status changes to "Blocked"
- The row shows an amber left border and a "BLOCKED" badge with elapsed time
- Active time stops accruing and blocked time starts
- An event is logged in the audit trail

#### 6.2 Unblocking a File

1. Click the green "Unblocked" button in the Blocker column.
2. The Unblock Dialog shows a summary of the blocker.
3. Optionally add a resolution note.
4. Click "Unblocked" to confirm.

#### 6.3 Visual Indicators

| Condition | Visual Indicator |
|-----------|-----------------|
| File blocked < 48 hours | Amber left border on row, "BLOCKED Xh" badge |
| File blocked > 48 hours | Red left border on row, "BLOCKED Xd" badge |
| SLA breached | Subtle red background tint on entire row |

#### 6.4 Blocker Types

| Blocker Type | When to Use |
|-------------|-------------|
| Waiting on Scoper | Scoper has not provided scope report, measurements, or photos |
| Waiting on Public Adjuster | PA needs to provide documentation or authorization |
| Waiting on Carrier | Carrier adjuster has not responded or provided required info |
| Waiting on Contractor | Contractor has not supplied supplemental info or pricing |
| Waiting on Client | Insured/client needs to provide access, documents, or decisions |
| Internal Hold | Internal CCS process hold (management review, reassignment, etc.) |
| Missing Documentation | Required documents missing from the file |
| Other | Any blocker not covered above |

### 7. Scorecards Tab

#### 7.1 Weekly Performance Summary

Four key metrics: Avg Days Held, Revision Count, First-Time Approval Rate, Dollar Value/Hour.

#### 7.2 Time Performance by Severity

Shows how the estimator performs against time targets for each severity level. Green "Met", Yellow "Close" (within 20%), Red "Over".

#### 7.3 Average Claim Value by Severity

Compares the estimator's average claim values against expected value ranges for each severity level.

### 8. Team Dashboard

#### 8.1 Team Performance Overview

Four summary cards: Team Avg Days Held, Team Revision Rate, Team $/Hour, Weekly Volume.

#### 8.2 Estimator Rankings

Ranked table sorted by Overall Score: $/Hour (40%), Revision Rate (30%), First-Time Approval (20%), Avg Days Held (10%).

#### 8.3 Severity Distribution

How estimates are distributed across severity levels for each estimator.

### 9. Analysis Tab

#### 9.1 Individual Performance Analysis

Auto-generated strength, area for improvement, and recommended action per estimator.

#### 9.2 Red Flag Alerts

| Alert Type | Trigger Condition | Target |
|-----------|-------------------|--------|
| High Revision Rate | Average revisions > 1.5 | < 1.5 |
| Below $/Hour Target | Dollar per hour < $10,000 | > $10,000 |
| Slow Turnaround | Average days held > 3 | < 3 days |

#### 9.3 Optimal Work Assignment Matrix

Recommended primary/secondary assignee per severity level based on current performance data.

### 10. Liquidity Tab

#### 10.1 Finding an Estimate

Search by file number or client name.

#### 10.2 Entering Settlement Data

1. Search for the estimate and click on it.
2. Enter the actual settlement amount and settlement date.
3. System shows real-time accuracy preview.
4. Click "Save Settlement."

#### 10.3 Accuracy Rating

| Accuracy Variance | Rating | Badge Color |
|------------------|--------|-------------|
| Within +/-10% | Excellent | Green |
| Within +/-25% | Good | Yellow |
| Beyond +/-25% | Needs Review | Red |

### 11. Severity Levels & SLA Targets

#### 11.1 Severity Target Reference

| Severity | Time Target | Value Range | SLA Warning At |
|----------|------------|-------------|----------------|
| 1 | < 30 minutes | $2,000 - $5,000 | 20 minutes |
| 2 | < 1 hour | $5,000 - $15,000 | 45 minutes |
| 3 | < 3 hours | $15,000 - $50,000 | 2 hours |
| 4 | < 6 hours | $50,000 - $150,000 | 4.5 hours |
| 5 | < 12 hours | $150,000+ | 9 hours |

#### 11.2 Red Flag Thresholds (Dual Clock Check)

| Severity | Active Time Flag | Total Time Flag |
|----------|-----------------|-----------------|
| 1 | > 45 min active | > 3 days total |
| 2 | > 1.5 hrs active | > 5 days total |
| 3 | > 4.5 hrs active | > 10 days total |
| 4 | > 9 hrs active | > 15 days total |
| 5 | > 18 hrs active | > 25 days total |

### 12. KPI Metrics Reference

| Metric | Formula | Target |
|--------|---------|--------|
| Avg Days Held | (Today - Date Received) for open; (Date Closed - Date Received) for closed | < 3 days |
| Revision Rate | Total Revisions / Total Estimates | < 1.5 |
| First-Time Approval % | (Estimates with 0 revisions / Total sent) x 100 | > 70% |
| Raw $/Hour | Sum(Estimate Value) / Sum(Total Time / 60) | > $12,000 |
| Adjusted $/Hour | Sum(Estimate Value) / Sum(Active Time / 60) | As high as possible |
| Active Efficiency | (Active Time / Total Time) x 100 | As high as possible |
| Blocker Frequency | (Estimates entering blocked / Total) x 100 | As low as possible |
| SLA Compliance | (Completed within target / Total) x 100 | > 80% |
| Settlement Accuracy | Avg(abs(Actual - Estimate) / Estimate x 100) | Within +/-10% |

#### Overall Performance Score

| Component | Weight |
|-----------|--------|
| Adjusted Productivity | 30% |
| Quality | 25% |
| Speed (SLA Compliance) | 20% |
| Efficiency | 15% |
| Accuracy | 10% |

### 13. Roles & Permissions

| Role | Data Entry | Own Scorecard | All Scorecards | Team Dashboard | Analysis | Admin |
|------|-----------|---------------|----------------|----------------|----------|-------|
| Estimator | Own tab only | Yes | No | Limited | No | No |
| Manager | All tabs | Yes | Yes | Full | Full | Yes |
| Superadmin | All tabs | Yes | Yes | Full | Full | Yes |

Roles are determined by the portal and passed to the system via URL parameters at login.

### 14. Best Practices for Estimators

**Daily Workflow:**
- Enter new estimates as soon as files are assigned. Minimum required: File # and Client Name.
- Update the Hours field each time you finish a work session on a file.
- Use the Blocker button immediately when you cannot proceed.
- Unblock files as soon as the issue is resolved.
- Add severity and peril when known.

**Blocker Best Practices:**
- Always select the most specific blocker type.
- Include the person or company name when possible.
- Keep the reason brief but specific.
- The blocker button is not surveillance — it is your tool to prove that a slow file was not your fault.

**Data Quality Tips:**
- Use consistent carrier names (use auto-suggest).
- Update the estimate value as it changes.
- Mark files as "Sent to Carrier" when submitted.
- Enter settlement data promptly in the Liquidity tab.

### 15. Technical Reference

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI Framework | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Authentication | URL parameters from Employee Portal |
| Hosting | Standalone deploy (embedded in portal via iframe) |
| Charts | Recharts |
| Data Fetching | React Query |

### 16. Support

For Support: Contact Will Pratt, Claim Director
Department: Estimating — Coastal Claims Services
System Capacity: Handles 40-70 estimates per estimator per week efficiently
