---
sidebar_position: 3
title: Views
description: "Reference for all 23 database views in the gym schema — purpose, source tables, and key computed fields."
---

# Views

The `gym` schema contains 23 views that join, aggregate, and compute data for the application. Views follow a numbered prefix system that maps to admin sidebar modules.

:::note
Views are read-only. The application reads from views for display but writes to the underlying tables directly.
:::

## Analytics views (view_1_*)

These views power the analytics dashboard and KPI cards.

### view_1_1_cost_per_lead

Calculates the cost of acquiring each lead by dividing marketing spend by lead count.

- **Sources:** `leads`, `branch_marketing_cost`
- **Key fields:** branch, month, year, cost per lead, total leads, total cost
- **Used by:** Analytics dashboard — cost-per-lead chart

### view_1_2_monthly_conversion_report

Tracks lead-to-member conversion rates per month.

- **Sources:** `leads`, `member`
- **Key fields:** branch, month, year, total leads, total converted, conversion rate
- **Used by:** Analytics dashboard — conversion funnel

### view_1_3_leads_status_distribution

Counts leads grouped by status for pipeline visualization.

- **Sources:** `leads`
- **Key fields:** branch, status, count
- **Used by:** Analytics dashboard — lead status breakdown chart

### view_1_4_monthly_revenue_trend

Aggregates monthly revenue from payments.

- **Sources:** `member_payment`, `member_package`
- **Key fields:** branch, month, year, total revenue
- **Used by:** Analytics dashboard — revenue trend chart

### view_1_5_monthly_kpi_summary

Combines key metrics into a single summary row per month.

- **Sources:** Multiple tables
- **Key fields:** branch, month, year, new members, revenue, active packages, sessions completed
- **Used by:** Analytics dashboard — KPI cards

---

## Member views (view_2_*)

### view_2_member

The primary member view used across the admin app. Joins member data with computed fields.

- **Sources:** `member`, `staff` (assigned trainer), `member_package`, `member_payment`
- **Key fields:** All member columns plus trainer name, active package count, total payments, outstanding balance
- **Used by:** Members list page, member search, member detail view

### view_2_1_tnc

Lists T&C documents with version and status.

- **Sources:** `tnc`
- **Key fields:** id, body, version, status, branch
- **Used by:** Package assignment — T&C selection

### view_2_2_member_tnc

Member T&C signature records with joined names.

- **Sources:** `member_tnc`, `member`, `tnc`, `staff`
- **Key fields:** member name, T&C version, member signature, staff signature, signed date, package
- **Used by:** Member detail — T&C tab

### view_2_3_member_notes

Member notes with author names.

- **Sources:** `member_notes`, `staff`
- **Key fields:** note content, created by name, created at, status
- **Used by:** Member detail — notes section

---

## Leads views (view_3_*)

### view_3_leads

Enriched lead data with computed fields.

- **Sources:** `leads`
- **Key fields:** All lead columns plus remark count, days since creation
- **Used by:** Leads list page, lead pipeline

### view_3_1_leads_remark

Lead remarks with author names.

- **Sources:** `lead_remarks`, `staff`
- **Key fields:** remark content, author name, is_bot flag, created at
- **Used by:** Lead detail modal — remarks timeline

---

## Operations views (view_4_*)

### view_4_1_1_package

Package catalog with status.

- **Sources:** `package`
- **Key fields:** All package columns
- **Used by:** Package selection dropdowns, package management

### view_4_1_2_member_package

Member packages with joined member and package names, session calculations.

- **Sources:** `member_package`, `member`, `package`, `staff`
- **Key fields:** member name, package name, trainer name, remaining sessions (calculated), start/end dates, total price
- **Used by:** Package management page, member detail — packages tab

### view_4_2_member_payment_ledger

Payment ledger showing debit, credit, and outstanding balance per member package.

- **Sources:** `member_payment`, `member_package`
- **Key fields:** member_package_id, total paid, outstanding balance, payment count
- **Used by:** Payment recording — auto-fill outstanding, payment history

### view_4_3_appointment

Appointments with joined member and trainer names. The primary appointment view.

- **Sources:** `appointment`, `member`, `staff`, `member_package`
- **Key fields:** All appointment columns plus member name, trainer name, package name
- **Used by:** Appointment list/calendar, schedule views

### view_4_3_member_payment

Member payments with joined names and package details.

- **Sources:** `member_payment`, `member`, `member_package`, `package`
- **Key fields:** member name, package name, amount, payment type, payment plan, date
- **Used by:** Payment management page, member detail — payments tab

### view_4_3_1_member_invoice

Invoices with full details for PDF generation.

- **Sources:** `member_invoice`, `member`, `member_package`, `package`
- **Key fields:** All invoice columns plus member name, package name
- **Used by:** Invoice download, payment history

---

## Staff views (view_5_*)

### view_5_1_trainer_schedule

Trainer availability with exclusions applied. This is the **core availability view** used by both the admin booking form and the portal booking wizard.

- **Sources:** `trainer_schedule`, `trainer_exclusion`
- **Key fields:** trainer_id, day_of_week, start_time, end_time, valid_from, valid_to, exclusion dates
- **Used by:** Booking forms (admin + portal), trainer schedule page

:::tip
Both the admin and portal apps read from this same view to determine available time slots, ensuring consistency.
:::

### view_5_2_trainer_monthly_commission_report

Aggregated monthly commission summary per trainer.

- **Sources:** `trainer_monthly_commission`
- **Key fields:** trainer_id, year, month, total conduction fee, total sales commission, total entitled commission
- **Used by:** Commission report page — summary table

### view_5_2_1_trainer_monthly_commission_details

Detailed commission breakdown per trainer per member.

- **Sources:** `trainer_monthly_commission`, `member`
- **Key fields:** trainer_id, member name, session counts by type, fees, sales amounts, rates
- **Used by:** Commission detail modal — per-member breakdown

### view_5_3_staff

Staff view with computed fields for the staff management page.

- **Sources:** `staff`
- **Key fields:** All staff columns plus role label, active status
- **Used by:** User management page, trainer selection dropdowns

---

## Points views (view_6_*)

### view_6_1_member_points

Current point balance per member.

- **Sources:** `member_points_transaction`
- **Key fields:** member_id, total points earned, total points redeemed, current balance
- **Used by:** Member profile — points display, portal points page

### view_6_2_member_points_transaction

Point transactions with joined member and merchandise names.

- **Sources:** `member_points_transaction`, `member`, `merchandise`, `member_points_redeemption_fulfilment`
- **Key fields:** member name, transaction type, points, merchandise name, redemption code, fulfilment status
- **Used by:** Point system transactions tab, portal points history
