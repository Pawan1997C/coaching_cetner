import { Request } from 'express';
import { asyncHandler } from './asyncHandler';
import { ApiError } from './ApiError';
import { deleteFile, uploadBuffer } from '../config/cloudinary';

/** PUT handler that uploads req.file (field "image") to Cloudinary and stores it on `field` of the found doc. */
export const imageHandler = (find: (req: Request) => Promise<any>, field: string, folder: string) =>
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'Attach an image as "image"');
    const doc = await find(req);
    if (!doc) throw new ApiError(404, 'Not found');
    const old = doc.get(field)?.publicId as string | undefined;
    const stored = await uploadBuffer(req.file, folder);
    doc.set(field, { url: stored.url, publicId: stored.publicId });
    await doc.save();
    if (old) await deleteFile(old, 'image').catch(() => null); // replace, don't accumulate
    res.json(doc);
  });

export const dropImages = (doc: any, ...fields: string[]) =>
  Promise.all(fields.map((f) => (doc[f]?.publicId ? deleteFile(doc[f].publicId, 'image').catch(() => null) : null)));
