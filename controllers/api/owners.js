const Owner = require('../../models/owner');
const OwnerApplication = require('../../models/ownerApplication');
const User = require('../../models/user');
const Campground = require('../../models/campground');
const Booking = require('../../models/booking');
const Review = require('../../models/review');
const ExpressError = require('../../utils/ExpressError');
const { generateToken, revokeAllUserTokens } = require('../../utils/jwtUtils');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { logError, logInfo, logDebug } = require('../../utils/logger');

/**
 * Register a new owner
 * POST /api/owners/register
 * Can be used by:
 * 1. Admin to approve applications (with userId parameter)
 * 2. Authenticated users to register themselves as owners (without userId parameter)
 */
const registerOwner = async (req, res) => {
  try {
    const {
      userId,
      applicationId,
      businessName,
      businessType,
      businessRegistrationNumber,
      taxId,
      businessAddress,
      businessPhone,
      businessEmail,
      bankingInfo,
      settings,
      verificationStatus = 'pending',
    } = req.body;

    // Determine the user ID - if userId is provided and user is admin, use that
    // Otherwise use the authenticated user's ID
    let targetUserId;
    let isAdminRegistration = false;

    if (userId && req.user.isAdmin) {
      targetUserId = userId;
      isAdminRegistration = true;
    } else {
      targetUserId = req.user._id;
    }

    // Check if user exists
    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Check if user is already an owner
    const existingOwner = await Owner.findOne({ user: targetUserId });
    if (existingOwner) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User is already registered as an owner',
      });
    }

    // If applicationId is provided, get data from application
    let applicationData = {};
    if (applicationId) {
      const application = await OwnerApplication.findById(applicationId);
      if (application) {
        applicationData = {
          businessName: application.businessName,
          businessType: application.businessType,
          businessRegistrationNumber: application.businessRegistrationNumber,
          taxId: application.taxId,
          businessAddress: application.businessAddress,
          businessPhone: application.businessPhone,
          businessEmail: application.businessEmail,
          bankingInfo: application.bankingInfo,
          verificationDocuments: application.documents.map((doc) => ({
            type: doc.type,
            filename: doc.filename,
            url: doc.url,
            uploadedAt: doc.uploadedAt,
            status: 'approved',
          })),
        };
      }
    }

    // Set verification status based on who is registering
    // Admin registrations can be immediately verified if specified
    // Self-registrations always start as pending
    const finalVerificationStatus = isAdminRegistration ? verificationStatus : 'pending';

    // Create new owner (use application data if available, otherwise use request body)
    const owner = new Owner({
      user: targetUserId,
      businessName: businessName || applicationData.businessName,
      businessType: businessType || applicationData.businessType,
      businessRegistrationNumber:
        businessRegistrationNumber || applicationData.businessRegistrationNumber,
      taxId: taxId || applicationData.taxId,
      businessAddress: businessAddress || applicationData.businessAddress,
      businessPhone: businessPhone || applicationData.businessPhone,
      businessEmail: businessEmail || applicationData.businessEmail,
      bankingInfo: bankingInfo || applicationData.bankingInfo,
      settings: settings || {},
      verificationStatus: finalVerificationStatus,
      verifiedAt: finalVerificationStatus === 'verified' ? new Date() : undefined,
      verifiedBy: finalVerificationStatus === 'verified' ? req.user._id : undefined,
      verificationDocuments: applicationData.verificationDocuments || [],
    });

    await owner.save();

    // Update user to mark as owner if verified immediately (admin registration)
    // For self-registrations, the user will be marked as owner when their application is approved
    if (finalVerificationStatus === 'verified') {
      await User.findByIdAndUpdate(targetUserId, { isOwner: true });

      // Revoke all refresh tokens for the user to force token refresh with updated isOwner status
      await revokeAllUserTokens(targetUserId);
    }

    // If this was from an application, mark it as approved
    if (applicationId && isAdminRegistration) {
      await OwnerApplication.findByIdAndUpdate(applicationId, {
        status: 'approved',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      });
    }

    // Different response messages based on who is registering and the verification status
    let responseMessage;
    if (isAdminRegistration) {
      responseMessage = 'Owner registration successful.';
    } else {
      responseMessage =
        'Your owner application has been submitted and is pending review. You will be notified once it is approved.';
    }

    res.status(201).json({
      message: responseMessage,
      owner: {
        id: owner._id,
        businessName: owner.businessName,
        verificationStatus: owner.verificationStatus,
        verificationStatusDisplay: owner.verificationStatusDisplay,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      },
    });
  } catch (error) {
    logError('Error registering owner', error, {
      endpoint: '/api/owners/register',
      userId: req.user?._id,
      targetUserId: req.body.userId,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register owner',
    });
  }
};

