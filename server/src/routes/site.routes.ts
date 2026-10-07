import { Router } from 'express';
import * as S from '../controllers/site.controller';
import { uploadImage } from '../middleware/upload';
import { imageHandler } from '../utils/imageField';

const r = Router();
const find = () => S.getSettings();
r.get('/', S.get);
r.put('/', S.update);
r.put('/logo', uploadImage.single('image'), imageHandler(find, 'logo', 'site'));
r.put('/hero', uploadImage.single('image'), imageHandler(find, 'heroImage', 'site'));
export default r;
