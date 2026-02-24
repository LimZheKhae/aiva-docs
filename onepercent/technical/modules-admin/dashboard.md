---
sidebar_position: 1
title: Dashboard
description: "How the dashboard module works — role-based views, data sources, components, and branch filtering."
---

# Dashboard

The dashboard is the landing page of the Admin app. It renders **two entirely different views** based on the logged-in staff member's role: an admin/manager view with gym-wide KPIs, and a trainer view focused on personal sessions and commission.

**Route:** `apps/admin/src/app/(staff)/dashboard/page.tsx`
**Permission module:** `dashboard` (view only — no edit or export actions are checked)

## Role branching

The page reads the staff member's role from `useCurrentStaff()` and renders one of two components:

```tsx
const isTrainer = role === "trainer";
// trainer → <TrainerDashboard />
// everything else → <AdminDashboard />
```

While the role is loading, a skeleton with 4 stat cards and a content grid is displayed.

## Data fetching

**Hook:** `src/hooks/use-dashboard-stats.ts`

The dashboard has **no dedicated API route**. All data is fetched directly from the Supabase browser client using parallel queries in a `useEffect`. It uses `useState` — not SWR — with a manual `refresh()` function.

There are no real-time subscriptions or polling intervals on the dashboard. Data is fetched once on mount.

### Timezone handling

All date calculations use `Asia/Kuala_Lumpur` (UTC+8) to determine "today":

```ts
const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Asia/Kuala_Lumpur",
});
```

## Admin dashboard