/**
 * Get owner profile
 * GET /api/owners/profile
 */
const getOwnerProfile = async (req, res) => {
  try {
    const owner = await Owner.findOne({ user: req.user._id })
      .populate('user', 'username email phone')
      .populate('campgrounds', 'title location images');

    if (!owner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Owner profile not found',
      });
    }

    res.json({
      owner: {
        ...owner.toObject(),
        // Don't expose sensitive information
        verificationToken: undefined,
        bankingInfo: {
          ...owner.bankingInfo,
          accountNumber: owner.bankingInfo.accountNumber
            ? '*'.repeat(owner.bankingInfo.accountNumber.length - 4) +
              owner.bankingInfo.accountNumber.slice(-4)
            : undefined,
        },
      },
    });
  } catch (error) {
    logError('Error fetching owner profile', error, {
      endpoint: '/api/owners/profile',
      userId: req.user?._id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch owner profile',
    });
  }
};

/**
 * Update owner profile
 * PUT /api/owners/profile
 */
const updateOwnerProfile = async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      businessRegistrationNumber,
      taxId,
      businessAddress,
      businessPhone,
      businessEmail,
      bankingInfo,
      settings,
    } = req.body;

    const owner = await Owner.findOne({ user: req.user._id });
    if (!owner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Owner profile not found',
      });
    }

    // Update fields
    if (businessName) owner.businessName = businessName;
    if (businessType) owner.businessType = businessType;
    if (businessRegistrationNumber) owner.businessRegistrationNumber = businessRegistrationNumber;
    if (taxId) owner.taxId = taxId;
    if (businessAddress) owner.businessAddress = { ...owner.businessAddress, ...businessAddress };
    if (businessPhone) owner.businessPhone = businessPhone;
    if (businessEmail) owner.businessEmail = businessEmail;
    if (bankingInfo) owner.bankingInfo = { ...owner.bankingInfo, ...bankingInfo };
    if (settings) owner.settings = { ...owner.settings, ...settings };

    await owner.save();

    res.json({
      message: 'Owner profile updated successfully',
      owner: {
        ...owner.toObject(),
        verificationToken: undefined,
        bankingInfo: {
          ...owner.bankingInfo,
          accountNumber: owner.bankingInfo.accountNumber
            ? '*'.repeat(owner.bankingInfo.accountNumber.length - 4) +
              owner.bankingInfo.accountNumber.slice(-4)
            : undefined,
        },
      },
    });
  } catch (error) {
    logError('Error updating owner profile', error, {
      endpoint: '/api/owners/profile',
      userId: req.user?._id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update owner profile',
    });
  }
};

/**
 * Upload verification documents
 * POST /api/owners/verification/documents
 */
const uploadVerificationDocuments = async (req, res) => {
  try {
    const { type, description } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No files uploaded',
      });
    }

    const owner = await Owner.findOne({ user: req.user._id });
    if (!owner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Owner profile not found',
      });
    }

    // Add documents to owner
    const documents = req.files.map((file) => ({
      type: type || 'other',
      filename: file.filename,
      url: file.path,
      description,
      uploadedAt: new Date(),
      status: 'pending',
    }));

    owner.verificationDocuments.push(...documents);

    // Update verification status to under_review if it was pending
    if (owner.verificationStatus === 'pending') {
      owner.verificationStatus = 'under_review';
    }

    await owner.save();

    res.json({
      message: 'Documents uploaded successfully',
      documents: documents.map((doc) => ({
        type: doc.type,
        filename: doc.filename,
        uploadedAt: doc.uploadedAt,
        status: doc.status,
      })),
    });
  } catch (error) {
    logError('Error uploading verification documents', error, {
      endpoint: '/api/owners/verification-documents',
      userId: req.user?._id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to upload verification documents',
    });
  }
};

