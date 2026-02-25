---
sidebar_position: 8
title: Realtime subscriptions
description: "Reference for Supabase Realtime channels — which tables broadcast changes and which components listen."
---

# Realtime subscriptions

The project uses Supabase Realtime to push database changes to the browser via WebSocket connections. This enables live updates without polling — when a record changes in the database, all subscribed clients receive the update instantly.

## How it works

Supabase Realtime listens for PostgreSQL changes (INSERT, UPDATE, DELETE) on specified tables and broadcasts them to connected clients via channels. Each channel subscribes to changes on a specific table with optional filters.

```typescript
// Basic subscription pattern
const channel = supabase
  .channel('channel-name')
  .on('postgres_changes', {
    event: '*',        // INSERT, UPDATE, DELETE, or *
    schema: 'gym',
    table: 'appointment',
    filter: 'trainer_id=eq.abc-123'  // optional row filter
  }, (payload) => {
    // Handle the change
    mutate();  // Revalidate SWR cache
  })
  .subscribe();
```

## Admin app channels

### appointment-changes

Listens for any changes to the `appointment` table.

- **Source:** [use-appointments.ts](apps/admin/src/hooks/use-appointments.ts)
- **Table:** `appointment`
- **Events:** INSERT, UPDATE, DELETE
- **Filter:** By branch (if user is branch-scoped)
- **Action:** Revalidates the appointment list SWR cache

### new-appointments

Listens specifically for new appointment inserts to show notification badges.

- **Source:** [use-appointment-notifications.ts](apps/admin/src/hooks/use-appointment-notifications.ts)
- **Table:** `appointment`
- **Events:** INSERT
- **Action:** Increments the unread appointment counter in the sidebar

### customer-changes

Listens for member record changes.

- **Source:** [use-members.ts](apps/admin/src/hooks/use-members.ts)
- **Table:** `member`
- **Events:** INSERT, UPDATE, DELETE
- **Action:** Revalidates the member list SWR cache

### leads-changes

Listens for lead record changes.

- **Source:** [use-leads.ts](apps/admin/src/hooks/use-leads.ts)
- **Table:** `leads`
- **Events:** INSERT, UPDATE, DELETE
- **Action:** Revalidates the leads list SWR cache

### conversations_changes

Listens for WhatsApp conversation and message changes.

- **Source:** [use-whatsapp-real.ts](apps/admin/src/hooks/use-whatsapp-real.ts)
- **Table:** `whatsapp_conversations`, `whatsapp_messages`
- **Events:** INSERT, UPDATE
- **Action:** Updates conversation list and message thread in real time

### trainer-schedule-changes

Listens for schedule and exclusion changes.

- **Source:** [use-trainer-schedules.ts](apps/admin/src/hooks/use-trainer-schedules.ts)
- **Table:** `trainer_schedule`, `trainer_exclusion`
- **Events:** INSERT, UPDATE, DELETE
- **Action:** Revalidates the schedule calendar

### trainer-schedule-realtime-\{trainerId\}

Per-trainer schedule page subscription.

- **Source:** [trainer-schedule/page.tsx](apps/admin/src/app/(staff)/staff/trainer-schedule/page.tsx)
- **Table:** `trainer_schedule`
- **Events:** INSERT, UPDATE, DELETE
- **Filter:** `trainer_id=eq.\{trainerId\}`
- **Action:** Live-updates the calendar when another user edits the same trainer's schedule

### member-notes-\{memberId\}

Real-time notes on member detail view.

- **Source:** [member-detail-modal.tsx](apps/admin/src/components/members/member-detail-modal.tsx), [member-detail-view.tsx](apps/admin/src/components/members/member-detail-view.tsx)
- **Table:** `member_notes`
- **Events:** INSERT, UPDATE, DELETE
- **Filter:** `member_id=eq.\{memberId\}`
- **Action:** Live-updates notes without page refresh

### admin-trainer-availability-\{trainerId\}

Availability updates during booking.

- **Source:** [new-appointment-form.tsx](apps/admin/src/components/forms/new-appointment-form.tsx)
- **Table:** `appointment`
- **Events:** INSERT, UPDATE, DELETE
- **Filter:** `trainer_id=eq.\{trainerId\}`
- **Action:** Updates available time slots in real time as other users book the same trainer

### affected-appointments-trainer-\{trainerId\}

Updates the affected appointments dialog while editing schedules.

- **Source:** [affected-appointments-dialog.tsx](apps/admin/src/components/trainer-schedule/affected-appointments-dialog.tsx)
- **Table:** `appointment`
- **Events:** UPDATE
- **Filter:** `trainer_id=eq.\{trainerId\}`
- **Action:** Refreshes the list of affected appointments

### reschedule-trainer-availability-\{trainerId\}

Availability updates during rescheduling.

- **Source:** [reschedule-modal.tsx](apps/admin/src/components/appointments/reschedule-modal.tsx)
- **Table:** `appointment`
- **Events:** INSERT, UPDATE, DELETE
- **Filter:** `trainer_id=eq.\{trainerId\}`
- **Action:** Updates slot availability while rescheduling

---

## Portal app channels

### member-schedule-\{memberId\}

Listens for appointment changes relevant to the logged-in member.

- **Source:** [use-member-schedule.ts](apps/portal/src/hooks/use-member-schedule.ts)
- **Table:** `appointment`
- **Events:** INSERT, UPDATE, DELETE
- **Filter:** `member_id=eq.\{memberId\}`
- **Action:** Updates the schedule page and upcoming session list

### trainer-availability-\{trainerId\}

Listens for schedule changes during the booking wizard.

- **Source:** [use-trainer-availability.ts](apps/portal/src/hooks/use-trainer-availability.ts)
- **Table:** `trainer_schedule`
- **Events:** INSERT, UPDATE, DELETE
- **Filter:** `trainer_id=eq.\{trainerId\}`
- **Action:** Updates available dates in the booking calendar

### appointments-\{trainerId\}-\{date\}

Listens for appointment changes for a specific trainer and date during booking.

- **Source:** [use-trainer-availability.ts](apps/portal/src/hooks/use-trainer-availability.ts)
- **Table:** `appointment`
- **Events:** INSERT, UPDATE, DELETE
- **Filter:** `trainer_id=eq.\{trainerId\}`
- **Action:** Updates available time slots — if someone books a slot while you're browsing, it becomes unavailable instantly

### all-slots-\{trainerId\}-\{date\}

Comprehensive slot availability channel for the booking wizard.

- **Source:** [use-trainer-availability.ts](apps/portal/src/hooks/use-trainer-availability.ts)
- **Table:** `appointment`
- **Events:** INSERT, UPDATE, DELETE
- **Action:** Refreshes all slots for the selected date

### merchandise-realtime

Listens for merchandise catalog changes.

- **Source:** [use-merchandise.ts](apps/portal/src/hooks/use-merchandise.ts)
- **Table:** `merchandise`
- **Events:** INSERT, UPDATE, DELETE
- **Action:** Updates the rewards catalog in real time (e.g., when stock changes or items are added/removed)

---

## Channel lifecycle

All realtime subscriptions follow the same cleanup pattern:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('channel-name')
    .on('postgres_changes', { ... }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [dependencies]);
```

The channel is created when the component mounts and removed when it unmounts, preventing memory leaks and stale subscriptions.

:::warning
Each Supabase project has a concurrent connection limit for Realtime. With 17 channels across both apps, a single admin user with all modules open could use multiple connections. The portal is more efficient since members only see their own data.
:::
