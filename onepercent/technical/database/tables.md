---
sidebar_position: 2
title: Tables (data dictionary)
description: "Complete data dictionary for all tables in the gym schema — columns, data types, constraints, and relationships."
---

# Tables (data dictionary)

This page documents every table in the `gym` schema. Each table lists its columns with data types, nullability, defaults, and descriptions.

**Legend:**
- **PK** — primary key
- **FK** — foreign key
- **NN** — not null
- **UQ** — unique
- **ID** — identity (auto-increment)

## Core entities

### member

Gym members and customers. Central entity that most other tables reference.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `bigint` | PK, ID, UQ | Auto-generated member ID. |
| `register_date` | `timestamptz` | NN, default `now()` | Registration timestamp. |
| `name` | `text` | NN | Full name. |
| `contact` | `text` | NN | Phone number with country code. |
| `email` | `text` | | Login email (portal access). |
| `gender` | `gender` | | Male or female. |
| `dob` | `date` | | Date of birth. |
| `nationality` | `text` | | Nationality (e.g., Malaysian, Singaporean). |
| `identity_number` | `text` | | IC or passport number. |
| `source` | `source_channel` | | Marketing source channel. |
| `handler` | `handler` | NN, default `ai agent` | WhatsApp message routing (ai agent or human). |
| `branch` | `branch` | NN | Home branch (kota damansara, kepong, all branch). |

| `leads_id` | `uuid` | FK → leads | Linked lead if converted. |
| `closed_by` | `uuid` | FK → staff | Staff who closed the sale. |
| `tier` | `member_tier` | | Company or fans (affects commission). |
| `avatar_url` | `text` | | Profile photo URL in storage. |
| `whatsapp_number` | `text` | | WhatsApp-specific number. |
| `whatsapp_opt_in` | `boolean` | | WhatsApp messaging consent. |
| `preferred_contact_method` | `text` | | Preferred contact method. |
| `signed_tnc` | `boolean` | | Whether T&C has been signed. |
| `emergency_contact_name_1` | `text` | | Emergency contact 1 name. |
| `emergency_contact_1` | `text` | | Emergency contact 1 phone. |
| `emergency_relation_1` | `text` | | Emergency contact 1 relationship. |
| `emergency_contact_name_2` | `text` | | Emergency contact 2 name. |
| `emergency_contact_2` | `text` | | Emergency contact 2 phone. |
| `emergency_relation_2` | `text` | | Emergency contact 2 relationship. |

**RLS:** Enabled. Members can read/update their own row. Staff access is branch-scoped by category (admin, trainer, super_admin). See [RLS policies](./rls-policies).

---

### staff

Staff members including trainers, admins, and super admins. Links to Supabase Auth via email matching.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Staff UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `name` | `text` | NN | Full name. |
| `email` | `text` | NN | Login email (matched to Supabase Auth). |
| `contact` | `text` | | Phone number. |
| `gender` | `gender` | | Male or female. |
| `category` | `staff_category` | NN | Role: trainer, admin, or super_admin. |
| `trainer_type` | `trainer_type` | | Full time or part time (trainers only). |
| `trainer_category` | `trainer_category` | | Tier: junior, senior, master, grand master, director. |
| `specification` | `text` | | Trainer specialization. |
| `status` | `general_status` | NN | Active or inactive. |
| `branch` | `branch` | NN | Assigned branch. |
| `avatar_url` | `text` | | Profile photo URL in storage. |

**RLS:** Enabled. All authenticated users can read and update staff records.

---

### leads

Prospect tracking before conversion to member.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Lead UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `name` | `text` | NN | Full name. |
| `contact` | `text` | NN | Phone number. |
| `source` | `text` | | Free-text source description. |
| `source_channel` | `source_channel` | | Source channel enum (instagram, walk in, etc.). |
| `status` | `leads_status` | NN | Pipeline status (new → converted). |
| `scoring` | `bigint` | | Lead quality score (0–100). |
| `require_follow_up` | `boolean` | | Follow-up flag. |
| `follow_up_count` | `bigint` | | Number of follow-up attempts. |
| `branch` | `branch` | | Assigned branch. |
| `converted_at` | `timestamp` | | Timestamp when converted to member. |
| `fitness_goal` | `text` | | Bot-collected fitness goal. |
| `weight` | `text` | | Bot-collected weight. |
| `height` | `text` | | Bot-collected height. |
| `workout_experience` | `text` | | Bot-collected experience level. |

---

### lead_remarks