/**
 * Get owner dashboard data
 * GET /api/owners/dashboard
 */
const getOwnerDashboard = async (req, res) => {
  try {
    const owner = await Owner.findOne({ user: req.user._id }).populate(
      'campgrounds',
      'title location images'
    );

    if (!owner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Owner profile not found',
      });
    }

    // Get recent bookings
    const recentBookings = await Booking.find({
      campground: { $in: owner.campgrounds },
    })
      .populate('user', 'username email')
      .populate('campground', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get booking statistics for the last 30 days (include cancelled bookings in revenue since no refunds are given)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          campground: { $in: owner.campgrounds },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ['confirmed', 'cancelled']] },
                    { $eq: ['$paid', true] },
                  ],
                },
                '$totalPrice',
                0,
              ],
            },
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
          },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
    ]);

    // Get average rating
    const ratingStats = await Review.aggregate([
      {
        $lookup: {
          from: 'campgrounds',
          localField: 'campground',
          foreignField: '_id',
          as: 'campgroundData',
        },
      },
      {
        $match: {
          'campgroundData._id': { $in: owner.campgrounds },
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const stats = bookingStats[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
      cancelledBookings: 0,
    };

    const ratings = ratingStats[0] || {
      averageRating: 0,
      totalReviews: 0,
    };

    res.json({
      owner: {
        id: owner._id,
        businessName: owner.businessName,
        verificationStatus: owner.verificationStatus,
        verificationStatusDisplay: owner.verificationStatusDisplay,
        totalCampgrounds: owner.campgrounds.length,
      },
      stats: {
        ...stats,
        averageRating: Math.round(ratings.averageRating * 10) / 10,
        totalReviews: ratings.totalReviews,
      },
      recentBookings,
      campgrounds: owner.campgrounds,
    });
  } catch (error) {
    logError('Error fetching owner dashboard', error, {
      endpoint: '/api/owners/dashboard',
      userId: req.user?._id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch dashboard data',
    });
  }
};

/**
 * Get owner analytics
 * GET /api/owners/analytics
 */
const getOwnerAnalytics = async (req, res) => {
  try {
    const { period = '30d', startDate, endDate, campgroundId } = req.query;

    const owner = await Owner.findOne({ user: req.user._id });
    if (!owner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Owner profile not found',
      });
    }

    // Determine which campgrounds to analyze
    let campgroundsToAnalyze = owner.campgrounds;
    if (campgroundId) {
      campgroundsToAnalyze = owner.campgrounds.filter((camp) => camp.toString() === campgroundId);
      if (campgroundsToAnalyze.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Campground not found or not owned by you',
        });
      }
    }

    // Calculate date range
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    } else {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      const startOfPeriod = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: startOfPeriod } };
    }

    // Calculate previous period for comparison
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const previousPeriodStart = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);
    const currentPeriodStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const previousPeriodFilter = {
      createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart },
    };

    // Current period revenue and bookings (include cancelled bookings since no refunds are given)
    const currentPeriodStats = await Booking.aggregate([
      {
        $match: {
          campground: { $in: campgroundsToAnalyze },
          status: { $in: ['confirmed', 'cancelled'] },
          paid: true,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalBookings: { $sum: 1 },
        },
      },
    ]);

    // Previous period revenue and bookings (include cancelled bookings since no refunds are given)
    const previousPeriodStats = await Booking.aggregate([
      {
        $match: {
          campground: { $in: campgroundsToAnalyze },
          status: { $in: ['confirmed', 'cancelled'] },
          paid: true,
          ...previousPeriodFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalBookings: { $sum: 1 },
        },
      },
    ]);

    const current = currentPeriodStats[0] || { totalRevenue: 0, totalBookings: 0 };
    const previous = previousPeriodStats[0] || { totalRevenue: 0, totalBookings: 0 };

    // Calculate percentage changes
    const revenueChange =
      previous.totalRevenue > 0
        ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100
        : 0;
    const bookingsChange =
      previous.totalBookings > 0
        ? ((current.totalBookings - previous.totalBookings) / previous.totalBookings) * 100
        : 0;

    // Booking status distribution
    const bookingStatusStats = await Booking.aggregate([
      {
        $match: {
          campground: { $in: campgroundsToAnalyze },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to object format
    const bookingStatus = {};
    bookingStatusStats.forEach((stat) => {
      bookingStatus[stat._id] = stat.count;
    });

    // Campground performance (include cancelled bookings in revenue since no refunds are given)
    const campgroundPerformance = await Booking.aggregate([
      {
        $match: {
          campground: { $in: campgroundsToAnalyze },
          status: { $in: ['confirmed', 'cancelled'] },
          paid: true,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: '$campground',
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'campgrounds',
          localField: '_id',
          foreignField: '_id',
          as: 'campground',
        },
      },
      {
        $unwind: '$campground',
      },
      {
        $project: {
          campgroundId: '$_id',
          campgroundName: '$campground.title',
          revenue: 1,
          bookings: 1,
        },
      },
      {
        $sort: { revenue: -1 },
      },
    ]);

    // Get campground list for dropdown
    const campgroundsList = await Campground.find(
      { _id: { $in: owner.campgrounds } },
      'title _id'
    ).sort({ title: 1 });

    // Get reviews data
    const reviewsStats = await Review.aggregate([
      {
        $lookup: {
          from: 'campgrounds',
          localField: 'campground',
          foreignField: '_id',
          as: 'campgroundData',
        },
      },
      {
        $match: {
          'campgroundData._id': { $in: campgroundsToAnalyze },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const reviews = reviewsStats[0] || { averageRating: 0, totalReviews: 0 };

    // Get recent reviews for the owner's campgrounds
    const recentReviews = await Review.aggregate([
      {
        $lookup: {
          from: 'campgrounds',
          localField: 'campground',
          foreignField: '_id',
          as: 'campgroundData',
        },
      },
      {
        $match: {
          'campgroundData._id': { $in: campgroundsToAnalyze },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $unwind: '$campgroundData',
      },
      {
        $unwind: '$userData',
      },
      {
        $project: {
          _id: 1,
          rating: 1,
          body: 1,
          createdAt: 1,
          campground: '$campgroundData.title',
          author: '$userData.username',
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Calculate average booking value and duration (include cancelled bookings since no refunds are given)
    const bookingMetrics = await Booking.aggregate([
      {
        $match: {
          campground: { $in: campgroundsToAnalyze },
          status: { $in: ['confirmed', 'cancelled'] },
          paid: true,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          averageValue: { $avg: '$totalPrice' },
          totalBookings: { $sum: 1 },
        },
      },
    ]);

    const bookingMetricsData = bookingMetrics[0] || { averageValue: 0, totalBookings: 0 };

    // Calculate cancellation rate
    const cancellationStats = await Booking.aggregate([
      {
        $match: {
          campground: { $in: campgroundsToAnalyze },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
    ]);

    const cancellationData = cancellationStats[0] || { totalBookings: 0, cancelledBookings: 0 };
    const cancellationRate =
      cancellationData.totalBookings > 0
        ? (cancellationData.cancelledBookings / cancellationData.totalBookings) * 100
        : 0;

    // Prepare response data
    const responseData = {
      overview: {
        occupancyRate: 0, // Would need campsite data to calculate
        occupancyChange: 0,
      },
      revenue: {
        total: current.totalRevenue,
        change: revenueChange,
        byCampground: campgroundPerformance.map((camp) => ({
          name: camp.campgroundName,
          amount: camp.revenue,
        })),
      },
      bookings: {
        total: current.totalBookings,
        change: bookingsChange,
        confirmed: bookingStatus.confirmed || 0,
        pending: bookingStatus.pending || 0,
        cancelled: bookingStatus.cancelled || 0,
        completed: bookingStatus.completed || 0,
        averageValue: bookingMetricsData.averageValue,
        averageDuration: 1, // Would need check-in/check-out dates to calculate
        cancellationRate: cancellationRate,
        repeatCustomerRate: 0, // Would need user analysis to calculate
      },
      campgrounds: {
        list: campgroundsList,
      },
      reviews: {
        averageRating: reviews.averageRating,
        totalReviews: reviews.totalReviews,
        recent: recentReviews,
      },
      trends: {
        // Would need time-series data to calculate trends
      },
      topPerformers: {
        campgrounds: campgroundPerformance.slice(0, 5).map((camp) => ({
          name: camp.campgroundName,
          revenue: camp.revenue,
          bookings: camp.bookings,
          rating: reviews.averageRating,
          occupancyRate: 0, // Would need campsite data to calculate
        })),
      },
    };

    res.json(responseData);
  } catch (error) {
    logError('Error fetching owner analytics', error, {
      endpoint: '/api/owners/analytics',
      userId: req.user?._id,
      query: req.query,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch analytics data',
    });
  }
};

/**
 * Get owner booking details
 * GET /api/owners/bookings/:id
 */
const getOwnerBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const owner = await Owner.findOne({ user: req.user._id });
    if (!owner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Owner profile not found',
      });
    }

    const booking = await Booking.findById(id)
      .populate('user', 'username email phone')
      .populate('campground', 'title location images')
      .populate('campsite', 'name type description features price capacity images');

    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    // Check if the booking belongs to one of the owner's campgrounds
    if (!owner.campgrounds.includes(booking.campground._id)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view this booking',
      });
    }

    res.json({
      booking,
    });
  } catch (error) {
    logError('Error fetching owner booking', error, {
      endpoint: '/api/owners/bookings/:id',
      userId: req.user?._id,
      bookingId: req.params.id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch booking',
    });
  }
};

/**
 * Update owner booking status
 * PATCH /api/owners/bookings/:id/status
 */
const updateOwnerBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid status. Must be one of: pending, confirmed, cancelled, completed',
      });
    }

    const owner = await Owner.findOne({ user: req.user._id });
    if (!owner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Owner profile not found',
      });
    }

    const booking = await Booking.findById(id)
      .populate('campground', 'title location images')
      .populate('user', 'username email');

    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    // Check if the booking belongs to one of the owner's campgrounds
    if (!owner.campgrounds.includes(booking.campground._id)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this booking',
      });
    }

    booking.status = status;
    await booking.save();

    res.json({
      message: 'Booking status updated successfully',
      booking,
    });
  } catch (error) {
    logError('Error updating owner booking status', error, {
      endpoint: '/api/owners/bookings/:id/status',
      userId: req.user?._id,
      bookingId: req.params.id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update booking status',
    });
  }
};

