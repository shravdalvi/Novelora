import * as fs from 'fs';
import * as path from 'path';
import * as admin from 'firebase-admin';

// Attempt to load .env from various standard locations
function loadEnv(): void {
  const possibleEnvPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'functions/.env'),
    path.resolve(__dirname, '../functions/.env'),
    path.resolve(__dirname, '../../.env'),
  ];

  for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach((line) => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
              value = value.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = value.trim();
            }
          }
        });
        break;
      } catch {
        // Ignore file read error and continue
      }
    }
  }
}

loadEnv();

async function setAdminClaim(): Promise<void> {
  // 1. Read ADMIN_EMAIL from process.argv or process.env (defaults to primary author)
  const emailArg = process.argv[2];
  const email = emailArg || process.env.ADMIN_EMAIL || 'shravanidalvi70@gmail.com';

  if (!email) {
    console.error('❌ Error: No admin email provided.');
    console.error('\nUsage:');
    console.error('  npx ts-node scripts/setAdmin.ts <user-email>');
    console.error('  OR set ADMIN_EMAIL in your .env file and run:');
    console.error('  npm run set-admin\n');
    process.exit(1);
  }

  console.log(`🔍 Configuring admin privileges for: ${email}...`);

  // 2. Initialize Firebase Admin SDK
  // Check for service account file in standard locations
  const possibleKeyPaths = [
    path.resolve(__dirname, 'serviceAccount.json'),
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
    } else if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      console.log('🔧 Connecting to Firebase Local Emulator Suite...');
      credential = admin.credential.applicationDefault();
    } else {
      console.log(
        '⚠️  No serviceAccount.json found. Attempting Application Default Credentials.'
      );
      credential = admin.credential.applicationDefault();
    }
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential,
    });
  }

  const auth = admin.auth();
  const db = admin.firestore();

  try {
    // 3. Look up user by email
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;
    console.log(`✅ Found user record: UID=${uid}, Name=${userRecord.displayName || 'N/A'}`);

    // 4. Set custom claims { admin: true }
    const existingClaims = userRecord.customClaims || {};
    await auth.setCustomUserClaims(uid, {
      ...existingClaims,
      admin: true,
    });
    console.log(`✅ Custom claims updated: { admin: true }`);

    // 5. Create or update Firestore users/{uid} document with role: 'admin'
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      await userRef.update({
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Updated Firestore doc users/${uid} with role: 'admin'`);
    } else {
      await userRef.set({
        name: userRecord.displayName || 'Admin',
        email: userRecord.email,
        avatarUrl: userRecord.photoURL || '',
        role: 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Created Firestore doc users/${uid} with role: 'admin'`);
    }

    // 6. Success message with instructions
    console.log('\n🎉 ========================================================');
    console.log(`🎉 SUCCESS: Admin privileges granted to ${email}`);
    console.log('🎉 ========================================================');
    console.log('📌 IMPORTANT: Custom claims take effect on the client only');
    console.log('   after the user forces an ID token refresh.');
    console.log('   Please advise the user to:');
    console.log('     1. Sign out of Novelora completely');
    console.log('     2. Sign back in to receive the updated admin token\n');
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ User not found with email: ${email}`);
      console.error('   Please ensure the user has signed up before running this script.');
    } else {
      console.error('❌ Failed to assign admin claims:', error);
    }
    process.exit(1);
  }
}

setAdminClaim();

