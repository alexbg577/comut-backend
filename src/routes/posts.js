import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createPost, getPosts, getShorts, toggleLike, deletePost } from '../controllers/postController.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createPost.upload.array('files', 10), createPost);
router.get('/', getPosts);
router.get('/shorts', getShorts);
router.post('/:id/like', toggleLike);
router.delete('/:id', deletePost);

export default router;
