---
sidebar_position: 1
title: Common issues
description: Solutions to frequently encountered problems
---

# Common issues

## Authentication

### "No active staff profile" after login

**Cause**: The user's email exists in Supabase Auth but has no matching row in `gym.staff`, or the staff record's `status` is not `active`.

**Fix**:
1. Check that a row exists in `gym.staff` with the exact email (case-insensitive).
2. Verify `status` is set to `active`.
3. If the staff member was recently added, ask them to log out and back in.

### Session expires unexpectedly

**Cause**: The browser JWT and server cookie get out of sync, or the Supabase JWT has expired.

**Fix**:
- Confirm that `/api/auth/set-session` is called after every `signInWithPassword()`.
- Check that the `admin-auth` or `portal-auth` cookie is being set correctly (inspect via browser DevTools > Application > Cookies).
- Verify the Supabase JWT expiry setting in **Auth > Settings** (default is 3600 seconds).

### RBAC permissions not updating

**Cause**: The `useCurrentStaff` hook uses SWR with a polling interval. Changes to `role_permissions` or `staff_permissions` take effect on the next poll cycle.

**Fix**:
- Wait up to 60 seconds for the SWR cache to refresh, or ask the user to refresh the page.
- For immediate effect, call `mutate('/api/auth/me')` from the client.

## Database

### "Permission denied for schema gym"

**Cause**: The Supabase client is connecting to the `public` schema instead of `gym`, or the database role lacks `USAGE` on the `gym` schema.

**Fix**:
1. Verify that your Supabase client is configured with `db: { schema: 'gym' }`.
2. Run in the SQL editor:

```sql
GRANT USAGE ON SCHEMA gym TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA gym TO anon, authenticated;
```

### Migrations not applying

**Cause**: Supabase CLI migration state is out of sync.

**Fix**:
1. Check migration status: `supabase migration list`
2. If a migration is stuck, repair it: `supabase migration repair <version> --status applied`
3. Re-run: `supabase db push`

## Development

### Turbo dev only starts one app

**Cause**: Running `turbo dev` without the correct filter or missing a `dev` script in one of the apps.

**Fix**:
- Run both apps: `npx turbo dev`
- Run one app: `npx turbo dev --filter=admin`
- Make sure each app's `package.json` has a `"dev"` script.

### Hot reload not working

**Cause**: File watching may fail on large monorepos or specific OS configurations.

**Fix**:
- On Linux, increase the file watcher limit: `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf`
- On Windows, try restarting the dev server — sometimes Turbo's watcher needs a fresh start.
- Make sure you're editing files inside the correct `apps/` directory, not a cached or built copy.
