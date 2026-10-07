import { Router } from 'express';
import * as A from '../controllers/analytics.controller';

const r = Router();
r.get('/overview', A.overview);
r.get('/attendance-trend', A.attendanceTrend);
r.get('/fee-collection', A.feeCollection);
r.get('/performance', A.performance);
r.get('/students/:id/report', A.studentReport);
export default r;
