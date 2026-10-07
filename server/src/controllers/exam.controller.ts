import { Exam } from '../models/Exam';
import { Result } from '../models/Result';
import { Student } from '../models/Student';
import { makeCrud } from '../utils/crud';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { gradeFor, percentage } from '../utils/grade';

const crud = makeCrud(Exam, {
  populate: [
    { path: 'batch', select: 'name' },
    { path: 'subject', select: 'name' },
  ],
  filters: ['batch', 'subject'],
  sort: '-date',
});

export const { list, get, create, update } = crud;

export const remove = asyncHandler(async (req, res) => {
  const exam = await Exam.findByIdAndDelete(req.params.id);
  if (!exam) throw new ApiError(404, 'Exam not found');
  await Result.deleteMany({ exam: exam._id });
  res.json({ message: 'Exam and its results deleted' });
});

// Bulk save marks: body { results: [{ student, marksObtained, absent?, remarks? }] }
export const saveResults = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) throw new ApiError(404, 'Exam not found');
  const rows = req.body.results;
  if (!Array.isArray(rows) || !rows.length) throw new ApiError(400, 'results must be a non-empty array');

  for (const r of rows) {
    const m = Number(r.marksObtained);
    if (!r.absent && (Number.isNaN(m) || m < 0 || m > exam.totalMarks)) {
      throw new ApiError(400, `Marks must be between 0 and ${exam.totalMarks}`);
    }
  }
  await Result.bulkWrite(
    rows.map((r: any) => ({
      updateOne: {
        filter: { exam: exam._id, student: r.student },
        update: {
          $set: { marksObtained: r.absent ? 0 : Number(r.marksObtained), absent: !!r.absent, remarks: r.remarks },
        },
        upsert: true,
      },
    }))
  );
  res.json({ message: `Saved ${rows.length} results` });
});

// Results for one exam with percentage, grade, pass/fail and rank.
export const getResults = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate('subject', 'name').populate('batch', 'name');
  if (!exam) throw new ApiError(404, 'Exam not found');
  const results = await Result.find({ exam: exam._id }).populate('student', 'name rollNo').lean();
  const ranked = results
    .sort((a, b) => b.marksObtained - a.marksObtained)
    .map((r, i) => {
      const pct = percentage(r.marksObtained, exam.totalMarks);
      return { ...r, percentage: pct, grade: r.absent ? '-' : gradeFor(pct), passed: !r.absent && r.marksObtained >= exam.passMarks, rank: i + 1 };
    });
  const roster = await Student.find({ batch: exam.batch, status: 'active' }).select('name rollNo').sort('rollNo');
  res.json({ exam, results: ranked, roster });
});

export const studentResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ student: req.params.studentId })
    .populate({ path: 'exam', populate: { path: 'subject', select: 'name' } })
    .lean();
  res.json(
    results
      .filter((r: any) => r.exam)
      .map((r: any) => {
        const pct = percentage(r.marksObtained, r.exam.totalMarks);
        return { ...r, percentage: pct, grade: r.absent ? '-' : gradeFor(pct), passed: r.marksObtained >= r.exam.passMarks };
      })
      .sort((a: any, b: any) => +new Date(b.exam.date) - +new Date(a.exam.date))
  );
});
