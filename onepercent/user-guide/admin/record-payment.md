---
sidebar_position: 6
title: Record a payment
description: "How to record member payments — log payments, track outstanding balances, generate invoices, and email receipts."
---

# Record a payment

Log payments against member packages, track outstanding balances, generate PDF invoices, and email receipts directly from the system.

## Before you begin

- You need `can_edit` permission on the **Payment** module.
- The member should already have a package assigned (see [manage packages](./manage-packages)).

## View payments

1. Click **Operations > Payment** in the sidebar.
1. The payments table shows all recorded payments with date, member, package, amount, payment type, and invoice status.

<!-- ![Payments table overview](./assets/record-payment-table.png) -->

### Filters

- **Search** — find by member name, package name, or invoice number.
- **Date range** — filter by payment date.
- **Branch** — filter by gym branch.
- **Payment type** — filter by type (Cash, Card, Bank Transfer, etc.).

## Record a new payment

1. Click **Add Payment**.
1. **Select a member** — search by name or phone number.
1. **Select a package** — choose from the member's packages.
1. Fill in the payment details:
   - **Amount before tax** — the payment amount in MYR.
   - **Tax** — tax percentage or amount (defaults to 0).
   - **Grand total** — auto-calculated from amount and tax, but editable.
   - **Payment type** — Cash, Card, Bank Transfer, or other method.
   - **Payment plan** — Full Payment or Partial Payment.
   - **Payment proof** (optional) — upload an image (JPEG, PNG, or WebP, max 10 MB).
1. Click **Save**.

<!-- ![Add payment form](./assets/record-payment-add-form.png) -->

## Payment plans

| Plan | Meaning |
| --- | --- |
| **Full Payment** | Complete payment for the package. When selected with an outstanding balance, the amount auto-fills with the remaining balance. |
| **Partial Payment** | A portion of the total. The outstanding balance updates on the ledger after saving. |

## Generate an invoice

After recording a payment:

1. Open the payment record.
1. Click **Generate Invoice**.
1. A PDF invoice is generated using the `@repo/invoice-pdf` package.
1. The invoice includes the gym logo, member details, package info, payment amount, and a unique invoice number.

<!-- ![Generated invoice preview](./assets/record-payment-invoice.png) -->

## Email an invoice

1. Open the payment record with a generated invoice.
1. Click **Send Invoice**.
1. The system sends the PDF to the member's email address via Resend.
1. A confirmation message shows when the email is sent.

:::note
The member's email must be on file for email delivery to work. Check the member's profile if the email fails.
:::

## Track outstanding balances

- The **Dashboard** shows the total outstanding amount across all members in the **Outstanding** metric card.
- On the payments page, you can filter for packages with remaining balances.
- Each member's profile page shows their payment history and any outstanding amounts.

## Export payments

1. Apply any filters you want.
1. Click the **Export** button.
1. An Excel file downloads with all filtered payment records.

:::note
You need `can_export` permission on the Payment module to use the export feature.
:::

## Things to keep in mind

- Payments are linked to specific packages, not members directly. One member can have payments across multiple packages.
- Invoice numbers are auto-generated and unique.
- The outstanding balance on the dashboard includes all unpaid amounts, not just overdue ones.
- Payment records can include remarks for tracking negotiated discounts, payment arrangements, or other context.