/**
 * Get owner bookings
 * GET /api/owners/bookings
 */
const getOwnerBookings = async (req, res) => {
  try {
    const { status, campgroundId, page = 1, limit = 20 } = req.query;

    const owner = await Owner.findOne({ user: req.user._id });
    if (!owner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Owner profile not found',
      });
    }

    // Build query
    const query = {
      campground: { $in: owner.campgrounds },
    };

    if (status) {
      query.status = status;
    }

    if (campgroundId) {
      query.campground = campgroundId;
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('user', 'username email phone')
      .populate('campground', 'title location images')
      .populate('campsite', 'name type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logError('Error fetching owner bookings', error, {
      endpoint: '/api/owners/bookings',
      userId: req.user?._id,
      query: req.query,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch bookings',
    });
  }
};

/**
 * Apply to become an owner
 * POST /api/owners/apply
 */
const applyToBeOwner = async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      businessRegistrationNumber,
      taxId,
      businessAddress,
      businessPhone,
      businessEmail,
      bankingInfo,
      applicationReason,
      experience,
      expectedProperties,
    } = req.body;

    // Check if user is already an owner
    const existingOwner = await Owner.findOne({ user: req.user._id });
    if (existingOwner) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User is already registered as an owner',
      });
    }

    // Check if user already has any application
    const existingApplication = await OwnerApplication.findOne({
      user: req.user._id,
    });

    if (existingApplication) {
      // If there's a pending or under_review application, don't allow resubmission
      if (
        existingApplication.status === 'pending' ||
        existingApplication.status === 'under_review'
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'You already have a pending owner application',
        });
      }

      // If there's a rejected application, update it instead of creating a new one
      if (existingApplication.status === 'rejected') {
        // Update the existing application with new data
        existingApplication.businessName = businessName;
        existingApplication.businessType = businessType;
        existingApplication.businessRegistrationNumber = businessRegistrationNumber;
        existingApplication.taxId = taxId;
        existingApplication.businessAddress = businessAddress;
        existingApplication.businessPhone = businessPhone;
        existingApplication.businessEmail = businessEmail;
        existingApplication.bankingInfo = bankingInfo;
        existingApplication.applicationReason = applicationReason;
        existingApplication.experience = experience;
        existingApplication.expectedProperties = expectedProperties;
        existingApplication.status = 'pending';
        existingApplication.rejectionReason = undefined; // Clear rejection reason
        existingApplication.reviewedBy = undefined; // Clear previous review
        existingApplication.reviewedAt = undefined; // Clear previous review date

        await existingApplication.save();

        res.status(200).json({
          message:
            'Owner application resubmitted successfully. You will be notified once it is reviewed.',
          application: {
            id: existingApplication._id,
            businessName: existingApplication.businessName,
            status: existingApplication.status,
            statusDisplay: existingApplication.statusDisplay,
            createdAt: existingApplication.createdAt,
            isResubmission: true,
          },
        });
        return;
      }

      // If there's an approved application, user is already an owner
      if (existingApplication.status === 'approved') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'You are already an approved owner',
        });
      }
    }

    // Create new owner application if no existing application
    const application = new OwnerApplication({
      user: req.user._id,
      businessName,
      businessType,
      businessRegistrationNumber,
      taxId,
      businessAddress,
      businessPhone,
      businessEmail,
      bankingInfo,
      applicationReason,
      experience,
      expectedProperties,
      status: 'pending',
    });

    await application.save();

    res.status(201).json({
      message:
        'Owner application submitted successfully. You will be notified once it is reviewed.',
      application: {
        id: application._id,
        businessName: application.businessName,
        status: application.status,
        statusDisplay: application.statusDisplay,
        createdAt: application.createdAt,
        isResubmission: false,
      },
    });
  } catch (error) {
    logError('Error submitting owner application', error, {
      endpoint: '/api/owners/apply',
      userId: req.user?._id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to submit owner application',
    });
  }
};

