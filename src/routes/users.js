import express from 'express';
import { authenticate, isComutOwner } from '../middleware/auth.js';
import { getProfile, updatePassword, getAllUsers, deleteUser, changeUserPassword, getUserFavorites, toggleFavorite } from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', authenticate, getProfile);
router.put('/password', authenticate, updatePassword);
router.get('/favorites', authenticate, getUserFavorites);
router.post('/favorites/:postId', authenticate, toggleFavorite);

// Comut Owner routes
router.get('/all', authenticate, isComutOwner, getAllUsers);
router.delete('/:id', authenticate, isComutOwner, deleteUser);
router.put('/:id/password', authenticate, isComutOwner, changeUserPassword);

export default router;
