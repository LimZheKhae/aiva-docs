---
sidebar_position: 5
title: Profile & Account
description: "How the portal profile module works — member profile display, profile editing, avatar upload, payment history with invoice downloads, points balance, transaction history, merchandise catalog, and QR-based redemption."
---

# Profile and account

The profile module is the member's account hub. It includes the main profile page with stats, a profile editor with avatar upload, payment history with invoice downloads, and the full points and rewards experience. The points and rewards section is the portal's most feature-rich area — with a merchandise catalog, redemption flow, QR codes, and real-time status updates.

## Routes

| Route | File | Lines | Purpose |
| --- | --- | --- | --- |
| `/profile` | `app/(protected)/profile/page.tsx` | ~467 | Profile card, stats grid, and navigation menu. |
| `/profile/edit` | `app/(protected)/profile/edit/page.tsx` | ~570 | Profile editor with avatar upload and emergency contacts. |
| `/profile/payments` | `app/(protected)/profile/payments/page.tsx` | ~1,101 | Payment history with filters and invoice downloads. |
| `/profile/points` | `app/(protected)/profile/points/page.tsx` | ~517 | Points balance and transaction history with infinite scroll. |
| `/profile/points/rewards` | `app/(protected)/profile/points/rewards/page.tsx` | ~1,589 | Merchandise catalog, redemption flow, and QR code display. |

## Data fetching

| Hook | File | Purpose |
| --- | --- | --- |
| `useMemberProfile()` | `src/hooks/use-member-profile.ts` | Profile data and stats (points, payments, sessions). |
| `useMemberEdit()` | `src/hooks/use-member-edit.ts` | Profile form data, avatar upload, and profile update functions. |
| `useMemberPayments()` | `src/hooks/use-member-payments.ts` | Payments, invoices, total paid, and outstanding balance. |
| `useMemberPoints()` | `src/hooks/use-member-points.ts` | Points balance and paginated transaction history with infinite scroll. |
| `useMerchandise()` | `src/hooks/use-merchandise.ts` | Merchandise catalog, pending redemptions, balance, and redeem function. Real-time subscriptions. |

## Profile page

**Route:** `apps/portal/src/app/(protected)/profile/page.tsx` (~467 lines)

### Layout

```
┌──────────────────────────────────────────┐
│  Profile Card                             │
│  ┌──────┐  Member Name                   │
│  │Avatar│  Phone · Branch                │
│  └──────┘  Member for X years            │
├──────────────────────────────────────────┤
│  Stats Grid (3 columns, clickable)        │
│  ┌──────┐  ┌──────────┐  ┌──────────┐   │
│  │Points│  │ Payments │  │ Sessions │   │
│  └──────┘  └──────────┘  └──────────┘   │
├──────────────────────────────────────────┤
│  Edit Profile        →                    │
│  My Points           →                    │
│  Payment History     →                    │
├──────────────────────────────────────────┤
│  [Sign Out]                               │
│  1% Fitness · Version                     │
└──────────────────────────────────────────┘
```

### Profile card

- Avatar with fallback initials (first letters of the name).
- Member name, phone number, and branch.
- Membership duration (e.g., "2 years" or "New member").

### Stats grid

Three clickable stat cards that navigate to the respective pages:

| Stat | Navigates to |
| --- | --- |
| **Points** | `/profile/points` |
| **Payments** | `/profile/payments` |
| **Completed Sessions** | `/schedule/history` |

### Sign out

A sign-out button with a loading state. Calls `supabaseBrowser.auth.signOut()` and redirects to `/login`.

## Edit profile

**Route:** `apps/portal/src/app/(protected)/profile/edit/page.tsx` (~570 lines)

### Form sections

**Avatar upload:**

- Tap to select an image file.
- Shows a preview before saving.
- Uploads directly to Supabase Storage via `uploadAvatar(memberId, file)`.

**Personal information:**

