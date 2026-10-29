import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { assertAuth } from '../middleware/assertAuth';
import { validate } from '../middleware/validate';
import { AddCommentSchema, DeleteCommentSchema } from '../validators/commentSchemas';
import { notFound } from '../utils/errors';
import { db, FieldValue } from '../utils/firebase';
import { ApiResponse, Comment } from '../types';

export const ToggleLikeSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  chapterId: z.string().min(1, 'Chapter ID is required'),
});

export interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
}

/**
 * Toggles a user's like on a chapter.
 * Uses a transaction to ensure atomicity of the like status and like counter.
 */
export async function toggleLikeHandler(
  request: CallableRequest
): Promise<ApiResponse<ToggleLikeResult>> {
  assertAuth(request);
  const uid = request.auth!.uid;
  const data = validate(ToggleLikeSchema, request.data);

  const chapterRef = db
    .collection('books')
    .doc(data.bookId)
    .collection('chapters')
    .doc(data.chapterId);

  const likeRef = db
    .collection('users')
    .doc(uid)
    .collection('likes')
    .doc(data.chapterId);

  const result = await db.runTransaction(async (transaction) => {
    const chapterDoc = await transaction.get(chapterRef);
    if (!chapterDoc.exists) {
      throw notFound(`Chapter with ID ${data.chapterId}`);
    }

    const likeDoc = await transaction.get(likeRef);
    const currentLikeCount = chapterDoc.data()?.likeCount || 0;

    if (likeDoc.exists) {
      // User has already liked -> unlike
      const newCount = Math.max(0, currentLikeCount - 1);
      transaction.delete(likeRef);
      transaction.update(chapterRef, {
        likeCount: newCount,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { liked: false, likeCount: newCount };
    } else {
      // User has not liked yet -> like
      const newCount = currentLikeCount + 1;
      transaction.set(likeRef, {
        bookId: data.bookId,
        chapterId: data.chapterId,
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.update(chapterRef, {
        likeCount: newCount,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { liked: true, likeCount: newCount };
    }
  });

  return {
    success: true,
    data: result,
    message: result.liked ? 'Chapter liked.' : 'Chapter unliked.',
  };
}

/**
 * Adds a comment to a specific chapter.
 * Automatically fetches user display name and avatar from users/{uid}.
 */
export async function addCommentHandler(
  request: CallableRequest
): Promise<ApiResponse<Comment>> {
  assertAuth(request);
  const uid = request.auth!.uid;
  const data = validate(AddCommentSchema, request.data);

  const chapterRef = db
    .collection('books')
    .doc(data.bookId)
    .collection('chapters')
    .doc(data.chapterId);

  const chapterDoc = await chapterRef.get();
  if (!chapterDoc.exists) {
    throw notFound(`Chapter with ID ${data.chapterId}`);
  }

  // Fetch author details from Firestore users/{uid}
  let userName = (request.auth?.token.name as string) || 'Reader';
  let userAvatarUrl = (request.auth?.token.picture as string) || '';

  const userDoc = await db.collection('users').doc(uid).get();
  if (userDoc.exists) {
    const userData = userDoc.data();
    if (userData?.name) userName = userData.name;
    if (userData?.avatarUrl) userAvatarUrl = userData.avatarUrl;
  }

  const commentRef = chapterRef.collection('comments').doc();
  const now = FieldValue.serverTimestamp();

  const commentData = {
    id: commentRef.id,
    bookId: data.bookId,
    chapterId: data.chapterId,
    userId: uid,
    userName,
    userAvatarUrl,
    text: data.text,
    createdAt: now,
  };

  await commentRef.set(commentData);

  const createdSnap = await commentRef.get();
  const comment = { id: commentRef.id, ...createdSnap.data() } as Comment;

  return {
    success: true,
    data: comment,
    message: 'Comment added successfully.',
  };
}

/**
 * Deletes a comment. Only the author of the comment or an admin can delete it.
 */
export async function deleteOwnCommentHandler(
  request: CallableRequest
): Promise<ApiResponse<{ commentId: string }>> {
  assertAuth(request);
  const uid = request.auth!.uid;
  const isAdmin = !!request.auth?.token.admin;
  const data = validate(DeleteCommentSchema, request.data);

  const commentRef = db
    .collection('books')
    .doc(data.bookId)
    .collection('chapters')
    .doc(data.chapterId)
    .collection('comments')
    .doc(data.commentId);

  const commentDoc = await commentRef.get();
  if (!commentDoc.exists) {
    throw notFound(`Comment with ID ${data.commentId}`);
  }

  const commentData = commentDoc.data();
  if (commentData?.userId !== uid && !isAdmin) {
    throw new HttpsError(
      'permission-denied',
      'You do not have permission to delete this comment.'
    );
  }

  await commentRef.delete();

  return {
    success: true,
    data: { commentId: data.commentId },
    message: 'Comment deleted successfully.',
  };
}

