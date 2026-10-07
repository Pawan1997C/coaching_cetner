import { Schema, model } from 'mongoose';

const paymentSchema = new Schema({
  amount: { type: Number, required: true, min: 1 },
  method: { type: String, enum: ['cash', 'upi', 'card', 'bank', 'cheque'], default: 'cash' },
  paidOn: { type: Date, default: Date.now },
  receiptNo: { type: String, required: true },
  note: String,
  receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

const feeSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
    title: { type: String, required: true, trim: true }, // e.g. "October 2026 tuition"
    totalAmount: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    dueDate: Date,
    payments: [paymentSchema],
    paidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending', index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

feeSchema.virtual('netAmount').get(function () {
  return this.totalAmount - (this.discount ?? 0);
});
feeSchema.virtual('balance').get(function () {
  return Math.max(0, this.totalAmount - (this.discount ?? 0) - this.paidAmount);
});

// Keep paidAmount/status in sync with the payments array on every save.
feeSchema.pre('save', function () {
  this.paidAmount = this.payments.reduce((sum, p) => sum + p.amount, 0);
  const net = this.totalAmount - (this.discount ?? 0);
  this.status = this.paidAmount >= net ? 'paid' : this.paidAmount > 0 ? 'partial' : 'pending';
});

export const Fee = model('Fee', feeSchema);

// Typed helpers (virtuals aren't visible to TypeScript on the document type).
type Amounts = { totalAmount: number; discount?: number | null; paidAmount: number };
export const netOf = (f: Amounts) => f.totalAmount - (f.discount ?? 0);
export const balanceOf = (f: Amounts) => Math.max(0, netOf(f) - f.paidAmount);
