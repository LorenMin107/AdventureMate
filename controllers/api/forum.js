const Forum = require('../../models/forum');
const User = require('../../models/user');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const { logger } = require('../../utils/logger');

/**
 * Get all forum posts with filtering and pagination
 */
const getForumPosts = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    type,
    sort = 'latest',
    search,
    tags,
    status = 'active',
  } = req.query;

  const skip = (page - 1) * limit;
  const query = { status };

  // Add filters
  if (category) query.category = category;
  if (type) query.type = type;
  if (tags) {
    query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
  }

  // Add search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  // Sort options
  let sortOption = {};
  switch (sort) {
    case 'latest':
      sortOption = { createdAt: -1 };
      break;
    case 'oldest':
      sortOption = { createdAt: 1 };
      break;
    case 'most_voted':
      sortOption = { voteCount: -1, createdAt: -1 };
      break;
    case 'most_replied':
      sortOption = { replyCount: -1, createdAt: -1 };
      break;
    case 'most_viewed':
      sortOption = { views: -1, createdAt: -1 };
      break;
    case 'trending':
      // Sort by recent activity and engagement
      sortOption = { lastActivity: -1, voteCount: -1 };
      break;
    default:
      sortOption = { isSticky: -1, isPinned: -1, createdAt: -1 };
  }

  const posts = await Forum.find(query)
    .populate('author', 'username avatar')
    .populate('replies.author', 'username avatar')
    .sort(sortOption)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Forum.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  // Add vote status for current user
  if (req.user) {
    posts.forEach((post) => {
      post.userVote = post.upvotes.includes(req.user._id)
        ? 'upvote'
        : post.downvotes.includes(req.user._id)
          ? 'downvote'
          : null;
      post.upvotes = post.upvotes.length;
      post.downvotes = post.downvotes.length;
    });
  } else {
    posts.forEach((post) => {
      post.userVote = null;
      post.upvotes = post.upvotes.length;
      post.downvotes = post.downvotes.length;
    });
  }

  logger.info('Forum posts retrieved', {
    userId: req.user?._id,
    category,
    type,
    total,
    page,
    limit,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      'Forum posts retrieved successfully'
    )
  );
});

/**
 * Get a single forum post by ID
 */
const getForumPost = catchAsync(async (req, res) => {
  const { id } = req.params;

  const post = await Forum.findById(id)
    .populate('author', 'username avatar createdAt')
    .populate('replies.author', 'username avatar createdAt')
    .populate('upvotes', 'username')
    .populate('downvotes', 'username');

  if (!post) {
    return res.status(404).json(new ApiResponse(404, 'Forum post not found'));
  }

  // Add view count (only if user is not the author)
  const isAuthor = req.user && post.author._id.equals(req.user._id);

  logger.info('View count check', {
    userId: req.user?._id,
    postAuthorId: post.author._id,
    isAuthor,
    willIncrement: !req.user || !isAuthor,
  });

  if (!req.user || !isAuthor) {
    await post.addView();
    logger.info('View count incremented', { postId: id, newViews: post.views });
  } else {
    logger.info('View count not incremented - user is author', {
      postId: id,
      currentViews: post.views,
    });
  }

  // Add vote status for current user
  if (req.user) {
    post.userVote = post.upvotes.some((vote) => vote._id.equals(req.user._id))
      ? 'upvote'
      : post.downvotes.some((vote) => vote._id.equals(req.user._id))
        ? 'downvote'
        : null;

    // Add vote status for replies
    post.replies.forEach((reply) => {
      reply.userVote = reply.upvotes.some((vote) => vote._id.equals(req.user._id))
        ? 'upvote'
        : reply.downvotes.some((vote) => vote._id.equals(req.user._id))
          ? 'downvote'
          : null;
      reply.upvotes = reply.upvotes.length;
      reply.downvotes = reply.downvotes.length;
    });
  } else {
    post.userVote = null;
    post.replies.forEach((reply) => {
      reply.userVote = null;
      reply.upvotes = reply.upvotes.length;
      reply.downvotes = reply.downvotes.length;
    });
  }

  post.upvotes = post.upvotes.length;
  post.downvotes = post.downvotes.length;

  logger.info('Forum post retrieved', {
    userId: req.user?._id,
    postId: id,
  });

  res.status(200).json(new ApiResponse(200, { post }, 'Forum post retrieved successfully'));
});

/**
 * Create a new forum post
 */
const createForumPost = catchAsync(async (req, res) => {
  const { title, content, category, type, tags } = req.body;

  const post = await Forum.create({
    title,
    content,
    category,
    type,
    tags: tags || [],
    author: req.user._id,
  });

  await post.populate('author', 'username avatar');

  logger.info('Forum post created', {
    userId: req.user._id,
    postId: post._id,
    category,
    type,
  });

  res.status(201).json(new ApiResponse(201, { post }, 'Forum post created successfully'));
});

