---
sidebar_position: 1
title: Introduction
description: Overview of the Onepercent gym management system
---

# Onepercent

Onepercent is a gym management system built as a Turborepo monorepo with two Next.js 16 apps:

- **Admin**: staff-facing dashboard for managing members, packages, payments, and operations
- **Portal**: member-facing app for viewing memberships, booking sessions, and managing profiles

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Monorepo | Turborepo |
| Auth | Supabase Auth (JWT, PKCE) |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS, shadcn/ui |
| Language | TypeScript |

## Documentation sections

This documentation is organized into three areas:

- [**Technical docs**](./technical/architecture): architecture, auth flows, API references, and developer guides
- [**User manual**](./user-manual/getting-started): step-by-step guides for staff and members
- [**Changelog**](./changelog/v0-1-0): release notes and version history
