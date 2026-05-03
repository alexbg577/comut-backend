import express from 'express';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Créer un groupe
router.post('/create', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    if (req.user.groupId) return res.status(400).json({ error: 'Vous êtes déjà dans un groupe' });

    const group = await Group.create({ name, ownerId: req.user._id, members: [req.user._id] });
    await User.findByIdAndUpdate(req.user._id, { groupId: group._id });
    res.status(201).json({ group });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rejoindre un groupe via code
router.post('/join', auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (req.user.groupId) return res.status(400).json({ error: 'Vous êtes déjà dans un groupe' });
    const group = await Group.findOne({ code: code.toUpperCase() });
    if (!group) return res.status(404).json({ error: 'Code invalide' });

    group.members.push(req.user._id);
    await group.save();
    await User.findByIdAndUpdate(req.user._id, { groupId: group._id });
    res.json({ group });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Infos du groupe de l'utilisateur
router.get('/me', auth, async (req, res) => {
  try {
    if (!req.user.groupId) return res.status(404).json({ error: 'Pas dans un groupe' });
    const group = await Group.findById(req.user.groupId)
      .populate('ownerId', 'pseudo email avatar')
      .populate('members', 'pseudo email avatar')
      .populate('admins', 'pseudo email avatar');
    res.json({ group });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Quitter un groupe
router.post('/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.user.groupId);
    if (!group) return res.status(404).json({ error: 'Groupe introuvable' });
    if (group.ownerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "L'owner ne peut pas quitter le groupe" });
    }
    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    group.admins = group.admins.filter(a => a.toString() !== req.user._id.toString());
    await group.save();
    await User.findByIdAndUpdate(req.user._id, { groupId: null });
    res.json({ message: 'Groupe quitté' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Promouvoir un membre en admin (owner du groupe)
router.post('/promote/:userId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.user.groupId);
    if (!group) return res.status(404).json({ error: 'Groupe introuvable' });
    if (group.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Réservé à l\'owner du groupe' });
    }
    if (!group.admins.includes(req.params.userId)) {
      group.admins.push(req.params.userId);
      await group.save();
    }
    res.json({ message: 'Admin promu' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rétrograder un admin
router.post('/demote/:userId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.user.groupId);
    if (!group) return res.status(404).json({ error: 'Groupe introuvable' });
    if (group.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Réservé à l\'owner du groupe' });
    }
    group.admins = group.admins.filter(a => a.toString() !== req.params.userId);
    await group.save();
    res.json({ message: 'Admin rétrogradé' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Exclure un membre (owner du groupe)
router.post('/kick/:userId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.user.groupId);
    if (!group) return res.status(404).json({ error: 'Groupe introuvable' });
    const isGroupOwner = group.ownerId.toString() === req.user._id.toString();
    const isGroupAdmin = group.admins.map(a => a.toString()).includes(req.user._id.toString());
    if (!isGroupOwner && !isGroupAdmin) return res.status(403).json({ error: 'Accès refusé' });

    group.members = group.members.filter(m => m.toString() !== req.params.userId);
    group.admins = group.admins.filter(a => a.toString() !== req.params.userId);
    await group.save();
    await User.findByIdAndUpdate(req.params.userId, { groupId: null });
    res.json({ message: 'Membre exclu' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Paramètres du groupe (owner du groupe)
router.patch('/settings', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.user.groupId);
    if (!group) return res.status(404).json({ error: 'Groupe introuvable' });
    if (group.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Réservé à l\'owner du groupe' });
    }
    const { sharingEnabled } = req.body;
    if (typeof sharingEnabled === 'boolean') group.settings.sharingEnabled = sharingEnabled;
    await group.save();
    res.json({ group });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
