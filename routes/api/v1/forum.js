const express = require('express');
const router = express.Router();
const forumRoutes = require('../forum');

// Mount all forum routes
router.use('/', forumRoutes);

module.exports = router;
