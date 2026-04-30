import Comment from '../models/Comment.js';
import Post from '../models/Post.js';

export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'pseudo')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = await Comment.create({
      content,
      post: req.params.postId,
      author: req.user._id
    });

    post.commentsCount += 1;
    await post.save();

    const populatedComment = await comment.populate('author', 'pseudo');
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isComutOwner = req.user.email === process.env.COMUT_OWNER_EMAIL;

    if (!isAuthor && !isComutOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
