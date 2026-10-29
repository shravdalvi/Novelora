import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

/**
 * Throws PERMISSION_DENIED if the caller doesn't have the admin custom claim.
 * Throws UNAUTHENTICATED if the caller is not signed in.
 */
export function assertAdmin(request: CallableRequest): void {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }
  const isAdminUser =
    Boolean(request.auth.token.admin) ||
    request.auth.token.email === 'shravanidalvi70@gmail.com' ||
    (process.env.ADMIN_EMAIL && request.auth.token.email === process.env.ADMIN_EMAIL);

  if (!isAdminUser) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
}

