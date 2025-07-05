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
    const existingOwner = await Owner.findOne({ user: userId });
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
      targetUserId: req.body.userId 
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
      userId: req.user?._id 
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
      userId: req.user?._id 
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
      userId: req.user?._id 
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

    // Get booking statistics for the last 30 days
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
          totalRevenue: { $sum: '$totalPrice' },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
          },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
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
      userId: req.user?._id 
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
    const { period = '30d', startDate, endDate } = req.query;

    const owner = await Owner.findOne({ user: req.user._id });
    if (!owner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Owner profile not found',
      });
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

    // Revenue analytics
    const revenueAnalytics = await Booking.aggregate([
      {
        $match: {
          campground: { $in: owner.campgrounds },
          status: 'confirmed',
          paid: true,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    // Booking status distribution
    const bookingStatusStats = await Booking.aggregate([
      {
        $match: {
          campground: { $in: owner.campgrounds },
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

    // Campground performance
    const campgroundPerformance = await Booking.aggregate([
      {
        $match: {
          campground: { $in: owner.campgrounds },
          status: 'confirmed',
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

    res.json({
      period,
      analytics: {
        revenue: revenueAnalytics,
        bookingStatus: bookingStatusStats,
        campgroundPerformance,
      },
    });
  } catch (error) {
    logError('Error fetching owner analytics', error, { 
      endpoint: '/api/owners/analytics',
      userId: req.user?._id,
      query: req.query 
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch analytics data',
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
      .populate('campground', 'title location')
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
      query: req.query 
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

    // Check if user already has an application
    const existingApplication = await OwnerApplication.findOne({ user: req.user._id });
    if (existingApplication) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You already have a pending owner application',
      });
    }

    // Check if user is already an owner
    const existingOwner = await Owner.findOne({ user: req.user._id });
    if (existingOwner) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User is already registered as an owner',
      });
    }

    // Create new owner application
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
      },
    });
  } catch (error) {
    logError('Error submitting owner application', error, { 
      endpoint: '/api/owners/apply',
      userId: req.user?._id 
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
      userId: req.user?._id 
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
      userId: req.user?._id 
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
      userId: req.user?._id 
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to upload documents',
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
  getOwnerBookings,
  applyToBeOwner,
  getOwnerApplication,
  updateOwnerApplication,
  uploadApplicationDocuments,
};
