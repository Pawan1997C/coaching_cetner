import { Router } from 'express';
import * as F from '../controllers/fee.controller';
import { restrictTo } from '../middleware/auth';

const r = Router();
r.use(restrictTo('admin')); // money stays with admins; loosen if teachers should collect fees
r.get('/', F.list); // ?pending=true&student=&batch=&status=
r.post('/', F.create);
r.get('/:id', F.get);
r.put('/:id', F.update);
r.delete('/:id', F.remove);
r.post('/:id/payments', F.addPayment);
r.get('/:id/receipts/:receiptNo', F.getReceipt);
export default r;
