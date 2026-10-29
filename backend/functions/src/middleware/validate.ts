import { HttpsError } from 'firebase-functions/v2/https';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validates data against a Zod schema, throws INVALID_ARGUMENT on failure.
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new HttpsError('invalid-argument', `Validation error: ${messages}`);
    }
    throw err;
  }
}

