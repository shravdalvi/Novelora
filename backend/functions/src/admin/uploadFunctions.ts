import { CallableRequest } from 'firebase-functions/v2/https';
import { assertAdmin } from '../middleware/assertAdmin';
import { validate } from '../middleware/validate';
import { GetUploadUrlSchema } from '../validators/chapterSchemas';
import { storage } from '../utils/firebase';
import { ApiResponse } from '../types';

export interface UploadUrlResult {
  uploadUrl: string;
  filePath: string;
  publicUrl: string;
}

/**
 * Generates a v4 signed PUT URL for uploading media (covers, backgrounds, avatars, etc.)
 * Expires in 15 minutes.
 */
export async function getUploadUrlHandler(
  request: CallableRequest
): Promise<ApiResponse<UploadUrlResult>> {
  assertAdmin(request);
  const data = validate(GetUploadUrlSchema, request.data);

  const bucket = storage.bucket();
  const bucketName =
    bucket.name ||
    process.env.STORAGE_BUCKET ||
    `${process.env.GCLOUD_PROJECT || 'novelora'}.firebasestorage.app`;

  // Sanitize file name and prefix with timestamp for uniqueness
  const sanitizedFileName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${data.folder}/${Date.now()}-${sanitizedFileName}`;
  const file = bucket.file(filePath);

  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: data.contentType,
  });

  const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

  return {
    success: true,
    data: {
      uploadUrl,
      filePath,
      publicUrl,
    },
    message: 'Upload URL generated successfully.',
  };
}

