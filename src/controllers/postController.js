import Post from '../models/Post.js';
import Group from '../models/Group.js';
import cloudinary from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'comut',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'png', 'mp4', 'mp3', 'zip']
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 * 1024 }
});

export const createPost = async (req, res) => {
  try {
    const { title, description, type, groupId } = req.body;
    const files = req.files ? req.files.map(f => f.path) : [];

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ error: 'Not a group member' });

    const post = await Post.create({
      title,
      description,
      type,
      files,
      group: groupId,
      author: req.user._id
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const { groupId, sort, type } = req.query;
    const query = { group: groupId };

    if (type && type !== 'all') query.type = type;

    let sortOption = { createdAt: -1 };
    if (sort === 'likes') sortOption = { likesCount: -1 };
    if (sort === 'recent') sortOption = { createdAt: -1 };

    const posts = await Post.find(query)
      .sort(sortOption)
      .populate('author', 'pseudo')
      .populate('group', 'name');

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getShorts = async (req, res) => {
  try {
    const { groupId } = req.query;

    const posts = await Post.find({
      group: groupId,
      type: { $in: ['video', 'photo'] }
    }).populate('author', 'pseudo');

    const musicPosts = await Post.find({ group: groupId, type: 'music' });
    const musicUrls = musicPosts.map(p => p.files[0]);

    const shorts = posts.map(post => ({
      ...post.toObject(),
      backgroundMusic: post.type === 'photo' && musicUrls.length > 0
        ? musicUrls[Math.floor(Math.random() * musicUrls.length)]
        : null
    }));

    res.json(shorts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const index = post.likes.indexOf(req.user._id);
    if (index > -1) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(req.user._id);
    }

    post.likesCount = post.likes.length;
    await post.save();

    res.json({ liked: index === -1, likesCount: post.likesCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const isAuthor = post.author.toString() === req.user._id.toString();
    const isComutOwner = req.user.email === process.env.COMUT_OWNER_EMAIL;

    if (!isAuthor && !isComutOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
