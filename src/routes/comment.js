import express from 'express';
import Comment from '../models/Comment.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Ajouter un commentaire
router.post('/', auth, async (req, res) => {
  try {
    const { contentId, text, parentId } = req.body;
    if (!contentId || !text) return res.status(400).json({ error: 'Champs manquants' });
    const comment = await Comment.create({
      contentId, text, parentId: parentId || null,
      authorId: req.user._id
    });
    await comment.populate('authorId', 'pseudo avatar');
    res.status(201).json({ comment });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Liste des commentaires d'un contenu
router.get('/:contentId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ contentId: req.params.contentId, parentId: null })
      .populate('authorId', 'pseudo avatar')
      .sort({ createdAt: -1 });
    res.json({ comments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Supprimer un commentaire
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Commentaire introuvable' });
    const isAuthor = comment.authorId.toString() === req.user._id.toString();
    if (!isAuthor && req.user.role !== 'owner') return res.status(403).json({ error: 'Accès refusé' });
    await comment.deleteOne();
    res.json({ message: 'Commentaire supprimé' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Liker un commentaire
router.post('/:id/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Commentaire introuvable' });
    const idx = comment.likes.indexOf(req.user._id);
    if (idx === -1) comment.likes.push(req.user._id);
    else comment.likes.splice(idx, 1);
    await comment.save();
    res.json({ liked: idx === -1, likesCount: comment.likes.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
