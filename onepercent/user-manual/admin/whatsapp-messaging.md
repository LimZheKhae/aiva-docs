---
sidebar_position: 10
title: Send WhatsApp messages
description: "How to use the WhatsApp chat module — connect a session, send messages, manage conversations, tag contacts, and view member context."
---

# Send WhatsApp messages

Chat with members and leads directly from the admin app via WhatsApp. The chat module shows member profiles alongside conversations, so you have context without switching apps.

## Before you begin

- You need `can_view` permission on the **Chats** module to see conversations.
- You need `can_edit` permission to send messages, manage tags, and edit notes.
- The WAHA server must be running (ask your system administrator).

## Connect WhatsApp

Before you can send or receive messages, you need an active WhatsApp session.

1. Click **Chats** in the sidebar.
1. If you see a yellow "WhatsApp not connected" banner, click the **Session Manager** button.
1. Click **Start Session**.
1. A QR code appears — scan it with WhatsApp on your phone (open WhatsApp > Settings > Linked Devices > Link a Device).
1. Wait for the status to turn green (**Working**).
1. Close the dialog.

<!-- ![Session manager with QR code](./assets/whatsapp-session-manager.png) -->

The QR code refreshes every 5 seconds. If you miss it, a new one appears automatically.

:::warning
**Logging out** disconnects the WhatsApp session entirely. You'll need to scan a new QR code to reconnect. The logout dialog requires you to type "I acknowledged" as a safety check.
:::

## Send a message

1. Select a conversation from the list on the left (or search for a contact).
1. Type your message in the input box at the bottom of the chat.
1. Press **Enter** to send (or **Shift+Enter** for a new line).

Your message appears instantly in the chat (optimistic update) and is confirmed once WAHA delivers it.

### Send media

1. Click the **attachment icon** next to the input box.
1. Select a file (images, documents, videos — max 16 MB).
1. A preview appears. Optionally add a caption.
1. Click **Send**.

<!-- ![Chat thread with message input](./assets/whatsapp-chat-thread.png) -->

### Message status indicators

| Icon | Meaning |
| --- | --- |
| Clock | Sending. |
| Single check | Sent. |
| Double check | Delivered. |
| Blue double check | Read. |
| Warning | Failed to send. |

## Manage conversations

### Search and filter

The conversation list supports several filters:

| Filter | Options |
| --- | --- |
| **Type** | All / Personal / Groups. |
| **Search** | Phone number or name. |
| **Tag** | Filter by conversation tag. |
| **Assignment** | Filter by assigned staff or "Unassigned." |
| **Branch** | Kota Damansara / Kepong / All. |
| **Status** | Contact type (Member, Lead, Unknown) or specific lead/member status. |

### Assign a conversation

The member info panel on the right shows who the contact is. Staff can be assigned to conversations for follow-up accountability.

### Tag a conversation

1. Select a conversation.
1. In the member info panel on the right, click the **Tags** section.
1. Click a tag to add it (color-coded badges).
1. Click again to remove.

Tags help you organize conversations by topic (e.g., "Follow up," "Interested," "VIP").

### Add notes

1. In the member info panel, click the **Notes** section.
1. Type your note and click outside to save.

Notes persist across sessions and are visible to all staff.

## Member info panel

When you select a conversation, the right panel shows context about the contact:

<!-- ![Member info panel](./assets/whatsapp-member-info.png) -->

- **Profile** — avatar, name, phone, and status badge (Active, Expired, No Package, Lead, or Not a Member).
- **Member details** (if matched) — email, DOB, gender, branch, registration date, and assigned trainer.
- **Active packages** — package name, remaining sessions, expiry date, and trainer.
- **Tags** — conversation tags.
- **Notes** — editable notes about the conversation.

The system automatically matches contacts by phone number. It tries multiple formats (with/without country code, leading zero) to find the right member or lead.

## Manage tags (settings)

1. Click the **Settings** gear icon on the chat page.
1. You can create, edit, or delete tags.
1. Each tag has a name, description, and color.

:::warning
Deleting a tag removes it from **all conversations** that use it. A confirmation dialog warns you before proceeding.
:::

## Things to keep in mind

- Messages appear in real time via a direct WebSocket connection to WAHA.
- The system handles WhatsApp's Link ID (LID) format automatically — you don't need to worry about different phone number formats.
- Group chats are supported — each message shows the sender's name and profile picture.
- The chat module supports 20+ message types including images, videos, audio, documents, stickers, locations, contacts, and polls.
- Incoming messages from unknown numbers show a "Not a Member" badge. You can still chat with them and view basic contact info.
