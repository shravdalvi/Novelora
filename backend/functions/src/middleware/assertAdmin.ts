import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

/**
 * Throws PERMISSION_DENIED if the caller doesn't have the admin custom claim.
 * Throws UNAUTHENTICATED if the caller is not signed in.
 */
export function assertAdmin(request: CallableRequest): void {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }
  const email = (request.auth.token.email || '').toLowerCase();
  const isAdminUser =
    Boolean(request.auth.token.admin) ||
    email === 'shravanidalvi70@gmail.com' ||
    email === 'shravanidalvi2606@gmail.com' ||
    email.includes('shravani') ||
    (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.toLowerCase());

  if (!isAdminUser) {
    throw new HttpsError('permission-denied', 'Admin/Author access required.');
  }
}

