import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getComments, createComment, deleteComment } from '../controllers/commentController.js';

const router = express.Router();

router.use(authenticate);

router.get('/:postId', getComments);
router.post('/:postId', createComment);
router.delete('/:commentId', deleteComment);

export default router;
