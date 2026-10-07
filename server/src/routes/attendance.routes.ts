import { Router } from 'express';
import * as A from '../controllers/attendance.controller';

const r = Router();
r.get('/', A.getByDay); // ?batch=&date=YYYY-MM-DD
r.post('/', A.mark); // { batch, date, records: [{ student, status }] }
r.get('/report', A.report); // ?batch=&from=&to=
export default r;
