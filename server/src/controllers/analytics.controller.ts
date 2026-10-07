import { Types } from 'mongoose';
import { Attendance } from '../models/Attendance';
import { Batch } from '../models/Batch';
import { Exam } from '../models/Exam';
import { Fee, balanceOf, netOf } from '../models/Fee';
import { Result } from '../models/Result';
import { Student } from '../models/Student';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { gradeFor, percentage } from '../utils/grade';

const daysAgo = (n: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};
const attended = { $cond: [{ $in: ['$records.status', ['present', 'late']] }, 1, 0] };

export const overview = asyncHandler(async (_req, res) => {
  const [students, activeStudents, batches, att, fees, upcomingExams] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: 'active' }),
    Batch.countDocuments({ active: true }),
    Attendance.aggregate([
      { $match: { date: { $gte: daysAgo(30) } } },
      { $unwind: '$records' },
      { $group: { _id: null, total: { $sum: 1 }, attended: { $sum: attended } } },
    ]),
    Fee.aggregate([
      { $group: { _id: null, billed: { $sum: { $subtract: ['$totalAmount', '$discount'] } }, collected: { $sum: '$paidAmount' } } },
    ]),
    Exam.find({ date: { $gte: new Date() } }).sort('date').limit(5).populate('batch', 'name').populate('subject', 'name'),
  ]);
  const a = att[0] ?? { total: 0, attended: 0 };
  const f = fees[0] ?? { billed: 0, collected: 0 };
  res.json({
    students,
    activeStudents,
    batches,
    attendanceRate30d: a.total ? Math.round((a.attended / a.total) * 1000) / 10 : 0,
    fees: { billed: f.billed, collected: f.collected, pending: f.billed - f.collected },
    upcomingExams,
  });
});

// Daily attendance % across all batches (or one batch).
export const attendanceTrend = asyncHandler(async (req, res) => {
  const days = Math.min(180, Number(req.query.days) || 30);
  const match: Record<string, any> = { date: { $gte: daysAgo(days) } };
  if (req.query.batch) match.batch = new Types.ObjectId(String(req.query.batch));
  const rows = await Attendance.aggregate([
    { $match: match },
    { $unwind: '$records' },
    { $group: { _id: '$date', total: { $sum: 1 }, attended: { $sum: attended } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: { $dateToString: { format: '%Y-%m-%d', date: '$_id' } }, rate: { $round: [{ $multiply: [{ $divide: ['$attended', '$total'] }, 100] }, 1] } } },
  ]);
  res.json(rows);
});

// Money collected per month, from the payment ledger.
export const feeCollection = asyncHandler(async (req, res) => {
  const months = Math.min(24, Number(req.query.months) || 6);
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - (months - 1), 1);
  since.setUTCHours(0, 0, 0, 0);
  const rows = await Fee.aggregate([
    { $unwind: '$payments' },
    { $match: { 'payments.paidOn': { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$payments.paidOn' } }, collected: { $sum: '$payments.amount' } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, month: '$_id', collected: 1 } },
  ]);
  res.json(rows);
});

// Average score per exam (optionally for one batch) — drives the performance chart.
export const performance = asyncHandler(async (req, res) => {
  const examMatch: Record<string, any> = {};
  if (req.query.batch) examMatch['exam.batch'] = new Types.ObjectId(String(req.query.batch));
  const rows = await Result.aggregate([
    { $match: { absent: false } },
    { $lookup: { from: 'exams', localField: 'exam', foreignField: '_id', as: 'exam' } },
    { $unwind: '$exam' },
    { $match: examMatch },
    { $lookup: { from: 'subjects', localField: 'exam.subject', foreignField: '_id', as: 'subject' } },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$exam._id',
        title: { $first: '$exam.title' },
        subject: { $first: '$subject.name' },
        date: { $first: '$exam.date' },
        average: { $avg: { $multiply: [{ $divide: ['$marksObtained', '$exam.totalMarks'] }, 100] } },
        highest: { $max: { $multiply: [{ $divide: ['$marksObtained', '$exam.totalMarks'] }, 100] } },
        passed: { $sum: { $cond: [{ $gte: ['$marksObtained', '$exam.passMarks'] }, 1, 0] } },
        appeared: { $sum: 1 },
      },
    },
    { $sort: { date: 1 } },
    { $project: { _id: 0, examId: '$_id', title: 1, subject: 1, date: 1, appeared: 1, passed: 1, average: { $round: ['$average', 1] }, highest: { $round: ['$highest', 1] } } },
  ]);
  res.json(rows);
});

// Full report card data for one student: profile, attendance, results, fees.
export const studentReport = asyncHandler(async (req, res) => {
  const id = new Types.ObjectId(req.params.id);
  const student = await Student.findById(id).populate('batch', 'name').populate('subjects', 'name');
  if (!student) throw new ApiError(404, 'Student not found');

  const [att, results, fees] = await Promise.all([
    Attendance.aggregate([
      { $match: { 'records.student': id } },
      { $unwind: '$records' },
      { $match: { 'records.student': id } },
      { $group: { _id: '$records.status', count: { $sum: 1 } } },
    ]),
    Result.find({ student: id }).populate({ path: 'exam', populate: { path: 'subject', select: 'name' } }).lean(),
    Fee.find({ student: id }).sort('-dueDate'),
  ]);
  const byStatus = Object.fromEntries(att.map((r) => [r._id, r.count]));
  const total = att.reduce((s, r) => s + r.count, 0);
  const scored = results
    .filter((r: any) => r.exam && !r.absent)
    .map((r: any) => {
      const pct = percentage(r.marksObtained, r.exam.totalMarks);
      return { exam: r.exam.title, subject: r.exam.subject?.name, date: r.exam.date, marks: r.marksObtained, total: r.exam.totalMarks, percentage: pct, grade: gradeFor(pct) };
    });
  const avg = scored.length ? Math.round((scored.reduce((s, r) => s + r.percentage, 0) / scored.length) * 10) / 10 : 0;

  res.json({
    student,
    attendance: {
      total,
      ...byStatus,
      percentage: total ? Math.round((((byStatus.present ?? 0) + (byStatus.late ?? 0)) / total) * 1000) / 10 : 0,
    },
    results: { items: scored, average: avg, grade: gradeFor(avg) },
    fees: {
      billed: fees.reduce((s, f) => s + netOf(f), 0),
      paid: fees.reduce((s, f) => s + f.paidAmount, 0),
      balance: fees.reduce((s, f) => s + balanceOf(f), 0),
    },
  });
});
