# Novelora — Backend & Cloud Functions

> Firebase Cloud Functions (2nd gen) · Node.js 20 · TypeScript · Zod

---

## Structure

```
backend/
├── functions/
│   ├── src/
│   │   ├── admin/          ← Admin-only callable functions
│   │   │   ├── bookFunctions.ts    (createBook, updateBook, deleteBook, getAdminStats)
│   │   │   ├── chapterFunctions.ts (createChapter, updateChapter, deleteChapter, publishChapter, scheduleChapter, reorderChapters)
│   │   │   ├── uploadFunctions.ts  (getUploadUrl)
│   │   │   ├── readerFunctions.ts  (toggleLike, addComment, deleteOwnComment)
│   │   │   └── publicFunctions.ts  (subscribeNewsletter)
│   │   ├── middleware/     ← Auth guards
│   │   │   ├── assertAdmin.ts
│   │   │   └── assertAuth.ts
│   │   ├── validators/     ← Zod schemas for all inputs
│   │   ├── scheduled/      ← publishScheduledChapters (every 5 min)
│   │   ├── triggers/       ← onUserCreate, onChapterWrite
│   │   ├── utils/          ← slugify, wordCount, errors, firebase (admin SDK init)
│   │   └── index.ts        ← All exports
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── scripts/
    ├── setAdmin.ts          ← Grant admin claim by email
    └── serviceAccount.example.json
```

---

## Setup

### Install & Build

```bash
cd backend/functions
npm install
npm run build
```

### Environment Variables

```bash
cp .env.example .env
# Edit .env:
# ADMIN_EMAIL=your@email.com
```

---

## Grant Admin Access

The `setAdmin.ts` script grants the `admin: true` Firebase custom claim to a user by email.

### Requirements

Place your Firebase service account key at `backend/scripts/serviceAccount.json` (gitignored).

Download it from:
> Firebase Console → Project Settings → Service Accounts → Generate new private key

### Run the script

```bash
# From the /backend directory:
ADMIN_EMAIL=your@email.com npx ts-node scripts/setAdmin.ts

# OR pass email as argument:
npx ts-node scripts/setAdmin.ts your@email.com

# Using emulators:
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
FIRESTORE_EMULATOR_HOST=localhost:8080 \
ADMIN_EMAIL=your@email.com \
npx ts-node scripts/setAdmin.ts
```

**After running:** the admin user must **sign out and sign back in** to receive the updated token.

---

## Function Reference

All callable functions follow the standard response shape:
```ts
{ success: boolean, data: T, message: string }
```

### Admin Functions (require `admin=true` custom claim)

| Function | Description |
|----------|-------------|
| `createBook(data)` | Create a new book with auto-generated slug |
| `updateBook(data)` | Update book fields; regenerates slug if title changes |
| `deleteBook({ id })` | Delete book + all chapters + all comments |
| `getAdminStats()` | Returns total books, chapters, drafts, recent comments |
| `createChapter(data)` | Create chapter, auto-assigns chapterNumber |
| `updateChapter(data)` | Update chapter content and metadata |
| `deleteChapter(data)` | Delete chapter, renumbers remaining |
| `publishChapter(data)` | Set chapter status to 'published' |
| `scheduleChapter(data)` | Set scheduledPublishAt, keeps status 'draft' |
| `reorderChapters(data)` | Batch-update chapterNumber based on new order |
| `getUploadUrl(data)` | Generate signed PUT URL for Storage upload |

### Reader Functions (require signed-in user)

| Function | Description |
|----------|-------------|
| `toggleLike({ bookId, chapterId })` | Toggle like, updates likeCount on chapter |
| `addComment({ bookId, chapterId, text })` | Add comment (max 1000 chars) |
| `deleteOwnComment({ bookId, chapterId, commentId })` | Delete own comment (or admin deletes any) |

### Public Functions (no auth required)

| Function | Description |
|----------|-------------|
| `subscribeNewsletter({ email })` | Subscribe to newsletter, deduplicates by email |

### Scheduled

| Function | Schedule | Description |
|----------|----------|-------------|
| `publishScheduledChapters` | Every 5 minutes | Publishes chapters where `scheduledPublishAt <= now` |

### Triggers

| Trigger | Description |
|---------|-------------|
| `onNewUser` | `auth.user().onCreate` — creates `users/{uid}` doc with role 'reader' |
| `onChapterWritten` | `onDocumentWritten('books/{bookId}/chapters/{chapterId}')` — updates wordCount |

---

## Security Model

- All admin functions call `assertAdmin(request)` first, which checks `request.auth.token.admin === true`
- The admin custom claim is **only** grantable via the `setAdmin.ts` script using Firebase Admin SDK
- Client-side code cannot grant admin — it's enforced server-side in every function
- Firestore Security Rules independently enforce the same role checks

---

## Local Development

Run all functions with the emulator:

```bash
# From project root:
firebase emulators:start --only functions,auth,firestore,storage

# Build functions on change:
cd backend/functions && npm run build:watch
```
