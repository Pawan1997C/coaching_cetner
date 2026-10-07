import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { ApiError } from '../utils/ApiError';

const IMAGES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCS = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

const filter =
  (allowed: string[]) => (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) =>
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new ApiError(400, 'Unsupported file type. Allowed: PDF, Word (.doc/.docx), JPG, PNG, WebP'));

// Files are held in memory and streamed straight to Cloudinary (nothing touches disk).
export const uploadMaterial = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: filter([...DOCS, ...IMAGES]),
});

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: filter(IMAGES),
});