/**
 * Get owner application
 * GET /api/owners/application
 */
const getOwnerApplication = async (req, res) => {
  try {
    const application = await OwnerApplication.findOne({ user: req.user._id })
      .populate('user', 'username email phone')
      .populate('reviewedBy', 'username email');

    if (!application) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No owner application found',
      });
    }

    res.json({
      application: application.toObject(),
    });
  } catch (error) {
    logError('Error fetching owner application', error, {
      endpoint: '/api/owners/application',
      userId: req.user?._id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch owner application',
    });
  }
};

/**
 * Update owner application
 * PUT /api/owners/application
 */
const updateOwnerApplication = async (req, res) => {
  try {
    const application = await OwnerApplication.findOne({ user: req.user._id });
    if (!application) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No owner application found',
      });
    }

    // Check if application can be modified
    if (!application.canBeModified()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Application cannot be modified in its current status',
      });
    }

    const {
      businessName,
      businessType,
      businessRegistrationNumber,
      taxId,
      businessAddress,
      businessPhone,
      businessEmail,
      bankingInfo,
      applicationReason,
      experience,
      expectedProperties,
    } = req.body;

    // Update fields
    if (businessName) application.businessName = businessName;
    if (businessType) application.businessType = businessType;
    if (businessRegistrationNumber)
      application.businessRegistrationNumber = businessRegistrationNumber;
    if (taxId) application.taxId = taxId;
    if (businessAddress)
      application.businessAddress = { ...application.businessAddress, ...businessAddress };
    if (businessPhone) application.businessPhone = businessPhone;
    if (businessEmail) application.businessEmail = businessEmail;
    if (bankingInfo) application.bankingInfo = { ...application.bankingInfo, ...bankingInfo };
    if (applicationReason) application.applicationReason = applicationReason;
    if (experience) application.experience = experience;
    if (expectedProperties) application.expectedProperties = expectedProperties;

    await application.save();

    res.json({
      message: 'Application updated successfully',
      application: application.toObject(),
    });
  } catch (error) {
    logError('Error updating owner application', error, {
      endpoint: '/api/owners/application',
      userId: req.user?._id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update owner application',
    });
  }
};

