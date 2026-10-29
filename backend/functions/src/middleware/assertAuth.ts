import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

/**
 * Throws UNAUTHENTICATED if the caller is not signed in.
 */
export function assertAuth(request: CallableRequest): void {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }
}

