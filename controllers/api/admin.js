const User = require('../../models/user');
const Owner = require('../../models/owner');
const OwnerApplication = require('../../models/ownerApplication');
const Booking = require('../../models/booking');
const Campground = require('../../models/campground');
const Review = require('../../models/review');
const mongoose = require('mongoose');
const { revokeAllUserTokens } = require('../../utils/jwtUtils');
const ApiResponse = require('../../utils/ApiResponse');
const { logError, logInfo, logWarn } = require('../../utils/logger');
const redisCache = require('../../utils/redis');

module.exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalCampgrounds = await Campground.countDocuments();
    const totalReviews = await Review.countDocuments();

    // Count total campsites
    const totalCampsites = await mongoose.model('Campsite').countDocuments();

    // Count owner applications by status
    const pendingApplications = await OwnerApplication.countDocuments({ status: 'pending' });
    const underReviewApplications = await OwnerApplication.countDocuments({
      status: 'under_review',
    });
    const approvedApplications = await OwnerApplication.countDocuments({ status: 'approved' });
    const rejectedApplications = await OwnerApplication.countDocuments({ status: 'rejected' });
    const totalApplications =
      pendingApplications + underReviewApplications + approvedApplications + rejectedApplications;

    // Get recent bookings - only show bookings that are not cancelled
    // For admin users, show all recent bookings regardless of ownership
    const recentBookings = await Booking.find({
      status: { $ne: 'cancelled' },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username email')
      .populate('campground', 'title location images')
      .populate('campsite', 'name price capacity');

    // Get recent users
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email createdAt');

    // Get recent owner applications
    const recentApplications = await OwnerApplication.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username email')
      .select('businessName status createdAt');

    const data = {
      stats: {
        totalUsers,
        totalBookings,
        totalCampgrounds,
        totalCampsites,
        totalReviews,
        totalApplications,
        pendingApplications,
        underReviewApplications,
        approvedApplications,
        rejectedApplications,
      },
      recentBookings,
      recentUsers,
      recentApplications,
    };

    return ApiResponse.success(data, 'Dashboard statistics retrieved successfully').send(res);
  } catch (error) {
    logError('Error fetching dashboard stats', error, {
      endpoint: '/api/v1/admin/dashboard',
      userId: req.user?._id,
    });
    return ApiResponse.error('Failed to fetch dashboard statistics', error.message, 500).send(res);
  }
};

module.exports.getBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortField = req.query.sortField || 'startDate';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    const sortOptions = {};
    sortOptions[sortField] = sortOrder;

    // Build query based on filters
    let query = {};

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by user if provided
    if (req.query.userId) {
      query.user = req.query.userId;
    }

    // Filter by campground if provided
    if (req.query.campgroundId) {
      query.campground = req.query.campgroundId;
    }

    // Filter by date range if provided
    if (req.query.startDate) {
      query.startDate = { $gte: new Date(req.query.startDate) };
    }

    if (req.query.endDate) {
      query.endDate = { $lte: new Date(req.query.endDate) };
    }

    const totalBookings = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .skip(skip)
      .limit(limit)
      .populate('user', 'username email')
      .populate('campground', 'title location price images')
      .populate('campsite', 'name price capacity features')
      .sort(sortOptions);

    const totalPages = Math.ceil(totalBookings / limit);

    const data = {
      bookings,
      pagination: {
        total: totalBookings,
        page,
        limit,
        totalPages,
      },
      sort: {
        field: sortField,
        order: sortOrder === 1 ? 'asc' : 'desc',
      },
    };

    return ApiResponse.success(data, 'Bookings retrieved successfully').send(res);
  } catch (error) {
    logError('Error fetching bookings', error, {
      endpoint: '/api/v1/admin/bookings',
      userId: req.user?._id,
      query: req.query,
    });
    return ApiResponse.error('Failed to fetch bookings', error.message, 500).send(res);
  }
};

module.exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortField = req.query.sortField || 'username';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    const sortOptions = {};
    sortOptions[sortField] = sortOrder;

    const totalUsers = await User.countDocuments();

    // Get users with their basic info
    let users = await User.find({})
      .skip(skip)
      .limit(limit)
      .select('username email isAdmin bookings reviews createdAt')
      .sort(sortOptions);

    // For each user, get the active (non-cancelled) bookings
    const usersWithActiveBookings = await Promise.all(
      users.map(async (user) => {
        // Convert Mongoose document to plain object so we can modify it
        const userObj = user.toObject();

        // Find only non-cancelled bookings
        if (userObj.bookings && userObj.bookings.length > 0) {
          const activeBookings = await Booking.find({
            _id: { $in: userObj.bookings },
            status: { $ne: 'cancelled' },
          }).select('_id');

          // Replace the bookings array with just the active bookings
          userObj.bookings = activeBookings.map((booking) => booking._id);
        }

        return userObj;
      })
    );

    const totalPages = Math.ceil(totalUsers / limit);

    const data = {
      users: usersWithActiveBookings,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages,
      },
      sort: {
        field: sortField,
        order: sortOrder === 1 ? 'asc' : 'desc',
      },
    };

    return ApiResponse.success(data, 'Users retrieved successfully').send(res);
  } catch (error) {
    logError('Error fetching users', error, {
      endpoint: '/api/v1/admin/users',
      userId: req.user?._id,
      query: req.query,
    });
    return ApiResponse.error('Failed to fetch users', error.message, 500).send(res);
  }
};