/**
 * Upload application documents
 * POST /api/owners/application/documents
 */
const uploadApplicationDocuments = async (req, res) => {
  try {
    const { type, description } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No files uploaded',
      });
    }

    const application = await OwnerApplication.findOne({ user: req.user._id });
    if (!application) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No owner application found',
      });
    }

    // Check if application can be modified
    if (!application.canBeModified()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Documents cannot be uploaded for application in current status',
      });
    }

    // Add documents to application
    const documents = req.files.map((file) => ({
      type: type || 'other',
      filename: file.filename,
      url: file.path,
      uploadedAt: new Date(),
    }));

    application.documents.push(...documents);

    // Update status to under_review if it was pending
    if (application.status === 'pending') {
      application.status = 'under_review';
    }

    await application.save();

    res.json({
      message: 'Documents uploaded successfully',
      documents: documents.map((doc) => ({
        type: doc.type,
        filename: doc.filename,
        uploadedAt: doc.uploadedAt,
      })),
    });
  } catch (error) {
    logError('Error uploading application documents', error, {
      endpoint: '/api/owners/application/documents',
      userId: req.user?._id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to upload documents',
    });
  }
};

/**
 * Export revenue report
 * GET /api/owners/export/revenue
 */
const exportRevenueReport = async (req, res) => {
  try {
    const { period = '30d', format = 'csv' } = req.query;
    const owner = await Owner.findOne({ user: req.user._id }).populate('campgrounds');

    if (!owner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Owner profile not found',
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get revenue data
    const revenueData = await Booking.aggregate([
      {
        $match: {
          campground: { $in: owner.campgrounds.map((c) => c._id) },
          createdAt: { $gte: startDate },
          status: { $in: ['confirmed', 'cancelled'] },
          paid: true,
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            campground: '$campground',
          },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'campgrounds',
          localField: '_id.campground',
          foreignField: '_id',
          as: 'campgroundInfo',
        },
      },
      {
        $unwind: '$campgroundInfo',
      },
      {
        $sort: { '_id.date': 1 },
      },
    ]);

    if (format === 'json') {
      return res.json({
        period,
        startDate,
        endDate: now,
        revenueData,
      });
    }

    // Generate CSV
    const csvHeader = 'Date,Campground,Revenue,Bookings\n';
    const csvRows = revenueData
      .map(
        (item) => `${item._id.date},"${item.campgroundInfo.title}",${item.revenue},${item.bookings}`
      )
      .join('\n');
    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="revenue-report-${period}-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    logError('Error exporting revenue report', error, {
      endpoint: '/api/owners/export/revenue',
      userId: req.user?._id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export revenue report',
    });
  }
};

