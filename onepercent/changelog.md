---
sidebar_position: 6
title: Changelog
description: "Release notes and development history for the Onepercent platform."
toc_min_heading_level: 2
toc_max_heading_level: 2
---

# Changelog

Notable changes to Onepercent, organized by development phase. Format follows [Keep a Changelog](https://keepachangelog.com/).

## UAT3 — 2026

### Fixed

- Fix duplicate sheet name error in Excel exports requiring unique names.
- Fix redundant `gym.` schema prefix in queries.
- Fix "Unknown" display in member views.
- Fix staff profile image editing issue.
- Fix member points display to include all zero-point transactions.

## Phase 3 — 2025

### Added

- **Member portal** — full self-service app for members on port 3002.
- **Portal booking wizard** — 3-step flow for members to book sessions (package → duration → date/time).
- **Portal attendance** — self-service check-in with 15-minute window detection.
- **Portal packages** — active package display with session progress and expiry tracking.
- **Portal profile** — profile editing, avatar upload, payment history with invoice downloads.
- **Points and rewards** — loyalty point system with earning rules, merchandise catalog, QR-based redemption, and real-time status updates.
- **Commission module** — trainer commission calculation with tiered rates, session types, sales commission, and Excel export.
- **Staff profile module** — trainer directory, profile modal, self-service editing, and avatar upload.
- **System settings** — user management with two-tier permission configuration (role defaults + staff overrides).
- **WhatsApp integration** — WAHA-based messaging with real-time WebSocket, conversation tags, staff assignment, and member enrichment.
- **Analytics dashboard** — revenue trends, lead conversion, marketing ROI by channel, and branch-level metrics.
- **Real-time point transactions** in member portal via Supabase channels.
- Trainer filter in commission reports.
- Storage-based signatures (migrated from base64).
- 30-day availability window for portal booking.

### Changed

- Migrate to Turborepo monorepo architecture (admin + portal + shared packages).
- Assigned trainer now references from `member_package` instead of `member` table.

## Phase 2 — 2024–2025

### Added

- **Appointment module** — calendar and list views, 7 appointment statuses, booking form with availability algorithm.
- **Trainer schedule module** — recurring weekly schedules, exclusion blocks, affected appointments dialog.
- **Cancellation system** — penalty and non-penalty cancellation with compensation sessions.
- **Bulk cancellation** — cancel all appointments for a date range with optional compensation.
- **Trainer replacement** — swap trainers on existing appointments.

## Phase 1 — 2024

### Added

- **Admin dashboard** — key metrics, action items, today's schedule, quick actions. Separate views for admins and trainers.
- **Member management** — registration with digital T&C signatures, profile editing, package assignment, payment tracking.
- **Lead management** — prospect pipeline from first contact through conversion, with status tracking, follow-up remarks, and Excel import/export.
- **Package operations** — package catalog, member package purchases, session tracking.
- **Payment operations** — payment recording, plan tracking, PDF invoice generation via `@repo/invoice-pdf`, email delivery via Resend.
- **Staff authentication** — email/password login with Supabase Auth, middleware protection, and session management.
- **Role-based access control** — 13 modules with view/edit/export permissions, role defaults, and per-staff overrides.
