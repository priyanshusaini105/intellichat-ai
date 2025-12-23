import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../errors/custom-errors.js';

/**
 * Middleware factory for request validation using Zod schemas
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Get the first error message
        const firstError = error.issues[0];
        next(new ValidationError(firstError?.message || 'Validation failed'));
      } else {
        next(error);
      }
    }
  };
};
