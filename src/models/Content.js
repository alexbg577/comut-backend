import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['video', 'photo', 'music'], required: true },
  title: { type: String, default: '' },
  url: { type: String, required: true },
  publicId: { type: String, default: null },
  thumbnail: { type: String, default: null },
  duration: { type: Number, default: null },
  size: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

// Virtual for likes count (for sorting)
contentSchema.virtual('likesCount').get(function () {
  return this.likes.length;
});

export default mongoose.model('Content', contentSchema);
