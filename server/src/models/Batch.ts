import { Schema, model } from 'mongoose';

const batchSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }, // e.g. "Class 10 - Morning"
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    schedule: { type: String, trim: true }, // e.g. "Mon-Fri, 7:00-9:00 AM"
    startDate: Date,
    endDate: Date,
    capacity: { type: Number, min: 1 },
    monthlyFee: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Batch = model('Batch', batchSchema);