module.exports.getUserDetails = async (req, res) => {
  try {
    // First get the user without populating bookings
    const user = await User.findById(req.params.id)
      .populate({
        path: 'reviews',
        populate: {
          path: 'campground',
          select: 'title',
          strictPopulate: false,
        },
      })
      .populate('contacts');

    if (!user) {
      return ApiResponse.error('User not found', 'The requested user could not be found', 404).send(
        res
      );
    }

    // Get bookings for this user
    // Always show only the user's own bookings, regardless of who is viewing
    const relevantBookings = await Booking.find({
      user: user._id,
      status: { $ne: 'cancelled' },
    }).populate({
      path: 'campground',
      select: 'title location price images',
    });

    // Convert to a plain object so we can modify it
    const userObj = user.toObject();

    // Replace the bookings array with just the relevant bookings
    userObj.bookings = relevantBookings;

    // Ensure reviews have campground data
    if (userObj.reviews && userObj.reviews.length > 0) {
      // Get all campgrounds for these reviews
      const reviewIds = userObj.reviews.map((review) => review._id);
      const reviews = await Review.find({ _id: { $in: reviewIds } }).populate(
        'campground',
        'title'
      );

      // Create a map of review ID to campground
      const reviewCampgroundMap = {};
      reviews.forEach((review) => {
        if (review.campground) {
          reviewCampgroundMap[review._id.toString()] = review.campground;
        }
      });

      // Update reviews with campground data
      userObj.reviews = userObj.reviews.map((review) => {
        const reviewId = review._id.toString();
        if (reviewCampgroundMap[reviewId] && !review.campground) {
          review.campground = reviewCampgroundMap[reviewId];
        }
        return review;
      });
    }

    return ApiResponse.success({ user: userObj }, 'User details retrieved successfully').send(res);
  } catch (error) {
    logError('Error fetching user details', error, {
      endpoint: '/api/v1/admin/users/:id',
      userId: req.user?._id,
      targetUserId: req.params.id,
    });
    return ApiResponse.error('Failed to fetch user details', error.message, 500).send(res);
  }
};

module.exports.toggleUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return ApiResponse.error('User not found', 'The requested user could not be found', 404).send(
        res
      );
    }

    // Prevent admin from removing their own admin status
    if (req.user._id.toString() === id && user.isAdmin && !isAdmin) {
      return ApiResponse.error(
        'You cannot remove your own admin privileges',
        'Admins cannot remove their own privileges',
        400
      ).send(res);
    }

    // Update the user's admin status
    user.isAdmin = isAdmin;
    await user.save();

    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isOwner: user.isOwner,
      createdAt: user.createdAt,
    };

    return ApiResponse.success(
      { user: userData },
      `User ${isAdmin ? 'granted' : 'removed'} admin privileges successfully`
    ).send(res);
  } catch (error) {
    logError('Error toggling user admin status', error, {
      endpoint: '/api/v1/admin/users/:id/admin',
      userId: req.user?._id,
      targetUserId: req.params.id,
      isAdmin,
    });
    return ApiResponse.error('Failed to update user admin status', error.message, 500).send(res);
  }
};

module.exports.toggleUserOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOwner } = req.body;

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return ApiResponse.error('User not found', 'The requested user could not be found', 404).send(
        res
      );
    }

    // If promoting to owner, create an Owner profile
    if (isOwner && !user.isOwner) {
      // Check if owner profile already exists
      const existingOwner = await Owner.findOne({ user: id });
      if (!existingOwner) {
        // Create a basic owner profile
        const owner = new Owner({
          user: id,
          businessName: `${user.username}'s Business`,
          businessType: 'individual',
          businessAddress: {
            street: 'Not provided',
            city: 'Not provided',
            state: 'Not provided',
            zipCode: 'Not provided',
            country: 'Myanmar',
          },
          businessPhone: user.phone || 'Not provided',
          businessEmail: user.email,
          verificationStatus: 'verified',
          verifiedAt: new Date(),
          verifiedBy: req.user._id,
          verificationNotes: [
            {
              note: 'Owner status granted directly by admin',
              addedBy: req.user._id,
              type: 'admin_note',
            },
          ],
        });
        await owner.save();
      }
    }

    // If removing owner status, deactivate the owner profile
    if (!isOwner && user.isOwner) {
      const owner = await Owner.findOne({ user: id });
      if (owner) {
        owner.isActive = false;
        owner.verificationStatus = 'suspended';
        owner.suspendedAt = new Date();
        owner.suspendedBy = req.user._id;
        owner.suspensionReason = 'Owner status removed by admin';
        owner.verificationNotes.push({
          note: 'Owner status removed by admin',
          addedBy: req.user._id,
          type: 'admin_note',
        });
        await owner.save();
      }
    }

    // Update the user's owner status
    user.isOwner = isOwner;
    await user.save();

    // Revoke all refresh tokens for the user to force token refresh with updated isOwner status
    await revokeAllUserTokens(user._id);

    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isOwner: user.isOwner,
      createdAt: user.createdAt,
    };

    return ApiResponse.success(
      { user: userData },
      `User ${isOwner ? 'granted' : 'removed'} owner privileges successfully`
    ).send(res);
  } catch (error) {
    logError('Error toggling user owner status', error, {
      endpoint: '/api/v1/admin/users/:id/owner',
      userId: req.user?._id,
      targetUserId: req.params.id,
      isOwner,
    });
    return ApiResponse.error('Failed to update user owner status', error.message, 500).send(res);
  }
};

