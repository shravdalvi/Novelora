/**
 * Novelora Database Seed Script
 *
 * Connects to Firebase Local Emulators:
 *  - Firestore: localhost:8080
 *  - Auth:      localhost:9099
 *  - Storage:   localhost:9199
 *
 * Seeds:
 *  - Test users (reader@test.com and admin@novelora.com)
 *  - 3 books with realistic fantasy, romance, and sci-fi data
 *  - 3 chapters per book with rich TipTap JSON content
 *  - Draft chapters to test admin-only visibility
 *  - Sample comments, bookmarks, reading progress, and likes
 *  - Newsletter subscribers
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Configure emulator environments before initializing Firebase Admin
const FIRESTORE_PORT = process.env.FIRESTORE_PORT || '8080';
const AUTH_PORT = process.env.AUTH_PORT || '9099';
const STORAGE_PORT = process.env.STORAGE_PORT || '9199';
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'novelora-app';

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || `127.0.0.1:${FIRESTORE_PORT}`;
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || `127.0.0.1:${AUTH_PORT}`;
process.env.FIREBASE_STORAGE_EMULATOR_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST || `127.0.0.1:${STORAGE_PORT}`;

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: PROJECT_ID,
    storageBucket: `${PROJECT_ID}.appspot.com`,
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Load sample data
const sampleDataPath = path.resolve(__dirname, 'sampleData.json');
const rawData = fs.readFileSync(sampleDataPath, 'utf8');
const sampleData = JSON.parse(rawData);

async function createOrUpdateUser(userData: {
  uid: string;
  email: string;
  password?: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'reader' | 'admin';
}) {
  let uid = userData.uid;

  // 1. Manage Firebase Auth User
  try {
    const existingUser = await auth.getUserByEmail(userData.email);
    uid = existingUser.uid;
    await auth.updateUser(uid, {
      displayName: userData.displayName,
      photoURL: userData.avatarUrl,
    });
    console.log(`  [Auth] Existing user found and updated: ${userData.email} (${uid})`);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      const newUser = await auth.createUser({
        uid: userData.uid,
        email: userData.email,
        password: userData.password || 'password123',
        displayName: userData.displayName,
        photoURL: userData.avatarUrl,
      });
      uid = newUser.uid;
      console.log(`  [Auth] Created user: ${userData.email} (${uid})`);
    } else {
      console.error(`  [Auth Error] Failed to process user ${userData.email}:`, error);
      throw error;
    }
  }

  // Set custom claims (admin: true if role is admin)
  if (userData.role === 'admin') {
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log(`  [Auth] Set custom claim { admin: true } on: ${userData.email}`);
  } else {
    await auth.setCustomUserClaims(uid, { admin: false });
  }

  // 2. Manage Firestore User Profile Document
  const userRef = db.collection('users').doc(uid);
  await userRef.set(
    {
      name: userData.displayName,
      email: userData.email,
      avatarUrl: userData.avatarUrl || null,
      role: userData.role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`  [Firestore] Saved profile for /users/${uid} (${userData.role})`);
  return uid;
}

async function seedDatabase() {
  console.log('\n======================================================');
  console.log('🚀 Starting Novelora Database Seed');
  console.log('======================================================');
  console.log(`Firestore Emulator : ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`Auth Emulator      : ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
  console.log(`Storage Emulator   : ${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`);
  console.log(`Target Project ID  : ${PROJECT_ID}\n`);

  // 1. Seed Users
  console.log('--- 1. Seeding Users ---');
  const readerUid = await createOrUpdateUser(sampleData.testUsers.reader);
  const adminUid = await createOrUpdateUser(sampleData.testUsers.admin);

  // 2. Seed Books and Chapters
  console.log('\n--- 2. Seeding Books and Chapters ---');
  for (const book of sampleData.books) {
    const bookRef = db.collection('books').doc(book.id);
    const { chapters, ...bookData } = book;

    await bookRef.set(
      {
        ...bookData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`  [Book] Seeded: "${book.title}" (slug: ${book.slug}, visibility: ${book.visibility})`);

    // Seed Chapters
    for (const chapter of chapters) {
      const chapterRef = bookRef.collection('chapters').doc(chapter.id);
      const { comments, ...chapterData } = chapter;

      await chapterRef.set(
        {
          ...chapterData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log(
        `    └─ [Chapter ${chapter.chapterNumber}] "${chapter.title}" (status: ${chapter.status}, words: ${chapter.wordCount})`
      );

      // Seed Comments on Chapter
      if (comments && comments.length > 0) {
        for (const comment of comments) {
          const commentRef = chapterRef.collection('comments').doc(comment.id);
          await commentRef.set(
            {
              userId: comment.userId === 'test-reader-uid-101' ? readerUid : (comment.userId === 'test-admin-uid-001' ? adminUid : comment.userId),
              userName: comment.userName,
              text: comment.text,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          console.log(`       └─ [Comment] "${comment.userName}": "${comment.text.slice(0, 40)}..."`);
        }
      }
    }
  }

  // 3. Seed Reader Activity (Bookmarks, Reading Progress, Likes)
  console.log('\n--- 3. Seeding Reader Activity ---');
  const readerUserRef = db.collection('users').doc(readerUid);

  // Bookmark Book 1
  const firstBook = sampleData.books[0];
  await readerUserRef.collection('bookmarks').doc(firstBook.id).set({
    bookId: firstBook.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`  [Bookmark] User ${readerUid} bookmarked "${firstBook.title}"`);

  // Progress on Book 1
  await readerUserRef.collection('progress').doc(firstBook.id).set({
    lastChapter: 2,
    scrollPosition: 350,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`  [Progress] User ${readerUid} reading progress on "${firstBook.title}" (Ch 2, pos 350px)`);

  // Like on Book 1 Chapter 1
  const firstChapter = firstBook.chapters[0];
  await readerUserRef.collection('likes').doc(firstChapter.id).set({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`  [Like] User ${readerUid} liked chapter "${firstChapter.title}"`);

  // 4. Seed Newsletter Subscribers
  console.log('\n--- 4. Seeding Subscribers ---');
  for (const subscriber of sampleData.subscribers) {
    const subRef = db.collection('subscribers').doc(subscriber.id);
    await subRef.set(
      {
        email: subscriber.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`  [Subscriber] Registered: ${subscriber.email}`);
  }

  console.log('\n======================================================');
  console.log('🎉 Novelora database successfully seeded!');
  console.log('======================================================');
  console.log('Test Reader: reader@test.com / password123');
  console.log('Test Admin : admin@novelora.com / password123 (custom claim: admin=true)\n');
}

// Execute
seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error seeding database:', err);
    process.exit(1);
  });
