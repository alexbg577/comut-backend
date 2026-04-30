import express from 'express';
import { authenticate, isComutOwner } from '../middleware/auth.js';
import {
  createGroup, joinGroup, getGroups, getGroup, updateMemberRole,
  removeMember, updateGroupSettings, deleteGroup, getAllGroups
} from '../controllers/groupController.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createGroup);
router.post('/join', joinGroup);
router.get('/', getGroups);
router.get('/all', isComutOwner, getAllGroups);
router.get('/:id', getGroup);
router.put('/:id/settings', updateGroupSettings);
router.put('/:groupId/members/:memberId', updateMemberRole);
router.delete('/:groupId/members/:memberId', removeMember);
router.delete('/:id', deleteGroup);

export default router;
