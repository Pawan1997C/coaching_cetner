import { Router } from 'express';
import * as S from '../controllers/student.controller';
import { restrictTo } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';

const r = Router();
r.get('/', S.list);
r.post('/', S.create);
r.get('/:id', S.get);
r.put('/:id', S.update);
r.put('/:id/avatar', uploadImage.single('avatar'), S.uploadAvatar);
r.delete('/:id', restrictTo('admin'), S.remove);
export default r;
