---
sidebar_position: 4
title: Packages
description: "How the portal packages module works — active package display, session progress, expiry tracking, bonus gym access, and training program tiers."
---

# Packages

The packages page shows the member's active training packages with session progress, expiry tracking, and trainer details. It also displays the available training program tiers as informational cards. This is a read-only page — members can't purchase or modify packages from the portal.

**Route:** `apps/portal/src/app/(protected)/packages/page.tsx` (~576 lines)

## Data fetching

**Hook:** `src/hooks/use-member-packages.ts`

| Export | Purpose |
| --- | --- |
| `useMemberPackages()` | Fetches the member's packages via SWR. Returns `myPackages[]`. |
| `getActivePackages()` | Filters packages where `end_date > today`. |
| `getDaysUntilExpiry()` | Calculates days remaining until package expiry. |
| `getSessionProgressColor()` | Returns a color based on remaining session percentage: green (plenty), orange (running low), or red (almost used up). |
| `getExpiryBadgeStyle()` | Returns background and text colors based on days until expiry. |

## Page layout

```
┌──────────────────────────────────────────┐
│  My Packages                              │
├──────────────────────────────────────────┤
│  Active Packages                          │
│  ┌──────────────────────────────────────┐ │
│  │  Package Name                        │ │
│  │  Trainer Name                        │ │
│  │  [X days until expiry] badge         │ │
│  │  ████████░░░░  8/12 sessions         │ │
│  │  [🎁 Bonus Gym Access]               │ │
│  │  📅 Start - End  📍 Branch           │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  Training Programs                        │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ Strong │ │Express │ │  Burn  │       │
│  │  🏋️   │ │  ⏱️   │ │  🔥   │       │
│  └────────┘ └────────┘ └────────┘       │
└──────────────────────────────────────────┘
```

## Active package card

Each active package card displays:

- **Package name** and **trainer name**.
- **Expiry badge** — days until expiry, color-coded:
  - Red: 7 days or less.
  - Orange: 8–30 days.
  - Green: more than 30 days.
- **Session progress bar** — visual bar showing sessions used vs total. Color matches the remaining percentage:
  - Red: under 25% remaining.
  - Orange: 25–50% remaining.
  - Green: over 50% remaining.
- **Bonus gym access** — a gift icon badge if the package includes gym access.
- **Details row** — calendar icon with start/end dates, location icon with branch name.

## Training programs

Three hardcoded informational cards showing the gym's program tiers:

| Program | Icon | Description |
| --- | --- | --- |
| **Strong** | Dumbbell | Build strength. |
| **Express** | Stopwatch | Shorter, efficient sessions. |
| **Burn** | Flame | Fat loss and body shaping. |

These are static promotional cards — they don't link to any booking or purchase flow.

## Empty states

- **No active packages** — shows an empty state message.
- **All packages expired** — shows an "Explore new packages" call-to-action.

## Database tables

| Source | Purpose |
| --- | --- |
| `member_package` (table) | Package records with session counts, dates, trainer assignment, and branch. |
| `staff` (table) | Trainer name lookup for package display. |

## Component files

| File | Purpose |
| --- | --- |
| `app/(protected)/packages/page.tsx` | Active packages with progress bars and training program cards (~576 lines). |
| `hooks/use-member-packages.ts` | SWR hook for packages with expiry and progress helpers. |