Conversation log per lead. Supports both staff and bot-generated remarks.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Remark UUID. |
| `lead_id` | `uuid` | FK → leads | Parent lead. |
| `remark` | `text` | NN | Remark content. |
| `created_by` | `uuid` | FK → staff | Staff author (null for bot). |
| `created_at` | `timestamp` | NN | Creation timestamp. |
| `is_bot` | `boolean` | | Whether remark was bot-generated. |

**RLS:** Enabled. Users can edit/delete own non-bot remarks.

---

### member_notes

Internal staff notes on members.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Note UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `member_id` | `bigint` | FK → member | Target member. |
| `notes` | `text` | NN | Note content. |
| `status` | `text` | | Note status. |
| `created_by` | `uuid` | FK → staff | Author. |

---

## Packages and payments

### package

Package catalog (templates). Not directly assigned to members — `member_package` links the two.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Package UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `name` | `text` | NN | Package name. |
| `description` | `text` | | Features description. |
| `session_count` | `bigint` | | Number of PT sessions included. |
| `bonus_session_count` | `bigint` | | Bonus sessions. |
| `membership_period` | `real` | | Months of gym membership access. |
| `price` | `numeric` | | Base price. |
| `branch` | `branch` | NN | Available at branch. |
| `status` | `general_status` | NN | Active or inactive. |
| `tnc_id` | `uuid` | FK → tnc | Linked T&C document. |
| `focus` | `text` | | Training focus area. |
| `in_body_check` | `text` | | InBody check inclusion. |
| `nutrition_plan` | `text` | | Nutrition plan inclusion. |
| `merchandise` | `text` | | Included merchandise. |
| `weekend_guest_privilege` | `text` | | Weekend guest privileges. |
| `pt_voucher` | `text` | | PT voucher details. |
| `assisted_stretching` | `text` | | Assisted stretching inclusion. |
| `branch_access` | `text` | | Multi-branch access details. |
| `shareable_pt` | `text` | | Whether PT sessions are shareable. |

---

### member_package

A purchased package linking a member to a package template with specific dates and sessions.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Member package UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `member_id` | `bigint` | FK → member | Package owner. |
| `package_id` | `uuid` | FK → package | Package template. |
| `trainer_id` | `uuid` | FK → staff | Assigned trainer. |
| `branch` | `branch` | NN | Branch for this purchase. |
| `package_start_date` | `date` | | PT session start date. |
| `package_end_date` | `date` | | PT session end date. |
| `membership_start_date` | `date` | | Gym membership start date. |
| `membership_end_date` | `date` | | Gym membership end date. |
| `paid_pt_session` | `bigint` | | Paid PT sessions. |
| `bonus_pt_session` | `bigint` | | Bonus PT sessions. |
| `bonus_month` | `bigint` | | Bonus membership months. |
| `compensation_session` | `bigint` | | Compensation sessions added. |
| `total_price` | `numeric` | | Total package price. |
| `closed_by` | `array` | | Staff IDs who closed the sale (supports split). |

---

### member_payment

Payment records for package purchases.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `bigint` | PK, ID | Auto-generated payment ID. |
| `created_at` | `timestamptz` | NN, default `now()` | Payment timestamp. |
| `member_id` | `bigint` | FK → member | Paying member. |
| `member_package_id` | `uuid` | FK → member_package | Package being paid for. |
| `payment_plan` | `payment_plan` | NN | Full or partial. |
| `amount_before_tax` | `numeric` | | Pre-tax amount. |
| `tax` | `numeric` | | Tax amount. |
| `grand_total` | `numeric` | | Total paid. |
| `payment_type` | `payment_type` | NN | Cash, online transfer, credit card, etc. |
| `payment_proof` | `text` | | URL to uploaded proof image. |

---

### member_invoice

Auto-generated invoices. Created by the `generate_member_invoice` trigger on payment insert.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Invoice UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `invoice_number` | `text` | | Sequential invoice number. |
| `member_id` | `bigint` | FK → member | Invoiced member. |
| `member_package_id` | `uuid` | FK → member_package | Related package. |
| `payment_id` | `bigint` | FK → member_payment | Triggering payment. |
| `purchase_date` | `timestamptz` | | Purchase date. |
| `branch` | `branch` | | Branch. |
| `bill_to` | `text` | | Billing name. |
| `item` | `text` | | Package/item description. |
| `payment_amount` | `numeric` | | Payment amount. |
| `tax` | `numeric` | | Tax. |
| `grand_total` | `numeric` | | Grand total. |
| `outstanding` | `numeric` | | Remaining balance. |
| `payment_method` | `text` | | Payment method used. |
| `payment_history` | `jsonb` | | Historical payment entries. |
| `remark` | `text` | | Notes. |
| `company_name` | `text` | | Company name (B2B invoicing). |
| `company_ssm_number` | `text` | | Company SSM number. |
| `company_e_invoice_number` | `text` | | E-invoice number. |
| `company_location` | `text` | | Company address. |

