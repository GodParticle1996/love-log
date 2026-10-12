import mongoose, { Document, Schema } from 'mongoose';

export interface ICapsule extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  unlockDate: Date;
  isLocked: boolean;
  isRevealed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const capsuleSchema = new Schema<ICapsule>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 10000 },
    unlockDate: { type: Date, required: true },
    isLocked: { type: Boolean, default: true },
    isRevealed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

capsuleSchema.virtual('isUnlocked').get(function () {
  return !this.isLocked || new Date() >= this.unlockDate;
});

capsuleSchema.set('toJSON', { virtuals: true });

export const Capsule = mongoose.model<ICapsule>('Capsule', capsuleSchema);
