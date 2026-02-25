---
sidebar_position: 2
title: Register a member
description: "How to register a new gym member — fill in personal details, add emergency contacts, and send a portal invitation."
---

# Register a member

Add a new member to the system with their personal details and emergency contacts. The system automatically sends a portal invitation email so the member can set up their own login.

## Before you begin

- You need `can_edit` permission on the **Members** module.
- Have the member's name, email, phone number, and date of birth ready.

## Steps

### Open the registration form

1. Click **Members** in the sidebar.
1. Click the **Add Member** button in the top-right corner.

<!-- ![Add Member button on the members page](./assets/register-member-add-button.png) -->

### Fill in personal details

1. Enter the member's **full name** (required).
1. Enter their **email address** (required) — this becomes their portal login.
1. Enter their **phone number** with country code (required) — auto-validated and corrected for format.
1. Select their **date of birth** (required) — day, month, and year dropdowns. Age must be between 10 and 120.
1. Select their **gender** (required).
1. Select their **nationality** (required) — presets include Malaysian, Singaporean, Chinese, Australian, British, and more.
1. Select the **branch** (required) — Kota Damansara or Kepong. Auto-filled if your staff account is branch-restricted.
1. Enter their **identity number** (optional) — IC or passport number.
1. Select a **response handler** (optional) — "AI Agent" or "Human" for WhatsApp message routing.
1. Select the **marketing source** (required) — how the member found the gym (Instagram, TikTok, Walk-in, Referral, etc.).
1. Select the **tier** (required) — "Company" (full commission) or "Fans" (50% commission) for staff commission calculation.

<!-- ![Personal details form](./assets/register-member-personal-details.png) -->

### Add emergency contacts

1. Fill in **Emergency Contact 1** (required) — name, phone, and relationship.
1. Optionally fill in **Emergency Contact 2**.

### Save the member

1. Review all details.
1. Click **Register Member**.
1. The system creates the member record, sends a portal invitation email, and redirects you to their profile page.

## After registration

- **Portal invite sent automatically** — the system sends an email inviting the member to set their portal password. If the member already has an auth account, a password reset email is sent instead.
- **Assign a package** — go to the member's profile and add a training package (including T&C signature). See [manage packages](./manage-packages).
- **Re-send invite** — if the member didn't receive the email, click the **Send Invite** button (mail icon) on their profile page.

## Draft auto-save

The registration form saves your progress automatically every 500 ms. If you navigate away with unsaved changes, a dialog asks whether to save a draft, discard, or cancel. Drafts are stored in your browser and restored the next time you open the form.

## Pre-fill from a lead

If you're converting a lead to a member, the form is pre-filled with the lead's name, phone, source, and branch. The lead is automatically linked and its status updates to **Converted** after registration. See [manage leads](./manage-leads).

## Things to keep in mind

- Email addresses must be unique — you can't register two members with the same email.
- Phone numbers are validated and auto-corrected for format. Duplicates are flagged before submission.
- Members can later edit their own profile (name, DOB, gender, emergency contacts) from the portal, but they can't change their email or phone number.
- T&C signatures and the digital signature pad happen during **package assignment**, not during member registration.
