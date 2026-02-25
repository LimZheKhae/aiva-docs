---
sidebar_position: 7
title: Storage buckets
description: "Reference for Supabase Storage buckets — file uploads for avatars, signatures, payment proofs, merchandise images, and trainer photos."
---

# Storage buckets

The project uses Supabase Storage for file uploads. All buckets are **public** (files are accessible via URL without authentication), which simplifies image rendering in the UI.

## Buckets

| Bucket | Public | Purpose | Uploaded by |
| --- | --- | --- | --- |
| `member_avatar` | Yes | Member profile photos. | Portal (member uploads) and admin (staff uploads). |
| `trainer_image` | Yes | Staff/trainer profile photos. | Admin app only. |
| `signature` | Yes | Digital T&C signatures (member and staff). | Admin app during package assignment. |
| `payment_proof` | Yes | Payment proof images (receipts, transfer screenshots). | Admin app during payment recording. |
| `merchandise-images` | Yes | Product images for the merchandise catalog. | Admin app — point system merchandise tab. |

## File path conventions

Each bucket organizes files by entity ID to prevent collisions:

| Bucket | Path pattern | Example |
| --- | --- | --- |
| `member_avatar` | `\{member_id\}/\{filename\}` | `42/avatar-1709123456.jpg` |
| `trainer_image` | `\{staff_id\}/\{filename\}` | `abc-def-123/photo.png` |
| `signature` | `\{member_id\}/\{filename\}` | `42/member-sign-2025-01-15.png` |
| `payment_proof` | `\{member_id\}/\{filename\}` | `42/proof-1709123456.jpg` |
| `merchandise-images` | `\{merchandise_id\}/\{filename\}` | `xyz-789/product.png` |

## Upload constraints

| Constraint | Value |
| --- | --- |
| **Max file size** | 10 MB (enforced by the app). |
| **Accepted types** | JPEG, PNG, WebP (images only). |
| **Overwrite behavior** | New uploads use unique filenames (timestamp-based) — old files are not automatically deleted. |

## How uploads work

### Member avatar (portal)

1. Member taps their avatar on the profile edit page.
2. Selects an image from their device.
3. The portal uploads to `member_avatar/\{member_id\}/\{filename\}`.
4. On success, the `avatar_url` column on the `member` table is updated with the public URL.

### T&C signatures (admin)

1. During package assignment, the member draws their signature on a canvas.
2. The staff witness also signs.
3. Both signatures are uploaded to the `signature` bucket.
4. The URLs are saved to `member_tnc.member_sign` and `member_tnc.staff_sign`.

### Payment proof (admin)

1. When recording a payment, staff optionally upload a proof image.
2. The image goes to `payment_proof/\{member_id\}/\{filename\}`.
3. The URL is saved to `member_payment.payment_proof`.

## Accessing stored files

Supabase Storage generates public URLs in this format:

```
https://\{project_ref\}.supabase.co/storage/v1/object/public/\{bucket\}/\{path\}
```

The app uses the Supabase client's `getPublicUrl()` method:

```typescript
const { data } = supabase.storage
  .from('member_avatar')
  .getPublicUrl(`${memberId}/avatar.jpg`);
// data.publicUrl → full URL
```

:::note
Since all buckets are public, anyone with the URL can access the files. This is acceptable for profile photos and product images but worth noting for payment proofs and signatures. If privacy requirements change, buckets can be made private and accessed via signed URLs instead.
:::
