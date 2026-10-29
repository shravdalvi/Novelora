/**
 * Novelora Live Database Seed Script
 *
 * Seeds initial books and chapters directly into your live Firebase Firestore:
 * Project: novelora-60cfc
 *
 * Usage:
 *  1. Place your Firebase service account key in:
 *     backend/scripts/serviceAccount.json
 *     (Download from Firebase Console -> Project Settings -> Service Accounts -> Generate new private key)
 *  2. Run:
 *     npm run seed:live
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'novelora-60cfc';

// Resolve service account key
const possibleKeyPaths = [
  path.resolve(__dirname, '../../backend/scripts/serviceAccount.json'),
  path.resolve(__dirname, '../serviceAccount.json'),
  path.resolve(process.cwd(), 'serviceAccount.json'),
];

let credential: admin.credential.Credential | undefined;

for (const keyPath of possibleKeyPaths) {
  if (fs.existsSync(keyPath)) {
    console.log(`🔑 Using service account credentials from: ${keyPath}`);
    credential = admin.credential.cert(keyPath);
    break;
  }
}

if (!credential) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('🔑 Using GOOGLE_APPLICATION_CREDENTIALS environment variable.');
    credential = admin.credential.applicationDefault();
  } else {
    console.log('⚠️  No serviceAccount.json found. Attempting Application Default Credentials for:', PROJECT_ID);
    credential = admin.credential.applicationDefault();
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential,
    projectId: PROJECT_ID,
    storageBucket: `${PROJECT_ID}.firebasestorage.app`,
  });
}

const db = admin.firestore();

// Load sample data
const sampleDataPath = path.resolve(__dirname, 'sampleData.json');
const rawData = fs.readFileSync(sampleDataPath, 'utf8');
const sampleData = JSON.parse(rawData);

async function seedLiveDatabase() {
  console.log('\n======================================================');
  console.log(`🚀 Starting Novelora Live Firestore Seed (${PROJECT_ID})`);
  console.log('======================================================\n');

  // Seed Books and Chapters
  console.log('--- Seeding Books and Chapters ---');
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
    console.log(`✅ [Book] Seeded: "${book.title}" (slug: ${book.slug}, visibility: ${book.visibility})`);

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
        `   └─ [Chapter ${chapter.chapterNumber}] "${chapter.title}" (status: ${chapter.status}, words: ${chapter.wordCount})`
      );

      // Seed initial comments if any
      if (comments && comments.length > 0) {
        for (const comment of comments) {
          const commentRef = chapterRef.collection('comments').doc(comment.id);
          await commentRef.set(
            {
              userId: comment.userId,
              userName: comment.userName,
              text: comment.text,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      }
    }
  }

  console.log('\n======================================================');
  console.log('🎉 Live Firestore seeding complete!');
  console.log('Your books are now live in Firestore and visible on the website.');
  console.log('======================================================\n');
}

seedLiveDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Error seeding live database:', err);
    console.error('\nTip: Make sure you have downloaded your Firebase Service Account key:');
    console.error('1. Go to Firebase Console -> Project Settings -> Service Accounts');
    console.error('2. Click "Generate new private key"');
    console.error('3. Save it to backend/scripts/serviceAccount.json\n');
    process.exit(1);
  });

