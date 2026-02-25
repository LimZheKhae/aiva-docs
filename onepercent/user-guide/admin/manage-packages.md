---
sidebar_position: 5
title: Manage packages
description: "How to manage member training packages — assign packages, track sessions, manage expiry, and handle renewals."
---

# Manage packages

Assign training packages to members, track their session usage, and manage renewals. Packages define how many personal training sessions a member has purchased and which trainer delivers them.

## Before you begin

- You need `can_view` permission on the **Package** module to see packages.
- You need `can_edit` permission to create or modify packages.

## View packages

1. Click **Operations > Package** in the sidebar.
1. The packages table shows all member packages with name, member, trainer, sessions used/total, expiry date, and status.

<!-- ![Packages table overview](./assets/manage-packages-table.png) -->

### Filters

- **Search** — find by member name or package name.
- **Status** — Active, Expired, or All.
- **Branch** — filter by gym branch.
- **Trainer** — filter by assigned trainer.

## Assign a package to a member

The package assignment is a 3-step workflow that includes terms and conditions acknowledgment and digital signatures.

### Step 1: Package details

1. Click **Add Package**.
1. **Select a member** — search by name or phone number.
1. Fill in the package details:
   - **Package** — select from the package catalog.
   - **Trainer** — the assigned personal trainer.
   - **Staff closer** — the staff member who closed the sale (for commission attribution).
   - **Total sessions** — number of PT sessions included.
   - **Start date** and **end date** — the package validity period.
   - **Total price** — the package cost.
   - **Bonus gym access** — number of bonus months of gym-only access (if applicable).
1. Click **Next**.

<!-- ![Add package form - step 1](./assets/manage-packages-add-form.png) -->

### Step 2: Terms and conditions

1. The T&C document linked to the selected package is displayed.
1. The member reads the terms.
1. Check the **acknowledgment checkbox** to confirm the member agrees.
1. Click **Next**.

### Step 3: Signatures

1. The member signs using the **signature pad** (draw with finger or mouse).
1. The staff member also signs in a second signature pad.
1. Click **Clear** to redo either signature if needed.
1. Click **Save**.

The signatures are uploaded as images to Supabase Storage, and a T&C record is created in the `member_tnc` table.

<!-- ![Signature pad](./assets/manage-packages-signature.png) -->

## View package details

Click a package row to see:

- **Session progress** — how many sessions have been used vs. total.
- **Appointment history** — all sessions booked under this package.
- **Payment records** — payments linked to this package.
- **Member details** — quick link to the member's profile.

## Edit a package

1. Click a package to open the detail view.
1. Click **Edit**.
1. Modify the fields you need to change (sessions, dates, trainer, etc.).
1. Click **Save**.

:::warning
Changing the total sessions on an active package affects the remaining session count. Double-check before saving.
:::

## Track session usage

Each package shows a progress indicator:

| Sessions remaining | Indicator |
| --- | --- |
| Over 50% | Green progress bar. |
| 25–50% | Orange progress bar. |
| Under 25% | Red progress bar. |

The dashboard's **Expiring Soon** and **Expiring** action items also flag packages running low on sessions or approaching their end date.

## Handle renewals

When a member's package is running out:

1. Check the **Follow-up Needed** section on the trainer dashboard — it lists members with 3 or fewer sessions remaining.
1. Discuss renewal with the member.
1. Create a new package (following the "Assign a package" steps above).
1. Record the payment (see [record a payment](./record-payment)).

## Export packages

1. Apply any filters you want.
1. Click the **Export** button.
1. An Excel file downloads with all filtered packages.

:::note
You need `can_export` permission on the Package module to use the export feature.
:::

## Things to keep in mind

- A member can have multiple active packages simultaneously (e.g., different trainers or programs).
- Packages determine which trainer shows up in the booking form — the member can only book sessions with the trainer assigned to their package.
- Expired packages are read-only — you can't book new sessions against them.
- Package session counts affect the duration options available in the booking wizard (e.g., 2 remaining sessions = max 60-minute booking).
