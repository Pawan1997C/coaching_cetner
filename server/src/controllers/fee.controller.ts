import { Fee, balanceOf } from '../models/Fee';
import { Student } from '../models/Student';
import { makeCrud } from '../utils/crud';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const crud = makeCrud(Fee, {
  populate: [
    { path: 'student', select: 'name rollNo phone guardianPhone' },
    { path: 'batch', select: 'name' },
  ],
  filters: ['student', 'batch', 'status'],
  sort: '-dueDate',
});

export const { get, update, remove } = crud;

export const list = asyncHandler(async (req, res) => {
  // ?pending=true -> everything not fully paid
  const filter: Record<string, any> = {};
  for (const k of ['student', 'batch', 'status'] as const) if (req.query[k]) filter[k] = String(req.query[k]);
  if (req.query.pending === 'true') filter.status = { $in: ['pending', 'partial'] };
  const items = await Fee.find(filter)
    .populate('student', 'name rollNo phone guardianPhone')
    .populate('batch', 'name')
    .sort('dueDate')
    .limit(500);
  res.json({ items, total: items.length });
});

export const create = asyncHandler(async (req, res) => {
  const { student, batch, title, totalAmount, discount, dueDate } = req.body;
  const s = await Student.findById(student);
  if (!s) throw new ApiError(404, 'Student not found');
  const fee = await Fee.create({ student, batch: batch ?? s.batch, title, totalAmount, discount, dueDate });
  res.status(201).json(fee);
});

const newReceiptNo = () =>
  `RC-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const addPayment = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id).populate('student', 'name rollNo');
  if (!fee) throw new ApiError(404, 'Fee record not found');
  const amount = Number(req.body.amount);
  if (!(amount > 0)) throw new ApiError(400, 'Enter a payment amount greater than 0');
  const due = balanceOf(fee);
  if (amount > due) throw new ApiError(400, `Amount is more than the balance of ${due}`);

  fee.payments.push({
    amount,
    method: req.body.method ?? 'cash',
    paidOn: req.body.paidOn ?? new Date(),
    note: req.body.note,
    receiptNo: newReceiptNo(),
    receivedBy: req.user!._id,
  } as any);
  await fee.save();
  const payment = fee.payments[fee.payments.length - 1];
  res.status(201).json({ fee, receipt: buildReceipt(fee, payment) });
});

const buildReceipt = (fee: any, p: any) => ({
  receiptNo: p.receiptNo,
  paidOn: p.paidOn,
  amount: p.amount,
  method: p.method,
  note: p.note,
  title: fee.title,
  student: fee.student,
  netAmount: fee.netAmount,
  totalPaid: fee.paidAmount,
  balance: fee.balance,
});

export const getReceipt = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id).populate('student', 'name rollNo');
  const p = fee?.payments.find((x) => x.receiptNo === req.params.receiptNo);
  if (!fee || !p) throw new ApiError(404, 'Receipt not found');
  res.json(buildReceipt(fee, p));
});
