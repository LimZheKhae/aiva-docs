---
sidebar_position: 9
title: Manage the point system
description: "How to manage the loyalty point system — earning rules, merchandise catalog, redemption processing, and QR-based fulfilment."
---

# Manage the point system

Run a loyalty program where members earn points and redeem them for merchandise. You manage the earning rules, merchandise catalog, and fulfilment — members browse and redeem from the portal.

## Before you begin

- You need `can_view` permission on the **Point System** module to see data.
- You need `can_edit` permission to manage earning rules, merchandise, and fulfilment.

## View the point system

1. Click **Operations > Point System** in the sidebar.
1. The page has four tabs: **Transactions**, **Earning Rules**, **Merchandise**, and **Redemptions**.

## Transactions tab

Shows all point transactions across all members.

<!-- ![Transactions tab](./assets/point-system-transactions.png) -->

Each row shows:

- **Member name**
- **Transaction type** — Earn or Redeem.
- **Points** — amount earned or spent.
- **Balance after** — running balance at that point.
- **Remark** — description of the transaction.
- **Date**

### Add points manually

1. Click **Add Points**.
1. Select a member.
1. Enter the points amount.
1. Enter a remark (e.g., "Birthday bonus" or "Referral reward").
1. Click **Save**.

## Earning rules tab

Configure how members earn points automatically. Each rule defines a points-per-ringgit rate.

<!-- ![Earning rules configuration](./assets/point-system-earning-rules.png) -->

Each rule has:

- **Name** — the rule name (e.g., "Session points" or "Purchase points").
- **Points per value** — how many points are earned per RM spent.
- **Active** — toggle to enable or disable the rule.
- **Branch** — which branch the rule applies to.

To edit a rule:

1. Click the rule row.
1. Modify the points-per-value rate or toggle active/inactive.
1. Click **Save**.

## Merchandise tab

Manage the reward catalog that members browse in the portal.

### Add a merchandise item

1. Click **Add Item**.
1. Fill in:
   - **Name** — the reward item name.
   - **Description** — what the member receives.
   - **Points required** — the redemption cost.
   - **Category** — apparel, accessories, supplements, equipment, or other.
   - **Image** — upload a product photo.
   - **Branch** — which branches offer this item (or "All Branch").
   - **Active** — toggle to show/hide from the catalog.
1. Click **Save**.

<!-- ![Add merchandise form](./assets/point-system-add-merchandise.png) -->

### Edit or deactivate an item

1. Click the merchandise item.
1. Modify fields or toggle **Active** off to hide it from the portal.
1. Click **Save**.

:::tip
Deactivating an item hides it from the catalog but doesn't affect existing redemptions for that item.
:::

## Redemptions tab

Process member redemptions and fulfilments.

### Redemption lifecycle

1. Member redeems an item in the portal → status: **Pending**.
1. Member shows the QR code at the gym counter.
1. Staff scans or looks up the redemption code → status: **Fulfilled**.
1. (Or staff cancels if the member changes their mind → status: **Cancelled**, points refunded.)

### Fulfil a redemption

You can fulfil redemptions in two ways:

**Option 1: QR scanner**
1. Click the **QR Scanner** button on the Transactions tab.
1. Scan the member's QR code using your device camera, or enter the redemption code manually.
1. The status changes to **Fulfilled**.

**Option 2: Find and fulfil**
1. Go to the **Transactions** tab and filter by status **Pending**.
1. Find the pending redemption (member name, item, code).
1. Click **Fulfil**.
1. The status changes to **Fulfilled** and the member sees the update in their portal.

### Cancel a redemption

1. Find the pending redemption.
1. Click **Cancel**.
1. The points are refunded to the member's balance automatically.

<!-- ![Redemptions list with pending items](./assets/point-system-redemptions.png) -->

## Things to keep in mind

- Points don't expire — there's no expiry mechanism in the system.
- When a member redeems, a database trigger automatically creates a fulfilment record with a unique redemption code (format: `RPT-YYMMDDXXXX`).
- The portal has real-time subscriptions on the rewards page — when you fulfil or cancel a redemption, the member sees the change instantly.
- Members can only redeem items matching their branch or items set to "All Branch."
- Cancelled redemptions refund the full points amount.
