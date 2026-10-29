# Novelora Database Layer

This directory contains the database definitions, security rules, indexes, seed scripts, and security test suites for the **Novelora** personal novel publishing platform.

---

## 📁 Directory Structure

```
database/
├── firestore.rules              # Strict Firestore Security Rules
├── firestore.indexes.json        # Composite indexes for querying & collection groups
├── storage.rules                # Cloud Storage Security Rules for images/avatars
├── package.json                 # Dependencies for seeding and database tasks
├── tsconfig.json                # TypeScript compiler configuration
├── diagrams/
│   └── collections.md           # Tree diagram and detailed schema documentation
├── seeds/
│   ├── sampleData.json          # 3 complete books, chapters (TipTap JSON), & users
│   └── seed.ts                  # Emulator seed script (creates auth users + data)
├── tests/
│   ├── firestore.rules.test.ts  # Jest + @firebase/rules-unit-testing test suite
│   ├── jest.config.js           # Jest configuration with ts-jest preset
│   ├── package.json             # Test runner dependencies
│   └── tsconfig.json            # TypeScript configuration for tests
└── README.md                    # This documentation file
```

---

## 🗄️ Firestore Data Model

### Overview
Novelora uses a hierarchical Firestore document model tailored for reader engagement, fine-grained access control, and high read throughput:

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

For full field descriptions and types, see [`diagrams/collections.md`](file:///home/shrav/Desktop/projects/Novelora/database/diagrams/collections.md).

### Access Control Rules Summary
- **Guest / Unauthenticated**:
  - Can read `published` books.
  - Can read Chapter 1 of `published` books (teaser / free preview).
  - Can subscribe to the newsletter (`subscribers/{id}`).
  - Cannot access Chapter 2+ or any drafts.
- **Reader (Authenticated)**:
  - Can read all chapters of `published` books.
  - Can read and write only their own user profile, bookmarks, reading progress, and likes.
  - Cannot modify their own `role` field (prevents privilege escalation).
  - Can post comments (1–1000 characters) on published chapters with their verified `uid`.
  - Can delete their own comments, but cannot edit comments (comments are immutable).
- **Admin (`admin: true` Custom Claim)**:
  - Full read and write access to all books, chapters (including drafts), and metadata.
  - Can delete any comment (moderation).
  - Can read, update, and export subscriber lists.

---

## 🧪 Running Security Rules Tests

The rules tests are powered by **Jest** and `@firebase/rules-unit-testing`, validating every guest, reader, and admin authorization path against the local Firestore emulator.

### 1. Install Test Dependencies
```bash
cd /home/shrav/Desktop/projects/Novelora/database/tests
npm install
```

### 2. Start the Firebase Emulator
In a separate terminal or root process:
```bash
cd /home/shrav/Desktop/projects/Novelora
npm run emulators
# Or: firebase emulators:start --only firestore
```

### 3. Run the Test Suite
```bash
cd /home/shrav/Desktop/projects/Novelora/database/tests
npm test
```

### Test Coverage Highlights
- **Guest**: Reading published books & Chapter 1 allowed; reading drafts or Chapter 2+ denied; creating subscriber validated.
- **Reader**: Access to all published chapters; isolated bookmarks & reading progress; cannot escalate `role`; comment creation & deletion boundaries strictly enforced.
- **Admin**: Full draft visibility; chapter authoring; global comment moderation; subscriber read access.

---

## 🌱 Seeding Data

The seed script loads 3 complete books across Fantasy, Romance, and Sci-Fi genres with realistic long-form TipTap JSON chapters (>600 words each), sample comments, and test user accounts.

### Seeded Test Accounts
| Role | Email | Password | Custom Claim |
| :--- | :--- | :--- | :--- |
| **Reader** | `reader@test.com` | `password123` | `admin: false` |
| **Admin** | `admin@novelora.com` | `password123` | `admin: true` |

### 1. Install Database Dependencies
```bash
cd /home/shrav/Desktop/projects/Novelora/database
npm install
```

### 2. Ensure Local Emulators are Running
Make sure the Firebase emulators are running on their default ports:
- Firestore: `localhost:8080`
- Auth: `localhost:9099`
- Storage: `localhost:9199`

```bash
cd /home/shrav/Desktop/projects/Novelora
npm run emulators
```

### 3. Run the Seed Script
From the project root:
```bash
npm run seed
```
Or directly from the `database` folder:
```bash
cd /home/shrav/Desktop/projects/Novelora/database
npx ts-node seeds/seed.ts
```

---

## 🚀 Deploying Rules and Indexes

When deploying to Firebase production or staging projects:

### Deploy Everything (Rules + Indexes)
```bash
cd /home/shrav/Desktop/projects/Novelora
npm run deploy:rules
```
*Behind the scenes, this executes:*
```bash
firebase deploy --only firestore:rules,storage:rules,firestore:indexes
```

### Deploy Rules Only
```bash
firebase deploy --only firestore:rules,storage:rules
```

### Deploy Indexes Only
```bash
firebase deploy --only firestore:indexes
```
