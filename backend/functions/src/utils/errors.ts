import { HttpsError } from 'firebase-functions/v2/https';

export function notFound(resource: string): HttpsError {
  return new HttpsError('not-found', `${resource} not found.`);
}

export function serverError(message: string): HttpsError {
  return new HttpsError('internal', message);
}

