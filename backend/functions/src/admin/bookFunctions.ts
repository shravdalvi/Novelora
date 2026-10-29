import { CallableRequest } from 'firebase-functions/v2/https';
import { assertAdmin } from '../middleware/assertAdmin';
import { validate } from '../middleware/validate';
import {
  CreateBookSchema,
  UpdateBookSchema,
  DeleteBookSchema,
} from '../validators/bookSchemas';
import { slugify } from '../utils/slugify';
import { notFound } from '../utils/errors';
import { db, FieldValue } from '../utils/firebase';
import { ApiResponse, AdminStats, Book, Comment } from '../types';

/**
 * Creates a new book document in Firestore.
 * Requires admin privileges.
 */
export async function createBookHandler(
  request: CallableRequest
): Promise<ApiResponse<Book>> {
  assertAdmin(request);
  const data = validate(CreateBookSchema, request.data);

  // Generate URL slug from title
  let baseSlug = slugify(data.title);
  if (!baseSlug) {
    baseSlug = 'untitled-book';
  }

  // Ensure unique slug if a book with the same slug already exists
  let slug = baseSlug;
  const existingWithSlug = await db
    .collection('books')
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (!existingWithSlug.empty) {
    slug = `${baseSlug}-${Date.now().toString(36)}`;
  }

  const bookRef = db.collection('books').doc();
  const now = FieldValue.serverTimestamp();

  const newBookData = {
    id: bookRef.id,
    title: data.title,
    slug,
    description: data.description,
    genres: data.genres,
    tags: data.tags ?? [],
    status: data.status,
    visibility: data.visibility,
    coverImageUrl: data.coverImageUrl || '',
    chapterCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await bookRef.set(newBookData);

  const snapshot = await bookRef.get();
  const book = { id: bookRef.id, ...snapshot.data() } as Book;

  return {
    success: true,
    data: book,
    message: 'Book created successfully.',
  };
}

/**
 * Updates an existing book document.
 * Requires admin privileges.
 */
export async function updateBookHandler(
  request: CallableRequest
): Promise<ApiResponse<Book>> {
  assertAdmin(request);
  const data = validate(UpdateBookSchema, request.data);

  const bookRef = db.collection('books').doc(data.id);
  const bookDoc = await bookRef.get();

  if (!bookDoc.exists) {
    throw notFound(`Book with ID ${data.id}`);
  }

  const existingData = bookDoc.data() || {};
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (data.title !== undefined) {
    updates.title = data.title;
    // Regenerate slug if title changed
    if (data.title !== existingData.title) {
      const baseSlug = slugify(data.title) || 'untitled-book';
      let slug = baseSlug;
      const existingWithSlug = await db
        .collection('books')
        .where('slug', '==', slug)
        .limit(1)
        .get();

      if (!existingWithSlug.empty && existingWithSlug.docs[0].id !== data.id) {
        slug = `${baseSlug}-${Date.now().toString(36)}`;
      }
      updates.slug = slug;
    }
  }

  if (data.description !== undefined) updates.description = data.description;
  if (data.genres !== undefined) updates.genres = data.genres;
  if (data.tags !== undefined) updates.tags = data.tags;
  if (data.status !== undefined) updates.status = data.status;
  if (data.visibility !== undefined) updates.visibility = data.visibility;
  if (data.coverImageUrl !== undefined) updates.coverImageUrl = data.coverImageUrl;

  await bookRef.update(updates);

  const updatedSnap = await bookRef.get();
  const updatedBook = { id: bookRef.id, ...updatedSnap.data() } as Book;

  return {
    success: true,
    data: updatedBook,
    message: 'Book updated successfully.',
  };
}

/**
 * Deletes a book and all its subcollections (chapters, comments).
 * Requires admin privileges.
 */
export async function deleteBookHandler(
  request: CallableRequest
): Promise<ApiResponse<{ id: string }>> {
  assertAdmin(request);
  const data = validate(DeleteBookSchema, request.data);

  const bookRef = db.collection('books').doc(data.id);
  const bookDoc = await bookRef.get();

  if (!bookDoc.exists) {
    throw notFound(`Book with ID ${data.id}`);
  }

  // Delete all chapters in subcollection (along with comments)
  const chaptersSnapshot = await bookRef.collection('chapters').get();

  if (!chaptersSnapshot.empty) {
    const batches: FirebaseFirestore.WriteBatch[] = [db.batch()];
    let operationCount = 0;
    let currentBatchIndex = 0;

    for (const chapterDoc of chaptersSnapshot.docs) {
      // Delete any comments inside chapter
      const commentsSnapshot = await chapterDoc.ref.collection('comments').get();
      for (const commentDoc of commentsSnapshot.docs) {
        batches[currentBatchIndex].delete(commentDoc.ref);
        operationCount++;
        if (operationCount >= 450) {
          batches.push(db.batch());
          currentBatchIndex++;
          operationCount = 0;
        }
      }

      batches[currentBatchIndex].delete(chapterDoc.ref);
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
  }

  // Delete the book doc itself
  await bookRef.delete();

  return {
    success: true,
    data: { id: data.id },
    message: 'Book and its chapters deleted successfully.',
  };
}

/**
 * Retrieves aggregate platform statistics for admin dashboard.
 * Requires admin privileges.
 */
export async function getAdminStatsHandler(
  request: CallableRequest
): Promise<ApiResponse<AdminStats>> {
  assertAdmin(request);

  // Books stats
  const booksSnapshot = await db.collection('books').get();
  let totalBooks = 0;
  let publishedBooks = 0;
  let draftBooks = 0;

  for (const doc of booksSnapshot.docs) {
    totalBooks++;
    const book = doc.data();
    if (book.visibility === 'published') {
      publishedBooks++;
    } else {
      draftBooks++;
    }
  }

  // Chapters stats via collectionGroup
  const chaptersSnapshot = await db.collectionGroup('chapters').get();
  let totalChapters = 0;
  let publishedChapters = 0;
  let draftChapters = 0;

  for (const doc of chaptersSnapshot.docs) {
    totalChapters++;
    const chapter = doc.data();
    if (chapter.status === 'published') {
      publishedChapters++;
    } else {
      draftChapters++;
    }
  }

  // Recent 5 comments across platform via collectionGroup
  const commentsSnapshot = await db
    .collectionGroup('comments')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();

  const recentComments: Comment[] = commentsSnapshot.docs.map((doc) => {
    const commentData = doc.data();
    // Path structure: books/{bookId}/chapters/{chapterId}/comments/{commentId}
    const pathParts = doc.ref.path.split('/');
    const bookId = pathParts[1] || '';
    const chapterId = pathParts[3] || '';

    return {
      id: doc.id,
      bookId,
      chapterId,
      userId: commentData.userId || '',
      userName: commentData.userName || 'Anonymous Reader',
      userAvatarUrl: commentData.userAvatarUrl || '',
      text: commentData.text || '',
      createdAt: commentData.createdAt,
    };
  });

  return {
    success: true,
    data: {
      totalBooks,
      publishedBooks,
      draftBooks,
      totalChapters,
      publishedChapters,
      draftChapters,
      recentComments,
    },
    message: 'Admin stats retrieved successfully.',
  };
}
