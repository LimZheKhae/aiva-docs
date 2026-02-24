---
sidebar_position: 6
title: Payment
description: "How the payment module works — payment recording, invoice generation, PDF rendering, email delivery, ledger tracking, and export."
---

# Payment

The payment module tracks all financial transactions tied to member packages. It handles payment recording with proof uploads, automatic invoice generation via database triggers, PDF rendering, email delivery, and a per-member ledger view showing debit/credit/outstanding balances.

**Route:** `apps/admin/src/app/(staff)/operations/payment/page.tsx` (~1,081 lines) <br />
**Permission module:** `operations-payment` (`can_view` for page access, `can_edit` for adding payments and editing remarks, `can_export` for CSV export)

## Data fetching

**Hooks:**
- `src/hooks/use-payments.ts` — Fetches `view_4_3_member_payment` and merges invoice remarks from `member_invoice`.
- `src/hooks/use-payment-filters.ts` — Fetches distinct filter option values (branch, payment type, payment plan) from the view.

There are **no real-time subscriptions** on the payment module. Data is fetched on page load and refreshed manually via a "Refresh Data" button or automatically after adding a payment.

## Page layout

The page has two tabs:

```
┌──────────────────────────────────────────────────────────┐
│  [Payments] [Member Ledger]    [Add Payment] [Export]    │
├──────────────────────────────────────────────────────────┤

Tab 1: Payments
┌────────────┬────────────┬────────────┬──────────────┐
│  Total     │  Total     │ Outstanding│  Payment     │
│  Revenue   │  Collected │  Balance   │  Count       │
├────────────┴────────────┴────────────┴──────────────┤
│  Search · Type · Plan · Branch · Date Range         │
├─────────────────────────────────────────────────────┤
│  Payment Table (paginated, 20 per page)             │
└─────────────────────────────────────────────────────┘

Tab 2: Member Ledger
┌─────────────────────────────────────────────────────┐
│  Member Search Dropdown                             │
├─────────────────────────────────────────────────────┤
│  Per-Package Summary Cards                          │
├─────────────────────────────────────────────────────┤
│  Ledger Table (debit / credit / outstanding)        │
└─────────────────────────────────────────────────────┘
```

## Stats dashboard

Four KPI cards at the top of the Payments tab:

| Card | Calculation | Notes |
| --- | --- | --- |
| **Total Revenue** | Sum of `grand_total` (fallback to `amount_before_tax`). | Labeled "Package purchases." |
| **Total Collected** | Same as Total Revenue. | Labeled "Actual payments." Currently identical to revenue. |
| **Outstanding Balance** | Sum of `outstanding` where `is_latest = true` per `member_package_id`. | Deduplicated per package — only the most recent ledger entry counts. Shown in red if > 0. |
| **Payment Count** | Total number of payment records. | |

## Payment table

### Columns

| Column | Content |
| --- | --- |
| **Date** | Payment date. |
| **Member** | Member name (clickable — switches to ledger tab for that member). |
| **Package** | Package name (clickable — navigates to `/operations/package/{id}`). |
| **Type** | Payment type badge. |
| **Plan** | Payment plan (capitalized). |
| **Amount** | Grand total in MYR, right-aligned. |
| **Outstanding** | Red if > 0, green "Paid" badge if 0, dash if null. |
| **Remark** | Invoice remark, truncated at 40 chars with tooltip. |
| **Proof** | Image icon → opens `ImageViewerModal` for the payment proof. |
| **Invoice** | PDF icon → opens `InvoicePreviewModal`. Pencil icon → opens `UpdateInvoiceRemarkModal`. |

### Filters

| Filter | Type | Notes |
| --- | --- | --- |
| **Search** | Client-side | Matches `member_name`, `member_id`, `invoice_id`, `package_name`. Instant, no re-fetch. |
| **Payment Type** | Server-side | Dynamic options from `usePaymentFilters()`. |
| **Payment Plan** | Server-side | Dynamic options. |
| **Branch** | Server-side | Disabled and pre-set for single-branch staff. |
| **Date Range** | Server-side | All Time / Today / This Week / This Month / This Year. Uses `gte`/`lte` on `created_at`. |

Pagination: 20 items per page, client-side slicing. Resets to page 1 when payment count changes.

## Payment types and plans

### Payment types (`payment_type` enum)

| Value | Badge label | Style |
| --- | --- | --- |
| `cash` | Cash | Neutral gray |
| `online transfer` | Transfer | Neutral gray |
| `credit card` | Credit Card | Neutral gray |
| `debit card` | Debit Card | Neutral gray |
| `credit card/debit card` | Card | Neutral gray |
| `package_purchase` | Package | Brand red |

### Payment plans (`payment_plan` enum)

| Value | Label | Badge style |
| --- | --- | --- |
| `full` | Full Payment | Green (success) |
| `partial` | Partial Payment | Yellow (warning) |

## Adding a payment

**Component:** `src/components/payments/add-payment-modal.tsx`

The modal can be opened from three places, each pre-filling different fields:

