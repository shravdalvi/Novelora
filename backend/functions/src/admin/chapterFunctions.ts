import { CallableRequest } from 'firebase-functions/v2/https';
import { assertAdmin } from '../middleware/assertAdmin';
import { validate } from '../middleware/validate';
import {
  CreateChapterSchema,
  UpdateChapterSchema,
  DeleteChapterSchema,
  PublishChapterSchema,
  ScheduleChapterSchema,
  ReorderChaptersSchema,
} from '../validators/chapterSchemas';
import { extractWordCount } from '../utils/wordCount';
import { notFound } from '../utils/errors';
import { db, FieldValue } from '../utils/firebase';
import { ApiResponse, Chapter } from '../types';

/**
 * Creates a new chapter for a given book.
 * Auto-assigns the next chapter number, computes word count,
 * and increments the book's chapterCount.
 */
export async function createChapterHandler(
  request: CallableRequest
): Promise<ApiResponse<Chapter>> {
  assertAdmin(request);
  const data = validate(CreateChapterSchema, request.data);

  const bookRef = db.collection('books').doc(data.bookId);
  const bookDoc = await bookRef.get();

  if (!bookDoc.exists) {
    throw notFound(`Book with ID ${data.bookId}`);
  }

  const bookData = bookDoc.data() || {};
  const currentChapterCount = typeof bookData.chapterCount === 'number' ? bookData.chapterCount : 0;
  const chapterNumber = currentChapterCount + 1;

  const wordCount = extractWordCount(data.content);
  const chapterRef = bookRef.collection('chapters').doc();
  const now = FieldValue.serverTimestamp();

  const chapterData = {
    id: chapterRef.id,
    bookId: data.bookId,
    chapterNumber,
    title: data.title,
    content: data.content ?? {},
    wordCount,
    likeCount: 0,
    backgroundImageUrl: data.backgroundImageUrl || '',
    overlayOpacity: data.overlayOpacity ?? 0.5,
    status: data.status,
    scheduledPublishAt: data.scheduledPublishAt || null,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(chapterRef, chapterData);
  batch.update(bookRef, {
    chapterCount: FieldValue.increment(1),
    updatedAt: now,
  });

  await batch.commit();

  const createdSnap = await chapterRef.get();
  const chapter = { id: chapterRef.id, ...createdSnap.data() } as Chapter;

  return {
    success: true,
    data: chapter,
    message: 'Chapter created successfully.',
  };
}

/**
 * Updates an existing chapter. Recalculates word count if content changed.
 */
export async function updateChapterHandler(
  request: CallableRequest
): Promise<ApiResponse<Chapter>> {
  assertAdmin(request);
  const data = validate(UpdateChapterSchema, request.data);

  const bookRef = db.collection('books').doc(data.bookId);
  const chapterRef = bookRef.collection('chapters').doc(data.id);
  const chapterDoc = await chapterRef.get();

  if (!chapterDoc.exists) {
    throw notFound(`Chapter with ID ${data.id} in book ${data.bookId}`);
  }

  const now = FieldValue.serverTimestamp();
  const updates: Record<string, unknown> = {
    updatedAt: now,
  };

  if (data.title !== undefined) updates.title = data.title;
  if (data.backgroundImageUrl !== undefined) updates.backgroundImageUrl = data.backgroundImageUrl || '';
  if (data.overlayOpacity !== undefined) updates.overlayOpacity = data.overlayOpacity;
  if (data.status !== undefined) updates.status = data.status;
  if (data.scheduledPublishAt !== undefined) updates.scheduledPublishAt = data.scheduledPublishAt;

  if (data.content !== undefined) {
    updates.content = data.content;
    updates.wordCount = extractWordCount(data.content);
  }

  const batch = db.batch();
  batch.update(chapterRef, updates);
  batch.update(bookRef, { updatedAt: now });

  await batch.commit();

  const updatedSnap = await chapterRef.get();
  const chapter = { id: chapterRef.id, ...updatedSnap.data() } as Chapter;

  return {
    success: true,
    data: chapter,
    message: 'Chapter updated successfully.',
  };
}

/**
 * Deletes a chapter, decrements the book's chapterCount,
 * and renumbers the remaining chapters sequentially.
 */
export async function deleteChapterHandler(
  request: CallableRequest
): Promise<ApiResponse<{ id: string; bookId: string }>> {
  assertAdmin(request);
  const data = validate(DeleteChapterSchema, request.data);

  const bookRef = db.collection('books').doc(data.bookId);
  const chapterRef = bookRef.collection('chapters').doc(data.id);
  const chapterDoc = await chapterRef.get();

  if (!chapterDoc.exists) {
    throw notFound(`Chapter with ID ${data.id} in book ${data.bookId}`);
  }

  // Delete all comments belonging to this chapter
  const commentsSnapshot = await chapterRef.collection('comments').get();
  const batch = db.batch();

  for (const commentDoc of commentsSnapshot.docs) {
    batch.delete(commentDoc.ref);
  }

  batch.delete(chapterRef);
  batch.update(bookRef, {
    chapterCount: FieldValue.increment(-1),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  // Renumber remaining chapters sequentially
  const remainingChaptersSnapshot = await bookRef
    .collection('chapters')
    .orderBy('chapterNumber', 'asc')
    .get();

  if (!remainingChaptersSnapshot.empty) {
    const renumberBatch = db.batch();
    let index = 1;
    let needsUpdate = false;

    for (const doc of remainingChaptersSnapshot.docs) {
      if (doc.data().chapterNumber !== index) {
        renumberBatch.update(doc.ref, {
          chapterNumber: index,
          updatedAt: FieldValue.serverTimestamp(),
        });
        needsUpdate = true;
      }
      index++;
    }

    if (needsUpdate) {
      await renumberBatch.commit();
    }
  }

  return {
    success: true,
    data: { id: data.id, bookId: data.bookId },
    message: 'Chapter deleted and remaining chapters renumbered successfully.',
  };
}

/**
 * Publishes a chapter immediately, clearing any scheduled publish timestamp.
 */
export async function publishChapterHandler(
  request: CallableRequest
): Promise<ApiResponse<Chapter>> {
  assertAdmin(request);
  const data = validate(PublishChapterSchema, request.data);

  const bookRef = db.collection('books').doc(data.bookId);
  const chapterRef = bookRef.collection('chapters').doc(data.id);
  const chapterDoc = await chapterRef.get();

  if (!chapterDoc.exists) {
    throw notFound(`Chapter with ID ${data.id} in book ${data.bookId}`);
  }

  const now = FieldValue.serverTimestamp();
  const batch = db.batch();

  batch.update(chapterRef, {
    status: 'published',
    scheduledPublishAt: null,
    updatedAt: now,
  });

  batch.update(bookRef, {
    updatedAt: now,
  });

  await batch.commit();

  const updatedSnap = await chapterRef.get();
  const chapter = { id: chapterRef.id, ...updatedSnap.data() } as Chapter;

  return {
    success: true,
    data: chapter,
    message: 'Chapter published successfully.',
  };
}

/**
 * Schedules a chapter for future publication.
 */
export async function scheduleChapterHandler(
  request: CallableRequest
): Promise<ApiResponse<Chapter>> {
  assertAdmin(request);
  const data = validate(ScheduleChapterSchema, request.data);

  const bookRef = db.collection('books').doc(data.bookId);
  const chapterRef = bookRef.collection('chapters').doc(data.id);
  const chapterDoc = await chapterRef.get();

  if (!chapterDoc.exists) {
    throw notFound(`Chapter with ID ${data.id} in book ${data.bookId}`);
  }

  const now = FieldValue.serverTimestamp();
  const batch = db.batch();

  batch.update(chapterRef, {
    status: 'draft',
    scheduledPublishAt: data.scheduledPublishAt,
    updatedAt: now,
  });

  batch.update(bookRef, {
    updatedAt: now,
  });

  await batch.commit();

  const updatedSnap = await chapterRef.get();
  const chapter = { id: chapterRef.id, ...updatedSnap.data() } as Chapter;

  return {
    success: true,
    data: chapter,
    message: 'Chapter scheduled for publication successfully.',
  };
}

/**
 * Reorders chapters based on the provided ordered IDs array.
 */
export async function reorderChaptersHandler(
  request: CallableRequest
): Promise<ApiResponse<{ bookId: string; orderedIds: string[] }>> {
  assertAdmin(request);
  const data = validate(ReorderChaptersSchema, request.data);

  const bookRef = db.collection('books').doc(data.bookId);
  const bookDoc = await bookRef.get();

  if (!bookDoc.exists) {
    throw notFound(`Book with ID ${data.bookId}`);
  }

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  data.orderedIds.forEach((chapterId, index) => {
    const chapterRef = bookRef.collection('chapters').doc(chapterId);
    batch.update(chapterRef, {
      chapterNumber: index + 1,
      updatedAt: now,
    });
  });

  batch.update(bookRef, {
    updatedAt: now,
  });

  await batch.commit();

  return {
    success: true,
    data: {
      bookId: data.bookId,
      orderedIds: data.orderedIds,
    },
    message: 'Chapters reordered successfully.',
  };
}

