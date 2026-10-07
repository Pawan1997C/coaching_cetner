import { Router } from 'express';
import { Faculty } from '../models/Faculty';
import { uploadImage } from '../middleware/upload';
import { makeCrud } from '../utils/crud';
import { dropImages, imageHandler } from '../utils/imageField';

const c = makeCrud(Faculty, { search: ['name', 'designation'], sort: 'order createdAt', afterRemove: (d) => dropImages(d, 'photo') });
const r = Router();
r.get('/', c.list);
r.post('/', c.create);
r.put('/:id', c.update);
r.delete('/:id', c.remove);
r.put('/:id/photo', uploadImage.single('image'), imageHandler((req) => Faculty.findById(req.params.id), 'photo', 'faculty'));
export default r;
