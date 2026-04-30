import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import User from '../models/User.js';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export const register = async (req, res) => {
  try {
    const { email, pseudo, password } = req.body;

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { pseudo }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or pseudo already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      email,
      pseudo,
      password: hashedPassword,
      verificationToken,
      isComutOwner: email === process.env.COMUT_OWNER_EMAIL
    });

    const verifyUrl = `${process.env.BASE_URL}/api/auth/verify/${verificationToken}`;
    await resend.emails.send({
      from: 'Comut <noreply@comut.app>',
      to: email,
      subject: 'Verify your Comut account',
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your account</p>`
    });

    res.status(201).json({ message: 'Account created. Please verify your email.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.isVerified) {
      return res.status(401).json({ error: 'Please verify your email first' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: user._id, email: user.email, pseudo: user.pseudo, isComutOwner: user.isComutOwner }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).send('Invalid verification token');

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.send('Email verified successfully! You can now login.');
  } catch (error) {
    res.status(500).send('Verification failed');
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `${process.env.BASE_URL}/reset-password.html?token=${resetToken}`;
    await resend.emails.send({
      from: 'Comut <noreply@comut.app>',
      to: email,
      subject: 'Reset your password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password</p>`
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
