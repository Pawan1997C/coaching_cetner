import { Schema, model } from 'mongoose';

const facultySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true }, // "Senior Mathematics Teacher"
    qualification: { type: String, trim: true },
    experience: { type: String, trim: true }, // "12 years"
    bio: String,
    photo: { url: String, publicId: String },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Faculty = model('Faculty', facultySchema);
