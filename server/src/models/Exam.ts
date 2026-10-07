import { Schema, model } from 'mongoose';

const examSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    date: { type: Date, required: true },
    totalMarks: { type: Number, required: true, min: 1 },
    passMarks: { type: Number, required: true, min: 0 },
    durationMins: Number,
    syllabus: String,
  },
  { timestamps: true }
);

export const Exam = model('Exam', examSchema);
