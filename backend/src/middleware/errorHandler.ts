import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = 'APP_ERROR',
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
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // multer / upload filter errors
  if (err instanceof Error && /Only PDF|File too large|Unexpected field|resume/i.test(err.message)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION', message: err.message },
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
