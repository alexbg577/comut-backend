import express from 'express';
import User from '../models/User.js';
import Group from '../models/Group.js';
import Content from '../models/Content.js';
import { auth, isOwner } from '../middleware/auth.js';

const router = express.Router();

// Liste tous les utilisateurs
router.get('/users', auth, isOwner, async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('groupId', 'name code');
    res.json({ users });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Supprimer un utilisateur
router.delete('/users/:id', auth, isOwner, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    if (user.role === 'owner') return res.status(400).json({ error: 'Impossible de supprimer l\'owner' });
    if (user.groupId) {
      const group = await Group.findById(user.groupId);
      if (group) {
        group.members = group.members.filter(m => m.toString() !== user._id.toString());
        group.admins = group.admins.filter(a => a.toString() !== user._id.toString());
        await group.save();
      }
    }
    await user.deleteOne();
    res.json({ message: 'Utilisateur supprimé' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Modifier le mot de passe d'un utilisateur
router.patch('/users/:id/password', auth, isOwner, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Minimum 8 caractères' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Mot de passe mis à jour' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Liste tous les groupes
router.get('/groups', auth, isOwner, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('ownerId', 'pseudo email')
      .populate('members', 'pseudo email');
    res.json({ groups });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Supprimer un groupe
router.delete('/groups/:id', auth, isOwner, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Groupe introuvable' });
    await User.updateMany({ groupId: group._id }, { groupId: null });
    await Content.deleteMany({ groupId: group._id });
    await group.deleteOne();
    res.json({ message: 'Groupe supprimé' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Stats globales
router.get('/stats', auth, isOwner, async (req, res) => {
  try {
    const [users, groups, contents] = await Promise.all([
      User.countDocuments(),
      Group.countDocuments(),
      Content.countDocuments()
    ]);
    res.json({ users, groups, contents });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
