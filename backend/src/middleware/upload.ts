import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    cb(null, true);
  },
});

/** JSON uploads must skip multer — Android sends base64 JSON, not multipart. */
export function optionalResumeUpload(req: Request, res: Response, next: NextFunction): void {
  const ct = String(req.headers['content-type'] || '').toLowerCase();
  if (ct.includes('application/json')) {
    next();
    return;
  }
  resumeUpload.single('resume')(req, res, next);
}
