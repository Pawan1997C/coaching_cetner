import { Router } from 'express';
import * as M from '../controllers/material.controller';
import { uploadMaterial } from '../middleware/upload';

const r = Router();
r.get('/', M.list);
r.post('/', uploadMaterial.single('file'), M.upload);
r.put('/:id', M.update);
r.delete('/:id', M.remove);
export default r;
