import { Router } from 'express';
import { Batch } from '../models/Batch';
import { restrictTo } from '../middleware/auth';
import { makeCrud } from '../utils/crud';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { Student } from '../models/Student';
import { Exam } from '../models/Exam';

const c = makeCrud(Batch, { populate: [{ path: 'subjects', select: 'name' }], search: ['name'], filters: ['active'], sort: 'name' });
const r = Router();
r.get('/', c.list);
r.post('/', restrictTo('admin'), c.create);
r.get('/:id', c.get);
r.put('/:id', restrictTo('admin'), c.update);
// A batch with students or exams can't be deleted; mark it inactive instead.
r.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res, next) => {
  const [students, exams] = await Promise.all([Student.countDocuments({ batch: req.params.id }), Exam.countDocuments({ batch: req.params.id })]);
  if (students || exams) {
    const used = [students && `${students} student${students > 1 ? 's' : ''}`, exams && `${exams} exam${exams > 1 ? 's' : ''}`].filter(Boolean).join(' and ');
    throw new ApiError(409, `This batch still has ${used}. Move them to another batch first, or untick "Active" to retire the batch instead.`);
  }
  return c.remove(req, res, next);
}));
export default r;
