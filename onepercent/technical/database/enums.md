---
sidebar_position: 4
title: Enums
description: "Reference for all enum types in the gym schema — allowed values and their meanings."
---

# Enums

The `gym` schema uses PostgreSQL enum types to enforce allowed values at the database level. These enums are mirrored as TypeScript types in `@repo/database` with corresponding runtime arrays for validation.

## Appointment enums

### appointment_status

Status lifecycle for training sessions.

| Value | Description |
| --- | --- |
| `pending pt` | Waiting for trainer confirmation (portal bookings). |
| `pending member` | Waiting for member acknowledgement. |
| `confirmed` | Trainer confirmed, session is scheduled. |
| `acknowledged` | Member has acknowledged the session. |
| `completed` | Session finished, attendance recorded. |
| `cancelled` | Cancelled without penalty — session returned to package. |
| `cancelled penalty` | Cancelled with penalty — session deducted from package. |

### appointment_category

Whether the appointment is for a lead (trial) or an existing member.

| Value | Description |
| --- | --- |
| `leads` | Trial session for a prospect. |
| `member` | Regular session for a member. |

### appointment_session_type

How the session is counted for billing.

| Value | Description |
| --- | --- |
| `paid` | Deducts from paid sessions. |
| `bonus` | Deducts from bonus sessions. |
| `compensation` | Compensation session (doesn't deduct). |

### booking_source

How the appointment was created.

| Value | Description |
| --- | --- |
| `manual` | Booked by staff from the admin app. |
| `bot` | Booked by the member from the portal. |

---

## Member enums

### member_tier

Determines commission calculation rates.

| Value | Description |
| --- | --- |
| `company` | Full commission rate for trainers. |
| `fans` | 50% commission rate for trainers. |

### membership_status

Status of a member's gym membership access.

| Value | Description |
| --- | --- |
| `active` | Membership is current. |
| `expired` | Membership has expired. |

---

## Staff enums

### staff_category

Role-based categorization for staff members.

| Value | Description |
| --- | --- |
| `trainer` | Personal trainer. |
| `admin` | Administrative staff. |
| `super_admin` | Full system access. |

### trainer_category

Trainer seniority tier. Affects commission rates.

| Value | Description |
| --- | --- |
| `junior` | Entry-level trainer. |
| `senior` | Experienced trainer. |
| `master` | Senior trainer. |
| `grand master` | Top-tier trainer. |
| `director` | Director-level trainer. |

### trainer_type

Employment type for trainers.

| Value | Description |
| --- | --- |
| `full time` | Full-time employee. |
| `part time` | Part-time employee. |

---

## Payment enums

### payment_plan

Payment completion type.

| Value | Description |
| --- | --- |
| `full` | Full payment — clears the outstanding balance. |
| `partial` | Partial payment — outstanding balance remains. |

### payment_type

Payment method used.

| Value | Description |
| --- | --- |
| `cash` | Cash payment. |
| `online transfer` | Bank transfer. |
| `credit card` | Credit card. |
| `debit card` | Debit card. |
| `credit card/debit card` | Card payment (unspecified). |
| `package_purchase` | Internal: auto-generated on package purchase. |

---

## Leads enums

### leads_status

Pipeline status for lead tracking.

| Value | Transition | Description |
| --- | --- | --- |
| `new` | Entry point | First contact received. |
| `engaged` | new → engaged | Lead acknowledged consultation. |
| `escalated` | engaged → escalated | Assigned to a PIC (person in charge). |
| `no reply` | any → no reply | No response after contact attempts. |
| `consulted` | engaged → consulted | Completed a consultation or trial. |
| `rejected` | any → rejected | Lead declined or not interested. |
| `converted` | consulted → converted | Registered as a member. **Locked** — no further changes. |

---

## Commission enums

### commission_type

Type of commission earned.

| Value | Description |
| --- | --- |
| `conduction_fee` | Per-session fee for conducting training. |
| `new_sales` | Commission on new package sales. |
| `renew_sales` | Commission on package renewals. |

### session_type

Session categorization for commission calculation.

| Value | Description |
| --- | --- |
| `paid` | Standard paid session. |
| `free` | Complimentary session. |
| `transform` | Body transformation program session. |
| `express` | Express/short session. |
| `sponsor` | Sponsored session. |
| `compensate` | Compensation session. |

---

## Points enums

### point_transaction_type

Direction of a points transaction.

| Value | Description |
| --- | --- |
| `earn` | Points earned (positive). |
| `redeem` | Points spent (negative). |

### merchandise_redeemption_status

Fulfilment status for merchandise redemptions.

| Value | Description |
| --- | --- |
| `pending` | Awaiting collection. |
| `fulfilled` | Item collected by member. |
| `cancelled` | Redemption cancelled, points refunded. |

---

## Shared enums

### branch

Gym branch locations.

| Value | Description |
| --- | --- |
| `kota damansara` | Kota Damansara branch. |
| `kepong` | Kepong branch. |
| `all branch` | All branches (used for staff with cross-branch access). |

### gender

| Value |
| --- |
| `male` |
| `female` |

### general_status

Generic active/inactive/expired status used across multiple tables.

| Value | Description |
| --- | --- |
| `active` | Currently active. |
| `inactive` | Disabled or deactivated. |
| `expired` | Past expiry date. |

### member_package_status

Status of a purchased package.

| Value | Description |
| --- | --- |
| `active` | Package is in use. |
| `expired` | Package has expired. |
| `completed` | All sessions used. |

### handler

WhatsApp message routing handler.

| Value | Description |
| --- | --- |
| `ai agent` | Messages handled by AI bot. |
| `human` | Messages routed to human staff. |

### source_channel

Marketing source channels for tracking where members and leads come from.

| Value | Description |
| --- | --- |
| `facebook` | Facebook. |
| `facebook/instagram` | Facebook or Instagram (combined). |
| `google` | Google search or ads. |
| `instagram` | Instagram. |
| `website` | Company website. |
| `walk in` | Walk-in visit. |
| `br` | Business referral. |
| `xhs` | Xiaohongshu (RedNote). |
| `referral` | Member referral. |
| `flier` | Flyer distribution. |
| `call in` | Phone inquiry. |

---

## TypeScript usage

Enums are exported from `@repo/database` as both types and runtime arrays:

```typescript
// Type usage
import type { AppointmentStatus, Branch, Gender } from '@repo/database';

// Runtime array usage (for validation, dropdowns, etc.)
import { APPOINTMENT_STATUSES, BRANCHES, GENDERS } from '@repo/database';
```

The runtime arrays are useful for building select dropdowns, validating form inputs, and iterating over allowed values.
