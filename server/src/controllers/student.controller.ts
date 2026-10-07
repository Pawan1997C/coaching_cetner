import { Student } from '../models/Student';
import { makeCrud } from '../utils/crud';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { deleteFile, uploadBuffer } from '../config/cloudinary';

const crud = makeCrud(Student, {
  populate: [
    { path: 'batch', select: 'name' },
    { path: 'subjects', select: 'name' },
  ],
  search: ['name', 'rollNo', 'email', 'phone'],
  filters: ['batch', 'status'],
  sort: 'rollNo',
});

export const { list, get, update } = crud;

export const create = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  // Auto roll number (STU0001...). Fine for a single-admin setup; swap for a counter collection at scale.
  if (!body.rollNo) body.rollNo = `STU${String((await Student.countDocuments()) + 1).padStart(4, '0')}`;
  res.status(201).json(await Student.create(body));
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Attach an image as "avatar"');
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  const stored = await uploadBuffer(req.file, 'avatars');
  if (student.avatar?.publicId) await deleteFile(student.avatar.publicId, 'image').catch(() => null);
  student.avatar = { url: stored.url, publicId: stored.publicId };
  await student.save();
  res.json(student);
});

export const remove = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  if (student.avatar?.publicId) await deleteFile(student.avatar.publicId, 'image').catch(() => null);
  res.json({ message: 'Student deleted' });
});
