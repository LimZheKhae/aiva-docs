---
sidebar_position: 1
title: Common issues
description: "Solutions to frequently encountered problems with authentication, database, WhatsApp, and development."
---

# Common issues

## Authentication

### "No active staff profile" after login

**Cause:** The email exists in Supabase Auth but has no matching row in `gym.staff`, or the staff record's `status` isn't `active`.

**Fix:**

1. Check that a row exists in `gym.staff` with the exact email (matching is case-insensitive via `ilike`).
1. Verify `status` is set to `active`.
1. If the staff member was recently added, ask them to log out and back in.

### Session expires unexpectedly

**Cause:** The Supabase JWT has expired, or the auth cookie was cleared.

**Fix:**

- Check the Supabase JWT expiry setting in **Auth > Settings** (default is 3,600 seconds).
- Verify the `admin-auth` (admin app) or `portal-auth` (portal app) cookie exists in browser DevTools under **Application > Cookies**.
- The `useCurrentStaff()` hook polls every 60 seconds and auto-signs out on a `403` response. If the staff record becomes inactive mid-session, the user is signed out automatically.

### RBAC permissions not updating

**Cause:** The `useCurrentStaff()` hook uses SWR with a 60-second polling interval. Changes to `role_permissions` or `staff_permissions` take effect on the next poll cycle.

**Fix:**

- Wait up to 60 seconds for the SWR cache to refresh, or ask the user to refresh the page.
- SWR also revalidates on tab focus (`revalidateOnFocus: true`), so switching away and back triggers a refresh.

### Portal member can't log in

**Cause:** The email exists in Supabase Auth but has no matching row in `gym.member`, or the member record is inactive.

**Fix:**

1. Check that the member's email in `gym.member` matches the Supabase Auth email (case-insensitive).
1. Verify the member record exists and isn't marked inactive.
1. If the member was invited via admin, ensure they completed the password setup flow via the email link.

## Database

### "Permission denied for schema gym"

**Cause:** The Supabase client is connecting to the `public` schema instead of `gym`, or the database role lacks `USAGE` on the `gym` schema.

**Fix:**

1. Verify that your Supabase client is configured with `db: \{ schema: 'gym' \}`.
1. Run in the SQL editor:

```sql
GRANT USAGE ON SCHEMA gym TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA gym TO anon, authenticated;
```

### Type generation fails

**Cause:** The Supabase CLI can't reach the project, or the project ID is wrong.

**Fix:**

- Run `npm run types:generate` from the project root.
- Check that the Supabase project ID in the root `package.json` script matches your project.
- Ensure you're logged in to the Supabase CLI: `npx supabase login`.

## WhatsApp

### "WhatsApp not connected" banner

**Cause:** The WAHA session isn't running or lost its connection.

**Fix:**

1. Open the session manager dialog on the WhatsApp page.
1. Check the session status. If `STOPPED` or `FAILED`, click **Start Session**.
1. If status is `SCAN_QR_CODE`, scan the QR code with WhatsApp on your phone. The QR refreshes every 5 seconds.
1. Wait for status to reach `WORKING` (green).

### Messages not appearing in real time

**Cause:** The WebSocket connection to WAHA dropped, or WAHA is sending duplicate events that are being filtered.

**Fix:**

- Refresh the page to re-establish the WebSocket connection.
- Check that `WAHA_API_URL` in `.env.local` points to the correct WAHA server.
- The hook deduplicates messages using a `Set` that clears every 30 seconds. If messages are delayed, they may appear after the next clear cycle.

### Media not displaying

**Cause:** The media proxy endpoint can't reach WAHA, or the file exceeds the 16 MB limit.

**Fix:**

- Verify `WAHA_API_URL` is accessible from the Next.js server.
- Check that the media file is under 16 MB.
- For base64 media in optimistic messages, the preview displays immediately. If it disappears after send, the WAHA upload may have failed.

## Development

### Turbo dev only starts one app

**Cause:** Running a filtered command instead of the full dev script.

**Fix:**

- Run both apps: `npm run dev`
- Run one app: `npm run dev:admin` or `npm run dev:portal`
- Make sure each app's `package.json` has a `"dev"` script.

### Hot reload not working

**Cause:** File watching may fail on large monorepos or specific OS configurations.

**Fix:**

- On Linux, increase the file watcher limit: `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf`
- On Windows, try restarting the dev server — Turbopack's watcher sometimes needs a fresh start.
- Make sure you're editing files inside the correct `apps/` directory, not a cached or built copy.

### Build fails with type errors

**Cause:** The admin app's `next.config.ts` sets `ignoreBuildErrors: false`. TypeScript errors fail the build.

**Fix:**

- Run `npm run type-check` locally before pushing.
- Common culprits: `any` types (use `unknown` instead), untyped error catches, missing generic parameters on Supabase queries.
