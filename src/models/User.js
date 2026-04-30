import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  pseudo: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  isComutOwner: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
