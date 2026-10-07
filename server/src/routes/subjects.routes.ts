import { Router } from 'express';
import { Subject } from '../models/Subject';
import { restrictTo } from '../middleware/auth';
import { makeCrud } from '../utils/crud';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { Batch } from '../models/Batch';
import { Course } from '../models/Course';
import { Exam } from '../models/Exam';
import { Student } from '../models/Student';

const c = makeCrud(Subject, { search: ['name', 'code'], sort: 'name' });
const r = Router();
r.get('/', c.list);
r.post('/', restrictTo('admin'), c.create);
r.put('/:id', restrictTo('admin'), c.update);
// A subject that is still in use can't be deleted; remove it from those places first.
r.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const [batches, courses, exams, students] = await Promise.all([
    Batch.countDocuments({ subjects: id }), Course.countDocuments({ subjects: id }),
    Exam.countDocuments({ subject: id }), Student.countDocuments({ subjects: id }),
  ]);
  const used = [batches && `${batches} batch${batches > 1 ? 'es' : ''}`, courses && `${courses} website class${courses > 1 ? 'es' : ''}`, exams && `${exams} exam${exams > 1 ? 's' : ''}`, students && `${students} student${students > 1 ? 's' : ''}`].filter(Boolean).join(', ');
  if (used) throw new ApiError(409, `This subject is still used by ${used}. Remove it from them first.`);
  return c.remove(req, res, next);
}));
export default r;
