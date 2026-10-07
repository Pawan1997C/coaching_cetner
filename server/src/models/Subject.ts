import { Schema, model } from 'mongoose';

const subjectSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
  },
  { timestamps: true }
);

export const Subject = model('Subject', subjectSchema);
