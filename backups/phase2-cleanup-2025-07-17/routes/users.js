const express = require("express");
const router = express.Router();
const users = require("../controllers/users");
const Contact = require("../models/contact");
const catchAsync = require("../utils/catchAsync");
const { authenticateJWT } = require("../middleware/jwtAuth");

router.route("/register").get(users.renderRegister).post(catchAsync(users.register));
router.route("/login").get(users.renderLogin).post(catchAsync(users.login));
router.get("/about", users.about);
router.get("/terms", users.terms);
router.get("/privacy", users.privacy);

router.route("/contact").get(users.renderContact).post(authenticateJWT, catchAsync(users.submitContact));

router.get("/logout", users.logout);

module.exports = router;
