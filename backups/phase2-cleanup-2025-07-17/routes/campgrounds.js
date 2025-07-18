const express = require("express");
const router = express.Router();
const campgrounds = require("../controllers/campgrounds");
const catchAsync = require("../utils/catchAsync");
const { validateCampground } = require("../middleware");
const { authenticateJWT, requireAuth } = require("../middleware/jwtAuth");
const { isAuthorJWT, isAdminJWT } = require("../middleware/webJwtAuth");

const multer = require("multer"); // for handling file uploads
const { storage } = require("../cloudinary");
const upload = multer({ storage });

router
  .route("/")
  .get(catchAsync(campgrounds.index))
  .post(authenticateJWT, requireAuth, isAdminJWT, upload.array("image"), validateCampground, catchAsync(campgrounds.createCampground));

router.get("/new", authenticateJWT, requireAuth, isAdminJWT, campgrounds.renderNewForm);
router.get("/search", campgrounds.searchCampgrounds);

router
  .route("/:id")
  .get(catchAsync(campgrounds.showCampground))
  .put(authenticateJWT, requireAuth, isAuthorJWT, upload.array("image"), validateCampground, catchAsync(campgrounds.updateCampground))
  .delete(authenticateJWT, requireAuth, isAuthorJWT, catchAsync(campgrounds.deleteCampground));

router.get("/:id/edit", authenticateJWT, requireAuth, isAuthorJWT, catchAsync(campgrounds.renderEditForm));

module.exports = router;
