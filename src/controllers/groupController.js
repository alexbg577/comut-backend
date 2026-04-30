import Group from '../models/Group.js';
import User from '../models/User.js';
import crypto from 'crypto';
import { isComutOwner } from '../middleware/auth.js';

export const createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();

    const group = await Group.create({
      name,
      code,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }]
    });

    req.user.groups.push(group._id);
    await req.user.save();

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const { code } = req.body;

    const group = await Group.findOne({ code });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (isMember) return res.status(400).json({ error: 'Already a member' });

    group.members.push({ user: req.user._id, role: 'member' });
    await group.save();

    req.user.groups.push(group._id);
    await req.user.save();

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: { $elemMatch: { user: req.user._id } } })
      .populate('members.user', 'pseudo email');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members.user', 'pseudo email');
    if (!group) return res.status(404).json({ error: 'Group not found' });

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) return res.status(404).json({ error: 'Group not found' });

    const isOwner = group.owner.toString() === req.user._id.toString();
    if (!isOwner) return res.status(403).json({ error: 'Only owner can change roles' });

    const member = group.members.id(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    member.role = role;
    await group.save();

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const isOwner = group.owner.toString() === req.user._id.toString();
    if (!isOwner) return res.status(403).json({ error: 'Only owner can remove members' });

    group.members.pull(req.params.memberId);
    await group.save();

    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateGroupSettings = async (req, res) => {
  try {
    const { allowShare } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) return res.status(404).json({ error: 'Group not found' });

    const isOwner = group.owner.toString() === req.user._id.toString();
    if (!isOwner) return res.status(403).json({ error: 'Only owner can update settings' });

    group.allowShare = allowShare;
    await group.save();

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) return res.status(404).json({ error: 'Group not found' });

    const isOwner = group.owner.toString() === req.user._id.toString();
    const isComutOwner = req.user.email === process.env.COMUT_OWNER_EMAIL;

    if (!isOwner && !isComutOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await group.deleteOne();
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate('owner', 'pseudo email');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
