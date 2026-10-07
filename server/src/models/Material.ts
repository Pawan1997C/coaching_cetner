import { Schema, model } from 'mongoose';

const materialSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', index: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', index: true },
    file: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      resourceType: { type: String, enum: ['image', 'raw'], required: true },
      format: String,
      bytes: Number,
      originalName: String,
      mimeType: String,
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Material = model('Material', materialSchema);
