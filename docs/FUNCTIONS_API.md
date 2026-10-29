# Novelora — Cloud Functions API Reference

All callable functions return:
```ts
{ success: boolean, data: T, message: string }
```

On error, Firebase Functions throws an `HttpsError` with the appropriate code.

---

## Auth Requirements

| Level | How | Enforced |
|-------|-----|---------|
| Admin | `request.auth.token.admin === true` | `assertAdmin()` middleware |
| Signed In | `request.auth != null` | `assertAuth()` middleware |
| Public | No auth | No middleware |

---

## Admin Functions

### `createBook`

**Auth:** Admin  
**Input:**
```ts
{
  title: string          // 1-200 chars
  description: string    // 1-2000 chars
  genres: string[]       // 1-5 items
  tags?: string[]        // max 10 items
  status: 'ongoing' | 'completed'
  visibility: 'draft' | 'published'
  coverImageUrl?: string
}
```
**Output:** `{ success: true, data: Book, message: string }`  
Slug auto-generated from title; guaranteed unique.

---

### `updateBook`

**Auth:** Admin  
**Input:** Partial `CreateBook` + `{ id: string }`  
**Output:** `{ success: true, data: Book, message: string }`  
Slug regenerated if `title` changes.

---

### `deleteBook`

**Auth:** Admin  
**Input:** `{ id: string }`  
**Output:** `{ success: true, data: { id: string }, message: string }`  
Deletes all chapters and comments recursively.

---

### `getAdminStats`

**Auth:** Admin  
**Input:** `{}` (none)  
**Output:**
```ts
{
  success: true,
  data: {
    totalBooks: number
    publishedBooks: number
    draftBooks: number
    totalChapters: number
    publishedChapters: number
    draftChapters: number
    recentComments: Comment[]  // last 5 across platform
  }
}
```

---

### `createChapter`

**Auth:** Admin  
**Input:**
```ts
{
  bookId: string
  title: string
  content: object            // TipTap JSON
  backgroundImageUrl?: string
  overlayOpacity?: number    // 0-1, default 0.5
  status?: 'draft' | 'published'  // default 'draft'
  scheduledPublishAt?: string     // ISO date string
}
```
**Output:** `{ success: true, data: Chapter, message: string }`  
`chapterNumber` auto-assigned as `book.chapterCount + 1`.

---

### `updateChapter`

**Auth:** Admin  
**Input:** Partial `CreateChapter` + `{ id: string, bookId: string }`  
**Output:** `{ success: true, data: Chapter, message: string }`  
`wordCount` recalculated from `content` if changed.

---

### `deleteChapter`

**Auth:** Admin  
**Input:** `{ id: string, bookId: string }`  
**Output:** `{ success: true, data: { id: string }, message: string }`  
Decrements `book.chapterCount`.

---

### `publishChapter`

**Auth:** Admin  
**Input:** `{ id: string, bookId: string }`  
**Output:** `{ success: true, data: Chapter, message: string }`  
Sets `status: 'published'`, clears `scheduledPublishAt`.

---

### `scheduleChapter`

**Auth:** Admin  
**Input:** `{ id: string, bookId: string, scheduledPublishAt: string }` (ISO date)  
**Output:** `{ success: true, data: Chapter, message: string }`  
Keeps `status: 'draft'`; the scheduled function publishes at the specified time.

---

### `reorderChapters`

**Auth:** Admin  
**Input:** `{ bookId: string, orderedIds: string[] }`  
**Output:** `{ success: true, data: {}, message: string }`  
Batch-updates `chapterNumber` based on position in `orderedIds`.

---

### `getUploadUrl`

**Auth:** Admin  
**Input:**
```ts
{
  folder: 'covers' | 'chapter-images' | 'backgrounds' | 'avatars'
  fileName: string
  contentType: string   // must start with 'image/'
}
```
**Output:**
```ts
{
  success: true,
  data: {
    uploadUrl: string   // Signed PUT URL, expires in 15 min
    filePath: string    // Path inside the bucket
    publicUrl: string   // Public HTTPS URL
  }
}
```

---

## Reader Functions

### `toggleLike`

**Auth:** Signed In  
**Input:** `{ bookId: string, chapterId: string }`  
**Output:** `{ success: true, data: { liked: boolean, likeCount: number } }`

---

### `addComment`

**Auth:** Signed In  
**Input:** `{ bookId: string, chapterId: string, text: string }` (text: 1-1000 chars)  
**Output:** `{ success: true, data: Comment }`

---

### `deleteOwnComment`

**Auth:** Signed In  
**Input:** `{ bookId: string, chapterId: string, commentId: string }`  
**Output:** `{ success: true, data: { id: string } }`  
Users can delete their own; admins can delete any.

---

## Public Functions

### `subscribeNewsletter`

**Auth:** None  
**Input:** `{ email: string }` (valid email)  
**Output:** `{ success: true, data: { id: string }, message: "You're subscribed!..." }`  
Returns `already-exists` error if email is already subscribed.

---

## Scheduled Functions

### `publishScheduledChapters`

**Schedule:** Every 5 minutes (UTC)  
**Action:** Queries `chapters` collectionGroup where `status == 'draft'` AND `scheduledPublishAt <= now`. Batch-updates matched chapters to `status: 'published'`. Logs count.

---

## Triggers

### `onNewUser` (Auth trigger)

Fires on every new Firebase Auth user creation.  
Creates `users/{uid}` in Firestore:
```ts
{ name, email, avatarUrl, role: 'reader', createdAt }
```

### `onChapterWritten` (Firestore trigger)

Fires on any write to `books/{bookId}/chapters/{chapterId}`.  
Recalculates and updates `wordCount` from TipTap JSON content.

---

## Error Codes

| Code | Meaning |
|------|---------|
| `unauthenticated` | Not signed in |
| `permission-denied` | Signed in but no admin claim |
| `invalid-argument` | Zod validation failed |
| `not-found` | Document doesn't exist |
| `already-exists` | Duplicate (e.g. newsletter email) |
| `internal` | Unexpected server error |
