---
sidebar_position: 10
title: Commission
description: "How the commission module works — conduction fees, sales commission, tiered rate configuration, member tier impact, monthly reports, detail breakdowns, and Excel export."
---

# Commission

The commission module calculates and displays monthly commission earnings for trainers. It tracks two types of commission — conduction fees (per session conducted) and sales commission (percentage of package sales) — with rates that vary by branch, trainer category, trainer type, session count tiers, and sales threshold bands. Commission calculation happens entirely in database functions; the frontend is a read and configuration layer.

**Route:** `apps/admin/src/app/(staff)/staff/commission/page.tsx` (~793 lines) <br />
**Permission module:** `staff-commission` (`can_view` for page access, `can_edit` for rate configuration, `can_export` for Excel export)

## Data fetching

**Hooks:**

| Hook | File | Purpose |
| --- | --- | --- |
| `useCommission(options)` | `src/hooks/use-commission.ts` | Fetches `view_5_2_trainer_monthly_commission_report` with SWR. Key: `["commission-report", year, month, branch, trainerId]`. Sorted by `total_entitled_commission` descending. |
| `useCommissionDetails(trainerId, year, month)` | `src/hooks/use-commission.ts` | Fetches `view_5_2_1_trainer_monthly_commission_details` for a single trainer's per-member breakdown. Used by the detail modal. |
| `useCommissionPeriods()` | `src/hooks/use-commission.ts` | Queries distinct `year, month` combinations from the report view. Returns available periods sorted descending. Auto-selects the most recent period. |
| `useCommissionConfig(options)` | `src/hooks/use-commission-config.ts` | Fetches `trainer_commission_tier` where `status = 'active'`. Ordered by commission type, session type, trainer category, and session count min. |

There are **no API routes** for the commission module. All queries go directly through the Supabase browser client via SWR hooks.

There are **no realtime subscriptions** — data is refreshed manually via the Refresh button or by re-selecting filters.

## Page layout

```
┌──────────────────────────────────────────────────────────┐
│  Commission (or "My Commission" for trainers)             │
├──────────────────────────────────────────────────────────┤
│  [Report]  [Configuration (admin only)]                   │
├──────────────────────────────────────────────────────────┤

Report tab:
┌──────────────────────────────────────────────────────────┐
│  Feb 2026                    [Refresh] [Export Excel]      │
│  Year · Month · Branch · Trainer                          │
├─────────────┬──────────────┬──────────────┬──────────────┤
│  Total      │  Conduction  │  Sales       │  Total       │
│  Commission │  Fee         │  Commission  │  Sessions    │
├─────────────┴──────────────┴──────────────┴──────────────┤
│  Commission Table (click row → detail modal)              │
└──────────────────────────────────────────────────────────┘
```

### Summary cards

Four KPI cards at the top of the Report tab:

| Card | Source field |
| --- | --- |
| **Total Commission** | `total_entitled_commission` |
| **Conduction Fee** | `total_conduction_fee` |
| **Sales Commission** | `total_sales_commission` |
| **Total Sessions** | `total_conduction_count` |

### Filters

| Filter | Behavior |
| --- | --- |
| **Year** | Populated from distinct years in the data. Sorted descending. |
| **Month** | All 12 months (1-12). |
| **Branch** | Disabled and pre-set for single-branch staff. Hidden for trainers. "All" option available for multi-branch admins. |
| **Trainer** | Searchable combobox. Disabled and locked to self for trainers. Filtered by selected branch. |

When the branch changes, the trainer filter resets to "All Trainers."

## Commission types

### Conduction fees

A flat RM amount paid per session conducted. The rate depends on:

- **Branch** — each branch has its own rate table.
- **Trainer type** — full time or part time.
- **Trainer category** — junior, senior, master, grand master, director.
- **Session type** — paid, free, compensate, transform, express, sponsor.
- **Session count tier** (for paid sessions) — rates increase when a trainer exceeds 100 sessions per month.

### Sales commission

A percentage of package sales amount. The rate depends on:

- **Branch** — per-branch rates.
- **Trainer type** — full time or part time.
- **Trainer category** — junior through director.
- **Commission type** — new sales vs renewal sales (separate rates).
- **Sales threshold band** — rates increase at higher monthly sales volumes.
- **Member tier** — `company` tier gets full rate; `fans` tier gets 50% rate.

### Sales threshold bands

| Band | Sales range |
| --- | --- |
| Base (zero) | Under RM 8K |
| Tier 1 | RM 8K - 20K |
| Tier 2 | RM 20K - 30K |
| Tier 3 | RM 30K+ |

## Commission calculation

Commission is calculated entirely by **database functions** — the frontend doesn't perform any rate lookup or math.

### Database functions

| Function | Purpose |
| --- | --- |
| `calculate_all_commission()` | Processes all trainers at once. Returns an array of results with `commission_id`, `success`, `error_message`, `trainer_id`, `member_id`, `total_sales`, `total_session`. |
| `calculate_trainer_commission(...)` | Calculates commission for a single trainer-member-month combination. Accepts branch, member ID, member tier, month/year, trainer category, trainer ID, trainer type, sales amounts, and session count. Returns the commission record ID. |

