import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { email, pseudo, password } = req.body;
    if (!email || !pseudo || !password) return res.status(400).json({ error: 'Champs manquants' });
    if (password.length < 8) return res.status(400).json({ error: 'Mot de passe minimum 8 caractères' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email déjà utilisé' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const isOwnerEmail = email.toLowerCase() === process.env.COMUT_OWNER_EMAIL?.toLowerCase();
    const user = await User.create({
      email, pseudo, password, verificationToken,
      role: isOwnerEmail ? 'owner' : 'user'
    });

    await sendVerificationEmail(email, verificationToken);
    res.status(201).json({ message: 'Compte créé. Vérifiez votre email.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Vérification email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).send('<h2>Lien invalide ou expiré</h2>');
    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Email vérifié</title>
    <style>body{font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:linear-gradient(135deg,#6366f1,#8b5cf6)}
    .card{background:#fff;border-radius:20px;padding:48px;text-align:center;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
    h1{color:#6366f1;margin:0 0 16px}p{color:#6b7280}</style></head>
    <body><div class="card"><div style="font-size:48px">✅</div><h1>Email vérifié !</h1>
    <p>Votre compte Comut est maintenant actif. Vous pouvez vous connecter dans l'application.</p></div></body></html>`);
  } catch (e) {
    res.status(500).send('<h2>Erreur serveur</h2>');
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    if (!user.emailVerified) return res.status(403).json({ error: 'Vérifiez votre email avant de vous connecter' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    const token = makeToken(user._id);
    res.json({ token, user: { id: user._id, email: user.email, pseudo: user.pseudo, role: user.role, groupId: user.groupId, avatar: user.avatar } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mot de passe oublié
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'Si cet email existe, un lien a été envoyé.' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1h
    await user.save();
    await sendPasswordResetEmail(email, token);
    res.json({ message: 'Si cet email existe, un lien a été envoyé.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reset mot de passe
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ error: 'Minimum 8 caractères' });
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: 'Lien invalide ou expiré' });
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Changer mot de passe (connecté)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Minimum 8 caractères' });
    const user = await User.findById(req.user._id);
    const valid = await user.comparePassword(oldPassword);
    if (!valid) return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Mot de passe modifié' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Profil connecté
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
