import { Router } from 'express';
import { Course } from '../models/Course';
import { uploadImage } from '../middleware/upload';
import { makeCrud } from '../utils/crud';
import { dropImages, imageHandler } from '../utils/imageField';

const c = makeCrud(Course, {
  populate: [{ path: 'subjects', select: 'name' }],
  search: ['title', 'level'],
  sort: 'order createdAt',
  afterRemove: (d) => dropImages(d, 'image'),
});
const r = Router();
r.get('/', c.list);
r.post('/', c.create);
r.put('/:id', c.update);
r.delete('/:id', c.remove);
r.put('/:id/image', uploadImage.single('image'), imageHandler((req) => Course.findById(req.params.id), 'image', 'courses'));
export default r;
