---
sidebar_position: 2
title: Analytics
description: "How the analytics module works — KPIs, charts, channel performance, revenue trends, and marketing cost management."
---

# Analytics

The analytics module gives admins and managers a data-driven view of gym performance — revenue, ad spend, lead conversion, and marketing ROI across branches and channels. It's one of the most data-intensive pages in the Admin app, with all chart rendering and metric calculations happening client-side.

**Route:** `apps/admin/src/app/(staff)/analytics/page.tsx` (~2,763 lines, single file) <br />
**Permission module:** `analytics` (`can_view` for page access, `can_edit` for marketing cost management) <br />
**Chart library:** Recharts v3

:::note
The entire analytics UI — charts, tables, modals, calculations — lives in a single page component file. There are no separate component files in `src/components/analytics/`. All sub-components are defined inline.
:::

## Data fetching

All data is fetched directly from the Supabase browser client inside a `fetchData()` async function triggered on mount via `useEffect`. There are no dedicated hooks, no SWR caching, and no real-time subscriptions.

Five parallel queries run on load:

| Source view | What it provides |
| --- | --- |
| `view_1_1_cost_per_lead` | Enquiry count, sales closed, revenue per channel for a given month. |
| `view_1_2_monthly_conversion_report` | Conversion metrics per channel per month. |
| `view_1_3_leads_status_distribution` | Lead counts by status (new, engaged, consulted, closed, no reply) per channel. Fetched for 12 months in parallel for sparklines and channel performance. |
| `view_1_4_monthly_revenue_trend` | Revenue, ad cost, and net profit per branch per month. |
| `branch_marketing_cost` (raw table) | Channel-level ad spend records for ROA calculations. |

All metric calculations happen in `useMemo` hooks — no server-side aggregation beyond what the database views provide.

## Global filters

Three controls in the page header affect most sections:

| Control | Options | Effect |
| --- | --- | --- |
| **Period** | 3 / 6 / 12 months | Controls the time window for channel performance, revenue trend, and cost tables. |
| **Branch** | All Branches / Kepong / Kota Damansara | Filters all sections by branch. Disabled and pre-set for single-branch staff. |
| **Month / Year** | Dropdowns | Used by KPI cards, pipeline bar, and cost-per-lead calculations (point-in-time snapshot). |

A **Refresh** button re-runs `fetchData()`. A **Manage Cost** button opens the cost management dialog (visible only with `analytics.edit` permission).

