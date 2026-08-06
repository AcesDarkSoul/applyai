import multer from 'multer';

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    const name = (file.originalname || '').toLowerCase();
    const ok =
      name.endsWith('.pdf') ||
      name.endsWith('.docx') ||
      name.endsWith('.txt') ||
      name.endsWith('.md') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'text/markdown';
    if (!ok) {
      cb(new Error('Only PDF, DOCX, TXT, or MD resumes are supported'));
      return;
    }
    cb(null, true);
  },
});