| Opened from | Pre-filled fields |
| --- | --- |
| Payment page header | None. |
| Member detail page | Member (locked), optionally package. |
| Payment detail modal | Member + package + payment plan. |

### Form fields

| Field | Required | Details |
| --- | --- | --- |
| Member | Yes | Searchable dropdown with avatar. Filtered by staff branch. Locked if pre-filled. |
| Package | Yes | Only packages for the selected member. Shows name + outstanding amount. |
| Payment Type | Yes | Default: `cash`. Options from `usePaymentFilters()`. |
| Payment Plan | Yes | `full` or `partial`. |
| Payment Amount (RM) | Yes | Auto-filled and locked when plan = "full" (set to outstanding balance). |
| Tax (%) | Yes | Default: 0. Range 0–100. Recalculates grand total on change. |
| Grand Total (RM) | No | Auto-calculated: `amount × (1 + tax/100)`. Editable — back-calculates amount. Locked when plan = "full". |
| Payment Proof | No | JPEG/PNG/WebP, max 10MB. Shows thumbnail preview. |

### Auto-fill behavior

| Trigger | Effect |
| --- | --- |
| Package selected | Payment plan pre-filled from latest ledger entry. |
| Plan set to "full" | Amount = outstanding balance, grand total = outstanding × (1 + tax%). Both fields disabled. |
| Tax changed | Grand total recalculates. |
| Grand total manually edited | Amount back-calculates as `grandTotal / (1 + tax/100)`. |

### Validation

Zod schema `createPaymentSchemaWithBalance(outstanding)`:
- Amount must be > 0 and ≤ outstanding balance.
- Tax: 0–100.
- Payment type and plan must be valid enum values.

### Submit flow

1. Validate with Zod.
2. Upload proof image to Supabase Storage (`payment_proof` bucket, path: `payments/{memberId}/{timestamp}-{random}.{ext}`).
3. Get public URL.
4. Insert into `member_payment` table.
5. **Database trigger** automatically creates a `member_invoice` record.
6. Query `member_invoice` to get the auto-created invoice ID.
7. If member has email: fire-and-forget `POST /api/invoices/{id}/send-email`.
8. Refresh payment list.

:::note
Invoices are not created by the app — they're created by a **database trigger** on `member_payment` INSERT. The app only queries for the invoice after insert to get the ID for email sending.
:::

## Member ledger tab

The ledger tab shows a per-member debit/credit/outstanding history across all their packages.

### Member selection

A searchable dropdown loads members from `view_4_2_member_payment_ledger` (distinct `member_id` values) and resolves names from `view_2_member`. Max 50 shown, with live search.

Clicking a member name in the Payments table also switches to this tab with the member pre-selected.

### Per-package summary cards

One card per `member_package_id`, showing:

- Package name.
- Total price.
- Paid (sum of debits).
- Outstanding (from latest entry, red if > 0).

A top-level summary shows total outstanding across all packages.

### Ledger table

| Column | Content |
| --- | --- |
| **Date** | Payment date. |
| **Package** | Package name (from `member_package` → `package` join). |
| **Type** | Payment type. |
| **Plan** | Payment plan. |
| **Debit** | Amount paid, right-aligned. |
| **Credit** | Credit applied, right-aligned. |
| **Outstanding** | Running balance. Red if > 0. |
| **Invoice** | PDF icon + remark edit pencil. |

Data from `view_4_2_member_payment_ledger`, ordered ascending by `created_date` (oldest first).

## Invoice system

### How invoices are created

Invoices are created automatically by a **database trigger** on `member_payment` INSERT. The trigger populates the `member_invoice` table with payment details, member info, company info, and a structured `item` JSON field.

### Invoice data structure

The `item` field is a JSON string with this shape:

```json
{
  "membership": {
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "days_count": 365
  },
  "personal training": {
    "valid_from": "2024-01-01",
    "valid_to": "2025-01-01",
    "package_name": "Elite PT",
    "paid_pt_session": 24
  }
}
```

The `parseInvoiceItem()` utility converts this into structured rows for the invoice table. Falls back to a generic "Package Payment" row for older records without JSON structure.

### Invoice preview modal

**Component:** `src/components/invoices/invoice-preview-modal.tsx`

Fetches from `view_4_3_1_member_invoice` + `member` table. Renders a full invoice with:

1. **Header** — Company name, SSM number, E-invoice number, address, logo.
2. **Bill To** — Member name, phone, email, IC/passport.
3. **Invoice Details** — Invoice number, purchase date, branch.
4. **Items table** — Parsed from `item` JSON: No., Item, Sessions, Amount.
5. **Payment summary** — Subtotal, Tax, Grand Total, Payment Type, Outstanding (green "PAID" badge if 0).
6. **Payment history** — From `payment_history` JSON array.
7. **Footer** — "Thank you for your business!" + generation timestamp.

**Actions:**

| Action | Behavior |
| --- | --- |
| **Send Email** | If member has email, sends immediately. Otherwise opens a sub-dialog for custom email input. |
| **Print** | Injects invoice HTML into a hidden iframe and calls `iframe.print()`. |
| **Download PDF** | Calls `GET /api/invoices/{id}/pdf`. |