module.exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return ApiResponse.error(
        'Booking not found',
        'The requested booking could not be found',
        404
      ).send(res);
    }

    // Remove booking from campground
    await Campground.findByIdAndUpdate(booking.campground, {
      $pull: { bookings: booking._id },
    });

    // Remove booking from user
    await User.findByIdAndUpdate(booking.user, {
      $pull: { bookings: booking._id },
    });

    // Update the booking status to cancelled instead of deleting it
    await Booking.findByIdAndUpdate(id, { status: 'cancelled' });

    return ApiResponse.success({ bookingId: id }, 'Booking canceled successfully').send(res);
  } catch (error) {
    logError('Error canceling booking', error, {
      endpoint: '/api/v1/admin/bookings/:id/cancel',
      userId: req.user?._id,
      bookingId: req.params.id,
    });
    return ApiResponse.error('Failed to cancel booking', error.message, 500).send(res);
  }
};

// Owner Application Management Functions

module.exports.getOwnerApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    // Build query
    let query = {};
    if (status) {
      query.status = status;
    }

    const totalApplications = await OwnerApplication.countDocuments(query);

    const applications = await OwnerApplication.find(query)
      .skip(skip)
      .limit(limit)
      .populate('user', 'username email phone')
      .populate('reviewedBy', 'username email')
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalApplications / limit);

    const data = {
      applications,
      pagination: {
        total: totalApplications,
        page,
        limit,
        totalPages,
      },
    };

    return ApiResponse.success(data, 'Owner applications retrieved successfully').send(res);
  } catch (error) {
    logError('Error fetching owner applications', error, {
      endpoint: '/api/v1/admin/owner-applications',
      userId: req.user?._id,
      query: req.query,
    });
    return ApiResponse.error('Failed to fetch owner applications', error.message, 500).send(res);
  }
};

module.exports.getOwnerApplicationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await OwnerApplication.findById(id)
      .populate('user', 'username email phone createdAt')
      .populate('reviewedBy', 'username email')
      .populate('reviewNotes.addedBy', 'username email');

    if (!application) {
      return ApiResponse.error(
        'Owner application not found',
        'The requested application could not be found',
        404
      ).send(res);
    }

    return ApiResponse.success(
      { application },
      'Owner application details retrieved successfully'
    ).send(res);
  } catch (error) {
    logError('Error fetching owner application details', error, {
      endpoint: '/api/v1/admin/owner-applications/:id',
      userId: req.user?._id,
      applicationId: req.params.id,
    });
    return ApiResponse.error('Failed to fetch owner application details', error.message, 500).send(
      res
    );
  }
};

module.exports.approveOwnerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const application = await OwnerApplication.findById(id).populate('user');
    if (!application) {
      return ApiResponse.error(
        'Owner application not found',
        'The requested application could not be found',
        404
      ).send(res);
    }

    if (application.status !== 'pending' && application.status !== 'under_review') {
      return ApiResponse.error(
        'Application cannot be approved',
        'Application cannot be approved in its current status',
        400
      ).send(res);
    }

    // Approve the application
    await application.approve(req.user, notes);

    // Create owner profile from application data
    const owner = new Owner({
      user: application.user._id,
      businessName: application.businessName,
      businessType: application.businessType,
      businessRegistrationNumber: application.businessRegistrationNumber,
      taxId: application.taxId,
      businessAddress: application.businessAddress,
      businessPhone: application.businessPhone,
      businessEmail: application.businessEmail,
      bankingInfo: application.bankingInfo,
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      verifiedBy: req.user._id,
      verificationDocuments: application.documents.map((doc) => ({
        type: doc.type,
        filename: doc.filename,
        url: doc.url,
        uploadedAt: doc.uploadedAt,
        status: 'approved',
      })),
    });

    await owner.save();

    // Update user to mark as owner
    await User.findByIdAndUpdate(application.user._id, { isOwner: true });

    // Revoke all refresh tokens for the user to force token refresh with updated isOwner status
    await revokeAllUserTokens(application.user._id);

    const data = {
      application,
      owner: {
        id: owner._id,
        businessName: owner.businessName,
        verificationStatus: owner.verificationStatus,
      },
    };

    return ApiResponse.success(data, 'Owner application approved successfully').send(res);
  } catch (error) {
    logError('Error approving owner application', error, {
      endpoint: '/api/v1/admin/owner-applications/:id/approve',
      userId: req.user?._id,
      applicationId: req.params.id,
    });
    return ApiResponse.error('Failed to approve owner application', error.message, 500).send(res);
  }
};

module.exports.rejectOwnerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    if (!reason) {
      return ApiResponse.error(
        'Rejection reason is required',
        'Please provide a reason for rejecting this application',
        400
      ).send(res);
    }

    const application = await OwnerApplication.findById(id);
    if (!application) {
      return ApiResponse.error(
        'Owner application not found',
        'The requested application could not be found',
        404
      ).send(res);
    }

    if (application.status !== 'pending' && application.status !== 'under_review') {
      return ApiResponse.error(
        'Application cannot be rejected',
        'Application cannot be rejected in its current status',
        400
      ).send(res);
    }

    // Reject the application
    await application.reject(req.user, reason, notes);

    return ApiResponse.success({ application }, 'Owner application rejected successfully').send(
      res
    );
  } catch (error) {
    logError('Error rejecting owner application', error, {
      endpoint: '/api/v1/admin/owner-applications/:id/reject',
      userId: req.user?._id,
      applicationId: req.params.id,
    });
    return ApiResponse.error('Failed to reject owner application', error.message, 500).send(res);
  }
};

