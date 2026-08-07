import multer from 'multer';

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    const name = (file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    const ok =
      name.endsWith('.pdf') ||
      name.endsWith('.docx') ||
      name.endsWith('.txt') ||
      name.endsWith('.md') ||
      name.endsWith('.rtf') ||
      mime === 'application/pdf' ||
      mime === 'application/x-pdf' ||
      mime === 'application/octet-stream' ||
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword' ||
      mime === 'text/plain' ||
      mime === 'text/markdown' ||
      mime === 'text/rtf' ||
      mime === 'application/rtf';
    if (!ok) {
      cb(new Error('Only PDF, DOCX, TXT, MD, or RTF resumes are supported'));
      return;
    }
    // Reject legacy .doc by extension even if mime is octet-stream
    if (name.endsWith('.doc') && !name.endsWith('.docx')) {
      cb(new Error('Legacy .doc is not supported. Save as PDF or DOCX.'));
      return;
    }
    cb(null, true);
  },
});