### How `closed_by` feeds into commission

The `member_package` table has a `closed_by` field — a `string[]` (PostgreSQL array of staff UUIDs) recording which staff closed the sale. This is set via a multi-select UI when adding or editing a package.

The commission calculation function uses `closed_by` to attribute new and renewal sales to the listed trainer(s). Each trainer who closed a sale for a member gets their own `trainer_monthly_commission` record (keyed by `trainer_id` + `member_id` + `year` + `month`). Split commission logic for multiple closers is handled at the database function level.

### Member tier impact

| Tier | Commission rate |
| --- | --- |
| `company` | Full staff commission rate (default). |
| `fans` | 50% of the staff commission rate. |

The `trainer_monthly_commission` table stores `member_tier` as a snapshot at calculation time. The `calculate_trainer_commission` function applies the 50% reduction internally for `fans` tier members. The frontend reads pre-computed values.

## Commission report table

### Columns (admin view)

| Column | Content |
| --- | --- |
| **Trainer** | Avatar + name + category badge. |
| **Branch** | Branch name. |
| **Sessions** | Total conduction count. |
| **Conduction** | Total conduction fee (RM). |
| **Sales** | Total sales commission (RM). |
| **Total** | Total entitled commission (RM). |

### Trainer self-view

When a trainer views their own commission, the table shows only: Sessions, Conduction, Sales, Total. The Trainer and Branch columns are removed, and the page title changes to "My Commission."

Clicking a row opens the commission detail modal.

## Commission detail modal

**Component:** `src/components/commission/commission-detail-modal.tsx` (~263 lines)

A full-screen modal showing a single trainer's monthly breakdown.

### Sections

1. **Header** (black background) — trainer avatar, name, category badge, branch badge, period, total commission.

2. **Summary cards** (3) — Conduction (total fee + session count), Sales (total sales amount), Members (unique member count).

3. **Session breakdown** — 3x2 grid showing counts and fee subtotals per session type:

| Session type | Fee field |
| --- | --- |
| Paid | `conduction_fee_paid` |
| Free | `conduction_fee_free` |
| Transform | `conduction_fee_transform` |
| Express | `conduction_fee_express` |
| Sponsor | `conduction_fee_sponsor` |
| Compensate | `conduction_fee_compensate` |

4. **Sales commission** — New sales amount + commission earned, renewal sales amount + commission earned.

5. **Member details table** — from `useCommissionDetails`. Columns: Member name, Tier badge, Sessions, Conduction fee, Sales commission, Total.

## Configuration tab

**Component:** `src/components/commission/commission-config-tab.tsx` (~792 lines)

Visible only when the user has `can_edit` permission. Manages commission rates per branch and trainer type.

### Filters

| Filter | Options |
| --- | --- |
| **Branch** | Specific branch required (no "All" option). Locked for single-branch staff. |
| **Trainer Type** | Full time / Part time. |

An audit line shows the last updated date and staff name.

### Conduction fees matrix

A table with:

- **Rows:** Session types — paid, free, compensate, transform, express, sponsor.
- **Columns:** Trainer categories detected from data — junior, senior, master, grand master, director (sorted by `CATEGORY_SORT_ORDER`).
- **Values:** `fee_amount` (flat RM amount per session).

For `paid` sessions, rows are expandable to show session-count tiers:

| Tier | Session count range |
| --- | --- |
| Base | Under 100 sessions |
| Tier 2 | 100+ sessions |

### Sales commission matrix

A table with:

- **Rows:** `new_sales` (New Sales), `renew_sales` (Renewals).
- **Columns:** Trainer categories.
- **Values:** `commission_rate` (stored as 0-1 decimal, displayed as percentage).

Rows are expandable to show sales-threshold tiers:

| Tier | Sales range |
| --- | --- |
| Base (zero) | Under RM 8K |
| Tier 1 | RM 8K - 20K |
| Tier 2 | RM 20K - 30K |
| Tier 3 | RM 30K+ |

### Inline editing

Each cell is an `EditableCell` — click to edit, Enter to save, Escape to cancel. Shows a green check on success and a red background on error. Saves via `updateCommissionTier(id, updates, userId)` which updates the `trainer_commission_tier` table with `last_updated_at` and `last_updated_by` audit fields.

Validation: the value must be a non-negative number (inline check, no Zod schema).

## Export

**Permission:** Requires `can_export`.

**Format:** `.xlsx` via `xlsx-js-style` — generated entirely client-side.

**Filename:** `commission-report-\{BRANCH_ABBR\}-\{YEAR\}-\{MONTH\}.xlsx` (e.g., `commission-report-KD-2026-02.xlsx`).

### Branch handling

You can't export "All Branches" in one file. If "All Branches" is selected, the `ExportBranchDialog` opens to force a single branch selection before export.

### Workbook structure

