import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type ResourceType = 'image' | 'raw';

export interface StoredFile {
  url: string;
  publicId: string;
  resourceType: ResourceType;
  format?: string;
  bytes: number;
  originalName: string;
  mimeType: string;
}

/**
 * Images go up as `image` resources (so you can transform/thumbnail them).
 * PDF and Word files go up as `raw` resources, which avoids Cloudinary's
 * default block on delivering PDFs stored as images.
 */
export const uploadBuffer = (file: Express.Multer.File, subfolder: string): Promise<StoredFile> => {
  const isImage = file.mimetype.startsWith('image/');
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const publicId = isImage
    ? `${Date.now()}-${safeName.replace(/\.[^.]+$/, '')}`
    : `${Date.now()}-${safeName}`; // raw files keep their extension

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${env.CLOUDINARY_FOLDER}/${subfolder}`,
        resource_type: isImage ? 'image' : 'raw',
        public_id: publicId,
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Cloudinary upload failed'));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: isImage ? 'image' : 'raw',
          format: result.format,
          bytes: result.bytes,
          originalName: file.originalname,
          mimeType: file.mimetype,
        });
      }
    );
    stream.end(file.buffer);
  });
};

export const deleteFile = (publicId: string, resourceType: ResourceType = 'image') =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });

export default cloudinary;
