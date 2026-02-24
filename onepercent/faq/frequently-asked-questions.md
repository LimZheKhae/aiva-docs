---
sidebar_position: 2
title: Frequently asked questions
description: Answers to common questions about the Onepercent platform
---

# Frequently asked questions

## General

### Can I run both apps on a single domain?

Yes, but it's not recommended. The admin and portal apps use separate auth cookies (`admin-auth` and `portal-auth`), so they won't conflict. However, using separate subdomains keeps the apps cleanly isolated and simplifies CORS and cookie configuration.

### Which Node.js version is required?

Node.js 20 or later. The project uses features from recent Node releases and Next.js 16 requires Node 20+.

### Can I add a third app to the monorepo?

Yes. Turborepo supports any number of apps. Create a new folder under `apps/`, add a `package.json` with the standard scripts, and Turborepo will pick it up automatically.

## Admin app

### How do I add a new staff role?

1. Add the role to your `gym.staff_categories` table (or equivalent enum).
2. Insert default permissions for the new role into `gym.role_permissions`.
3. The admin UI will pick up the new role on the next page load.

### Can a staff member have permissions from multiple roles?

No. Each staff member has one role. However, you can use `staff_permissions` overrides to grant or revoke individual module access beyond what the role provides.

### How do I give a staff member access to a module their role doesn't allow?

Insert a row into `gym.staff_permissions` for that staff member and module with the desired `can_view`, `can_edit`, or `can_export` values. Staff overrides always take priority over role defaults.

## Portal app

### How do members reset their password?

Members click "Forgot password" on the portal login page. This sends a Supabase password reset email with a link back to the portal's `/auth/reset-password` page, where they set a new password.

### Can members see other members' data?

No. The portal app scopes all queries to the currently authenticated member. Supabase Row Level Security (RLS) provides an additional layer of protection at the database level.

## Deployment

### Do I need separate Supabase projects for staging and production?

It's strongly recommended. Use one project for development/staging and another for production. This prevents accidental data modifications and lets you test migrations safely.

### How do I handle preview deployments?

Add `https://*.vercel.app/**` to your Supabase Auth redirect URLs. Each Vercel preview deployment gets a unique URL that Supabase needs to accept for auth callbacks.