module.exports.updateApplicationReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const application = await OwnerApplication.findById(id);
    if (!application) {
      return ApiResponse.error(
        'Owner application not found',
        'The requested application could not be found',
        404
      ).send(res);
    }

    // Update status if provided
    if (status && ['pending', 'under_review'].includes(status)) {
      application.status = status;
    }

    // Add review note if provided
    if (notes) {
      application.reviewNotes.push({
        note: notes,
        addedBy: req.user._id,
        type: 'admin_note',
      });
    }

    await application.save();

    return ApiResponse.success({ application }, 'Application review updated successfully').send(
      res
    );
  } catch (error) {
    logError('Error updating application review', error, {
      endpoint: '/api/v1/admin/owner-applications/:id/review',
      userId: req.user?._id,
      applicationId: req.params.id,
    });
    return ApiResponse.error('Failed to update application review', error.message, 500).send(res);
  }
};

// Owner Management Functions

module.exports.getAllOwners = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    // Build query
    let query = {};
    if (status) {
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'suspended') {
        query.isActive = false;
      } else {
        query.verificationStatus = status;
      }
    }

    const totalOwners = await Owner.countDocuments(query);

    const owners = await Owner.find(query)
      .skip(skip)
      .limit(limit)
      .populate('user', 'username email phone createdAt')
      .populate('verifiedBy', 'username email')
      .populate('suspendedBy', 'username email')
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalOwners / limit);

    const data = {
      owners,
      pagination: {
        total: totalOwners,
        page,
        limit,
        totalPages,
      },
    };

    return ApiResponse.success(data, 'Owners retrieved successfully').send(res);
  } catch (error) {
    logError('Error fetching owners', error, {
      endpoint: '/api/v1/admin/owners',
      userId: req.user?._id,
      query: req.query,
    });
    return ApiResponse.error('Failed to fetch owners', error.message, 500).send(res);
  }
};

module.exports.getOwnerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const owner = await Owner.findById(id)
      .populate('user', 'username email phone createdAt lastLoginAt')
      .populate('verifiedBy', 'username email')
      .populate('suspendedBy', 'username email')
      .populate('campgrounds', 'title location images createdAt')
      .populate('verificationNotes.addedBy', 'username email');

    if (!owner) {
      return ApiResponse.error(
        'Owner not found',
        'The requested owner could not be found',
        404
      ).send(res);
    }

    // Get owner's booking statistics (include cancelled bookings in revenue since no refunds are given)
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          campground: { $in: owner.campgrounds.map((c) => c._id) },
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
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
    ]);

    const stats =
      bookingStats.length > 0
        ? bookingStats[0]
        : {
            totalBookings: 0,
            totalRevenue: 0,
            confirmedBookings: 0,
            cancelledBookings: 0,
          };

    const data = {
      owner: {
        ...owner.toObject(),
        // Don't expose sensitive banking information
        bankingInfo: {
          ...owner.bankingInfo,
          accountNumber: owner.bankingInfo?.accountNumber
            ? '*'.repeat(owner.bankingInfo.accountNumber.length - 4) +
              owner.bankingInfo.accountNumber.slice(-4)
            : undefined,
        },
      },
      stats,
    };

    return ApiResponse.success(data, 'Owner details retrieved successfully').send(res);
  } catch (error) {
    logError('Error fetching owner details', error, {
      endpoint: '/api/v1/admin/owners/:id',
      userId: req.user?._id,
      ownerId: req.params.id,
    });
    return ApiResponse.error('Failed to fetch owner details', error.message, 500).send(res);
  }
};

module.exports.suspendOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return ApiResponse.error(
        'Suspension reason is required',
        'Please provide a reason for suspending this owner',
        400
      ).send(res);
    }

    const owner = await Owner.findById(id);
    if (!owner) {
      return ApiResponse.error(
        'Owner not found',
        'The requested owner could not be found',
        404
      ).send(res);
    }

    if (!owner.isActive) {
      return ApiResponse.error(
        'Owner is already suspended',
        'This owner account is already in a suspended state',
        400
      ).send(res);
    }

    // Suspend the owner
    owner.isActive = false;
    owner.suspendedAt = new Date();
    owner.suspendedBy = req.user._id;
    owner.suspensionReason = reason;

    // Add verification note
    owner.verificationNotes.push({
      note: `Owner suspended: ${reason}`,
      addedBy: req.user._id,
      type: 'admin_note',
    });

    await owner.save();

    return ApiResponse.success({ owner }, 'Owner suspended successfully').send(res);
  } catch (error) {
    logError('Error suspending owner', error, {
      endpoint: '/api/v1/admin/owners/:id/suspend',
      userId: req.user?._id,
      ownerId: req.params.id,
    });
    return ApiResponse.error('Failed to suspend owner', error.message, 500).send(res);
  }
};

module.exports.reactivateOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const owner = await Owner.findById(id);
    if (!owner) {
      return ApiResponse.error(
        'Owner not found',
        'The requested owner could not be found',
        404
      ).send(res);
    }

    if (owner.isActive) {
      return ApiResponse.error(
        'Owner is already active',
        'This owner account is already in an active state',
        400
      ).send(res);
    }

    // Reactivate the owner
    owner.isActive = true;
    owner.suspendedAt = null;
    owner.suspendedBy = null;
    owner.suspensionReason = null;

    // Add verification note
    owner.verificationNotes.push({
      note: notes || 'Owner reactivated by admin',
      addedBy: req.user._id,
      type: 'admin_note',
    });

    await owner.save();

    return ApiResponse.success({ owner }, 'Owner reactivated successfully').send(res);
  } catch (error) {
    logError('Error reactivating owner', error, {
      endpoint: '/api/v1/admin/owners/:id/reactivate',
      userId: req.user?._id,
      ownerId: req.params.id,
    });
    return ApiResponse.error('Failed to reactivate owner', error.message, 500).send(res);
  }
};

