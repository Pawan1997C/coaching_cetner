import { Schema, model } from 'mongoose';

// One document per batch per day; `date` is always stored as UTC midnight.
const attendanceSchema = new Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    date: { type: Date, required: true },
    records: [
      {
        _id: false,
        student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
        status: { type: String, enum: ['present', 'absent', 'late', 'leave'], default: 'present' },
        note: String,
      },
    ],
    markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

attendanceSchema.index({ batch: 1, date: 1 }, { unique: true });
attendanceSchema.index({ 'records.student': 1, date: -1 });

export const Attendance = model('Attendance', attendanceSchema);
