---
sidebar_position: 2
title: Frequently asked questions
description: "Answers to common questions about the Onepercent platform — general, admin, portal, and deployment."
---

# Frequently asked questions

## General

### Can I run both apps on a single domain?

Yes, but it's not recommended. The admin and portal apps use separate auth cookies (`admin-auth` and `portal-auth`), so they won't conflict. However, using separate subdomains keeps the apps isolated and simplifies CORS and cookie configuration.

### Which Node.js version is required?

Node.js 20 or later. Next.js 16 requires Node 20+. The project also pins npm to version 10.0.0 via the `packageManager` field in the root `package.json`.

### Can I add a third app to the monorepo?

Yes. Turborepo supports any number of apps. Create a new folder under `apps/`, add a `package.json` with the standard scripts (`dev`, `build`, `start`, `lint`, `type-check`), and Turborepo picks it up automatically.

### Where do database types come from?

The `npm run types:generate` command uses the Supabase CLI to introspect the `gym` schema and generate TypeScript types into `packages/database/src/database.types.ts`. Helper types and enum arrays are manually maintained in `packages/database/src/database.helpers.ts`. Run type generation after any schema change.

## Admin app

### How do I add a new staff role?

1. Add the role value to the `staff_category` enum in the database.
1. Insert default permissions for the new role into `gym.role_permissions` for each of the 13 modules.
1. The admin UI picks up the new role on the next page load.

### Can a staff member have permissions from multiple roles?

No. Each staff member has one role (stored in `staff.category`). However, you can use `staff_permissions` overrides to grant or revoke individual module access beyond what the role provides.

### How do I give a staff member access to a module their role doesn't allow?

Go to **System Settings > User Management**, select the staff member, and toggle the permission checkboxes for the desired module. The override is saved to `gym.staff_permissions` and takes precedence over the role default. A "CUSTOM" badge appears on overridden modules.

### How does commission calculation work?

Commission is calculated entirely by database functions (`calculate_all_commission` and `calculate_trainer_commission`). The admin UI displays results — it doesn't calculate anything client-side. Rates are tiered by session count and sales threshold, and vary by trainer category and session type.

## Portal app

### How do members reset their password?

Members tap "Forgot password" on the portal login page. This verifies their email exists via `/api/auth/check-email`, then sends a Supabase password reset email. The link redirects to `/auth/callback`, which exchanges the code for a session, then forwards to `/reset-password` where they set a new password.

### Can members see other members' data?

No. All portal queries are scoped to the currently authenticated member's ID. Supabase Row Level Security (RLS) provides an additional layer of protection at the database level.

### How does the booking flow work?

The portal booking is a 3-step wizard: select a package (which determines the trainer), choose a duration (based on remaining sessions), then pick a date and time from the trainer's availability. Portal bookings arrive with `status: 'pending pt'` and require trainer confirmation from the admin app.

### Can members cancel their own appointments?

No. The portal doesn't expose cancellation controls. Members need to contact their trainer or gym staff to cancel. The cancellation policy notice on the schedule page reminds them of this.

## Deployment

### Do I need separate Supabase projects for staging and production?

It's strongly recommended. Use one project for development/staging (connected to Vercel) and another for production (connected to the Hostinger VPS). This prevents accidental data modifications and lets you test migrations safely.

### How do I handle Vercel preview deployments?

Add `https://*.vercel.app/**` to your Supabase Auth redirect URLs. Each Vercel preview deployment gets a unique URL that Supabase needs to accept for auth callbacks.

### How do I update the production VPS?

Pull the latest code, install dependencies, build, and restart the PM2 processes:

```bash
cd /var/www/onepercent
git pull origin master
npm install
npm run build
pm2 restart all
```
