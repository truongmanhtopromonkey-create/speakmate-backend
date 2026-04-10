import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    req.validated = schema.parse({ body: req.body, headers: req.headers, params: req.params, query: req.query });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ ok: false, code: 'BAD_REQUEST', error: error.flatten() });
    }
    next(error);
  }
};