| Sheet | Content |
| --- | --- |
| **Summary** | One row per trainer in the branch for the period. Columns: Trainer, Branch, Category, all 6 session type counts, Total Sessions, Conduction Fee, New Sales, New Sales Comm, Renewal Sales, Renewal Comm, Total Sales Comm, Total Commission. Includes a Grand Total row. |
| **Per-trainer sheets** | One sheet per trainer (named by trainer name, max 31 chars, deduplicated). Contains trainer email + category, period info, member count. One row per member with all session counts, fees, sales, and commission. Includes a Subtotal row. |

### Data fetching for export

Export bypasses the SWR hooks and queries directly:

- `view_5_2_trainer_monthly_commission_report` — summary data.
- `view_5_2_1_trainer_monthly_commission_details` — per-trainer member breakdowns.
- `member` table — member name lookup.
- `staff` table — trainer email lookup (used in sheet naming).

## Commission periods

- **Granularity:** Monthly (year + month integer pair).
- **Period discovery:** `useCommissionPeriods()` queries distinct year/month combinations from the report view. Only periods with existing commission records appear as options.
- **Auto-selection:** The most recent period is auto-selected on mount.
- **Historical access:** All past periods with data are selectable with no limit.

:::note
There's no pending/approved/paid workflow for commissions. Records in `trainer_monthly_commission` are computed values with no approval lifecycle. The only status field is on the rate configuration (`trainer_commission_tier.status`: active/inactive).
:::

## Permissions

### Role-based behavior

| Aspect | Trainer | Admin / Super Admin |
| --- | --- | --- |
| **Page title** | "My Commission" | "Commission" |
| **Trainer filter** | Disabled — locked to self. | Full combobox, filtered by selected branch. |
| **Branch filter** | Hidden. | Visible. Locked if single-branch staff. |
| **Configuration tab** | Hidden (no `can_edit`). | Visible with `can_edit`. |
| **Export button** | Visible if `can_export`. | Visible if `can_export`. |
| **Table columns** | Sessions, Conduction, Sales, Total. | Trainer, Branch, Sessions, Conduction, Sales, Total. |

### Branch scoping

| Staff type | Visible data |
| --- | --- |
| Trainer | Only their own commission data. Branch filter hidden. |
| Single-branch admin | Locked to their branch. Sees all trainers in that branch. |
| Multi-branch admin | Can switch between branches or view all. "All" omits the branch filter. |

## Session types

Six session types are tracked separately for conduction fee calculation:

| Type | Description |
| --- | --- |
| `paid` | Standard paid PT session. Has session-count tiers (under/over 100). |
| `free` | Free/complimentary session. |
| `compensate` | Compensation session (from cancelled appointment). |
| `transform` | Transform session type. |
| `express` | Express session type. |
| `sponsor` | Sponsored session type. |

## Enums

| Enum | Values |
| --- | --- |
| `commission_type` | `conduction_fee`, `new_sales`, `renew_sales` |
| `session_type` | `paid`, `free`, `compensate`, `transform`, `express`, `sponsor` |
| `trainer_category` | `junior`, `senior`, `master`, `grand master`, `director` |
| `trainer_type` | `full time`, `part time` |
| `member_tier` | `company`, `fans` |

## Database views and tables

| Source | Purpose |
| --- | --- |
| `view_5_2_trainer_monthly_commission_report` (view) | Aggregated commission per trainer per month. Joins `staff` for trainer name, avatar, branch, category. Used for the report table and period discovery. |
| `view_5_2_1_trainer_monthly_commission_details` (view) | Per-member commission rows. Joins `member` for member name. Includes individual conduction rates and sales rates. Used by the detail modal and export. |
| `trainer_monthly_commission` (table) | Computed commission records per trainer per member per month. Written by database functions. |
| `trainer_commission_tier` (table) | Rate configuration. Conduction fees and sales commission rates per branch, trainer type, trainer category, and tier thresholds. |

### Database functions

| Function | Purpose |
| --- | --- |
| `calculate_all_commission()` | Batch-processes all trainer commissions. Returns success/error per trainer-member pair. |
| `calculate_trainer_commission(...)` | Calculates a single trainer-member-month commission. Handles rate lookup, tier matching, and member tier discounting. |

## Component files

| File | Purpose |
| --- | --- |
| `staff/commission/page.tsx` | Page with Report and Configuration tabs, filters, summary cards, commission table (~793 lines). |
| `commission/commission-config-tab.tsx` | Rate configuration matrices with inline editing, session-count and sales-threshold tier expansion (~792 lines). |
| `commission/commission-detail-modal.tsx` | Full-screen detail modal with session breakdown, sales commission, and per-member table (~263 lines). |
| `commission/export-branch-dialog.tsx` | Branch selection dialog for export when "All Branches" is active (~81 lines). |
| `hooks/use-commission.ts` | SWR hooks for report data, detail data, and available periods. |
| `hooks/use-commission-config.ts` | SWR hook for rate configuration, mutation function for updates, staff name resolver. |
