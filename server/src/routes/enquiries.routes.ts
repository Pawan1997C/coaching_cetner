import { Router } from 'express';
import { Enquiry } from '../models/Enquiry';
import { makeCrud } from '../utils/crud';

const c = makeCrud(Enquiry, { filters: ['status'], search: ['name', 'phone', 'email'], sort: '-createdAt' });
const r = Router();
r.get('/', c.list);
r.put('/:id', c.update); // status, notes
r.delete('/:id', c.remove);
export default r;