module.exports.verifyOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const owner = await Owner.findById(id);
    if (!owner) {
      return ApiResponse.error(
        'Owner not found',
        'The requested owner could not be found',
        404
      ).send(res);
    }

    if (owner.verificationStatus === 'verified') {
      return ApiResponse.error(
        'Owner is already verified',
        'This owner account is already verified',
        400
      ).send(res);
    }

    // Verify the owner
    owner.verificationStatus = 'verified';
    owner.verifiedAt = new Date();
    owner.verifiedBy = req.user._id;

    // Add verification note
    if (notes) {
      owner.verificationNotes.push({
        note: notes,
        addedBy: req.user._id,
        type: 'admin_note',
      });
    }

    await owner.save();

    return ApiResponse.success({ owner }, 'Owner verified successfully').send(res);
  } catch (error) {
    logError('Error verifying owner', error, {
      endpoint: '/api/v1/admin/owners/:id/verify',
      userId: req.user?._id,
      ownerId: req.params.id,
    });
    return ApiResponse.error('Failed to verify owner', error.message, 500).send(res);
  }
};

module.exports.revokeOwnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return ApiResponse.error(
        'Revocation reason is required',
        'Please provide a reason for revoking owner status',
        400
      ).send(res);
    }

    const owner = await Owner.findById(id);
    if (!owner) {
      return ApiResponse.error(
        'Owner not found',
        'The requested owner could not be found',
        404
      ).send(res);
    }

    // Update user to remove owner status
    await User.findByIdAndUpdate(owner.user, { isOwner: false });

    // Revoke all refresh tokens for the user to force token refresh with updated isOwner status
    await revokeAllUserTokens(owner.user);

    // Add final verification note
    owner.verificationNotes.push({
      note: `Owner status revoked: ${reason}`,
      addedBy: req.user._id,
      type: 'admin_note',
    });

    // Set owner as inactive and suspended
    owner.isActive = false;
    owner.verificationStatus = 'suspended';
    owner.suspendedAt = new Date();
    owner.suspendedBy = req.user._id;
    owner.suspensionReason = reason;

    await owner.save();

    return ApiResponse.success({ owner }, 'Owner status revoked successfully').send(res);
  } catch (error) {
    logError('Error revoking owner status', error, {
      endpoint: '/api/v1/admin/owners/:id/revoke',
      userId: req.user?._id,
      ownerId: req.params.id,
    });
    return ApiResponse.error('Failed to revoke owner status', error.message, 500).send(res);
  }
};

// Safety Alert Management Functions

module.exports.getAllSafetyAlerts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, severity, type, campgroundId, requiresAcknowledgement } = req.query;

    // Build query
    let query = {};

    if (status) {
      query.status = status;
    }

    if (severity) {
      query.severity = severity;
    }

    if (type) {
      query.type = type;
    }

    if (campgroundId) {
      query.campground = campgroundId;
    }

    if (requiresAcknowledgement !== undefined && requiresAcknowledgement !== '') {
      query.requiresAcknowledgement = requiresAcknowledgement === 'true';
    }

    const totalAlerts = await mongoose.model('SafetyAlert').countDocuments(query);

    const alerts = await mongoose
      .model('SafetyAlert')
      .find(query)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .populate('campground', 'title location images')
      .populate('campsite', 'name')
      .populate('acknowledgedBy.user', 'username email')
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalAlerts / limit);

    const data = {
      alerts,
      pagination: {
        total: totalAlerts,
        page,
        limit,
        totalPages,
      },
    };

    return ApiResponse.success(data, 'Safety alerts retrieved successfully').send(res);
  } catch (error) {
    logError('Error fetching safety alerts', error, {
      endpoint: '/api/v1/admin/safety-alerts',
      userId: req.user?._id,
      query: req.query,
    });
    return ApiResponse.error('Failed to fetch safety alerts', error.message, 500).send(res);
  }
};

module.exports.updateSafetyAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const alert = await mongoose.model('SafetyAlert').findById(id);
    if (!alert) {
      return ApiResponse.error(
        'Safety alert not found',
        'The requested safety alert could not be found',
        404
      ).send(res);
    }

    // Update fields
    if (updateData.title !== undefined) alert.title = updateData.title.trim();
    if (updateData.description !== undefined) alert.description = updateData.description.trim();
    if (updateData.severity !== undefined) alert.severity = updateData.severity;
    if (updateData.type !== undefined) alert.type = updateData.type;
    if (updateData.status !== undefined) alert.status = updateData.status;
    if (updateData.startDate !== undefined) alert.startDate = updateData.startDate;
    if (updateData.endDate !== undefined) alert.endDate = updateData.endDate;
    if (updateData.isPublic !== undefined) alert.isPublic = updateData.isPublic;
    if (updateData.requiresAcknowledgement !== undefined) {
      alert.requiresAcknowledgement = updateData.requiresAcknowledgement;
    }

    alert.updatedBy = req.user._id;

    await alert.save();

    // Populate user information for response
    await alert.populate('createdBy', 'username');
    await alert.populate('updatedBy', 'username');
    await alert.populate('campground', 'title');
    await alert.populate('campsite', 'name');

    logInfo('Admin updated safety alert', {
      alertId: alert._id,
      adminId: req.user._id,
    });

    return ApiResponse.success({ alert }, 'Safety alert updated successfully').send(res);
  } catch (error) {
    logError('Error updating safety alert', error, {
      endpoint: '/api/v1/admin/safety-alerts/:id',
      userId: req.user?._id,
      alertId: req.params.id,
    });
    return ApiResponse.error('Failed to update safety alert', error.message, 500).send(res);
  }
};