**Component:** `src/components/dashboard/admin-dashboard.tsx`

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Logo · Greeting · Staff Name · Date · [Branch Toggle]  │
├────────────┬────────────┬────────────┬──────────────┤
│  Active    │  Today's   │ Outstanding│   Pending    │
│  Members   │  Sessions  │  (MYR)     │   Leads      │
├────────────┴────────────┴────────────┴──────────────┤
│ Expiring   │ Expiring   │ New Leads  │ Redemptions  │
│ (7 days)   │ (30 days)  │            │ (pending)    │
├─────────────────────────────┬───────────────────────┤
│    Today's Schedule (2/3)   │  Quick Actions (1/3)  │
└─────────────────────────────┴───────────────────────┘
```

### Stat cards

| Card | Query | Source view | Filter |
| --- | --- | --- | --- |
| Active Members | `count("*", { count: "exact", head: true })` | `view_4_1_2_member_package` | `package_status = 'active'` |
| Today's Sessions | `count("*", { count: "exact", head: true })` | `view_4_3_appointment` | `start_time` within today's date range |
| Outstanding | Sum of `outstanding` column | `view_4_1_2_member_package` | `outstanding > 0` |
| Pending Leads | `count("*", { count: "exact", head: true })` | `view_3_leads` | `status IN ('new', 'engaged')` |

The Outstanding card formats large values compactly (e.g., "RM 347.9K") and shows the full amount in a tooltip on hover. Currency formatting uses `Intl.NumberFormat("en-MY", { currency: "MYR" })`.

### Action items

Four `ActionItemCard` columns, each with a preview (up to 3 items) and a **View All** button that opens an `ActionItemsModal` dialog.

| Column | Source view | Filter | Limit |
| --- | --- | --- | --- |
| Expiring Soon (7 days) | `view_4_1_2_member_package` | `package_status = 'active'`, `package_end_date` within next 7 days | 10 |
| Expiring (30 days) | `view_4_1_2_member_package` | `package_status = 'active'`, `package_end_date` between day 8–30 | 10 |
| New Leads | `view_3_leads` | `status = 'new'`, ordered by `created_at` desc | 5 |
| Pending Redemptions | `view_6_2_member_points_transaction` | `redeemption_status = 'pending'`, `merchandise_id IS NOT NULL` | 10 |

Modal rows are clickable and navigate to the relevant page (`/members/{id}`, `/leads`, `/operations/point-system`).

### Today's schedule

Queries `view_4_3_appointment` for all appointments today, ordered by `start_time` ascending. Displays up to **8 rows** with a "View All Appointments" link to `/appointments?filter=today` when more exist.

Status badges use an inline `STATUS_CONFIG` map:

| Status value | Label | Color |
| --- | --- | --- |
| `pending pt` | Pending PT | Amber |
| `pending member` | Pending | Amber |
| `confirmed` | Confirmed | Emerald |
| `acknowledged` | Acknowledged | Blue |
| `completed` | Completed | Slate |
| `cancelled` | Cancelled | Red |
| `cancelled penalty` | Cancelled | Red |

### Quick actions

Four navigation buttons: Add New Member (`/members/new`), Schedule Session (`/appointments`), View Analytics (`/analytics`), Manage Packages (`/operations/package`).

### Branch filtering

| Staff branch | Behavior |
| --- | --- |
| `"all branch"` | 3-button pill toggle: All / Kepong / Kota Damansara. Selecting "All" removes the filter. |
| Specific branch | Auto-filtered. No toggle shown. |

When a branch is selected, `.eq("branch", selectedBranch)` is appended to all queries.

## Trainer dashboard

**Component:** `src/components/dashboard/trainer-dashboard.tsx`

### Layout

```
┌────────────────────────────────────────────────┐
│  Logo · Greeting · Staff Name · Date · [Branch Badge]  │
├──────────────────┬─────────────────────────────┤
│ Today's Progress │  Month-to-Date Commission   │
│  (circle ring)   │  (conduction + sales)       │
├──────────────────┴─────────────────────────────┤
│  My Sessions Today (2/3)  │  Follow-up + Quick  │
│                           │  Actions (1/3)      │
└───────────────────────────┴─────────────────────┘
```

### Today's progress

An SVG circular progress ring showing the ratio of completed to total sessions. The `strokeDasharray` is calculated from `progressPercent * 3.02` out of a total circumference of `302`.

Sub-stats:
- **Completed** — appointments with `status = 'completed'`.
- **Upcoming** — future appointments that are not completed or cancelled.

### Month-to-date commission

Queries `view_5_2_trainer_monthly_commission_report` where `trainer_id` matches the current staff and `year`/`month` match the current period.

| Field | Source column |
| --- | --- |
| Total | `total_entitled_commission` |
| Conduction Fee | `total_conduction_fee` (also shows `total_conduction_count` sessions) |
| Sales Commission | `total_sales_commission` |

"View Details" links to `/staff/commission`.

### My sessions today

Queries `view_4_3_appointment` filtered by `trainer_id = staffId` and today's date range. Identical structure to the admin schedule table with one addition: each row shows the **member's phone number**.

Completed sessions render with `opacity-60`, muted text color, and strikethrough on time and member name.

### Follow-up needed

Queries `view_4_1_2_member_package` for the trainer's active members with **3 or fewer sessions remaining** (`remaining_pt_session <= 3 AND remaining_pt_session > 0`).

Shows up to 4 members. Each row displays: member name, package name, and a sessions-remaining badge (destructive variant if ≤ 1). Clicking a member navigates to `/members/{memberId}`.

"View All" opens the `ActionItemsModal` with the full list. Empty state shows "All Clear!" with a checkmark icon.

### Quick actions

Three navigation buttons: View My Schedule (`/staff/trainer-schedule`), Book Session (`/appointments`), My Commission (`/staff/commission`).

## Database views used

| View | Purpose | Used by |
| --- | --- | --- |
| `view_4_3_appointment` | Today's sessions, trainer's personal sessions | Both |
| `view_4_1_2_member_package` | Active member count, outstanding total, expiring packages, low-session alerts | Both |
| `view_3_leads` | Pending leads count, new leads list | Admin |
| `view_6_2_member_points_transaction` | Pending point redemptions | Admin |
| `view_5_2_trainer_monthly_commission_report` | Monthly commission breakdown | Trainer |

## Component files

| File | Purpose |
| --- | --- |
| `dashboard/page.tsx` | Route entry point. Reads role, renders skeleton or the appropriate dashboard. |
| `dashboard/admin-dashboard.tsx` | Admin/manager dashboard layout and logic. |
| `dashboard/trainer-dashboard.tsx` | Trainer dashboard layout and logic. |
| `dashboard/action-item-card.tsx` | Reusable card showing a preview list with "View All" trigger. |
| `dashboard/action-items-modal.tsx` | Full-screen dialog listing all action items with navigation links. |
| `dashboard/stat-card.tsx` | Reusable KPI stat card with optional trend indicator. |
| `dashboard/today-schedule-table.tsx` | Reusable schedule table with status badges. |
| `dashboard/member-alert-list.tsx` | Card listing members needing follow-up. |
| `dashboard/quick-actions.tsx` | Navigation button grid with configurable actions. |

:::note
The `admin-dashboard.tsx` and `trainer-dashboard.tsx` components define their own inline versions of several widgets (stat cards, schedule rows, action items) rather than importing from the reusable files listed above. Both implementations exist in the codebase.
:::
