import User from '../models/User.js';
import Group from '../models/Group.js';
import bcrypt from 'bcryptjs';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('groups');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findById(req.user._id);
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) return res.status(401).json({ error: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const changeUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'User password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const postId = req.params.postId;

    const index = user.favorites.indexOf(postId);
    if (index > -1) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.push(postId);
    }

    await user.save();
    res.json({ isFavorite: index === -1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