module.exports.deleteSafetyAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await mongoose.model('SafetyAlert').findById(id);
    if (!alert) {
      return ApiResponse.error(
        'Safety alert not found',
        'The requested safety alert could not be found',
        404
      ).send(res);
    }

    await alert.deleteOne();

    logInfo('Admin deleted safety alert', {
      alertId: id,
      adminId: req.user._id,
    });

    return ApiResponse.success({ alertId: id }, 'Safety alert deleted successfully').send(res);
  } catch (error) {
    logError('Error deleting safety alert', error, {
      endpoint: '/api/v1/admin/safety-alerts/:id',
      userId: req.user?._id,
      alertId: req.params.id,
    });
    return ApiResponse.error('Failed to delete safety alert', error.message, 500).send(res);
  }
};

// Trip Management Functions

module.exports.getAllTrips = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { userId, isPublic } = req.query;

    // Build query
    let query = {};

    if (userId) {
      query.user = userId;
    }

    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }

    const totalTrips = await mongoose.model('Trip').countDocuments(query);

    const trips = await mongoose
      .model('Trip')
      .find(query)
      .skip(skip)
      .limit(limit)
      .populate('user', 'username email')
      .populate('collaborators', 'username email')
      .populate('days')
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalTrips / limit);

    const data = {
      trips,
      pagination: {
        total: totalTrips,
        page,
        limit,
        totalPages,
      },
    };

    return ApiResponse.success(data, 'Trips retrieved successfully').send(res);
  } catch (error) {
    logError('Error fetching trips', error, {
      endpoint: '/api/v1/admin/trips',
      userId: req.user?._id,
      query: req.query,
    });
    return ApiResponse.error('Failed to fetch trips', error.message, 500).send(res);
  }
};

module.exports.getTripDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await mongoose
      .model('Trip')
      .findById(id)
      .populate('user', 'username email')
      .populate('collaborators', 'username email')
      .populate({
        path: 'days',
        populate: {
          path: 'activities.campground',
          select: 'title location',
        },
      });

    if (!trip) {
      return ApiResponse.error('Trip not found', 'The requested trip could not be found', 404).send(
        res
      );
    }

    return ApiResponse.success({ trip }, 'Trip details retrieved successfully').send(res);
  } catch (error) {
    logError('Error fetching trip details', error, {
      endpoint: '/api/v1/admin/trips/:id',
      userId: req.user?._id,
      tripId: req.params.id,
    });
    return ApiResponse.error('Failed to fetch trip details', error.message, 500).send(res);
  }
};

module.exports.deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await mongoose.model('Trip').findById(id);
    if (!trip) {
      return ApiResponse.error('Trip not found', 'The requested trip could not be found', 404).send(
        res
      );
    }

    // Delete associated trip days
    await mongoose.model('TripDay').deleteMany({ trip: trip._id });

    // Remove trip from user's trips
    await User.findByIdAndUpdate(trip.user, {
      $pull: { trips: trip._id },
    });

    await trip.deleteOne();

    logInfo('Admin deleted trip', {
      tripId: id,
      adminId: req.user._id,
    });

    return ApiResponse.success({ tripId: id }, 'Trip deleted successfully').send(res);
  } catch (error) {
    logError('Error deleting trip', error, {
      endpoint: '/api/v1/admin/trips/:id',
      userId: req.user?._id,
      tripId: req.params.id,
    });
    return ApiResponse.error('Failed to delete trip', error.message, 500).send(res);
  }
};

// Enhanced Analytics Functions

