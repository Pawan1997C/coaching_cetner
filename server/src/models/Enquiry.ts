import { Schema, model } from 'mongoose';

const enquirySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    interest: { type: String, trim: true }, // course title the visitor picked
    message: { type: String, trim: true },
    status: { type: String, enum: ['new', 'contacted', 'enrolled', 'closed'], default: 'new', index: true },
    notes: String,
    source: { type: String, default: 'website' },
  },
  { timestamps: true }
);

export const Enquiry = model('Enquiry', enquirySchema);
