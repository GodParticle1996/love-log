import mongoose, { Document, Schema } from 'mongoose';

export interface IMemory extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  date: Date;
  location?: string;
  locationCoords?: { lat: number; lng: number };
  mood?: '😍' | '😂' | '🥹' | '😤' | '🤪' | '🥰' | '😎' | '🤗';
  photos: { url: string; key: string; caption?: string }[];
  tags: string[];
  isPrivate: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const memorySchema = new Schema<IMemory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    date: { type: Date, required: true, default: Date.now },
    location: { type: String, trim: true },
    locationCoords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    mood: {
      type: String,
      enum: ['😍', '😂', '🥹', '😤', '🤪', '🥰', '😎', '🤗'],
    },
    photos: [
      {
        url: { type: String, required: true },
        key: { type: String, required: true },
        caption: { type: String },
      },
    ],
    tags: [{ type: String, trim: true }],
    isPrivate: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

memorySchema.index({ userId: 1, date: -1 });
memorySchema.index({ userId: 1, mood: 1 });
memorySchema.index({ userId: 1, tags: 1 });

export const Memory = mongoose.model<IMemory>('Memory', memorySchema);