module.exports.getEnhancedDashboardStats = async (req, res) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalCampgrounds = await Campground.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalCampsites = await mongoose.model('Campsite').countDocuments();

    // Get safety alert statistics
    const totalSafetyAlerts = await mongoose.model('SafetyAlert').countDocuments();
    const activeSafetyAlerts = await mongoose.model('SafetyAlert').countDocuments({
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    // Get trip statistics
    const totalTrips = await mongoose.model('Trip').countDocuments();
    const publicTrips = await mongoose.model('Trip').countDocuments({ isPublic: true });
    const totalTripDays = await mongoose.model('TripDay').countDocuments();

    // Get owner application statistics
    const pendingApplications = await OwnerApplication.countDocuments({ status: 'pending' });
    const underReviewApplications = await OwnerApplication.countDocuments({
      status: 'under_review',
    });
    const approvedApplications = await OwnerApplication.countDocuments({ status: 'approved' });
    const rejectedApplications = await OwnerApplication.countDocuments({ status: 'rejected' });
    const totalApplications =
      pendingApplications + underReviewApplications + approvedApplications + rejectedApplications;

    // Get recent activity
    const recentBookings = await Booking.find({
      status: { $ne: 'cancelled' },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username email')
      .populate('campground', 'title location images')
      .populate('campsite', 'name price capacity');

    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email createdAt');

    const recentApplications = await OwnerApplication.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username email')
      .select('businessName status createdAt');

    const recentSafetyAlerts = await mongoose
      .model('SafetyAlert')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'username')
      .populate('campground', 'title')
      .select('title severity type status createdAt');

    const recentTrips = await mongoose
      .model('Trip')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username')
      .select('title isPublic startDate endDate createdAt');

    const data = {
      stats: {
        totalUsers,
        totalBookings,
        totalCampgrounds,
        totalCampsites,
        totalReviews,
        totalApplications,
        pendingApplications,
        underReviewApplications,
        approvedApplications,
        rejectedApplications,
        totalSafetyAlerts,
        activeSafetyAlerts,
        totalTrips,
        publicTrips,
        totalTripDays,
      },
      recentBookings,
      recentUsers,
      recentApplications,
      recentSafetyAlerts,
      recentTrips,
    };

    return ApiResponse.success(data, 'Enhanced dashboard statistics retrieved successfully').send(
      res
    );
  } catch (error) {
    logError('Error fetching enhanced dashboard stats', error, {
      endpoint: '/api/v1/admin/dashboard/enhanced',
      userId: req.user?._id,
    });
    return ApiResponse.error(
      'Failed to fetch enhanced dashboard statistics',
      error.message,
      500
    ).send(res);
  }
};

// Weather System Monitoring

module.exports.getWeatherStats = async (req, res) => {
  try {
    // Get weather API usage statistics from Redis
    const weatherStats = await redisCache.get('weather:stats');
    const weatherCacheStats = await redisCache.get('weather:cache:stats');

    // Get recent weather requests (if tracked)
    const recentWeatherRequests = await redisCache.get('weather:recent:requests');

    // Initialize default stats if none exist
    const defaultApiStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      avgResponseTime: 0,
      errorRate: 0,
      lastRequest: null,
      lastError: null,
    };

    const defaultCacheStats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      keys: 0,
      memoryUsage: 0,
    };

    // Get Redis connection status and basic info
    const cacheStatus = {
      isConnected: redisCache.isReady(),
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    };

    // If Redis is connected, try to get additional info
    if (redisCache.isReady()) {
      try {
        const info = await redisCache.client.info();
        let memory = 0;

        // Try to get memory usage, but handle gracefully if not available
        try {
          memory = await redisCache.client.memory('USAGE');
        } catch (memoryError) {
          logWarn('Could not fetch Redis info for weather stats', memoryError);
        }

        const keyspace = await redisCache.client.info('keyspace');

        // Parse keyspace info to get number of keys
        const keysMatch = keyspace.match(/keys=(\d+)/);
        const totalKeys = keysMatch ? parseInt(keysMatch[1]) : 0;

        // Count weather-related keys
        const weatherKeys = await redisCache.client.keys('weather:*');
        const weatherKeyCount = weatherKeys.length;

        // Update default cache stats with real data
        defaultCacheStats.keys = weatherKeyCount;
        defaultCacheStats.memoryUsage = memory || 0;
        defaultCacheStats.size = weatherKeyCount * 1024; // Rough estimate

        cacheStatus.totalKeys = totalKeys;
        cacheStatus.weatherKeys = weatherKeyCount;
        cacheStatus.memoryUsage = memory;
      } catch (redisError) {
        logWarn('Could not fetch Redis info for weather stats', redisError);
      }
    }

    const data = {
      apiStats: weatherStats ? JSON.parse(weatherStats) : defaultApiStats,
      cacheStats: weatherCacheStats ? JSON.parse(weatherCacheStats) : defaultCacheStats,
      recentRequests: recentWeatherRequests ? JSON.parse(recentWeatherRequests) : [],
      cacheStatus,
      systemInfo: {
        openWeatherKeyConfigured: !!process.env.OPENWEATHER_KEY,
        redisConfigured: !!process.env.REDIS_HOST,
        lastUpdated: new Date().toISOString(),
      },
    };

    return ApiResponse.success(data, 'Weather statistics retrieved successfully').send(res);
  } catch (error) {
    logError('Error fetching weather stats', error, {
      endpoint: '/api/v1/admin/weather/stats',
      userId: req.user?._id,
    });
    return ApiResponse.error('Failed to fetch weather statistics', error.message, 500).send(res);
  }
};

