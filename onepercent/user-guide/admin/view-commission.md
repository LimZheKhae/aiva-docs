---
sidebar_position: 8
title: View commission reports
description: "How to view and export trainer commission reports — conduction fees, sales commission, tiered rates, and Excel export."
---

# View commission reports

Review how much each trainer has earned from sessions conducted and packages sold. Commission is calculated automatically by the database — the admin app displays the results.

## Before you begin

- You need `can_view` permission on the **Commission** module.
- You need `can_export` permission to download Excel reports.

## View commission

1. Click **Staff > Commission** in the sidebar.
1. Select a **month** and **year** from the date picker.
1. Optionally filter by **trainer**.

<!-- ![Commission report overview](./assets/view-commission-overview.png) -->

The page shows a summary table with each trainer's:

- **Conduction fee** — earnings from sessions conducted.
- **Session count** — number of sessions that month.
- **Sales commission** — earnings from packages sold.
- **Total earnings** — combined total.

## Commission types

### Conduction fees

Trainers earn a fee for each session they conduct. The rate depends on:

| Factor | How it affects the rate |
| --- | --- |
| **Session type** | Paid, free, transform, express, sponsor, and compensate sessions each have different rates. |
| **Trainer category** | Junior, Senior, Master, Grand Master, and Director tiers earn different base rates. |
| **Session count** | Higher monthly session counts may unlock higher rate tiers. |

### Sales commission

Trainers earn commission on packages they sell. The rate is based on:

| Factor | How it affects the rate |
| --- | --- |
| **Sales threshold** | Hitting higher monthly sales targets unlocks higher commission percentages (e.g., under RM8K, RM8K–20K, RM20K+). |
| **Member tier** | Company members earn full commission. Fans members earn 50% commission. |
| **Attribution** | The staff closer on a package determines which trainer gets credit. |

## View trainer details

Click a trainer's row to open the **detail modal** showing:

- **Conduction fee breakdown** — list of every session with date, member, type, duration, and calculated fee.
- **Sales commission breakdown** — new sales and renewal sales with member, amount, and commission earned.
- **Rate tables** — the tiered rate configuration by trainer category and session type.

<!-- ![Commission detail modal](./assets/view-commission-detail.png) -->

## Export to Excel

1. Apply your filters (month, year, trainer).
1. Click **Export**.
1. An Excel workbook downloads with multiple sheets:
   - **Summary** — all trainers with totals.
   - **Per-trainer sheets** — detailed session and sales breakdowns for each trainer.

The export uses `xlsx-js-style` for formatted, professional-looking spreadsheets.

:::note
You need `can_export` permission on the Commission module. The export button is hidden without this permission.
:::

## Trainer dashboard view

Trainers see their own commission on their personal dashboard:

- **Month-to-date commission** card showing conduction fee, sales commission, and total earnings.
- Click **View Details** to see the full breakdown.

Trainers can only see their own data — not other trainers' commission.

## Things to keep in mind

- Commission is calculated by database functions (`calculate_all_commission` and `calculate_trainer_commission`), not in the browser. This ensures consistency and prevents rounding differences.
- Only **Completed** sessions count toward conduction fees.
- Commission types include conduction fees (per session), new sales commission, and renewal sales commission.
- Commission rates are configured in the database — changing them affects future calculations but not past months.