## Page layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Period Toggle · Branch Selector · Refresh · Manage │
├───────────────────┬───────────────────┬─────────────────────┤
│   Net Profit      │  Return on Ads    │  Conversion Rate    │
│   (sparkline)     │  (sparkline)      │  (sparkline)        │
├───────────────────┴───────────────────┴─────────────────────┤
│  Lead Pipeline Summary Bar (segmented by status)            │
├─────────────────────────────────────────────────────────────┤
│  Channel Performance (chart / table toggle)                 │
├─────────────────────────────────────────────────────────────┤
│  Revenue Trend (line chart: revenue vs ad cost)             │
├─────────────────────────────────────────────────────────────┤
│  Cost Performance by Branch (pivoted month table)           │
└─────────────────────────────────────────────────────────────┘
```

## Executive summary KPI cards

Three cards at the top, each with a value, subtitle, benchmark (where applicable), and a sparkline chart showing the trend over the selected period.

### Net profit

- **Value:** `totalSales - totalAdCost`, formatted as MYR.
- **Subtitle:** "Revenue RM X - Ad Cost RM Y".
- **Sparkline:** Area chart showing net profit per month.
- **Trend:** Not yet implemented — MoM comparison is hardcoded to `null` because previous-month ad cost data isn't reliably available.

### Return on ads (ROA)

- **Value:** `(totalSales / totalAdCost).toFixed(1)` displayed as a multiplier (e.g., "3.2x").
- **Subtitle:** "Every RM1 spent returns RM X".
- **Benchmark:** 3x target, shown with a Target icon.
- **Sparkline:** Area chart showing ROA per month.

### Conversion rate

- **Value:** `(totalSalesClosed / totalEnquiries) * 100`, displayed as a percentage.
- **Subtitle:** "X closed from Y leads".
- **Benchmark:** 10% target.
- **Sparkline:** Area chart showing conversion rate per month.
- **Trend:** Real MoM comparison using previous month's lead data from `view_1_3_leads_status_distribution`.

### How summary metrics are calculated

All values are derived in a single `summaryMetrics` useMemo:

| Metric | Formula | Source |
| --- | --- | --- |
| `totalEnquiries` | Sum of `enquiries` | `view_1_1_cost_per_lead` |
| `totalSalesClosed` | Sum of `sales_closed` | `view_1_1_cost_per_lead` |
| `totalSales` | Sum of `sales` | `view_1_1_cost_per_lead` |
| `totalAdCost` | Sum of `total_ad_cost` (excludes null branch and "all branch" rows) | `view_1_4_monthly_revenue_trend` |
| `avgCostPerLead` | `totalAdCost / totalEnquiries` | Derived |
| `avgCPA` | `totalAdCost / totalSalesClosed` | Derived |
| `overallROA` | `totalSales / totalAdCost` | Derived |
| `conversionRate` | `(totalSalesClosed / totalEnquiries) * 100` | Derived |

## Lead pipeline summary

A horizontal segmented bar showing the current month's leads broken into stages:

| Stage | Color |
| --- | --- |
| New | `#000000` (black) |
| Engaged | `#F59E0B` (amber) |
| Consulted | `#E50914` (red) |
| Closed | `#10B981` (green) |
| No Reply | `#6B7280` (gray) |

Segment widths are calculated as `(stageCount / totalLeads) * 100%`. The total lead count is displayed in the header.

## Channel performance

This section has a **Chart / Table toggle** in the header.

### Chart mode

A Recharts `ComposedChart` with:

- **Bars** (left y-axis) — Lead counts per channel, grouped by month. Up to 12 gradient-colored bar groups.
- **Line** (right y-axis) — Average conversion rate per channel (black line overlay).
- **Month filter** — Clicking a month pill in the legend isolates that month's bars.

### Table mode

Grouped rows — one per channel, expandable into one row per month. Columns:

| Column | Description |
| --- | --- |
| **Channel** | Badge with channel name. Clicking opens a `ChannelTrendModal`. |
| **Month** | Month label (e.g., "Feb 2026"). |
| **Leads** | Total leads for that month (sum of all statuses). |
| **Closed** | Closed count, shown in green. |
| **Conversion** | Progress bar — green (≥ 15%), amber (≥ 8%), red (< 8%). |
| **Ad Cost** | From `branch_marketing_cost` table. Shows "—" for organic channels. |
| **Revenue** | From `sales` in `view_1_3_leads_status_distribution`. |
| **ROA** | `revenue / adCost`. Green if ≥ 1x, red if < 1x. |
| **Revenue Trend** | MoM change vs previous month (arrow + percentage). |

Channels are sorted by total revenue descending.

### Channel trend modal

Opens when you click a channel badge in table mode. Shows:

- A `ComposedChart` with revenue bars (left y-axis) and conversion rate line (right y-axis) over time.
- Summary stats below: Total Revenue, Average Conversion %, Total Closed.

## Revenue trend chart

A Recharts `LineChart` with two lines:

| Line | Style | Color |
| --- | --- | --- |
| **Revenue** | Solid, 2.5px stroke | `#000000` (black) |
| **Ad Cost** | Dashed (5 5), 2px stroke | `#E50914` (red) |