---

### tnc

Terms and conditions documents. Versioned per branch.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | T&C UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `body` | `text` | | T&C content as HTML. |
| `status` | `text` | | Active or inactive. |
| `version` | `smallint` | | Version number. |
| `branch` | `branch` | | Applicable branch. |

---

### member_tnc

Signed T&C records with digital signatures from both member and staff.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Signature record UUID. |
| `signed_date` | `timestamptz` | | Signing timestamp. |
| `member_id` | `bigint` | FK → member | Signing member. |
| `tnc_id` | `uuid` | FK → tnc | T&C document version. |
| `member_package_id` | `uuid` | FK → member_package | Related package. |
| `member_sign` | `text` | | Member signature URL. |
| `member_sign_date` | `date` | | Member signature date. |
| `staff_sign` | `text` | | Staff witness signature URL. |
| `staff_sign_date` | `date` | | Staff signature date. |
| `staff_id` | `uuid` | FK → staff | Witnessing staff. |

---

## Appointments

### appointment

Training session bookings with a full status lifecycle.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Appointment UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `member_id` | `bigint` | FK → member | Attending member. |
| `trainer_id` | `uuid` | FK → staff | Conducting trainer. |
| `member_package_id` | `uuid` | FK → member_package | Package session is drawn from. |
| `trainer_schedule_id` | `uuid` | FK → trainer_schedule | Schedule slot used. |
| `start_time` | `timestamp` | NN | Session start. |
| `end_time` | `timestamp` | NN | Session end. |
| `status` | `appointment_status` | NN | Status lifecycle (see [enums](./enums)). |
| `category` | `appointment_category` | | Leads or member. |
| `session_type` | `appointment_session_type` | | Paid, bonus, or compensation. |
| `booking_source` | `booking_source` | | Manual (staff) or bot (portal). |
| `branch` | `branch` | NN | Session branch. |
| `remark` | `text` | | Notes. |
| `is_compensated` | `boolean` | | Whether this is a compensation session. |
| `sent_reminder_count` | `bigint` | | Number of reminders sent. |
| `cancelled_by` | `uuid` | FK → staff | Staff who cancelled. |
| `cancelled_at` | `timestamptz` | | Cancellation timestamp. |
| `rescheduled_from` | `timestamp` | | Original time before reschedule. |
| `rescheduled_by` | `uuid` | FK → staff | Staff who rescheduled. |
| `rescheduled_at` | `timestamptz` | | Reschedule timestamp. |
| `member_signed_attendance_at` | `timestamp` | | Member check-in timestamp. |
| `trainer_signed_attendance_at` | `timestamp` | | Trainer attendance confirmation. |
| `leads_id` | `uuid` | FK → leads | Lead appointment (trial sessions). |

---

### trainer_schedule

Recurring weekly availability slots for trainers.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Schedule UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `trainer_id` | `uuid` | FK → staff | Trainer. |
| `day_of_week` | `smallint` | NN | Day of week (1 = Monday, 7 = Sunday). |
| `start_time` | `time` | NN | Slot start time. |
| `end_time` | `time` | NN | Slot end time. |
| `valid_from` | `date` | | Schedule effective from. |
| `valid_to` | `date` | | Schedule effective until (null = ongoing). |
| `is_active` | `boolean` | NN | Soft-delete flag. |

---

### trainer_exclusion

Blocked time slots for trainer unavailability (holidays, leave, personal time).

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `bigint` | PK, ID | Auto-generated ID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `trainer_id` | `uuid` | FK → staff | Trainer. |
| `exclusion_date` | `date` | NN | Blocked date. |
| `start_time` | `time` | | Start time (null = all day). |
| `end_time` | `time` | | End time (null = all day). |
| `reason` | `text` | | Reason for exclusion. |
| `is_active` | `boolean` | NN | Soft-delete flag. |

---

## Commission

### trainer_commission_tier