/**
 * Update a forum post
 */
const updateForumPost = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title, content, category, tags } = req.body;

  const post = await Forum.findById(id);

  if (!post) {
    return res.status(404).json(new ApiResponse(404, 'Forum post not found'));
  }

  // Check if user is author or admin
  if (!post.author.equals(req.user._id) && !req.user.isAdmin) {
    return res.status(403).json(new ApiResponse(403, 'Not authorized to update this post'));
  }

  // Check if post is locked
  if (post.isLocked && !req.user.isAdmin) {
    return res.status(403).json(new ApiResponse(403, 'This post is locked and cannot be edited'));
  }

  const updatedPost = await Forum.findByIdAndUpdate(
    id,
    { title, content, category, tags },
    { new: true, runValidators: true }
  ).populate('author', 'username avatar');

  logger.info('Forum post updated', {
    userId: req.user._id,
    postId: id,
  });

  res
    .status(200)
    .json(new ApiResponse(200, { post: updatedPost }, 'Forum post updated successfully'));
});

/**
 * Delete a forum post
 */
const deleteForumPost = catchAsync(async (req, res) => {
  const { id } = req.params;

  const post = await Forum.findById(id);

  if (!post) {
    return res.status(404).json(new ApiResponse(404, 'Forum post not found'));
  }

  // Check if user is author or admin
  if (!post.author.equals(req.user._id) && !req.user.isAdmin) {
    return res.status(403).json(new ApiResponse(403, 'Not authorized to delete this post'));
  }

  // Soft delete for regular users, hard delete for admins
  if (req.user.isAdmin) {
    await Forum.findByIdAndDelete(id);
  } else {
    post.status = 'deleted';
    await post.save();
  }

  logger.info('Forum post deleted', {
    userId: req.user._id,
    postId: id,
    isAdmin: req.user.isAdmin,
  });

  res.status(200).json(new ApiResponse(200, 'Forum post deleted successfully'));
});

/**
 * Vote on a forum post
 */
const votePost = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { voteType } = req.body;

  if (!['upvote', 'downvote'].includes(voteType)) {
    return res.status(400).json(new ApiResponse(400, 'Invalid vote type'));
  }

  const post = await Forum.findById(id);

  if (!post) {
    return res.status(404).json(new ApiResponse(404, 'Forum post not found'));
  }

  await post.toggleVote(req.user._id, voteType);

  logger.info('Forum post voted', {
    userId: req.user._id,
    postId: id,
    voteType,
  });

  res.status(200).json(
    new ApiResponse(200, 'Vote recorded successfully', {
      voteCount: post.voteCount,
      upvotes: post.upvotes.length,
      downvotes: post.downvotes.length,
    })
  );
});

/**
 * Add a reply to a forum post
 */
const addReply = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const post = await Forum.findById(id);

  if (!post) {
    return res.status(404).json(new ApiResponse(404, 'Forum post not found'));
  }

  // Check if post is locked
  if (post.isLocked && !req.user.isAdmin) {
    return res
      .status(403)
      .json(new ApiResponse(403, 'This post is locked and cannot be replied to'));
  }

  await post.addReply(req.user._id, content);

  // Populate the new reply
  await post.populate('replies.author', 'username avatar');

  const newReply = post.replies[post.replies.length - 1];

  logger.info('Reply added to forum post', {
    userId: req.user._id,
    postId: id,
    replyId: newReply._id,
  });

  res.status(201).json(new ApiResponse(201, 'Reply added successfully', { reply: newReply }));
});

/**
 * Vote on a reply
 */
const voteReply = catchAsync(async (req, res) => {
  const { id, replyIndex } = req.params;
  const { voteType } = req.body;

  if (!['upvote', 'downvote'].includes(voteType)) {
    return res.status(400).json(new ApiResponse(400, 'Invalid vote type'));
  }

  const post = await Forum.findById(id);

  if (!post) {
    return res.status(404).json(new ApiResponse(404, 'Forum post not found'));
  }

  await post.toggleReplyVote(parseInt(replyIndex), req.user._id, voteType);

  const reply = post.replies[replyIndex];

  logger.info('Reply voted', {
    userId: req.user._id,
    postId: id,
    replyIndex,
    voteType,
  });

  res.status(200).json(
    new ApiResponse(200, 'Vote recorded successfully', {
      upvotes: reply.upvotes.length,
      downvotes: reply.downvotes.length,
    })
  );
});

/**
 * Accept an answer (for questions)
 */
