---
sidebar_position: 12
title: WhatsApp Chats
description: "How the WhatsApp chats module works — WAHA integration, real-time messaging, conversation management, session lifecycle, media handling, tags, member enrichment, and webhook processing."
---

# WhatsApp chats

The WhatsApp chats module connects the admin app to WhatsApp via **WAHA** (WhatsApp HTTP API), an open-source gateway that exposes WhatsApp Web as a REST API with WebSocket events. Staff send and receive WhatsApp messages directly from the CRM, with automatic member enrichment, conversation tagging, staff assignment, and a full media messaging experience. The module is the only external integration in the system — all other modules operate solely against Supabase.

**Route:** `apps/admin/src/app/(staff)/whatsapp/page.tsx` (~456 lines) <br />
**Permission module:** `chats` (`can_view` for page access, `can_edit` for sending messages, managing tags, and fulfilment)

## Architecture overview

The module draws from two data sources simultaneously:

| Source | Provides |
| --- | --- |
| **WAHA** | Real-time messages, chat list, media files, session status, WebSocket events. |
| **Supabase** | Member enrichment, conversation metadata (tags, notes, assignment), message records, settings. |

```
┌─────────────┐     WebSocket      ┌──────────┐     REST      ┌──────────────┐
│  Browser UI │ ◄─────────────────► │  WAHA    │ ◄────────────► │  WhatsApp    │
│  (React)    │     /api/waha/*     │  Server  │                │  Web         │
└──────┬──────┘                     └──────────┘                └──────────────┘
       │
       │  SWR / direct queries
       ▼
┌──────────────┐
│  Supabase    │
│  (PostgreSQL)│
└──────────────┘
```

Messages flow through WAHA in both directions. The browser connects to WAHA's WebSocket for real-time incoming messages and uses Next.js API routes as a proxy for outbound actions (sending, session management). Supabase stores conversation metadata, message records, and member data for enrichment.

## Data fetching

**Hook:** `src/hooks/use-whatsapp-real.ts` (~1,156 lines)

Three exported hooks from this file:

| Hook | Purpose |
| --- | --- |
| `useWhatsAppMessages(phoneNumber?)` | Primary hook. Without `phoneNumber`, fetches the conversation list. With `phoneNumber`, fetches messages for that chat. Manages filters, search, pagination, optimistic sends, and WebSocket events. |
| `useWhatsAppStatus()` | Polls session status every 10 seconds. Returns `status` (connected/disconnected/loading), `sessionInfo`, and `error`. |
| `useWhatsAppConversations()` | Real-time subscription via Supabase. Auto-fetches on mount and on database changes. |

There are **no SWR cache keys** — the hook manages state internally with `useState` and `useRef`. Debouncing (1,000 ms between conversation fetches, 300 ms for search) prevents duplicate requests.

**Real-time strategy:** The browser connects directly to WAHA's WebSocket (not through Next.js) for the lowest latency on incoming messages. Conversations refresh via polling with debounce.

