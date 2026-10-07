import { Material } from '../models/Material';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { deleteFile, uploadBuffer } from '../config/cloudinary';

export const list = asyncHandler(async (req, res) => {
  const filter: Record<string, any> = {};
  if (req.query.batch) filter.batch = String(req.query.batch);
  if (req.query.subject) filter.subject = String(req.query.subject);
  if (req.query.q) filter.title = { $regex: String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const items = await Material.find(filter)
    .populate('batch', 'name')
    .populate('subject', 'name')
    .populate('uploadedBy', 'name')
    .sort('-createdAt')
    .limit(200);
  res.json({ items, total: items.length });
});

export const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Attach a file as "file"');
  const { title, description, batch, subject } = req.body;
  if (!title) throw new ApiError(400, 'title is required');
  const file = await uploadBuffer(req.file, 'materials');
  try {
    const doc = await Material.create({
      title,
      description,
      batch: batch || undefined,
      subject: subject || undefined,
      file,
      uploadedBy: req.user!._id,
    });
    res.status(201).json(doc);
  } catch (e) {
    await deleteFile(file.publicId, file.resourceType).catch(() => null); // don't orphan the upload
    throw e;
  }
});

export const update = asyncHandler(async (req, res) => {
  const { title, description, batch, subject } = req.body; // metadata only; re-upload to replace the file
  const doc = await Material.findByIdAndUpdate(
    req.params.id,
    { title, description, batch, subject },
    { new: true, runValidators: true }
  );
  if (!doc) throw new ApiError(404, 'Material not found');
  res.json(doc);
});

export const remove = asyncHandler(async (req, res) => {
  const doc = await Material.findByIdAndDelete(req.params.id);
  if (!doc) throw new ApiError(404, 'Material not found');
  await deleteFile(doc.file!.publicId, doc.file!.resourceType as 'image' | 'raw').catch(() => null);
  res.json({ message: 'Material deleted' });
});
