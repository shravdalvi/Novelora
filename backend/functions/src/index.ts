import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

// Book handlers
import {
  createBookHandler,
  updateBookHandler,
  deleteBookHandler,
  getAdminStatsHandler,
} from './admin/bookFunctions';

// Chapter handlers
import {
  createChapterHandler,
  updateChapterHandler,
  deleteChapterHandler,
  publishChapterHandler,
  scheduleChapterHandler,
  reorderChaptersHandler,
} from './admin/chapterFunctions';

// Media upload handler
import { getUploadUrlHandler } from './admin/uploadFunctions';

// Reader handlers
import {
  toggleLikeHandler,
  addCommentHandler,
  deleteOwnCommentHandler,
} from './admin/readerFunctions';

// Public newsletter handler
import { subscribeNewsletterHandler } from './admin/publicFunctions';

// Scheduled handler
import { publishScheduledChaptersHandler } from './scheduled/publishScheduled';

// Triggers
import { onUserCreate } from './triggers/onUserCreate';
import { onChapterWrite } from './triggers/onChapterWrite';

// -------------------------------------------------------------
// Admin - Book Functions
// -------------------------------------------------------------
export const createBook = onCall(async (request) => {
  return createBookHandler(request);
});

export const updateBook = onCall(async (request) => {
  return updateBookHandler(request);
});

export const deleteBook = onCall(async (request) => {
  return deleteBookHandler(request);
});

export const getAdminStats = onCall(async (request) => {
  return getAdminStatsHandler(request);
});

// -------------------------------------------------------------
// Admin - Chapter Functions
// -------------------------------------------------------------
export const createChapter = onCall(async (request) => {
  return createChapterHandler(request);
});

export const updateChapter = onCall(async (request) => {
  return updateChapterHandler(request);
});

export const deleteChapter = onCall(async (request) => {
  return deleteChapterHandler(request);
});

export const publishChapter = onCall(async (request) => {
  return publishChapterHandler(request);
});

export const scheduleChapter = onCall(async (request) => {
  return scheduleChapterHandler(request);
});

export const reorderChapters = onCall(async (request) => {
  return reorderChaptersHandler(request);
});

// -------------------------------------------------------------
// Admin - Upload Function
// -------------------------------------------------------------
export const getUploadUrl = onCall(async (request) => {
  return getUploadUrlHandler(request);
});

// -------------------------------------------------------------
// Reader Functions
// -------------------------------------------------------------
export const toggleLike = onCall(async (request) => {
  return toggleLikeHandler(request);
});

export const addComment = onCall(async (request) => {
  return addCommentHandler(request);
});

export const deleteOwnComment = onCall(async (request) => {
  return deleteOwnCommentHandler(request);
});

// -------------------------------------------------------------
// Public Functions
// -------------------------------------------------------------
export const subscribeNewsletter = onCall(async (request) => {
  return subscribeNewsletterHandler(request);
});

// -------------------------------------------------------------
// Scheduled Tasks
// -------------------------------------------------------------
export const publishScheduledChapters = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'UTC',
  },
  async (event) => {
    return publishScheduledChaptersHandler(event);
  }
);

// -------------------------------------------------------------
// Event Triggers
// -------------------------------------------------------------
export const onNewUser = onUserCreate;
export const onChapterWritten = onChapterWrite;

