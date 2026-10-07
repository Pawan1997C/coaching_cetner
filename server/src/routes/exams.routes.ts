import { Router } from 'express';
import * as E from '../controllers/exam.controller';
import { restrictTo } from '../middleware/auth';

const r = Router();
r.get('/', E.list);
r.post('/', E.create);
r.get('/student/:studentId/results', E.studentResults);
r.get('/:id', E.get);
r.put('/:id', E.update);
r.delete('/:id', restrictTo('admin'), E.remove);
r.get('/:id/results', E.getResults);
r.put('/:id/results', E.saveResults);
export default r;
