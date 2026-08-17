import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = 'APP_ERROR',
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Resource not found' },
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  // multer / upload filter errors
  if (err instanceof Error && /Only PDF|File too large|Unexpected field|Unexpected end of form/i.test(err.message)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION',
        message: /end of form/i.test(err.message)
          ? 'Resume upload failed. Keep USB connected and try again (up to 10 MB).'
          : err.message,
      },
    });
    return;
  }

  // Resume parse / PDF / DOCX extraction failures should be client-visible
  if (
    err instanceof Error &&
    /PDF|DOCX|\.doc|scanned|extract|Unsupported resume|little\/no text|mammoth|pdf-parse/i.test(
      err.message,
    )
  ) {
    res.status(400).json({
      success: false,
      error: { code: 'RESUME_PARSE', message: err.message },
    });
    return;
  }

  // Firestore rejects nested undefined / oversized docs — do not hide as 500
  if (
    err instanceof Error &&
    /undefined as a Firestore value|exceeds the maximum allowed size|INVALID_ARGUMENT|invalid-argument/i.test(
      err.message,
    )
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: 'RESUME_SAVE',
        message: 'Could not save this resume. Try a smaller PDF or a DOCX/TXT file.',
      },
    });
    return;
  }

  logger.error('Unhandled error', {
    requestId: req.requestId,
    err: err instanceof Error ? err.message : err,
    stack: err instanceof Error ? err.stack : undefined,
  });

  const detail =
    env.NODE_ENV === 'development' && err instanceof Error
      ? err.message
      : 'Internal server error';

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: detail },
  });
}