// Comprehensive Business Analytics for Admin
module.exports.getBusinessAnalytics = async (req, res) => {
  try {
    const { period = '30d', startDate, endDate } = req.query;

    // Calculate date ranges
    const now = new Date();
    let currentPeriodStart, currentPeriodEnd, previousPeriodStart, previousPeriodEnd;

    if (startDate && endDate) {
      currentPeriodStart = new Date(startDate);
      currentPeriodEnd = new Date(endDate);
      const periodDuration = currentPeriodEnd - currentPeriodStart;
      previousPeriodStart = new Date(currentPeriodStart.getTime() - periodDuration);
      previousPeriodEnd = new Date(currentPeriodStart.getTime());
    } else {
      // Default to last 30 days
      currentPeriodEnd = now;
      currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousPeriodStart = new Date(currentPeriodStart.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousPeriodEnd = new Date(currentPeriodStart.getTime());
    }

    const currentPeriodFilter = {
      createdAt: { $gte: currentPeriodStart, $lte: currentPeriodEnd },
    };
    const previousPeriodFilter = {
      createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
    };

    // Platform Revenue Analytics (include cancelled bookings in revenue since no refunds are given)
    const currentRevenue = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'cancelled'] },
          paid: true,
          ...currentPeriodFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalBookings: { $sum: 1 },
          averageBookingValue: { $avg: '$totalPrice' },
        },
      },
    ]);

    const previousRevenue = await Booking.aggregate([
      {
        $match: {
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
          averageBookingValue: { $avg: '$totalPrice' },
        },
      },
    ]);

    const current = currentRevenue[0] || {
      totalRevenue: 0,
      totalBookings: 0,
      averageBookingValue: 0,
    };
    const previous = previousRevenue[0] || {
      totalRevenue: 0,
      totalBookings: 0,
      averageBookingValue: 0,
    };

    // Calculate percentage changes
    const revenueChange =
      previous.totalRevenue > 0
        ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100
        : 0;
    const bookingsChange =
      previous.totalBookings > 0
        ? ((current.totalBookings - previous.totalBookings) / previous.totalBookings) * 100
        : 0;

    // User Growth Analytics
    const currentUsers = await User.countDocuments(currentPeriodFilter);
    const previousUsers = await User.countDocuments(previousPeriodFilter);
    const userGrowth =
      previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;

    // Owner Growth Analytics
    const currentOwners = await Owner.countDocuments(currentPeriodFilter);
    const previousOwners = await Owner.countDocuments(previousPeriodFilter);
    const ownerGrowth =
      previousOwners > 0 ? ((currentOwners - previousOwners) / previousOwners) * 100 : 0;

    // Campground Performance Analytics (include cancelled bookings in revenue since no refunds are given)
    const topCampgrounds = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'cancelled'] },
          paid: true,
          ...currentPeriodFilter,
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
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'campground',
          as: 'reviews',
        },
      },
      {
        $addFields: {
          averageRating: { $avg: '$reviews.rating' },
          reviewCount: { $size: '$reviews' },
        },
      },
      {
        $project: {
          campgroundId: '$_id',
          campgroundName: '$campground.title',
          location: '$campground.location',
          revenue: 1,
          bookings: 1,
          averageRating: 1,
          reviewCount: 1,
        },
      },
      {
        $sort: { revenue: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Revenue by Month (Last 12 months) (include cancelled bookings in revenue since no refunds are given)
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'cancelled'] },
          paid: true,
          createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    // Booking Status Distribution
    const bookingStatusStats = await Booking.aggregate([
      {
        $match: currentPeriodFilter,
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // User Activity Analytics
    const activeUsers = await Booking.aggregate([
      {
        $match: currentPeriodFilter,
      },
      {
        $group: {
          _id: '$user',
          bookingCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          uniqueUsers: { $sum: 1 },
          totalBookings: { $sum: '$bookingCount' },
        },
      },
    ]);

    // Review Analytics - All time (not period-specific)
    const reviewStats = await Review.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating',
          },
        },
      },
    ]);

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (reviewStats[0]?.ratingDistribution) {
      reviewStats[0].ratingDistribution.forEach((rating) => {
        ratingDistribution[Math.floor(rating)]++;
      });
    }

    // Also get period-specific review growth for comparison
    const periodReviewStats = await Review.aggregate([
      {
        $match: currentPeriodFilter,
      },
      {
        $group: {
          _id: null,
          periodReviews: { $sum: 1 },
        },
      },
    ]);

    const previousPeriodReviewStats = await Review.aggregate([
      {
        $match: previousPeriodFilter,
      },
      {
        $group: {
          _id: null,
          periodReviews: { $sum: 1 },
        },
      },
    ]);

    const currentPeriodReviews = periodReviewStats[0]?.periodReviews || 0;
    const previousPeriodReviews = previousPeriodReviewStats[0]?.periodReviews || 0;
    const reviewGrowth =
      previousPeriodReviews > 0
        ? ((currentPeriodReviews - previousPeriodReviews) / previousPeriodReviews) * 100
        : 0;

    // Platform Health Metrics
    const platformHealth = {
      totalCampgrounds: await Campground.countDocuments(),
      totalCampsites: await mongoose.model('Campsite').countDocuments(),
      totalSafetyAlerts: await mongoose.model('SafetyAlert').countDocuments(),
      activeSafetyAlerts: await mongoose.model('SafetyAlert').countDocuments({
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now },
      }),
      totalTrips: await mongoose.model('Trip').countDocuments(),
      publicTrips: await mongoose.model('Trip').countDocuments({ isPublic: true }),
    };

    // Application Processing Analytics
    const applicationStats = await OwnerApplication.aggregate([
      {
        $match: currentPeriodFilter,
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const applicationDistribution = {};
    applicationStats.forEach((stat) => {
      applicationDistribution[stat._id] = stat.count;
    });

    // Prepare response data
    const analyticsData = {
      overview: {
        period: {
          start: currentPeriodStart,
          end: currentPeriodEnd,
          label: `${currentPeriodStart.toLocaleDateString()} - ${currentPeriodEnd.toLocaleDateString()}`,
        },
      },
      revenue: {
        total: current.totalRevenue,
        change: revenueChange,
        averageBookingValue: current.averageBookingValue,
        monthlyTrend: monthlyRevenue.map((item) => ({
          month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
          revenue: item.revenue,
          bookings: item.bookings,
        })),
      },
      bookings: {
        total: current.totalBookings,
        change: bookingsChange,
        statusDistribution: bookingStatusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        activeUsers: activeUsers[0]?.uniqueUsers || 0,
      },
      users: {
        total: await User.countDocuments(),
        growth: userGrowth,
        newUsers: currentUsers,
        activeUsers: activeUsers[0]?.uniqueUsers || 0,
      },
      owners: {
        total: await Owner.countDocuments(),
        growth: ownerGrowth,
        newOwners: currentOwners,
        applications: applicationDistribution,
      },
      campgrounds: {
        topPerformers: topCampgrounds,
        total: platformHealth.totalCampgrounds,
        totalCampsites: platformHealth.totalCampsites,
      },
      reviews: {
        averageRating: reviewStats[0]?.averageRating || 0,
        totalReviews: reviewStats[0]?.totalReviews || 0,
        ratingDistribution,
      },
      platform: {
        safetyAlerts: {
          total: platformHealth.totalSafetyAlerts,
          active: platformHealth.activeSafetyAlerts,
        },
        trips: {
          total: platformHealth.totalTrips,
          public: platformHealth.publicTrips,
        },
      },
    };

    return ApiResponse.success(analyticsData, 'Business analytics retrieved successfully').send(
      res
    );
  } catch (error) {
    logError('Error fetching business analytics', error, {
      endpoint: '/api/v1/admin/analytics/business',
      userId: req.user?._id,
      query: req.query,
    });
    return ApiResponse.error('Failed to fetch business analytics', error.message, 500).send(res);
  }
};
