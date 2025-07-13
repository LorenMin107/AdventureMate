const express = require('express');
const router = express.Router();
const {
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
} = require('../../controllers/api/forum');
const { authenticateJWT } = require('../../middleware/jwtAuth');
const { validateForumPost, validateReply } = require('../../middleware/validators');

/**
 * @swagger
 * components:
 *   schemas:
 *     ForumPost:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - category
 *         - type
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: Post title
 *         content:
 *           type: string
 *           maxLength: 5000
 *           description: Post content
 *         category:
 *           type: string
 *           enum: [general, camping-tips, equipment, destinations, safety, reviews, questions, announcements]
 *           description: Post category
 *         type:
 *           type: string
 *           enum: [discussion, question]
 *           description: Post type
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Post tags
 *     Reply:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           maxLength: 2000
 *           description: Reply content
 */

/**
 * @swagger
 * /api/v1/forum:
 *   get:
 *     summary: Get forum posts with filtering and pagination
 *     tags: [Forum]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of posts per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [discussion, question]
 *         description: Filter by post type
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, oldest, most_voted, most_replied, most_viewed, trending]
 *           default: latest
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *     responses:
 *       200:
 *         description: Forum posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ForumPost'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 */
router.get('/', getForumPosts);

/**
 * @swagger
 * /api/v1/forum/categories:
 *   get:
 *     summary: Get forum categories
 *     tags: [Forum]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: string
 *                           icon:
 *                             type: string
 */
router.get('/categories', getCategories);

/**
 * @swagger
 * /api/v1/forum/stats:
 *   get:
 *     summary: Get forum statistics
 *     tags: [Forum]
 *     responses:
 *       200:
 *         description: Forum statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalPosts:
 *                           type: integer
 *                         totalViews:
 *                           type: integer
 *                         totalReplies:
 *                           type: integer
 *                         totalVotes:
 *                           type: integer
 *                     categoryStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           lastActivity:
 *                             type: string
 *                           author:
 *                             type: object
 *                             properties:
 *                               username:
 *                                 type: string
 */
router.get('/stats', getForumStats);

/**
 * @swagger
 * /api/v1/forum:
 *   post:
 *     summary: Create a new forum post
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForumPost'
 *     responses:
 *       201:
 *         description: Forum post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     post:
 *                       $ref: '#/components/schemas/ForumPost'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateJWT, validateForumPost, createForumPost);

/**
 * @swagger
 * /api/v1/forum/{id}:
 *   get:
 *     summary: Get a single forum post by ID
 *     tags: [Forum]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Forum post ID
 *     responses:
 *       200:
 *         description: Forum post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     post:
 *                       $ref: '#/components/schemas/ForumPost'
 *       404:
 *         description: Forum post not found
 */
router.get('/:id', getForumPost);

/**
 * @swagger
 * /api/v1/forum/{id}:
 *   put:
 *     summary: Update a forum post
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Forum post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForumPost'
 *     responses:
 *       200:
 *         description: Forum post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     post:
 *                       $ref: '#/components/schemas/ForumPost'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Forum post not found
 */
router.put('/:id', authenticateJWT, validateForumPost, updateForumPost);

/**
 * @swagger
 * /api/v1/forum/{id}:
 *   delete:
 *     summary: Delete a forum post
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Forum post ID
 *     responses:
 *       200:
 *         description: Forum post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Forum post not found
 */
router.delete('/:id', authenticateJWT, deleteForumPost);

/**
 * @swagger
 * /api/v1/forum/{id}/vote:
 *   post:
 *     summary: Vote on a forum post
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Forum post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voteType
 *             properties:
 *               voteType:
 *                 type: string
 *                 enum: [upvote, downvote]
 *                 description: Vote type
 *     responses:
 *       200:
 *         description: Vote recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     voteCount:
 *                       type: integer
 *                     upvotes:
 *                       type: integer
 *                     downvotes:
 *                       type: integer
 *       400:
 *         description: Invalid vote type
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Forum post not found
 */
router.post('/:id/vote', authenticateJWT, votePost);

/**
 * @swagger
 * /api/v1/forum/{id}/replies:
 *   post:
 *     summary: Add a reply to a forum post
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Forum post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reply'
 *     responses:
 *       201:
 *         description: Reply added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     reply:
 *                       $ref: '#/components/schemas/Reply'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Post is locked
 *       404:
 *         description: Forum post not found
 */
router.post('/:id/replies', authenticateJWT, validateReply, addReply);

/**
 * @swagger
 * /api/v1/forum/{id}/replies/{replyIndex}/vote:
 *   post:
 *     summary: Vote on a reply
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Forum post ID
 *       - in: path
 *         name: replyIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Reply index
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voteType
 *             properties:
 *               voteType:
 *                 type: string
 *                 enum: [upvote, downvote]
 *                 description: Vote type
 *     responses:
 *       200:
 *         description: Vote recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     upvotes:
 *                       type: integer
 *                     downvotes:
 *                       type: integer
 *       400:
 *         description: Invalid vote type
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Forum post or reply not found
 */
router.post('/:id/replies/:replyIndex/vote', authenticateJWT, voteReply);

/**
 * @swagger
 * /api/v1/forum/{id}/replies/{replyIndex}/accept:
 *   post:
 *     summary: Accept an answer (for questions)
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Forum post ID
 *       - in: path
 *         name: replyIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Reply index
 *     responses:
 *       200:
 *         description: Answer accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to accept answers
 *       404:
 *         description: Forum post not found
 */
router.post('/:id/replies/:replyIndex/accept', authenticateJWT, acceptAnswer);

/**
 * @swagger
 * /api/v1/forum/{id}/replies/{replyIndex}:
 *   delete:
 *     summary: Delete a reply
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Forum post ID
 *       - in: path
 *         name: replyIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Reply index
 *     responses:
 *       200:
 *         description: Reply deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to delete this reply
 *       404:
 *         description: Forum post or reply not found
 */
router.delete('/:id/replies/:replyIndex', authenticateJWT, deleteReply);

/**
 * @swagger
 * /api/v1/forum/{id}/moderate:
 *   post:
 *     summary: Moderate a forum post (admin only)
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Forum post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [pin, sticky, lock, close, delete]
 *                 description: Moderation action
 *               reason:
 *                 type: string
 *                 description: Reason for moderation
 *     responses:
 *       200:
 *         description: Post moderated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     post:
 *                       $ref: '#/components/schemas/ForumPost'
 *       400:
 *         description: Invalid moderation action
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Forum post not found
 */
router.post('/:id/moderate', authenticateJWT, moderatePost);

module.exports = router;