/**
 * Export booking report
 * GET /api/owners/export/bookings
 */
const exportBookingReport = async (req, res) => {
  try {
    const { period = '30d', format = 'csv' } = req.query;
    const owner = await Owner.findOne({ user: req.user._id }).populate('campgrounds');

    if (!owner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Owner profile not found',
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get booking data
    const bookingData = await Booking.find({
      campground: { $in: owner.campgrounds.map((c) => c._id) },
      createdAt: { $gte: startDate },
    })
      .populate('user', 'username email')
      .populate('campground', 'title')
      .populate('campsite', 'name')
      .sort({ createdAt: -1 });

    if (format === 'json') {
      return res.json({
        period,
        startDate,
        endDate: now,
        bookingData,
      });
    }

    // Generate CSV
    const csvHeader =
      'Booking ID,Date,Campground,Campsite,User,Status,Total Price,Check-in,Check-out\n';
    const csvRows = bookingData
      .map((booking) => {
        const title = booking.campground?.title || 'N/A';
        const name = booking.campsite?.name || 'N/A';
        const username = booking.user?.username || 'N/A';
        return `${booking._id},"${booking.createdAt.toISOString().split('T')[0]}","${title}","${name}","${username}","${booking.status}",${booking.totalPrice},"${booking.startDate}","${booking.endDate}"`;
      })
      .join('\n');
    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="booking-report-${period}-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    logError('Error exporting booking report', error, {
      endpoint: '/api/owners/export/bookings',
      userId: req.user?._id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export booking report',
    });
  }
};