Tiered commission rate configuration. Rates depend on trainer category, session type, session count ranges, and sales thresholds.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Tier UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `branch` | `branch` | | Applicable branch. |
| `trainer_type` | `trainer_type` | | Full time or part time. |
| `trainer_category` | `trainer_category` | | Junior, senior, master, grand master, director. |
| `commission_type` | `commission_type` | | Conduction_fee, new_sales, or renew_sales. |
| `session_type` | `session_type` | | Paid, free, transform, express, sponsor, compensate. |
| `session_count_min` | `bigint` | | Minimum session count for this tier. |
| `session_count_max` | `bigint` | | Maximum session count for this tier. |
| `sales_threshold_min` | `numeric` | | Minimum sales for this tier. |
| `sales_threshold_max` | `numeric` | | Maximum sales for this tier. |
| `fee_amount` | `numeric` | | Fixed fee per session (conduction). |
| `commission_rate` | `numeric` | | Percentage rate (sales). |
| `status` | `general_status` | | Active or inactive. |
| `last_updated_at` | `timestamptz` | | Last modification. |
| `last_updated_by` | `uuid` | FK → staff | Last modifier. |

---

### trainer_monthly_commission

Pre-calculated monthly commission breakdown per trainer per member. Populated by the `calculate_all_commission` cron job.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Record UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `year` | `bigint` | NN | Commission year. |
| `month` | `bigint` | NN | Commission month. |
| `trainer_id` | `uuid` | FK → staff | Trainer. |
| `member_id` | `bigint` | FK → member | Member. |
| `member_tier` | `member_tier` | | Company or fans (affects rate). |
| `total_paid_session` | `numeric` | | Paid sessions conducted. |
| `conduction_fee_paid` | `numeric` | | Fee for paid sessions. |
| `conduction_paid_rate` | `numeric` | | Rate applied to paid sessions. |
| `total_free_session` | `numeric` | | Free sessions conducted. |
| `conduction_fee_free` | `numeric` | | Fee for free sessions. |
| `conduction_free_rate` | `numeric` | | Rate applied to free sessions. |
| `total_transform_session` | `numeric` | | Transform sessions. |
| `conduction_fee_transform` | `numeric` | | Fee for transform sessions. |
| `conduction_transform_rate` | `numeric` | | Transform rate. |
| `total_express_session` | `numeric` | | Express sessions. |
| `conduction_fee_express` | `numeric` | | Fee for express sessions. |
| `conduction_express_rate` | `numeric` | | Express rate. |
| `total_sponsor_session` | `numeric` | | Sponsor sessions. |
| `conduction_fee_sponsor` | `numeric` | | Fee for sponsor sessions. |
| `conduction_sponsor_rate` | `numeric` | | Sponsor rate. |
| `total_compensate_session` | `numeric` | | Compensate sessions. |
| `conduction_fee_compensate` | `numeric` | | Fee for compensate sessions. |
| `conduction_compensate_rate` | `numeric` | | Compensate rate. |
| `total_conduction_count` | `numeric` | | Total sessions conducted. |
| `total_conduction_fee` | `numeric` | | Total conduction fees. |
| `total_new_sales` | `numeric` | | New sales amount. |
| `new_sales_rate` | `numeric` | | New sales commission rate. |
| `sales_commission` | `numeric` | | New sales commission earned. |
| `total_renew_sales` | `numeric` | | Renewal sales amount. |
| `renew_sales_rate` | `numeric` | | Renewal commission rate. |
| `renew_commission` | `numeric` | | Renewal commission earned. |
| `total_sales_commission` | `numeric` | | Total sales commission. |
| `total_entitled_commission` | `numeric` | | Grand total commission. |
| `last_updated_at` | `timestamp` | | Last recalculation. |

---

### branch_marketing_cost

Marketing spend per branch per month. Used for cost-per-lead analytics.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Record UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `branch` | `branch` | NN | Branch. |
| `year` | `bigint` | NN | Year. |
| `month` | `bigint` | NN | Month. |
| `cost` | `numeric` | | Marketing cost (MYR). |
| `source_channel` | `source_channel` | | Marketing channel. |
| `status` | `text` | | Record status. |
| `remark` | `text` | | Notes. |
| `updated_at` | `timestamptz` | | Last update. |

---

## Points and merchandise

### points_config

Earning rules for the point system. Each rule defines a points-per-ringgit rate.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Rule UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `rule_key` | `text` | NN | Rule identifier. |
| `rule_value` | `numeric` | NN | Points per RM spent. |
| `description` | `text` | | Rule description. |
| `branch` | `branch` | | Applicable branch. |
| `status` | `general_status` | | Active or inactive. |
| `last_updated_at` | `timestamptz` | | Last update. |
| `last_updated_by` | `uuid` | FK → staff | Last modifier. |

