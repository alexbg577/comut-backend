import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import unzipper from 'unzipper';
import Content from '../models/Content.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024 * 1024 } }); // 3 GB

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
};

const getTypeFromMime = (mimetype) => {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('image/')) return 'photo';
  if (mimetype.startsWith('audio/')) return 'music';
  return null;
};

// Upload simple (vidéo/photo/musique)
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.user.groupId) return res.status(400).json({ error: 'Vous devez être dans un groupe pour uploader' });
    if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });

    const type = getTypeFromMime(req.file.mimetype);
    if (!type) return res.status(400).json({ error: 'Type de fichier non supporté' });

    const resourceType = type === 'music' ? 'video' : type === 'photo' ? 'image' : 'video';
    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: resourceType,
      folder: `comut/${req.user.groupId}`
    });

    const content = await Content.create({
      groupId: req.user.groupId,
      uploaderId: req.user._id,
      type,
      title: req.body.title || req.file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      thumbnail: result.thumbnail_url || null,
      duration: result.duration || null,
      size: req.file.size
    });

    res.status(201).json({ content });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Upload ZIP (extraction automatique)
router.post('/upload-zip', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.user.groupId) return res.status(400).json({ error: 'Groupe requis' });
    if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });

    res.json({ message: 'ZIP reçu, traitement en arrière-plan...' });

    const directory = await unzipper.Open.buffer(req.file.buffer);
    for (const file of directory.files) {
      if (file.type === 'Directory') continue;
      const buffer = await file.buffer();
      const mimeGuess = file.path.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? 'video/mp4'
        : file.path.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i) ? 'image/jpeg'
        : file.path.match(/\.(mp3|wav|aac|flac|ogg)$/i) ? 'audio/mpeg'
        : null;
      if (!mimeGuess) continue;

      const type = getTypeFromMime(mimeGuess);
      const resourceType = type === 'photo' ? 'image' : 'video';
      try {
        const result = await uploadToCloudinary(buffer, {
          resource_type: resourceType,
          folder: `comut/${req.user.groupId}`
        });
        await Content.create({
          groupId: req.user.groupId,
          uploaderId: req.user._id,
          type,
          title: file.path.split('/').pop(),
          url: result.secure_url,
          publicId: result.public_id,
          thumbnail: result.thumbnail_url || null,
          duration: result.duration || null,
          size: buffer.length
        });
      } catch (_) {}
    }
  } catch (e) {
    console.error('ZIP error:', e.message);
  }
});

// Liste des contenus du groupe
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.groupId) return res.status(400).json({ error: 'Groupe requis' });
    const { type, sort } = req.query;
    const filter = { groupId: req.user.groupId };
    if (type && type !== 'all') filter.type = type;

    let sortOption = { createdAt: -1 };
    if (sort === 'likes') sortOption = { 'likes.length': -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };

    const contents = await Content.find(filter)
      .populate('uploaderId', 'pseudo avatar')
      .sort(sortOption)
      .lean();

    if (sort === 'likes') {
      contents.sort((a, b) => b.likes.length - a.likes.length);
    }

    res.json({ contents });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Shorts (vidéos + photos avec musique aléatoire)
router.get('/shorts', auth, async (req, res) => {
  try {
    if (!req.user.groupId) return res.status(400).json({ error: 'Groupe requis' });
    const videos = await Content.find({ groupId: req.user.groupId, type: 'video' })
      .populate('uploaderId', 'pseudo avatar').lean();
    const photos = await Content.find({ groupId: req.user.groupId, type: 'photo' })
      .populate('uploaderId', 'pseudo avatar').lean();
    const musics = await Content.find({ groupId: req.user.groupId, type: 'music' }).lean();

    const shorts = [...videos, ...photos].sort(() => Math.random() - 0.5).map(item => ({
      ...item,
      bgMusic: item.type === 'photo' && musics.length > 0
        ? musics[Math.floor(Math.random() * musics.length)].url
        : null
    }));

    res.json({ shorts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Favoris
router.get('/favorites', auth, async (req, res) => {
  try {
    const contents = await Content.find({ groupId: req.user.groupId, favorites: req.user._id })
      .populate('uploaderId', 'pseudo avatar').lean();
    res.json({ contents });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Liker / Unliker
router.post('/:id/like', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: 'Contenu introuvable' });
    const idx = content.likes.indexOf(req.user._id);
    if (idx === -1) content.likes.push(req.user._id);
    else content.likes.splice(idx, 1);
    await content.save();
    res.json({ liked: idx === -1, likesCount: content.likes.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Favori / Unfavori
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: 'Contenu introuvable' });
    const idx = content.favorites.indexOf(req.user._id);
    if (idx === -1) content.favorites.push(req.user._id);
    else content.favorites.splice(idx, 1);
    await content.save();
    res.json({ favorited: idx === -1 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Supprimer un contenu
router.delete('/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: 'Contenu introuvable' });
    const isUploader = content.uploaderId.toString() === req.user._id.toString();
    const isAppOwner = req.user.role === 'owner';
    const group = await (await import('../models/Group.js')).default.findById(req.user.groupId);
    const isGroupOwner = group?.ownerId.toString() === req.user._id.toString();
    const isGroupAdmin = group?.admins.map(a => a.toString()).includes(req.user._id.toString());
    if (!isUploader && !isAppOwner && !isGroupOwner && !isGroupAdmin) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (content.publicId) {
      const resourceType = content.type === 'photo' ? 'image' : 'video';
      await cloudinary.uploader.destroy(content.publicId, { resource_type: resourceType });
    }
    await content.deleteOne();
    res.json({ message: 'Contenu supprimé' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
