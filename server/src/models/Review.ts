import { Schema, model } from 'mongoose';

// Admin-added reviews are published straight away; visitor submissions arrive as 'pending'.
const reviewSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true }, // "Parent of Class 10 student"
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true, maxlength: 800 },
    status: { type: String, enum: ['pending', 'published', 'hidden'], default: 'published', index: true },
    source: { type: String, enum: ['admin', 'website'], default: 'admin' },
  },
  { timestamps: true }
);

export const Review = model('Review', reviewSchema);
