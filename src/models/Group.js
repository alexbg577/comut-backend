import mongoose from 'mongoose';

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  settings: {
    sharingEnabled: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

groupSchema.pre('save', function (next) {
  if (!this.code) this.code = generateCode();
  next();
});

export default mongoose.model('Group', groupSchema);
