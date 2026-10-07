import { Schema, model } from 'mongoose';

const studentSchema = new Schema(
  {
    rollNo: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    dob: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    address: String,
    guardianName: { type: String, trim: true },
    guardianPhone: { type: String, trim: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', index: true },
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    status: { type: String, enum: ['active', 'inactive', 'alumni'], default: 'active', index: true },
    joinedOn: { type: Date, default: Date.now },
    avatar: { url: String, publicId: String },
  },
  { timestamps: true }
);

studentSchema.index({ name: 'text' });

export const Student = model('Student', studentSchema);