### PDF generation

**Route:** `GET /api/invoices/[id]/pdf`

- Fetches invoice data from `view_4_3_1_member_invoice` + member contact info.
- Renders PDF using `@react-pdf/renderer`'s `renderToBuffer()` with the `InvoicePDFTemplate` from `@repo/invoice-pdf`.
- Returns `application/pdf` with `Content-Disposition: attachment; filename=Invoice-{number}.pdf`.

### Email delivery

**Route:** `POST /api/invoices/[id]/send-email`

- Generates PDF via the same `renderToBuffer()` pipeline.
- Sends via **Resend** (`RESEND_API_KEY` env var).
- From: configurable via `RESEND_FROM_NAME` / `RESEND_FROM_EMAIL` (default: `"One Percent Fitness" <onboarding@resend.dev>`).
- Email HTML: minimal template with logo, "Thank you \{name\}", and the PDF attached.
- Subject: `"Invoice {number} - {company}"`.
- Accepts optional `{ email }` body to override the member's email.

### Invoice remark

**Route:** `PATCH /api/invoices/[id]/remark`

Updates `member_invoice.remark`. Empty strings are stored as `NULL`. Requires `operations-payment.can_edit` permission.

## Payment proof

| Aspect | Details |
| --- | --- |
| **Storage bucket** | `payment_proof` |
| **Path pattern** | `payments/{memberId}/{timestamp}-{random7chars}.{ext}` |
| **Accepted types** | JPEG, JPG, PNG, WebP |
| **Max size** | 10 MB |
| **Upload mode** | `upsert: false` (no overwriting) |
| **Viewing** | `ImageViewerModal` component, opened from table icon button or detail modal |

## Export

**Route:** `GET /api/operations/payment/export`

**Query params:** `branch`, `dateFrom`, `dateTo`, `paymentType`, `paymentPlan`, `searchMember`.

**CSV columns:** Payment ID, Created At, Member ID, Member Name, Package Name, Payment Plan, Amount Before Tax (RM), Tax (%), Grand Total (RM), Payment Type, Invoice ID, Branch.

Tax is converted from decimal (e.g., 0.06) to percentage (e.g., 6.00) for display. Filename: `payments_export_YYYY-MM-DD.csv`.

Requires `operations-payment.can_export`. Branch access enforced server-side.

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/operations/payment/export` | GET | CSV export with filters and permission check. |
| `/api/invoices/[id]/pdf` | GET | Generate and return invoice PDF. |
| `/api/invoices/[id]/send-email` | POST | Email invoice PDF via Resend. |
| `/api/invoices/[id]/remark` | PATCH | Update invoice remark. |

## Database views and tables

| Source | Purpose |
| --- | --- |
| `view_4_3_member_payment` (view) | Primary payments view. All columns including `is_latest` flag for outstanding deduplication. |
| `view_4_2_member_payment_ledger` (view) | Ledger tab. Debit/credit/outstanding per payment with running balance. |
| `view_4_3_1_member_invoice` (view) | Invoice data with company info, payment history JSON, and item JSON. |
| `member_payment` (table) | Write target for new payments. Trigger creates `member_invoice` on insert. |
| `member_invoice` (table) | Auto-created invoices. Remark is the only field updated by the app. |
| `member_package` (table) | Package names and total price for ledger cards. |
| `view_2_member` (view) | Member names for ledger dropdown. |

## Component files

| File | Purpose |
| --- | --- |
| `operations/payment/page.tsx` | Page with two tabs (Payments, Member Ledger), header actions. |
| `payments/payment-stats.tsx` | 4 KPI stat cards. |
| `payments/payment-table.tsx` | Filter bar + payment table with pagination, proof viewer, remark editing. |
| `payments/payment-detail-modal.tsx` | Payment history modal per member-package. |
| `payments/add-payment-modal.tsx` | New payment form with auto-fill, proof upload, and invoice email. |
| `invoices/invoice-button.tsx` | Invoice action buttons (3 variants: icon, preview, download). |
| `invoices/invoice-preview-modal.tsx` | Full invoice preview with send/print/download actions. |
| `invoices/update-invoice-remark-modal.tsx` | Remark editing modal. |
| `invoices/invoice-pdf-template.tsx` | In-admin HTML template for print/screen rendering. |
| `hooks/use-payments.ts` | Payment list fetch + invoice remark merge. |
| `hooks/use-payment-filters.ts` | Distinct filter option values. |
| `lib/validations/payment.ts` | Zod schemas for payment forms. |
| `lib/validations/common.ts` | Shared schemas for payment plan, type, currency, percentage. |

### Shared package

| File | Purpose |
| --- | --- |
| `packages/invoice-pdf/src/invoice-pdf-template.tsx` | `@react-pdf/renderer` Document component for server-side PDF generation. |
| `packages/invoice-pdf/src/utils.ts` | `formatCurrency`, `formatDate`, `formatDateTime`, `parseInvoiceItem`. |
