import { Types } from 'mongoose';
import { Attendance } from '../models/Attendance';
import { Student } from '../models/Student';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

export const day = (s: string) => {
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(+d)) throw new ApiError(400, 'Invalid date, use YYYY-MM-DD');
  return d;
};

// Mark (or re-mark) a batch's attendance for a day.
export const mark = asyncHandler(async (req, res) => {
  const { batch, date, records } = req.body;
  if (!batch || !date || !Array.isArray(records)) throw new ApiError(400, 'batch, date and records are required');
  const doc = await Attendance.findOneAndUpdate(
    { batch, date: day(date) },
    { batch, date: day(date), records, markedBy: req.user!._id },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  res.status(201).json(doc);
});

// Saved sheet for the day, or a fresh roster (everyone "present") if none exists yet.
export const getByDay = asyncHandler(async (req, res) => {
  const { batch, date } = req.query;
  if (!batch || !date) throw new ApiError(400, 'batch and date are required');
  const sheet = await Attendance.findOne({ batch: String(batch), date: day(String(date)) }).populate(
    'records.student',
    'name rollNo'
  );
  if (sheet) return res.json({ exists: true, batch, date, records: sheet.records });
  const students = await Student.find({ batch: String(batch), status: 'active' }).select('name rollNo').sort('rollNo');
  res.json({
    exists: false,
    batch,
    date,
    records: students.map((s) => ({ student: s, status: 'present' })),
  });
});

// Per-student totals for a batch over a date range.
export const report = asyncHandler(async (req, res) => {
  const { batch, from, to } = req.query;
  if (!batch) throw new ApiError(400, 'batch is required');
  const match: Record<string, any> = { batch: new Types.ObjectId(String(batch)) };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = day(String(from));
    if (to) match.date.$lte = day(String(to));
  }
  const count = (s: string) => ({ $sum: { $cond: [{ $eq: ['$records.status', s] }, 1, 0] } });
  const rows = await Attendance.aggregate([
    { $match: match },
    { $unwind: '$records' },
    {
      $group: {
        _id: '$records.student',
        present: count('present'),
        absent: count('absent'),
        late: count('late'),
        leave: count('leave'),
        total: { $sum: 1 },
      },
    },
    { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
    {
      $project: {
        _id: 0,
        student: { _id: '$student._id', name: '$student.name', rollNo: '$student.rollNo' },
        present: 1,
        absent: 1,
        late: 1,
        leave: 1,
        total: 1,
        percentage: { $round: [{ $multiply: [{ $divide: [{ $add: ['$present', '$late'] }, '$total'] }, 100] }, 1] },
      },
    },
    { $sort: { 'student.rollNo': 1 } },
  ]);
  res.json(rows);
});