---

### member_points_transaction

Point earn and redeem transaction log.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Transaction UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Transaction timestamp. |
| `member_id` | `bigint` | FK → member | Member. |
| `transaction_type` | `point_transaction_type` | NN | Earn or redeem. |
| `points_config_id` | `uuid` | FK → points_config | Applied earning rule (earn only). |
| `merchandise_id` | `uuid` | FK → merchandise | Redeemed item (redeem only). |
| `points` | `numeric` | NN | Points amount (positive for earn, negative for redeem). |
| `balance_before` | `numeric` | | Balance before transaction. |
| `balance_after` | `numeric` | | Balance after transaction. |
| `redemption_code` | `text` | | Auto-generated redemption code. |
| `remark` | `text` | | Notes. |

---

### member_points_redeemption_fulfilment

Tracks physical fulfilment of point redemptions.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Fulfilment UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `member_points_transaction_id` | `uuid` | FK → member_points_transaction | Related transaction. |
| `redemption_code` | `text` | | QR redemption code. |
| `status` | `merchandise_redeemption_status` | NN | Pending, fulfilled, or cancelled. |
| `fulfilled_by` | `uuid` | FK → staff | Staff who fulfilled. |
| `fulfilled_at` | `timestamp` | | Fulfilment timestamp. |
| `remark` | `text` | | Notes. |
| `last_updated_at` | `timestamptz` | | Last update. |
| `last_updated_by` | `uuid` | FK → staff | Last modifier. |

---

### merchandise

Merchandise catalog available for point redemption.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Merchandise UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `name` | `text` | NN | Item name. |
| `description` | `text` | | Item description. |
| `points_required` | `numeric` | NN | Cost in points. |
| `category` | `text` | | Category (apparel, accessories, supplements, equipment, other). |
| `quantity` | `bigint` | | Available stock. |
| `image_url` | `text` | | Product image URL. |
| `is_active` | `boolean` | NN | Whether listed for redemption. |
| `branch` | `branch` | | Available at branch. |
| `last_updated_at` | `timestamptz` | | Last update. |
| `last_updated_by` | `uuid` | FK → staff | Last modifier. |

---

## Permissions

### role_permissions

Default permissions per role. Defines the baseline access for each staff category.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Record UUID. |
| `role` | `text` | NN | Role name (admin, trainer, super_admin). |
| `module` | `text` | NN | Module key (e.g., `members`, `operations-payment`). |
| `can_view` | `boolean` | | View permission. |
| `can_edit` | `boolean` | | Edit permission. |
| `can_export` | `boolean` | | Export permission. |
| `created_at` | `timestamptz` | | Creation timestamp. |
| `updated_at` | `timestamptz` | | Last update. |

---

### staff_permissions

Per-staff permission overrides. These take precedence over `role_permissions` defaults.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Record UUID. |
| `staff_id` | `uuid` | FK → staff | Target staff member. |
| `module` | `text` | NN | Module key. |
| `can_view` | `boolean` | | View permission override. |
| `can_edit` | `boolean` | | Edit permission override. |
| `can_export` | `boolean` | | Export permission override. |
| `created_at` | `timestamptz` | | Creation timestamp. |
| `updated_at` | `timestamptz` | | Last update. |

**RLS:** Enabled. Admins can manage permissions for staff in their branch. Super admins have full access.

---

## WhatsApp / messaging

### whatsapp_conversations

Conversation threads with WhatsApp contacts.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Conversation UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | | Last update. |
| `member_id` | `integer` | FK → member | Linked member (if identified). |
| `phone_number` | `text` | NN | WhatsApp phone number. |
| `status` | `text` | | Conversation status. |
| `last_message_at` | `timestamptz` | | Last message timestamp. |
| `unread_count` | `integer` | | Unread message count. |
| `assigned_to` | `uuid` | FK → staff | Assigned staff handler. |
| `tags` | `text[]` | | Conversation tags. |
| `notes` | `text` | | Staff notes on conversation. |

---

### whatsapp_messages

