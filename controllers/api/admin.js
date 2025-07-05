const User = require('../../models/user');
const Owner = require('../../models/owner');
const OwnerApplication = require('../../models/ownerApplication');
const Booking = require('../../models/booking');
const Campground = require('../../models/campground');
const Review = require('../../models/review');
const mongoose = require('mongoose');
const { revokeAllUserTokens } = require('../../utils/jwtUtils');
const ApiResponse = require('../../utils/ApiResponse');
const { logError } = require('../../utils/logger');

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
      .populate('campground', 'title location')
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
      .populate('campground', 'title location price')
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

    // Get owner's booking statistics
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
          totalRevenue: { $sum: '$totalPrice' },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
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
