import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { validate } from '../middleware/validate';
import { SubscribeSchema } from '../validators/newsletterSchema';
import { db, FieldValue } from '../utils/firebase';
import { ApiResponse } from '../types';

export interface Subscriber {
  id: string;
  email: string;
  createdAt: unknown;
}

/**
 * Subscribes an email to the newsletter.
 * No authentication required. Checks for uniqueness.
 */
export async function subscribeNewsletterHandler(
  request: CallableRequest
): Promise<ApiResponse<Subscriber>> {
  const data = validate(SubscribeSchema, request.data);
  const normalizedEmail = data.email.toLowerCase().trim();

  // Check if email is already registered
  const existingSubscribers = await db
    .collection('subscribers')
    .where('email', '==', normalizedEmail)
    .limit(1)
    .get();

  if (!existingSubscribers.empty) {
    throw new HttpsError(
      'already-exists',
      'This email is already subscribed to the newsletter.'
    );
  }

  const subscriberRef = db.collection('subscribers').doc();
  const now = FieldValue.serverTimestamp();

  const subscriberData = {
    id: subscriberRef.id,
    email: normalizedEmail,
    createdAt: now,
  };

  await subscriberRef.set(subscriberData);

  const createdSnap = await subscriberRef.get();
  const subscriber = { id: subscriberRef.id, ...createdSnap.data() } as Subscriber;

  return {
    success: true,
    data: subscriber,
    message: "You're subscribed! We'll notify you of new chapters.",
  };
}

