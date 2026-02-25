---
sidebar_position: 3
title: Manage leads
description: "How to track and manage prospective members — add leads, update statuses, add remarks, and convert leads to members."
---

# Manage leads

Track prospective members from first contact through to conversion. Each lead moves through a pipeline of statuses, and you can log remarks to keep a record of every interaction.

## Before you begin

- You need `can_view` permission on the **Leads** module to see leads.
- You need `can_edit` permission to create, update, or convert leads.

## View leads

1. Click **Leads** in the sidebar.
1. The leads table shows all prospects with their name, contact, status, source, assigned staff, and last updated date.

<!-- ![Leads table overview](./assets/manage-leads-table.png) -->

### Filter and search

- **Search** — type a name or phone number in the search box.
- **Status filter** — filter by pipeline status (New, Engaged, Consulted, etc.).
- **Source filter** — filter by marketing channel (Instagram, TikTok, Facebook, Walk-in, Referral, etc.).
- **Branch filter** — filter by gym branch.

## Add a new lead

1. Click the **Add Lead** button.
1. Fill in the lead's details:
   - **Name** (required, minimum 2 characters)
   - **Contact number** (required)
   - **Source** — free text description (e.g., "Walk-in referral").
   - **Source channel** — dropdown (Instagram, TikTok, Facebook, etc.).
   - **Branch** (optional) — Kota Damansara or Kepong.
   - **Scoring** — a 0–100 score to rank lead quality.
   - **Require follow-up** — toggle on if the lead needs follow-up.
1. Click **Save**.

The lead is created with status **New**.

## Update a lead's status

1. Click on a lead in the table to open the detail view.
1. Click the **Status** dropdown.
1. Select the new status.

### Lead statuses

| Status | Meaning |
| --- | --- |
| **New** | First contact, not yet reached out. |
| **Engaged** | Lead acknowledged consultation. |
| **Escalated** | Assigned to a PIC (person in charge). |
| **No Reply** | Attempted contact but no response. |
| **Consulted** | Completed a consultation or trial session. |
| **Rejected** | Lead declined or isn't interested. |
| **Converted** | Became a paying member. |

## Add a remark

Remarks keep a log of every interaction with a lead.

1. Open the lead's detail view.
1. Type your remark in the text area at the bottom.
1. Click **Add Remark**.
1. The remark appears in the timeline with your name and timestamp.

You can also edit or delete existing remarks. Bot-generated remarks (e.g., from WhatsApp auto-responses) are marked with a badge.

<!-- ![Lead remarks timeline](./assets/manage-leads-remarks.png) -->

## Convert a lead to a member

When a lead is ready to sign up:

1. Open the lead's detail view.
1. Click **Convert to Member**.
1. The system pre-fills the member registration form with the lead's details (name, contact, email).
1. Complete the registration (see [register a member](./register-member)).
1. The lead's status automatically changes to **Converted** and is locked — no further status changes are allowed.

## Import and export leads

### Import from Excel

1. Click the **Import** button on the leads page.
1. Select a CSV file with columns: name, contact, source, source_channel, status, scoring, require_follow_up, remark, branch.
1. The system validates phone numbers (7–15 digits), checks for duplicates within the batch, and validates branches.
1. Review the preview and confirm.

### Export to Excel

1. Apply any filters you want (status, source, branch).
1. Click the **Export** button.
1. An Excel file downloads with all filtered leads.

:::note
You need `can_export` permission on the Leads module to use the export feature.
:::

## Things to keep in mind

- Each lead is tracked by phone number — duplicate phone numbers are flagged.
- Leads are branch-scoped. Staff assigned to a specific branch only see leads for their branch.
- The source field helps track marketing ROI in the analytics dashboard.
