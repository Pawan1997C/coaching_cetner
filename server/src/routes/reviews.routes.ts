import { Router } from 'express';
import { Review } from '../models/Review';
import { makeCrud } from '../utils/crud';

const c = makeCrud(Review, { filters: ['status'], search: ['name', 'text'], sort: '-createdAt' });
const r = Router();
r.get('/', c.list);
r.post('/', c.create); // admin-added reviews are published immediately
r.put('/:id', c.update); // edit text or change status (publish / hide)
r.delete('/:id', c.remove);
export default r;