| Field | Editable | Notes |
| --- | --- | --- |
| **Full Name** | Yes | Text input. |
| **Email** | No | Read-only with "Contact staff to change" label. |
| **Phone** | No | Read-only. |
| **Date of Birth** | Yes | DatePicker component. |
| **Gender** | Yes | Select dropdown: Male / Female. |

**Emergency contact 1** (required):

| Field | Details |
| --- | --- |
| **Contact Name** | Text input. |
| **Contact Phone** | Text input. |
| **Relationship** | Text input. |

**Emergency contact 2** (optional): Same fields as contact 1.

### Save flow

1. If an avatar was selected, uploads it first. Shows "Uploading avatar..." state.
2. Calls `updateMemberProfile(memberId, formData)` to update the `member` table.
3. Revalidates both `member-edit` and `member-profile` SWR cache keys.
4. Shows "Saving profile..." during the update.

## Payment history

**Route:** `apps/portal/src/app/(protected)/profile/payments/page.tsx` (~1,101 lines)

### Financial summary

- **Total Paid** — large display showing the lifetime payment total.
- **Outstanding Balance** — shown only when greater than 0.

### Advanced filter bar

| Filter | Behavior |
| --- | --- |
| **Search** | Matches package name or invoice number. Highlights matching text in results. |
| **Year** | Selector shown only when payments span multiple years. |
| **Month** | Scrollable month chips for the selected year. Auto-scrolls to the selected month. |
| **Clear all** | Resets all filters. |

Shows a "X of Y" count of filtered results.

### Payment list

Each payment row displays:

- Date (day/month/year).
- Package name (highlighted if matching search).
- Amount (currency formatted).
- Download icon (if an invoice exists for the payment).

### Invoice download

Tapping the download icon calls `/api/invoices/\{id\}/pdf`. The browser auto-downloads the file using the `content-disposition` filename from the response.

### Pagination

Loads 20 payments at a time. "Load More" button for additional results.

### Empty state

When filters produce no results, shows a filter icon with "No payments found" and a reason based on the active filters.

## Points page

**Route:** `apps/portal/src/app/(protected)/profile/points/page.tsx` (~517 lines)

### Layout

