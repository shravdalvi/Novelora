# NOVELORA

> **Stories, panel by panel.**

Novelora is a personal Wattpad-style novel publishing platform — one author, unlimited readers. Built with a neo-brutalist comic-book aesthetic using React, Firebase, and TipTap.

---

## 🗂 Monorepo Structure

```
novelora/
├── frontend/      → React + Vite + TypeScript + Tailwind + Firebase Web SDK
├── backend/       → Firebase Cloud Functions (Node.js + TypeScript, 2nd gen)
├── database/      → Firestore rules, Storage rules, indexes, seed scripts, tests
├── docs/          → API docs, design system, deployment guide
└── firebase.json  → Firebase project config (hosting, functions, rules, emulators)
```

---

## 🚀 Quick Start (Emulator)

### Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Java 11+ (for Firebase Emulators)

### 1. Create Your Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `novelora-app` (or anything)
3. Enable **Authentication** → Sign-in methods:
   - ✅ Email/Password
   - ✅ Google
4. Enable **Firestore Database** (start in production mode)
5. Enable **Storage** (start in production mode)
6. Go to **Project Settings** → **Your apps** → **Add app** → **Web**
7. Copy the Firebase config object

### 2. Configure Environment Variables

```bash
# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env and paste your Firebase config values

# Backend
cp backend/functions/.env.example backend/functions/.env
# Edit backend/functions/.env and set ADMIN_EMAIL=your@email.com
```

### 3. Install Dependencies

```bash
# Root
npm install

# Frontend
cd frontend && npm install && cd ..

# Backend functions
cd backend/functions && npm install && cd ../..

# Database tests (optional)
cd database/tests && npm install && cd ../..
```

### 4. Configure Firebase Project

```bash
firebase login
firebase use --add  # select your project, alias: default
# OR edit .firebaserc and replace "novelora-app" with your project ID
```

### 5. Run with Emulators

```bash
npm run dev
```

This starts:
- 🔥 Firebase Emulators (Auth :9099, Firestore :8080, Functions :5001, Storage :9199)
- ⚡ Vite dev server (Frontend :5173)
- 🖥 Emulator UI at http://localhost:4000

### 6. Seed Sample Data

```bash
npm run seed
```

Seeds 3 books with 3 chapters each (including images and a background chapter).

### 7. Grant Admin Access

```bash
# Make sure emulators are running
npm run set-admin
# OR: cd backend && ADMIN_EMAIL=you@email.com npx ts-node scripts/setAdmin.ts
```

Then **sign out and sign back in** to pick up the admin custom claim.

---

## 🌐 Deploy to Production

### One-command deploy (hosting + functions + rules)

```bash
npm run deploy
```

### Deploy individual parts

```bash
npm run deploy:hosting    # Frontend only
npm run deploy:functions  # Cloud Functions only
npm run deploy:rules      # Firestore + Storage rules only
```

---

## 🔐 Admin Setup (Production)

After deploying:

```bash
# Set service account path in backend/scripts/setAdmin.ts
# Then run:
cd backend && ADMIN_EMAIL=your@email.com npx ts-node scripts/setAdmin.ts
```

The admin user must **sign out and sign back in** to activate the `admin=true` custom claim.

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FIREBASE HOSTING                   │
│              (React SPA, frontend/dist)              │
└──────────────────────┬──────────────────────────────┘
                       │ reads (Firestore SDK)
                       │ calls (Cloud Functions)
┌──────────────────────▼──────────────────────────────┐
│              FIREBASE CLOUD FUNCTIONS               │
│   All admin writes, likes, comments, scheduling     │
│   Admin SDK + Zod validation + custom claim checks  │
└──────────┬────────────────────────┬─────────────────┘
           │                        │
┌──────────▼──────┐    ┌────────────▼────────────────┐
│   FIRESTORE      │    │     FIREBASE STORAGE        │
│  books, chapters │    │  covers, images, backgrounds│
│  users, comments │    │  avatars                    │
└─────────────────┘    └─────────────────────────────┘
```

### Access Levels

| Action | Guest | Reader | Admin |
|--------|-------|--------|-------|
| Browse library | ✅ | ✅ | ✅ |
| Read Chapter 1 | ✅ | ✅ | ✅ |
| Read Chapter 2+ | ❌ | ✅ | ✅ |
| Bookmark / Like / Comment | ❌ | ✅ | ✅ |
| See draft chapters | ❌ | ❌ | ✅ |
| Create / Edit / Delete content | ❌ | ❌ | ✅ |
| Writing Studio | ❌ | ❌ | ✅ |

---

## 🎨 Design System

Neo-brutalist comic-book aesthetic:
- **Fonts**: Bangers (headings), Space Grotesk (UI), Literata (reading)
- **Colors**: Pure White `#FFFFFF` · Frost `#F2F8FD` · Aurora Blue `#8EC9F5` · Midnight Ink `#0B1D33`
- **Borders**: 3px solid `#0B1D33` on everything
- **Shadows**: `6px 6px 0 #0B1D33` hard offset (no blur)
- **Hover**: `translate(-2px, -2px)` + larger shadow
- **Press**: `translate(4px, 4px)` + no shadow

See [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) for the full design reference.

---

## 📚 Documentation

- [`docs/FUNCTIONS_API.md`](docs/FUNCTIONS_API.md) — Cloud Functions API reference
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — Design tokens, components, patterns
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Detailed deployment guide
- [`database/README.md`](database/README.md) — Data model and Firestore rules guide
- [`backend/README.md`](backend/README.md) — Functions setup and scripts guide

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v3 |
| Rich Text | TipTap v2 (inline images, headings, scene breaks) |
| Backend | Firebase Cloud Functions v2 (Node.js 20, TypeScript) |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Auth | Firebase Auth (Email/Password + Google) |
| Validation | Zod |
| Drag & Drop | @hello-pangea/dnd |
| Routing | React Router v6 |
| Toasts | react-hot-toast |
| Hosting | Firebase Hosting |

---

## ⚖️ License

All stories published on Novelora are original works. All rights reserved.
