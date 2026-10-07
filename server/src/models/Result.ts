import { Schema, model } from 'mongoose';

const resultSchema = new Schema(
  {
    exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    marksObtained: { type: Number, required: true, min: 0 },
    absent: { type: Boolean, default: false },
    remarks: String,
  },
  { timestamps: true }
);

resultSchema.index({ exam: 1, student: 1 }, { unique: true });
resultSchema.index({ student: 1 });

export const Result = model('Result', resultSchema);