Individual WhatsApp messages with AI processing metadata.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Message UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Message timestamp. |
| `updated_at` | `timestamptz` | | Last update. |
| `waha_message_id` | `text` | | WAHA message ID. |
| `session_name` | `text` | | WAHA session name. |
| `from_number` | `text` | | Sender phone number. |
| `to_number` | `text` | | Recipient phone number. |
| `member_id` | `integer` | FK → member | Linked member. |
| `message_type` | `text` | | Message type (text, image, etc.). |
| `message_body` | `text` | | Message content. |
| `media_url` | `text` | | Media attachment URL. |
| `media_mime_type` | `text` | | Media MIME type. |
| `direction` | `text` | | Inbound or outbound. |
| `status` | `text` | | Delivery status. |
| `ai_processed` | `boolean` | | Whether AI processed this message. |
| `ai_intent` | `text` | | Detected intent. |
| `ai_confidence` | `numeric` | | AI confidence score. |
| `ai_entities` | `jsonb` | | Extracted entities. |
| `ai_response` | `text` | | AI-generated response. |
| `requires_human` | `boolean` | | Flagged for human review. |
| `appointment_created` | `uuid` | FK → appointment | Appointment created from this message. |
| `action_taken` | `text` | | Action taken on this message. |
| `metadata` | `jsonb` | | Additional metadata. |
| `error_message` | `text` | | Error details (if failed). |

---

### whatsapp_outbox

Outbound message queue. Inserting a row triggers an n8n webhook via the `notify_n8n_webhook` function.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Outbox UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Queue timestamp. |
| `module_name` | `text` | | Source module. |
| `category` | `text` | | Message category. |
| `recipient_contact` | `text` | NN | Recipient phone number. |
| `recipient_type` | `text` | | Recipient type (member, lead). |
| `message_body` | `text` | NN | Message content. |
| `status` | `text` | | Delivery status. |
| `sent_at` | `timestamp` | | Sent timestamp. |
| `branch` | `text` | | Source branch. |

---

### whatsapp_sessions

WAHA session state tracking.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Session UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | | Last update. |
| `session_name` | `text` | NN | Session identifier. |
| `phone_number` | `text` | | Connected phone number. |
| `status` | `text` | | Connection status (STOPPED, WORKING, etc.). |
| `qr_code` | `text` | | Current QR code data. |
| `last_connected_at` | `timestamptz` | | Last successful connection. |
| `engine` | `text` | | WAHA engine type. |
| `metadata` | `jsonb` | | Additional session data. |

---

### whatsapp_settings

Configuration for tags, templates, and WhatsApp feature settings.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Setting UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | | Last update. |
| `setting_type` | `text` | NN | Setting category (tag, template, config). |
| `setting_key` | `text` | NN | Setting identifier. |
| `tag_color` | `text` | | Tag display color. |
| `tag_description` | `text` | | Tag description. |
| `template_content` | `text` | | Template body. |
| `template_variables` | `jsonb` | | Template variable definitions. |
| `config_data` | `jsonb` | | Configuration data. |
| `is_active` | `boolean` | | Whether setting is active. |
| `display_order` | `integer` | | Sort order. |

---

### whatsapp_templates

Reusable message templates.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Template UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `name` | `text` | NN | Template name. |
| `category` | `text` | | Template category. |
| `template_text` | `text` | NN | Template body with variables. |
| `variables` | `text[]` | | Variable placeholders. |
| `is_active` | `boolean` | NN | Whether template is available. |
| `usage_count` | `integer` | | Times used. |

---

### message_reply_template

Quick reply templates for staff.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Template UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `name` | `text` | NN | Template name. |
| `category` | `text` | | Category grouping. |
| `body` | `text` | NN | Reply text. |
| `status` | `text` | | Active or inactive. |
| `cta` | `text` | | Call-to-action text. |
| `type` | `text` | | Template type. |

---

### message_source_template

Auto-routing templates that assign leads to branches based on source keywords.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Template UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `source` | `text` | | Source identifier. |
| `source_channel` | `source_channel` | | Marketing channel. |
| `status` | `general_status` | | Active or inactive. |
| `branch` | `branch` | | Target branch. |
| `keywords` | `text[]` | | Matching keywords. |

---

## Knowledge base

### chat_history

Chat interaction history for AI conversations.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Record UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Timestamp. |
| `member_contact` | `bigint` | | Member contact number. |
| `type` | `text` | | Message type. |
| `message_text` | `text` | | Message content. |
| `status` | `text` | | Processing status. |

---

### knowledge

Knowledge base articles used for AI-generated responses.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Article UUID. |
| `created_at` | `timestamptz` | NN, default `now()` | Creation timestamp. |
| `title` | `text` | NN | Article title. |
| `description` | `jsonb` | | Article content (structured). |
| `source_url` | `text` | | Reference URL. |
