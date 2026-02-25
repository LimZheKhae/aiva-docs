---
sidebar_position: 7
title: Set up trainer schedules
description: "How to manage trainer availability — create recurring weekly schedules, block out time off, and resolve appointment conflicts."
---

# Set up trainer schedules

Define when each trainer is available for bookings. Schedules are recurring weekly patterns — set them once and they repeat. Use exclusion blocks to handle days off, holidays, and personal time.

## Before you begin

- You need `can_edit` permission on the **Trainer Schedule** module.
- Trainers should already exist as staff members (see [manage staff](./manage-staff)).

## View trainer schedules

1. Click **Staff > Trainer Schedule** in the sidebar.
1. Select a trainer from the dropdown.
1. Toggle between **Week** and **Month** calendar views.

<!-- ![Trainer schedule calendar view](./assets/trainer-schedule-calendar.png) -->

The calendar shows:

- **Green blocks** — available time slots.
- **Red/gray blocks** — exclusion periods (blocked time).
- **Blue blocks** — booked appointments.

## Add a recurring schedule

1. Click **Add Schedule** (or click an empty time slot on the calendar).
1. Fill in:
   - **Day of week** — Monday through Sunday.
   - **Start time** and **End time** — the availability window.
   - **Branch** — which gym location.
1. Click **Save**.

The schedule repeats every week on that day automatically.

<!-- ![Add schedule form](./assets/trainer-schedule-add-form.png) -->

### Example

To make a trainer available Monday to Friday, 9 AM to 6 PM:

1. Add a schedule for **Monday**, 09:00–18:00.
1. Repeat for **Tuesday** through **Friday**.

Each day can have different hours — trainers don't need to work the same hours every day.

## Edit a schedule

1. Click an existing schedule block on the calendar.
1. Modify the times or branch.
1. Click **Save**.

## Delete a schedule

1. Click an existing schedule block.
1. Click **Delete**.
1. If there are upcoming appointments during that time, an **Affected Appointments** dialog shows the impacted bookings.
1. Decide how to handle them (reschedule or cancel) before confirming.

<!-- ![Affected appointments dialog](./assets/trainer-schedule-affected.png) -->

## Block out time (exclusions)

For days off, holidays, or personal time:

1. Click **Add Exclusion**.
1. Select the **date** (or date range).
1. Select the **start time** and **end time** (or toggle **All Day**).
1. Enter a **reason** (optional, e.g., "Public holiday" or "Annual leave").
1. Click **Save**.

The blocked time appears on the calendar as a red or gray block. Members won't see these slots in the portal booking wizard.

## Resolve appointment conflicts

When you delete a schedule or add an exclusion that overlaps with existing appointments:

1. The system shows an **Affected Appointments** dialog listing all impacted bookings.
1. For each appointment, you can:
   - **Reschedule** — move to a different time.
   - **Cancel** — cancel the appointment (with or without penalty).
1. Resolve all conflicts before the change takes effect.

## Things to keep in mind

- Schedules use a **soft-delete pattern** — deleted schedules are marked `is_active = false` rather than being removed from the database.
- The trainer's availability in the booking form comes from `view_5_1_trainer_schedule`, which combines recurring schedules minus exclusion blocks.
- Both the admin booking form and the portal booking wizard use the same availability view, so what staff sees matches what members see.
- Changes to schedules don't retroactively affect past appointments.