```
┌──────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐ │
│  │  Balance Card (gold gradient)        │ │
│  │  12,450 points                       │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  How to Earn (info card)                  │
│  Redeem Rewards → /profile/points/rewards │
│                                           │
│  Points History (infinite scroll)         │
│  ┌──────────────────────────────────────┐ │
│  │  ↑ Session completed    +50   12,450 │ │
│  │  ↑ Package purchase    +200   12,400 │ │
│  │  ↓ Merchandise redeem  -500   12,200 │ │
│  │  ...                                 │ │
│  └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Balance card

An amber/gold gradient card showing the current spendable points balance.

### Transaction history

Infinite scroll powered by `useMemberPoints()` with `IntersectionObserver` sentinel (15 items per page via `useSWRInfinite`).

Each transaction shows:

- **Icon** — up arrow (earn) or down arrow (redeem) with matching background color.
- **Remark** — description or default text.
- **Date** and status badge (if cancelled).
- **Points** — `+` or `-` amount.
- **Balance after** — running balance at that point.

Cancelled redemptions display at 50% opacity with strikethrough points and a "Cancelled" label.

Shows the total transaction count at the bottom.

## Rewards page

**Route:** `apps/portal/src/app/(protected)/profile/points/rewards/page.tsx` (~1,589 lines)

The most feature-rich page in the portal. Premium UI with gold background gradients.

### Tabs

| Tab | Content |
| --- | --- |
| **Catalog** | Merchandise grid with affordability indicators. |
| **My Rewards** | Pending redemptions (with QR) and collection history. Badge shows pending count. |

### Catalog tab

A 2-column grid of merchandise cards. Each card shows:

- Merchandise image.
- Name and category badge.
- Points cost badge.
- Green checkmark if the member can afford it.
- Reduced opacity (0.7) if insufficient points.

**Branch filtering:** Items are fetched where `is_active = true`, then client-side filtered to items matching the member's branch or `all branch`.

### Redemption flow

1. Member taps a merchandise card.
2. **Redeem modal** opens showing the item image, name, description, and a points breakdown:
   - Current balance.
   - Cost.
   - Remaining after redemption (green if positive, red if negative).
3. "Redeem Now" button is disabled if points are insufficient.
4. On tap, calls `redeemMerchandise(itemId, points)` which inserts a `redeem` transaction into `member_points_transaction`.
5. A database trigger automatically creates a `member_points_redeemption_fulfilment` record with `status: 'pending'` and a generated redemption code.
6. **Success modal** displays full-screen with:
   - QR code (rendered via `react-qr-code` with level "H" error correction).
   - Redemption code text (format: `RPT-YYMMDDXXXX`).
   - Animated success badge.

### My rewards tab

Split into two sections:

- **Ready to Collect** — pending redemptions. Full cards, tappable to open a QR modal showing the QR code and redemption code.
- **Collection History** — fulfilled and cancelled redemptions. Compact cards, collapsed by default with a "Show more" button.

Each reward shows its status:

| Status | Display |
| --- | --- |
| `pending` | Awaiting collection. Tappable for QR. |
| `fulfilled` | Collected. Green check. |
| `cancelled` | Cancelled (points refunded). Strikethrough. |

### Real-time subscriptions

**Hook:** `src/hooks/use-merchandise.ts`

The merchandise hook subscribes to real-time changes on three tables via a Supabase channel named `merchandise-realtime`:

- `member_points_transaction` — balance changes.
- `merchandise` — catalog updates (new items, price changes).
- `member_points_redeemption_fulfilment` — status changes (pending → fulfilled/cancelled).

This ensures the catalog and redemption status update live — if staff fulfills a redemption from the admin app, the member sees the status change immediately.

:::note
The points page (`/profile/points`) uses SWR with `revalidateOnFocus: true` but no real-time subscriptions. Only the rewards page has real-time updates.
:::

## Database views and tables

| Source | Purpose |
| --- | --- |
| `view_2_member` (view) | Member profile data with computed fields. Used by profile and edit hooks. |
| `view_6_1_member_points` (view) | Aggregated points balance and lifetime stats. Excludes cancelled redemptions from balance. |
| `view_6_2_member_points_transaction` (view) | Transaction list with joined member name, merchandise name, fulfilment status, and redemption code. |
| `member` (table) | Write target for profile updates and avatar URL. |
| `member_payment` (table) | Payment records for history display. |
| `member_invoice` (table) | Invoice records for PDF download links. |
| `member_points_transaction` (table) | Write target for redemption transactions. |
| `member_points_redeemption_fulfilment` (table) | Redemption lifecycle tracking. Auto-created by DB trigger. |
| `merchandise` (table) | Reward catalog items. |

**Storage bucket:** Supabase Storage for avatar uploads (member images).

## Component files

| File | Purpose |
| --- | --- |
| `app/(protected)/profile/page.tsx` | Profile card, stats grid, and navigation menu (~467 lines). |
| `app/(protected)/profile/edit/page.tsx` | Profile editor with avatar upload and emergency contacts (~570 lines). |
| `app/(protected)/profile/payments/page.tsx` | Payment history with advanced filters and invoice downloads (~1,101 lines). |
| `app/(protected)/profile/points/page.tsx` | Points balance and transaction history with infinite scroll (~517 lines). |
| `app/(protected)/profile/points/rewards/page.tsx` | Merchandise catalog, redemption flow, and QR code display (~1,589 lines). |
| `hooks/use-member-profile.ts` | SWR hook for profile data, stats, sign-out, and membership duration helper. |
| `hooks/use-member-edit.ts` | Profile form conversion, avatar upload, and update functions. |
| `hooks/use-member-payments.ts` | SWR hook for payments, invoices, totals, and invoice matching. |
| `hooks/use-member-points.ts` | SWR hook with infinite scroll for points balance and transactions. |
| `hooks/use-merchandise.ts` | SWR hook with real-time subscriptions for catalog, redemptions, and balance. |
