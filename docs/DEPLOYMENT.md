# Novelora — Deployment Guide

---

## Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)
- Billing enabled (required for Cloud Functions)

---

## 1. Firebase Project Setup

### Create Project

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Name: `novelora-app` (or your choice)
3. Enable Google Analytics (optional)

### Enable Services

```
Authentication → Sign-in method:
  ✅ Email/Password
  ✅ Google (add your support email)

Firestore Database:
  → Create database → Production mode → Choose region (e.g. us-central1)

Storage:
  → Get started → Production mode → Same region as Firestore

Functions:
  → Upgrade to Blaze (pay-as-you-go) plan (required for Cloud Functions)
```

### Register Web App

```
Project Settings → Your apps → Add app → Web (</>) 
→ App nickname: "Novelora Web"
→ Copy the firebaseConfig object
```

---

## 2. Environment Configuration

### Frontend

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_SITE_NAME=Novelora
VITE_USE_EMULATOR=false
```

### Backend

```bash
cp backend/functions/.env.example backend/functions/.env
```

Edit `backend/functions/.env`:
```env
ADMIN_EMAIL=your@email.com
```

---

## 3. Install Dependencies

```bash
# Root tools
npm install

# Frontend
cd frontend && npm install

# Backend functions
cd backend/functions && npm install
```

---

## 4. Set Firebase Project

```bash
firebase login
firebase use --add
# Select your project → alias: default
```

Or edit `.firebaserc`:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

---

## 5. Deploy Rules First

```bash
firebase deploy --only firestore:rules,storage:rules,firestore:indexes
```

---

## 6. Deploy Functions

```bash
cd backend/functions && npm run build
firebase deploy --only functions
```

> Functions take 2–5 minutes to deploy. Watch for errors in the output.

---

## 7. Grant Admin Access

### Get Service Account Key

1. Firebase Console → Project Settings → Service Accounts
2. Click **Generate new private key** → Download JSON
3. Save as `backend/scripts/serviceAccount.json` (gitignored)

### Run setAdmin Script

```bash
cd backend
ADMIN_EMAIL=your@email.com npx ts-node scripts/setAdmin.ts
```

**IMPORTANT**: After running, sign out and sign back in to your Novelora account to activate the admin claim.

---

## 8. Deploy Frontend

```bash
cd frontend && npm run build
firebase deploy --only hosting
```

---

## 9. Full Deploy (All at Once)

After first setup, use:

```bash
npm run deploy
```

This runs: `frontend build → firebase deploy (hosting + functions + rules)`

---

## 10. Seed Production Data (Optional)

> ⚠️ Only run this once, against your real project. It will create sample books.

Edit `database/seeds/seed.ts` to target production (remove emulator config), then:

```bash
cd database
npx ts-node seeds/seed.ts
```

---

## Custom Domain (Optional)

1. Firebase Console → Hosting → Add custom domain
2. Follow DNS verification steps
3. Firebase provides a free SSL certificate

---

## Monitoring

- **Functions logs**: `firebase functions:log` or Firebase Console → Functions → Logs
- **Firestore usage**: Firebase Console → Firestore → Usage
- **Hosting**: Firebase Console → Hosting

---

## Environment Variables in Functions (Production)

Firebase Functions v2 reads `.env` files automatically during deployment.
The `backend/functions/.env` file is deployed with your functions.

For secrets, use Firebase Secret Manager:
```bash
firebase functions:secrets:set MY_SECRET
```

---

## Rollback

```bash
# List hosting releases
firebase hosting:releases

# Roll back hosting to previous version
firebase hosting:rollback

# Redeploy previous function version via Git
git checkout <previous-commit>
npm run deploy:functions
```

