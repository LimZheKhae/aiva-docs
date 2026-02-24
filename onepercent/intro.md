---
sidebar_position: 1
title: Introduction
description: "What Onepercent is, the problems it solves, and how it helps 1% Fitness run day-to-day operations."
---

# Onepercent

**Onepercent** is a gym management system built for **1% Fitness**, a premium personal training gym operating across multiple branches in Malaysia and Singapore. It gives staff a single place to manage members, bookings, payments, and communications — and gives members a self-service portal to book sessions, check in, and track their fitness journey.

## The problem

Running a personal training gym involves a lot of moving parts. Before Onepercent, these were managed through a mix of spreadsheets, WhatsApp group chats, and manual record-keeping. This created several recurring problems:

- **Scattered member data.** Member profiles, package details, and payment records lived in different spreadsheets. Finding a member's current status meant checking multiple sources.
- **Scheduling headaches.** Coordinating trainer availability with member bookings was done manually. Double-bookings, missed sessions, and scheduling conflicts were common.
- **Payment tracking gaps.** Outstanding balances, partial payments, and invoice generation were tracked by hand — leading to missed payments and accounting errors.
- **No visibility into sales performance.** Leads from different marketing channels (Instagram, TikTok, Facebook, walk-ins, referrals) weren't tracked in one place. There was no clear picture of conversion rates or cost-per-lead.
- **Trainer commission disputes.** Calculating how much each trainer earned — based on sessions conducted and packages sold — required manual counting that was slow and error-prone.
- **Disconnected member experience.** Members had no way to self-book sessions, view their remaining package sessions, or check their attendance history. Everything required a message to staff.

## The solution

Onepercent replaces these manual workflows with two connected applications:

### Admin — the staff dashboard

The **Admin** app is the day-to-day tool for gym staff, managers, and trainers. It covers:

- **Member management** — Register new members with digital T&C signatures, manage profiles, assign packages, and track payment history.
- **Lead pipeline** — Track prospects from first contact through conversion to paying member, with follow-up status and staff remarks.
- **Appointment scheduling** — Book personal training sessions with real-time trainer availability checks, manage check-ins, and handle cancellations.
- **Package and payment operations** — Define package catalogs, record payments, generate PDF invoices, and track outstanding balances.
- **Trainer schedules and commission** — Set recurring availability, block out time off, and auto-calculate commission based on sessions conducted and packages sold.
- **Points and rewards** — Run a loyalty programme where members earn points and redeem them for merchandise.
- **WhatsApp messaging** — Send and receive WhatsApp messages directly from the CRM, with member profiles visible alongside conversations.
- **Analytics** — View revenue trends, lead conversion rates, marketing ROI by channel, and branch-level performance.

### Portal — the member app

The **Portal** app is a mobile-friendly self-service tool for gym members:

- **Book sessions** — Browse available time slots and book personal training sessions in a few taps.
- **Check in** — Record gym attendance via QR code or button-based check-in.
- **View packages** — See active package details (sessions remaining, expiry date) and past package history.
- **Track points** — View loyalty points balance, transaction history, and browse rewards to redeem.
- **Manage profile** — Update personal information and view payment history.

## Who this documentation is for

This documentation is organized into sections for different audiences:

| Section | Audience | What you'll find |
| --- | --- | --- |
| [**Technical docs**](./technical/architecture) | Developers | Architecture, authentication flows, RBAC system, and API references. |
| [**User manual**](./user-manual/getting-started) | Staff and members | Step-by-step guides for using the Admin and Portal apps. |
| [**Deployment**](./deployment/environment-setup) | DevOps and developers | Environment setup, hosting configuration, and CI/CD. |
| [**FAQ**](./faq/common-issues) | Everyone | Common issues, troubleshooting, and frequently asked questions. |
| [**Changelog**](./changelog) | Everyone | Release notes and version history. |