/**
 * Export reviews report
 * GET /api/owners/export/reviews
 */
const exportReviewsReport = async (req, res) => {
  try {
    const { period = '30d', format = 'csv' } = req.query;
    const owner = await Owner.findOne({ user: req.user._id }).populate('campgrounds');

    if (!owner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Owner profile not found',
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get reviews data
    const reviewsData = await Review.find({
      campground: { $in: owner.campgrounds.map((c) => c._id) },
      createdAt: { $gte: startDate },
    })
      .populate('author', 'username')
      .populate('campground', 'title')
      .sort({ createdAt: -1 });

    if (format === 'json') {
      return res.json({
        period,
        startDate,
        endDate: now,
        reviewsData,
      });
    }

    // Generate CSV
    const csvHeader = 'Review ID,Date,Campground,Author,Rating,Comment\n';
    const csvRows = reviewsData
      .map((review) => {
        const title = review.campground?.title || 'N/A';
        const username = review.author?.username || 'N/A';
        const body = review.body.replace(/"/g, '""');
        return `${review._id},"${review.createdAt.toISOString().split('T')[0]}","${title}","${username}",${review.rating},"${body}"`;
      })
      .join('\n');
    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reviews-report-${period}-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    logError('Error exporting reviews report', error, {
      endpoint: '/api/owners/export/reviews',
      userId: req.user?._id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export reviews report',
    });
  }
};

/**
 * Export full report (combined data)
 * GET /api/owners/export/full
 */
const exportFullReport = async (req, res) => {
  try {
    const { period = '30d', format = 'csv' } = req.query;
    const owner = await Owner.findOne({ user: req.user._id }).populate('campgrounds');

    if (!owner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Owner profile not found',
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get all data
    const [revenueData, bookingData, reviewsData] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            campground: { $in: owner.campgrounds.map((c) => c._id) },
            createdAt: { $gte: startDate },
            status: { $in: ['confirmed', 'cancelled'] },
            paid: true,
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            totalBookings: { $sum: 1 },
          },
        },
      ]),
      Booking.find({
        campground: { $in: owner.campgrounds.map((c) => c._id) },
        createdAt: { $gte: startDate },
      }).countDocuments(),
      Review.find({
        campground: { $in: owner.campgrounds.map((c) => c._id) },
        createdAt: { $gte: startDate },
      }).countDocuments(),
    ]);

    const summary = {
      period,
      startDate,
      endDate: now,
      totalRevenue: revenueData[0]?.totalRevenue || 0,
      totalBookings: revenueData[0]?.totalBookings || 0,
      totalReviews: reviewsData,
      campgrounds: owner.campgrounds.length,
    };

    if (format === 'json') {
      return res.json(summary);
    }

    // Generate CSV
    const csvHeader = 'Metric,Value\n';
    const csvRows = [
      `Period,${period}`,
      `Start Date,${startDate.toISOString().split('T')[0]}`,
      `End Date,${now.toISOString().split('T')[0]}`,
      `Total Revenue,${summary.totalRevenue}`,
      `Total Bookings,${summary.totalBookings}`,
      `Total Reviews,${summary.totalReviews}`,
      `Campgrounds,${summary.campgrounds}`,
    ].join('\n');
    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="full-report-${period}-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    logError('Error exporting full report', error, {
      endpoint: '/api/owners/export/full',
      userId: req.user?._id,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export full report',
    });
  }
};

module.exports = {
  registerOwner,
  getOwnerProfile,
  updateOwnerProfile,
  uploadVerificationDocuments,
  getOwnerDashboard,
  getOwnerAnalytics,
  getOwnerBooking,
  getOwnerBookings,
  updateOwnerBookingStatus,
  applyToBeOwner,
  getOwnerApplication,
  updateOwnerApplication,
  uploadApplicationDocuments,
  exportRevenueReport,
  exportBookingReport,
  exportReviewsReport,
  exportFullReport,
};