const acceptAnswer = catchAsync(async (req, res) => {
  const { id, replyIndex } = req.params;

  const post = await Forum.findById(id);

  if (!post) {
    return res.status(404).json(new ApiResponse(404, 'Forum post not found'));
  }

  // Check if user is author or admin
  if (!post.author.equals(req.user._id) && !req.user.isAdmin) {
    return res
      .status(403)
      .json(new ApiResponse(403, 'Not authorized to accept answers for this post'));
  }

  await post.acceptAnswer(parseInt(replyIndex));

  logger.info('Answer accepted', {
    userId: req.user._id,
    postId: id,
    replyIndex,
  });

  res.status(200).json(new ApiResponse(200, 'Answer accepted successfully'));
});

/**
 * Delete a reply (reply author or admin only)
 */
const deleteReply = catchAsync(async (req, res) => {
  const { id, replyIndex } = req.params;

  const post = await Forum.findById(id);

  if (!post) {
    return res.status(404).json(new ApiResponse(404, 'Forum post not found'));
  }

  const reply = post.replies[parseInt(replyIndex)];
  if (!reply) {
    return res.status(404).json(new ApiResponse(404, 'Reply not found'));
  }

  // Check if user is reply author or admin
  if (!reply.author.equals(req.user._id) && !req.user.isAdmin) {
    return res.status(403).json(new ApiResponse(403, 'Not authorized to delete this reply'));
  }

  await post.deleteReply(parseInt(replyIndex));

  logger.info('Reply deleted', {
    userId: req.user._id,
    postId: id,
    replyIndex,
  });

  res.status(200).json(new ApiResponse(200, 'Reply deleted successfully'));
});

/**
 * Get forum categories
 */
const getCategories = catchAsync(async (req, res) => {
  const categories = Forum.getCategories();

  res.status(200).json(new ApiResponse(200, { categories }, 'Categories retrieved successfully'));
});

/**
 * Get forum statistics
 */
const getForumStats = catchAsync(async (req, res) => {
  try {
    // Get all active posts
    const posts = await Forum.find({ status: 'active' });

    // Calculate stats manually, always defaulting to arrays/numbers
    const totalPosts = posts.length;
    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
    const totalReplies = posts.reduce(
      (sum, post) => sum + (Array.isArray(post.replies) ? post.replies.length : 0),
      0
    );
    const totalVotes = posts.reduce((sum, post) => {
      const upvotes = Array.isArray(post.upvotes) ? post.upvotes.length : 0;
      const downvotes = Array.isArray(post.downvotes) ? post.downvotes.length : 0;
      return sum + upvotes + downvotes;
    }, 0);

    // Get category stats
    const categoryCounts = {};
    posts.forEach((post) => {
      const category = typeof post.category === 'string' ? post.category : 'general';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const categoryStats = Object.entries(categoryCounts)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => b.count - a.count);

    // Get recent activity
    const recentActivity = await Forum.find({ status: 'active' })
      .populate('author', 'username')
      .sort({ lastActivity: -1 })
      .limit(5)
      .select('title lastActivity author');

    res.status(200).json(
      new ApiResponse(
        200,
        {
          stats: {
            totalPosts,
            totalViews,
            totalReplies,
            totalVotes,
          },
          categoryStats,
          recentActivity,
        },
        'Forum statistics retrieved successfully'
      )
    );
  } catch (error) {
    logger.error('Error getting forum stats', error);
    res.status(500).json(new ApiResponse(500, 'Error retrieving forum statistics'));
  }
});

/**
 * Moderate forum post (admin only)
 */
const moderatePost = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;

  if (!req.user.isAdmin) {
    return res.status(403).json(new ApiResponse(403, 'Admin access required'));
  }

  const post = await Forum.findById(id);

  if (!post) {
    return res.status(404).json(new ApiResponse(404, 'Forum post not found'));
  }

  switch (action) {
    case 'pin':
      post.isPinned = !post.isPinned;
      break;
    case 'sticky':
      post.isSticky = !post.isSticky;
      break;
    case 'lock':
      post.isLocked = !post.isLocked;
      break;
    case 'close':
      post.status = 'closed';
      break;
    case 'delete':
      post.status = 'deleted';
      break;
    default:
      return res.status(400).json(new ApiResponse(400, 'Invalid moderation action'));
  }

  await post.save();

  logger.info('Forum post moderated', {
    adminId: req.user._id,
    postId: id,
    action,
    reason,
  });

  res.status(200).json(new ApiResponse(200, 'Post moderated successfully', { post }));
});

module.exports = {
  getForumPosts,
  getForumPost,
  createForumPost,
  updateForumPost,
  deleteForumPost,
  votePost,
  addReply,
  voteReply,
  acceptAnswer,
  deleteReply,
  getCategories,
  getForumStats,
  moderatePost,
};
