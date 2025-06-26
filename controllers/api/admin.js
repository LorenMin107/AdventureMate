const User = require("../../models/user");
const Booking = require("../../models/booking");
const Campground = require("../../models/campground");
const Review = require("../../models/review");

module.exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalCampgrounds = await Campground.countDocuments();
    const totalReviews = await Review.countDocuments();

    // Get recent bookings
    const recentBookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "username email")
      .populate("campground", "title location");

    // Get recent users
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("username email createdAt");

    res.json({
      stats: {
        totalUsers,
        totalBookings,
        totalCampgrounds,
        totalReviews
      },
      recentBookings,
      recentUsers
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};

module.exports.getBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortField = req.query.sortField || "startDate";
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

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
      .populate("user", "username email")
      .populate("campground", "title location price")
      .sort(sortOptions);

    const totalPages = Math.ceil(totalBookings / limit);

    res.json({
      bookings,
      pagination: {
        total: totalBookings,
        page,
        limit,
        totalPages
      },
      sort: {
        field: sortField,
        order: sortOrder === 1 ? "asc" : "desc"
      }
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

module.exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortField = req.query.sortField || "username";
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

    const sortOptions = {};
    sortOptions[sortField] = sortOrder;

    const totalUsers = await User.countDocuments();

    // Get users with their basic info
    let users = await User.find({})
      .skip(skip)
      .limit(limit)
      .select("username email isAdmin bookings reviews createdAt")
      .sort(sortOptions);

    // For each user, get the active (non-cancelled) bookings
    const usersWithActiveBookings = await Promise.all(users.map(async (user) => {
      // Convert Mongoose document to plain object so we can modify it
      const userObj = user.toObject();

      // Find only non-cancelled bookings
      if (userObj.bookings && userObj.bookings.length > 0) {
        const activeBookings = await Booking.find({
          _id: { $in: userObj.bookings },
          status: { $ne: 'cancelled' }
        }).select('_id');

        // Replace the bookings array with just the active bookings
        userObj.bookings = activeBookings.map(booking => booking._id);
      }

      return userObj;
    }));

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users: usersWithActiveBookings,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages
      },
      sort: {
        field: sortField,
        order: sortOrder === 1 ? "asc" : "desc"
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

module.exports.getUserDetails = async (req, res) => {
  try {
    // First get the user without populating bookings
    const user = await User.findById(req.params.id)
      .populate({
        path: "reviews",
        populate: {
          path: "campground",
          select: "title"
        }
      })
      .populate("contacts");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get only active bookings for this user
    const activeBookings = await Booking.find({
      user: user._id,
      status: { $ne: 'cancelled' }
    }).populate({
      path: "campground",
      select: "title location price images"
    });

    // Convert to a plain object so we can modify it
    const userObj = user.toObject();

    // Replace the bookings array with just the active bookings
    userObj.bookings = activeBookings;

    res.json({ user: userObj });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
};

module.exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Remove booking from campground
    await Campground.findByIdAndUpdate(booking.campground, {
      $pull: { bookings: booking._id }
    });

    // Remove booking from user
    await User.findByIdAndUpdate(booking.user, {
      $pull: { bookings: booking._id }
    });

    // Update the booking status to cancelled instead of deleting it
    await Booking.findByIdAndUpdate(id, { status: 'cancelled' });

    res.json({ 
      success: true,
      message: "Booking canceled successfully" 
    });
  } catch (error) {
    console.error("Error canceling booking:", error);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
};
