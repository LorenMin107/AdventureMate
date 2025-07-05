const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams: true allows us to access the params from the parent router

const reviews = require("../controllers/reviews");
const catchAsync = require("../utils/catchAsync");
const { validateReview } = require("../middleware");
const { authenticateJWT, requireAuth } = require("../middleware/jwtAuth");
const { isReviewAuthorJWT } = require("../middleware/webJwtAuth");

router.post("/", authenticateJWT, requireAuth, validateReview, catchAsync(reviews.createReview));

router.delete("/:reviewId", authenticateJWT, requireAuth, isReviewAuthorJWT, catchAsync(reviews.deleteReview));
module.exports = router;
