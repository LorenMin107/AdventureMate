const express = require('express');
const router = express.Router();

// Import all route files
const campgroundRoutes = require('./campgrounds');
const campsiteRoutes = require('./campsites');
const reviewRoutes = require('./reviews');
const userRoutes = require('./users');
const bookingRoutes = require('./bookings');
const adminRoutes = require('./admin');
const authRoutes = require('./auth');
const twoFactorAuthRoutes = require('./twoFactorAuth');
const ownerRoutes = require('./owners');
const weatherRoutes = require('./weather');
const safetyAlertRoutes = require('./safetyAlerts');
const campsiteSafetyAlertRoutes = require('./campsiteSafetyAlerts');
const mapboxRoutes = require('./mapbox');
const cloudinaryRoutes = require('./cloudinary');
const forumRoutes = require('./forum');

// Mount routes
router.use('/campgrounds/:id/reviews', reviewRoutes);
router.use('/campgrounds/:campgroundId/campsites', campsiteRoutes);
router.use('/campgrounds/:campgroundId/safety-alerts', safetyAlertRoutes);
router.use('/campgrounds', campgroundRoutes);
router.use('/campsites', campsiteRoutes);
router.use('/campsite-safety-alerts', campsiteSafetyAlertRoutes);
router.use('/bookings', bookingRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/2fa', twoFactorAuthRoutes);
router.use('/owners', ownerRoutes);
router.use('/trips', require('./trips'));
router.use('/weather', weatherRoutes);
router.use('/mapbox', mapboxRoutes);
router.use('/cloudinary', cloudinaryRoutes);
router.use('/forum', forumRoutes);

module.exports = router;
