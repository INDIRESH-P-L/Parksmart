// validate(schema, source?) — runs req[source] through a zod schema.
//
// On success the parsed value (coerced, trimmed, defaulted) REPLACES the raw
// input, so controllers only ever see clean data. Query strings are the one
// exception: Express defines req.query as a getter, so the parsed result is
// stored on req.validatedQuery instead of being reassigned.
//
// On failure → 422 with a per-field issue list in the standard envelope.
import { ApiError } from '../utils/response.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || source,
      message: issue.message,
    }));
    return next(new ApiError(422, 'Validation failed', errors));
  }
  if (source === 'query') {
    req.validatedQuery = result.data;
  } else {
    req[source] = result.data;
  }
  return next();
};
