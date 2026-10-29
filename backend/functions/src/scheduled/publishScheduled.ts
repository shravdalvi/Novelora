import { ScheduledEvent } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { db, FieldValue } from '../utils/firebase';

/**
 * Periodically checks for draft chapters that have a scheduledPublishAt date in the past.
 * Transitions their status to 'published', updates the parent book's updatedAt timestamp,
 * and clears the scheduledPublishAt field.
 */
export async function publishScheduledChaptersHandler(
  _event: ScheduledEvent
): Promise<void> {
  const nowIso = new Date().toISOString();
  logger.info(`Checking scheduled chapters to publish before: ${nowIso}`);

  try {
    const scheduledSnapshot = await db
      .collectionGroup('chapters')
      .where('status', '==', 'draft')
      .where('scheduledPublishAt', '<=', nowIso)
      .get();

    if (scheduledSnapshot.empty) {
      logger.info('No scheduled chapters due for publishing.');
      return;
    }

    logger.info(`Found ${scheduledSnapshot.size} chapters ready to publish.`);

    const batches: FirebaseFirestore.WriteBatch[] = [db.batch()];
    let currentBatchIndex = 0;
    let operationCount = 0;
    const bookIdsToUpdate = new Set<string>();

    for (const chapterDoc of scheduledSnapshot.docs) {
      const parentBookRef = chapterDoc.ref.parent.parent;
      if (parentBookRef) {
        bookIdsToUpdate.add(parentBookRef.id);
      }

      batches[currentBatchIndex].update(chapterDoc.ref, {
        status: 'published',
        scheduledPublishAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      operationCount++;

      if (operationCount >= 450) {
        batches.push(db.batch());
        currentBatchIndex++;
        operationCount = 0;
      }
    }

    // Update updatedAt for each parent book
    for (const bookId of bookIdsToUpdate) {
      const bookRef = db.collection('books').doc(bookId);
      batches[currentBatchIndex].update(bookRef, {
        updatedAt: FieldValue.serverTimestamp(),
      });
      operationCount++;

      if (operationCount >= 450) {
        batches.push(db.batch());
        currentBatchIndex++;
        operationCount = 0;
      }
    }

    for (const batch of batches) {
      await batch.commit();
    }

    logger.info(
      `Successfully published ${scheduledSnapshot.size} chapter(s) across ${bookIdsToUpdate.size} book(s).`
    );
  } catch (error) {
    logger.error('Error publishing scheduled chapters:', error);
    throw error;
  }
}

