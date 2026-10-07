import { Schema, model } from 'mongoose';

// A class/programme the centre offers, e.g. "Class 10 Board Preparation".
const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    level: { type: String, trim: true }, // e.g. "Class 9-10", "JEE / NEET"
    description: String,
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    schedule: String, // "Mon-Sat, 7-9 AM"
    duration: String, // "10 months"
    fee: String, // display text, e.g. "₹2,500 / month"
    seats: String, // e.g. "Max 25 students per batch"
    image: { url: String, publicId: String },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Course = model('Course', courseSchema);