## Page layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠ WhatsApp not connected (banner, shown when disconnected)      │
├────────────────┬──────────────────────────┬──────────────────────┤
│  Conversation  │  Chat Thread             │  Member Info Panel   │
│  List          │                          │  (collapsible)       │
│                │  ┌────────────────────┐  │                      │
│  [Search]      │  │  Message history   │  │  Avatar + Name       │
│  [Filters]     │  │  (scroll to load   │  │  Status badge        │
│                │  │   older messages)  │  │  Member details      │
│  Conversation  │  │                    │  │  Active packages     │
│  cards with    │  │                    │  │                      │
│  unread badges │  └────────────────────┘  │  Tags                │
│                │  ┌────────────────────┐  │  Notes               │
│                │  │  Message input     │  │                      │
│                │  │  + emoji + attach  │  │                      │
│                │  └────────────────────┘  │                      │
├────────────────┴──────────────────────────┴──────────────────────┤
│  [Session Manager]  [Settings]                                    │
└──────────────────────────────────────────────────────────────────┘
```

Three-column responsive grid. On mobile, the member info panel collapses, and the conversation list narrows.

## Session lifecycle

**Component:** `src/components/whatsapp/whatsapp-session-manager.tsx` (~490 lines)

Before sending or receiving messages, a WhatsApp session must be connected. The session manager handles the full lifecycle:

### Session statuses

| Status | Color | Meaning |
| --- | --- | --- |
| `STOPPED` | Gray | Session inactive. |
| `STARTING` | Cyan (spinner) | Session booting up. |
| `SCAN_QR_CODE` | Yellow | Waiting for QR code scan on a phone. |
| `WORKING` | Green | Connected and operational. |
| `FAILED` | Red | Connection failed. |

### QR code flow

1. Staff clicks **Start Session**.
2. Status changes to `STARTING`, then `SCAN_QR_CODE`.
3. A QR code displays in the dialog, refreshing every 5 seconds via polling.
4. Staff scans the QR code with WhatsApp on their phone.
5. Status transitions to `WORKING`. The dialog notifies the parent via `onStatusChange()`.

The session manager auto-checks status every 5 seconds. It only notifies the parent when transitioning **to** `WORKING` — intermediate states don't trigger refreshes, preventing UI flickering.

### Logout

Logout requires typing "I acknowledged" in a confirmation dialog. This is intentional — logging out disconnects the WhatsApp Web session entirely and requires a fresh QR scan to reconnect.

## Conversation list

**Component:** `src/components/whatsapp/conversation-list.tsx` (~572 lines)

### Filters

| Filter | Options |
| --- | --- |
| **Type** | All / Personal (individual) / Groups. Toggle buttons. |
| **Search** | Server-side with debounce. Matches phone number and name. |
| **Tag** | Dropdown with color-coded tags from `whatsapp_settings`. |
| **Assignment** | Staff dropdown with "Unassigned" option. Lists active staff from `view_5_3_staff`. |
| **Branch** | Kota Damansara / Kepong / None / All Branch. |
| **Status** | Grouped dropdown: Contact type (Member, Lead, Unknown), Lead status (New, Engaged, Consulted, Escalated, No Reply, Rejected, Converted), Member status (Active, Inactive, No Package). |

Type, tag, and assignment filters are applied server-side via query parameters. The contacts API route handles the filtering and returns paginated results.

### Conversation card

Each card shows:

- Avatar with fallback initials.
- Member name and phone number.
- Last message preview with direction indicator (arrow for outgoing).
- Unread count badge (red).
- Tags as color-coded badges.
- Assignment badge showing the assigned staff name.
- Relative time: "Just now", "1m", "2h", "3d", or a date.

Pagination uses a "Load more" button. A footer displays total conversations and unread count.

## Chat thread

**Component:** `src/components/whatsapp/chat-thread.tsx` (~1,173 lines)

The largest component in the module. Displays the message history for a selected conversation and handles message composition.

### Supported message types

The chat thread renders over 20 message types from WhatsApp:

| Category | Types |
| --- | --- |
| **Text** | Plain text, links. |
| **Media** | Image, video, audio, voice (PTT), sticker, GIF. |
| **Documents** | Files with download links. |
| **Interactive** | Polls, buttons, lists. |
| **Contact** | vCard / contact cards. |
| **Location** | Map coordinates. |
| **Reactions** | Emoji reactions on messages. |
| **System** | Revoked/deleted messages, call logs, E2E encryption notifications. |

### Message display

- **Date separators** group messages by day.
- **Status indicators:** sent (single check), delivered (double check), read (blue double check), failed (warning), pending (clock).
- **AI processing badge** shows when a message was processed by AI.
- **Source badge** shows a "1%" icon for WAHA-sourced messages.
- **Group chats** display sender name, profile picture, and phone number per message.

### Media handling

Media display follows this logic:

1. **Optimistic messages** — display base64 data URLs immediately (from the file the staff attached).
2. **WAHA messages** — download media via `/api/waha/media` proxy endpoint.
3. **Fallback** — graceful error message if media is unavailable.

Video and audio detection uses base64 prefix matching (`AAAA` for MP4, `GkXfo` for WebM, `UklGR` for WAV, etc.) when the MIME type isn't provided.

**File size limit:** 16 MB per attachment.

### Scroll behavior

- Auto-scrolls to the bottom on new messages.
- Scrolling up triggers older message loading (100 per batch).
- Preserves scroll position when loading older messages.
- Prevents accidental load-more triggers when switching conversations.

### Message input

An inline component within the chat thread:

- Auto-expanding textarea.
- Emoji picker with search.
- File attachment with preview and base64 encoding.
- **Enter** to send, **Shift+Enter** for newline.

## Member info panel

**Component:** `src/components/whatsapp/member-info-panel.tsx` (~893 lines)

A right-side panel showing context about the person you're chatting with. Collapses on mobile.

### Sections

1. **Profile header** — avatar, name, phone, status badge.
2. **Member details** (if matched) — email, DOB, gender, branch, registration date.
3. **Active packages** (if matched) — package name, remaining sessions, expiry date, trainer name.
4. **Tags** — add/remove conversation tags with a color-coded selector.
5. **Notes** — editable textarea for conversation notes.

### Contact matching

The panel uses flexible phone number matching to find the member or lead:

- Tries the raw phone number, with `+60` prefix, with `60` prefix, and with leading `0`.
- Searches `view_2_member` first, then falls back to the `leads` table.
- Handles converted leads by checking `member_id` on the lead record.
- Creates a `whatsapp_conversations` record if one doesn't exist for the phone number.

### Status badges

| Type | Badge |
| --- | --- |
| Active member | Black "Active" badge. |
| Expired member | Red border "Expired" badge. |
| No package | Gray "No Package" badge. |
| Lead | Colored dot with lead status label. |
| Unknown | "Not a Member" badge. |

## Optimistic messaging

When staff send a message, the module uses optimistic UI updates for instant feedback:

1. The message appears in the chat thread immediately with a "pending" status indicator.
2. The API route sends the message to WAHA.
3. On success, the optimistic message is replaced with the confirmed message (including WAHA's message ID).
4. On failure, the optimistic message is removed and an error toast appears.

For media messages, the base64 data URL is preserved in the optimistic message so the image/file preview remains visible while the upload completes.

## Real-time updates

### WebSocket connection

The hook `useWAHAWebSocket()` (inside `use-whatsapp-real.ts`) connects directly to WAHA's WebSocket endpoint. Incoming events trigger:

1. **Message deduplication** — WAHA sends duplicate WebSocket events. A `Set` tracks processed message IDs to filter duplicates. The Set clears every 30 seconds to prevent memory leaks.
2. **LID resolution** — WhatsApp uses Link IDs (LIDs) instead of phone numbers in some contexts. The hook resolves LIDs to phone numbers via `wahaClient.resolveLid()`.
3. **Conversation update** — the conversation list updates optimistically (new message preview, timestamp, unread count increment).
4. **New conversation creation** — if the incoming message is from an unknown number, a new conversation entry is created.

### Phone number normalization

WhatsApp uses multiple identifier formats:

| Format | Example | Context |
| --- | --- | --- |
| `@c.us` | `60123456789@c.us` | Individual chats. |
| `@g.us` | `120363123456@g.us` | Group chats. |
| `@lid` | `abc123@lid` | Link ID (newer WhatsApp format). |
| Plain | `60123456789` | Database storage. |

The WAHA client's `resolveChatId()` method normalizes any format to a consistent `chatId` and `phoneNumber` pair. Bulk LID resolution (`getAllLidMappings()`) fetches all mappings upfront for efficiency rather than resolving one-by-one.

## Tags and settings

**Component:** `src/components/whatsapp/whatsapp-settings.tsx` (~420 lines)

### Tag management

Tags help categorize conversations. Each tag has:

| Field | Details |
| --- | --- |
| **Name** | Display label. |
| **Description** | Optional description. |
| **Color** | Design system colors: Black, Red, and three Gray shades. |

Tags are stored in the `whatsapp_settings` table with `setting_type = 'tag'`.

**Creating a tag:** Insert into `whatsapp_settings` with name, color, description, and display order.

**Deleting a tag:** Calls the `remove_tag_from_all_conversations` RPC function to cascade-remove the tag from all conversations, then deletes the tag definition. A confirmation dialog warns about the cascade.

The settings panel is only visible to staff with `can_edit` permission on the `chats` module.

## WAHA client library

**File:** `src/lib/waha-client.ts` (~464 lines)

A singleton service class that wraps all WAHA HTTP API calls.

### Session methods

| Method | Purpose |
| --- | --- |
| `getSessions()` | List all sessions. |
| `getSession(name)` | Get session info. |
| `createSession(name, config)` | Create a new session. |
| `startSession(name)` | Start a session. |
| `stopSession(name)` | Stop a session. |
| `logoutSession(name)` | Logout and disconnect (requires new QR scan). |
| `getQRCode(name)` | Get the QR code image for scanning. |

### Messaging methods

| Method | Purpose |
| --- | --- |
| `sendText(session, chatId, text)` | Send a text message. |
| `sendImage(session, chatId, imageUrl, caption, filename, mimetype)` | Send an image (base64 or URL). |
| `sendFile(session, chatId, fileUrl, filename, caption, mimetype)` | Send a document/file. |

### Chat methods

| Method | Purpose |
| --- | --- |
| `getChats(session, limit, offset)` | Simple chat list. |
| `getChatsOverview(session, limit, offset)` | Extended info with profile pictures. Falls back to `getChats` on 45-second timeout. |
| `getChatMessages(session, chatId, limit, downloadMedia)` | Fetch message history. |
| `markChatAsRead(session, chatId)` | Mark a conversation as read. |

### LID resolution methods

| Method | Purpose |
| --- | --- |
| `resolveLid(session, lid)` | Resolve a single LID to a phone number. |
| `getAllLidMappings(session)` | Fetch all LID-to-phone mappings (bulk, more efficient). |
| `resolveLidsBatch(session, lids)` | Batch-resolve multiple LIDs. |
| `resolveChatId(session, to)` | Smart resolver — handles LID, `@g.us`, `@c.us`, and plain phone formats. Returns `chatId` + `phoneNumber`. |

### Error handling

- **Timeouts:** 90-second default, 45 seconds for chat overview. Prevents WAHA hangs from blocking the UI.
- **Fallback pattern:** Non-critical errors return empty arrays instead of throwing. Critical errors (auth, validation) throw.
- **Logging:** All errors are logged to console with context.

### Configuration

```
WAHA_API_URL      — WAHA HTTP API endpoint (default: http://localhost:3000)
WAHA_API_KEY      — Optional API key for WAHA authentication
WAHA_SESSION_NAME — Session identifier (default: 'default')
```

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/waha/contacts` | GET | Fetch conversations with server-side filtering, LID resolution, member enrichment, and pagination. |
| `/api/waha/messages/send` | POST | Send a message (text, image, or file). Permission-gated. Stores message record in Supabase. |
| `/api/waha/session/info` | GET | Get current session status from WAHA. |
| `/api/waha/session/start` | POST | Start or restart the WAHA session. |
| `/api/waha/session/stop` | POST | Stop the WAHA session. |
| `/api/waha/session/logout` | POST | Logout the WAHA session (requires new QR scan). |
| `/api/waha/session/qr` | GET | Get the QR code image for session pairing. |
| `/api/waha/media` | GET | Proxy endpoint for downloading media files from WAHA. |
| `/api/webhooks/waha` | POST | Webhook receiver for WAHA events (message acknowledgments, state changes). |

### Send message flow

`POST /api/waha/messages/send` — the most complex route:

1. Authenticates the request and verifies the staff has `can_edit` on `chats`.
2. Validates required fields based on message type (`text`, `image`, or `file`).
3. Resolves the chat ID via `wahaClient.resolveChatId()` — handles any format.
4. Sends via the appropriate WAHA method (`sendText`, `sendImage`, `sendFile`).
5. Stores a record in the `whatsapp_messages` table (metadata only, not the media binary).
6. Returns the WAHA message ID and the stored record.

### Contacts route

`GET /api/waha/contacts` — handles the conversation list with extensive processing:

1. Checks the staff's branch for scoping.
2. Fetches chats from WAHA (up to 500 for search, otherwise the requested limit).
3. Bulk-resolves all LIDs to phone numbers.
4. Normalizes chat IDs and extracts phone numbers.
5. Applies server-side filters (type, tag, assignment, branch, status, search).
6. Deduplicates by cleaned phone number.
7. Enriches with Supabase data (member info, tags, assignment, notes).
8. Paginates and returns with a `hasMore` flag.

## Webhook handler

**Route:** `apps/admin/src/app/api/webhooks/waha/route.ts`

**Endpoint:** `POST /api/webhooks/waha`

### Security

Optional signature verification via `x-webhook-signature` header, compared against the `WEBHOOK_SECRET` environment variable.

### Event handling

| Event | Action |
| --- | --- |
| `message.any` | Logs the incoming message. |
| `message.ack` | Updates message delivery status. |
| `state.change` | Handles session state transitions. |
| `session.status` | Handles session status updates. |

:::note
The webhook currently logs events but doesn't store incoming messages in the database. Real-time message updates come via the direct WebSocket connection instead. The `handleIncomingMessage()` function exists but isn't called — it's a placeholder for future server-side message storage.
:::

### Member matching in webhook

When processing messages, the webhook attempts flexible phone number matching:

- Tries multiple variations (with/without country code, leading zero).
- Updates the message record with `member_id` if a match is found.
- Creates or updates a conversation record via `upsertConversation()`.

## Message enrichment

Messages from WAHA are enriched with data from Supabase before display:

| Enrichment | Source | Purpose |
| --- | --- | --- |
| **AI metadata** | `whatsapp_messages` table | Adds `ai_processed`, `ai_response`, and `appointment_created` flags. |
| **Member data** | `view_2_member` | Maps phone numbers to member names for display. |
| **Media URLs** | Multiple WAHA fields | Extracts media URLs from different WAHA response versions. |
| **Message type** | MIME type inference | Infers message type from MIME type when not provided. |

## Permissions

### Role-based behavior

| Aspect | Without `can_edit` | With `can_edit` |
| --- | --- | --- |
| **View conversations** | Yes (with `can_view`). | Yes. |
| **Send messages** | No. | Yes. |
| **Manage tags** | View only. | Create, delete. |
| **Edit notes** | No. | Yes. |
| **Settings button** | Hidden. | Visible. |
| **Session manager** | View status. | Start, stop, logout. |

### API-level checks

The send message route (`/api/waha/messages/send`) performs its own permission check independently:

1. Gets the authenticated user's email.
2. Fetches the staff record with case-insensitive email matching.
3. Verifies `status = 'active'`.
4. Checks `can_edit` for the `chats` module (merging role defaults with staff overrides).
5. Returns `401` if not authenticated, `403` if no permission.

## Database tables

| Source | Purpose |
| --- | --- |
| `whatsapp_messages` (table) | Message records. Stores WAHA message ID, from/to numbers, body, type, direction, status, media URL, AI metadata, and member ID. Write target for sent messages and webhook events. |
| `whatsapp_conversations` (table) | Conversation metadata. Stores phone number, member ID, chat ID, group flag, status, tags (array), notes, assigned staff, and timestamps. |
| `whatsapp_settings` (table) | Configuration. Stores tags (setting type, key, color, description, display order, active flag). |

### Related tables

| Source | Purpose |
| --- | --- |
| `view_2_member` (view) | Member enrichment — name, branch, membership JSONB. |
| `view_4_1_2_member_package` (view) | Active packages with trainer info for the member info panel. |
| `view_5_3_staff` (view) | Staff list for the assignment filter dropdown. |
| `leads` (table) | Lead matching for non-member contacts. |
| `staff` (table) | Staff records for permission checks and assignment. |
| `role_permissions` (table) | Role-based permission defaults. |
| `staff_permissions` (table) | Per-staff permission overrides. |

### Database functions

| Function | Purpose |
| --- | --- |
| `remove_tag_from_all_conversations` | RPC function that cascade-removes a tag from all conversations when the tag is deleted. |

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `WAHA_API_URL` | Yes | `http://localhost:3000` | WAHA HTTP API endpoint. |
| `WAHA_SESSION_NAME` | No | `default` | Session identifier for WAHA. |
| `WAHA_API_KEY` | No | — | API key for WAHA authentication. |
| `WEBHOOK_SECRET` | No | — | Secret for webhook signature verification. |

## Component files

| File | Purpose |
| --- | --- |
| `whatsapp/page.tsx` | Three-column layout with session status banner, conversation selection, and filter state (~456 lines). |
| `whatsapp/chat-thread.tsx` | Message display with 20+ type renderers, media handling, scroll management, and inline message input (~1,173 lines). |
| `whatsapp/conversation-list.tsx` | Filterable conversation list with search, pagination, unread badges, and tag/assignment display (~572 lines). |
| `whatsapp/member-info-panel.tsx` | Right panel with member/lead lookup, package display, tag management, and notes (~893 lines). |
| `whatsapp/whatsapp-session-manager.tsx` | Session lifecycle dialog with QR code display, status polling, and logout confirmation (~490 lines). |
| `whatsapp/whatsapp-settings.tsx` | Tag CRUD with color picker, cascade delete, and permission gating (~420 lines). |
| `whatsapp/message-input.tsx` | Standalone message input component (~116 lines). |
| `hooks/use-whatsapp-real.ts` | Primary hook with conversation fetching, message history, WebSocket handling, optimistic sends, and filters (~1,156 lines). |
| `lib/waha-client.ts` | Singleton WAHA HTTP client with session, messaging, chat, and LID resolution methods (~464 lines). |
