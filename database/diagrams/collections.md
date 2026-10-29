# Novelora Firestore Collections & Document Architecture

This document describes the schema hierarchy and collection structure of the Novelora Firestore database.

## Document Hierarchy Tree

```
users/{uid}
  ├── name, email, avatarUrl, role, createdAt
  ├── bookmarks/{bookId}: bookId, createdAt
  ├── progress/{bookId}: lastChapter, scrollPosition, updatedAt
  └── likes/{chapterId}: createdAt

books/{bookId}
  ├── title, slug, coverImageUrl, description, genres[], tags[]
  ├── status, visibility, chapterCount, createdAt, updatedAt
  └── chapters/{chapterId}
        ├── chapterNumber, title, content, backgroundImageUrl
        ├── overlayOpacity, status, scheduledPublishAt
        ├── wordCount, likeCount, createdAt, updatedAt
        └── comments/{commentId}: userId, userName, text, createdAt

subscribers/{id}
  └── email, createdAt
```

## Detailed Field Specifications

### 1. `users/{uid}`
Primary user profile collection. Document ID is identical to Firebase Auth `uid`.
- `name` (string): Full name or handle of the user.
- `email` (string): User's primary email address.
- `avatarUrl` (string | null): Public HTTPS URL to user avatar in Storage.
- `role` (string): User role (`'reader'` | `'admin'`). Enforced by security rules (users cannot mutate this field).
- `createdAt` (timestamp): Account creation timestamp.
- `updatedAt` (timestamp): Last profile modification timestamp.

#### Subcollection: `users/{uid}/bookmarks/{bookId}`
User's personal library bookmark. Document ID corresponds to `books/{bookId}`.
- `bookId` (string): The ID of the bookmarked book.
- `createdAt` (timestamp): Timestamp when bookmark was added.

#### Subcollection: `users/{uid}/progress/{bookId}`
User's reading progress tracking for a given book. Document ID corresponds to `books/{bookId}`.
- `lastChapter` (number): The chapter number the user was last reading.
- `scrollPosition` (number): Scroll position in pixels or offset in the reader view.
- `updatedAt` (timestamp): Timestamp when progress was last recorded.

#### Subcollection: `users/{uid}/likes/{chapterId}`
User's chapter likes. Document ID corresponds to `chapters/{chapterId}`.
- `createdAt` (timestamp): Timestamp when chapter was liked.

---

### 2. `books/{bookId}`
Collection containing published and draft books/novels.
- `title` (string): Book title.
- `slug` (string): URL-friendly unique identifier (e.g., `echoes-of-the-forgotten-realm`).
- `coverImageUrl` (string): Public HTTPS URL to the book cover image.
- `description` (string): Synopsis or long-form description of the book.
- `genres` (array of strings): Categorization tags (e.g., `['Fantasy', 'Adventure']`).
- `tags` (array of strings): Specific searchable keywords (e.g., `['magic', 'ancient-ruins']`).
- `status` (string): Release status (`'ongoing'` | `'completed'` | `'hiatus'`).
- `visibility` (string): Access level (`'published'` | `'draft'`). Published books are readable by all visitors; draft books require admin privileges.
- `chapterCount` (number): Aggregate count of chapters in this book.
- `createdAt` (timestamp): Book creation timestamp.
- `updatedAt` (timestamp): Last modification timestamp.

#### Subcollection: `books/{bookId}/chapters/{chapterId}`
Chapters belonging to a specific book.
- `chapterNumber` (number): Ordinal number of the chapter (1, 2, 3...).
- `title` (string): Chapter title.
- `content` (map / JSON): Rich text document structured as TipTap JSON (`{ type: 'doc', content: [...] }`).
- `backgroundImageUrl` (string, optional): Background texture or illustration for immersive reading.
- `overlayOpacity` (number, optional): Contrast overlay opacity (0.0 to 1.0, e.g. 0.6) for background readability.
- `status` (string): Publication status (`'published'` | `'draft'` | `'scheduled'`).
- `scheduledPublishAt` (timestamp, optional): Future timestamp for scheduled publishing triggers.
- `wordCount` (number): Total word count of the chapter content.
- `likeCount` (number): Total likes received.
- `createdAt` (timestamp): Chapter creation timestamp.
- `updatedAt` (timestamp): Last modification timestamp.

#### Subcollection: `books/{bookId}/chapters/{chapterId}/comments/{commentId}`
Reader comments for a specific chapter.
- `userId` (string): The Firebase Auth `uid` of the comment author. Must match `request.auth.uid`.
- `userName` (string): Author display name at the time of commenting.
- `text` (string): Comment content (1 - 1000 characters). Immutable once posted.
- `createdAt` (timestamp): Comment creation timestamp.

---

### 3. `subscribers/{id}`
Email newsletter subscriptions for updates and new releases.
- `email` (string): Subscriber's email address. Validated against regex pattern.
- `createdAt` (timestamp): Subscription timestamp.
- Access: Public write (`create`), Admin-only read, update, and delete.
