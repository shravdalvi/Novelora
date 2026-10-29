import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { extractWordCount } from '../utils/wordCount';

/**
 * Triggered on any write to a chapter document: books/{bookId}/chapters/{chapterId}.
 * Recalculates and persists the chapter's wordCount if content has changed.
 */
export const onChapterWrite = onDocumentWritten(
  'books/{bookId}/chapters/{chapterId}',
  async (event) => {
    // If the document was deleted, nothing to recalculate
    if (!event.data || !event.data.after.exists) {
      return;
    }

    const beforeData = event.data.before?.exists ? event.data.before.data() : null;
    const afterData = event.data.after.data();

    if (!afterData) {
      return;
    }

    // Check if content was created or modified
    const beforeContent = beforeData ? JSON.stringify(beforeData.content) : null;
    const afterContent = JSON.stringify(afterData.content);

    if (beforeContent !== afterContent) {
      const calculatedWordCount = extractWordCount(afterData.content);

      // Only update if current wordCount does not match calculated to prevent infinite loops
      if (afterData.wordCount !== calculatedWordCount) {
        logger.info(
          `Updating word count for chapter ${event.params.chapterId} in book ${event.params.bookId}: ${afterData.wordCount} -> ${calculatedWordCount}`
        );

        await event.data.after.ref.update({
          wordCount: calculatedWordCount,
        });
      }
    }
  }
);