- X-axis: month labels.
- Y-axis: formatted as "Xk" (thousands).
- Tooltip shows: Revenue (RM), Ad Cost (RM), Net Profit (RM, green if positive, red if negative).
- Data source: `view_1_4_monthly_revenue_trend`, aggregated across branches when "All" is selected, sliced to the selected period.

## Cost performance by branch

A horizontally scrollable pivot table. Only rendered when data exists.

- **Rows:** One per branch, sorted by total revenue descending. Grand totals row at the bottom.
- **Columns:** Branch (sticky left), one column per month in the selected period, Total column.

Each month cell shows:

- Revenue with MoM trend badge (arrow + percentage).
- Ad cost in muted text.
- ROA multiplier, colored by `getPerformanceColor()`: green (≥ 3x), amber (≥ 1x), red (< 1x).
- Net profit in green or red.

MoM trends are **computed client-side** by comparing consecutive month entries.

## Marketing cost management

The **Manage Cost** dialog lets admins input monthly ad spend per channel per branch. Only visible if the user has `analytics.edit` permission.

### Dialog modes

| Mode | When | Behavior |
| --- | --- | --- |
| **add** | No data exists for the selected period. | Empty form, all channels at RM 0. |
| **view** | Data exists. | Read-only display. "Edit Costs" button switches to edit mode. |
| **edit** | User clicked "Edit Costs". | Editable form pre-filled with existing values. |

### Form fields

- **Period selection:** Branch, Year (current ± 2 years), Month.
- **Channel cost table:** One row per paid channel with cost (number) and remark (text, max 500 chars) fields.

### Paid channels (have cost entry)

`facebook`, `facebook/instagram`, `google`, `instagram`, `website`, `xhs`

### Organic channels (excluded from cost entry)

`walk in`, `referral`, `br`

### Save behavior

- Calls `PUT /api/analytics/branch-marketing-cost` with all channel data.
- Channels with `cost > 0` are upserted (unique constraint: `branch + year + month + source_channel`).
- Channels with `cost = 0` have their existing records **deleted**.
- Branch ownership is validated both client-side and server-side.

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/analytics/branch-marketing-cost` | PUT | Bulk upsert channel costs for a branch/month. Deletes zero-cost records. |
| `/api/analytics/branch-marketing-cost` | POST | Legacy single-record create. |
| `/api/analytics/branch-marketing-cost/[id]` | PATCH | Update a specific cost record by UUID. |
| `/api/analytics/branch-marketing-cost/[id]` | DELETE | Delete a specific cost record. Idempotent. |

All routes validate with Zod (schemas in `src/lib/validations/analytics.ts`), check `analytics.edit` RBAC permission, and enforce branch ownership for single-branch staff.

## Source channel display names

| Database value | Display label |
| --- | --- |
| `facebook` | Facebook |
| `facebook/instagram` | FB/Instagram |
| `instagram` | Instagram |
| `google` | Google |
| `xiaohongshu` | Xiaohongshu |
| `tiktok` | TikTok |
| `referral` | Referral |
| `walk in` | Walk-in |
| `br` | BR |

## Permissions

| Action | What it controls |
| --- | --- |
| `can_view` | Access to the analytics page (enforced by `ModuleAccessBoundary`). |
| `can_edit` | Visibility of "Manage Cost" button and all cost write API routes. |
| `can_export` | Defined in RBAC schema but **not yet implemented** — no export button exists. |

## Database views reference

| View | What it computes |
| --- | --- |
| `view_1_1_cost_per_lead` | Enquiries, sales closed, and revenue per channel for a given month/year. |
| `view_1_2_monthly_conversion_report` | Conversion metrics per channel per month. |
| `view_1_3_leads_status_distribution` | Lead counts broken down by status per channel per branch per month. |
| `view_1_4_monthly_revenue_trend` | Revenue, ad cost, and net profit aggregated per branch per month. |
| `view_1_5_monthly_kpi_summary` | Defined in types but **not queried** on this page. Reserved for future use. |
