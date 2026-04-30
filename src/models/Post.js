import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: { type: String, enum: ['photo', 'video', 'music'], required: true },
  files: [String],
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Post', postSchema);
