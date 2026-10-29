import * as functions from 'firebase-functions/v1';
import * as logger from 'firebase-functions/logger';
import { db, FieldValue } from '../utils/firebase';

/**
 * Triggered when a new user signs up in Firebase Auth.
 * Automatically creates a Firestore profile in users/{uid} with default reader role.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user: functions.auth.UserRecord) => {
  try {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const userData = {
        name: user.displayName || 'Reader',
        email: user.email || '',
        avatarUrl: user.photoURL || '',
        role: 'reader',
        createdAt: FieldValue.serverTimestamp(),
      };

      await userRef.set(userData);
      logger.info(`Successfully created user document for UID: ${user.uid}`);
    }
  } catch (error) {
    logger.error(`Error in onUserCreate trigger for UID ${user.uid}:`, error);
    throw error;
  }
});
