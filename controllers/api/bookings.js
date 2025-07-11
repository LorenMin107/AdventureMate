const Campground = require('../../models/campground');
const Booking = require('../../models/booking');
const User = require('../../models/user');
const SafetyAlert = require('../../models/safetyAlert');
const config = require('../../config');
const stripe = require('stripe')(config.stripe.secretKey);
const { logError, logInfo, logDebug } = require('../../utils/logger');

function calculateDaysAndPrice(startDate, endDate, pricePerNight) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nightsCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const totalPrice = nightsCount * pricePerNight;
  return { daysCount: nightsCount, totalPrice };
}

module.exports.getBookings = async (req, res) => {
  try {
    let query = {};

    // By default, don't show cancelled bookings unless specifically requested
    if (!req.query.showCancelled) {
      query.status = { $ne: 'cancelled' };
    }

    // Always filter by the current user's ID, regardless of admin status
    // This ensures users only see their own bookings
    query.user = req.user._id;

    const bookings = await Booking.find(query)
      .populate({
        path: 'campground',
        select: 'title location images',
      })
      .populate({
        path: 'campsite',
        select: 'name description features price capacity images',
      })
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    logError('Error fetching bookings', error, {
      endpoint: '/api/v1/bookings',
      userId: req.user?._id,
      query: req.query,
    });
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

module.exports.getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate({
        path: 'campground',
        select: 'title location images',
      })
      .populate({
        path: 'campsite',
        select: 'name description features price capacity images',
      })
      .populate('user', 'username email');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if the booking belongs to the current user or if the user is an admin
    if (booking.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    // If the booking has a Stripe session ID, get the session details
    let session = null;
    if (booking.sessionId) {
      session = await stripe.checkout.sessions.retrieve(booking.sessionId);
    }

    res.json({ booking, session });
  } catch (error) {
    logError('Error fetching booking', error, {
      endpoint: '/api/v1/bookings/:id',
      userId: req.user?._id,
      bookingId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

module.exports.createBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, campsiteId, guests } = req.body;

    const campground = await Campground.findById(id);
    if (!campground) {
      return res.status(404).json({ error: 'Campground not found' });
    }

    // Check if user has acknowledged all required safety alerts for campground
    const campgroundAlerts = await SafetyAlert.getAlertsRequiringAcknowledgement(
      campground._id,
      req.user,
      'campground'
    );

    // Debug logging for safety alert acknowledgment check
    console.log('Backend - Campground alerts acknowledgment check:', {
      campgroundId: campground._id,
      userId: req.user._id,
      alertsCount: campgroundAlerts.length,
      alertsWithAcknowledgment: campgroundAlerts.map((alert) => ({
        id: alert._id,
        title: alert.title,
        requiresAcknowledgement: alert.requiresAcknowledgement,
        acknowledgedBy: alert.acknowledgedBy,
        acknowledgedByLength: (alert.acknowledgedBy || []).length,
        acknowledgedByDetails: (alert.acknowledgedBy || []).map((ack) => ({
          user: ack.user,
          userType: typeof ack.user,
          userString: ack.user?.toString(),
          userObjectId: typeof ack.user === 'object' ? ack.user._id : null,
          currentUserString: req.user._id?.toString(),
          match: (() => {
            if (!ack || !ack.user) return false;
            const ackUserId = typeof ack.user === 'object' ? ack.user._id : ack.user;
            const currentUserId = req.user._id;
            return ackUserId?.toString() === currentUserId?.toString();
          })(),
        })),
      })),
    });

    const unacknowledgedCampgroundAlerts = campgroundAlerts.filter((alert) => {
      if (!alert.requiresAcknowledgement) {
        return false;
      }

      const hasAcknowledged = alert.acknowledgedBy.some((ack) => {
        if (!ack || !ack.user) return false;

        // Handle both populated user object and user ID string
        const ackUserId = typeof ack.user === 'object' ? ack.user._id : ack.user;
        const currentUserId = req.user._id;

        return ackUserId.toString() === currentUserId.toString();
      });

      return !hasAcknowledged;
    });

    // Check if user has acknowledged all required safety alerts for campsite (if specified)
    let unacknowledgedCampsiteAlerts = [];
    if (campsiteId) {
      const campsiteAlerts = await SafetyAlert.getAlertsRequiringAcknowledgement(
        campsiteId,
        req.user,
        'campsite'
      );
      unacknowledgedCampsiteAlerts = campsiteAlerts.filter((alert) => {
        if (!alert.requiresAcknowledgement) {
          return false;
        }

        const hasAcknowledged = alert.acknowledgedBy.some((ack) => {
          if (!ack || !ack.user) return false;

          // Handle both populated user object and user ID string
          const ackUserId = typeof ack.user === 'object' ? ack.user._id : ack.user;
          const currentUserId = req.user._id;

          return ackUserId.toString() === currentUserId.toString();
        });

        return !hasAcknowledged;
      });
    }

    // Combine all unacknowledged alerts
    const allUnacknowledgedAlerts = [
      ...unacknowledgedCampgroundAlerts,
      ...unacknowledgedCampsiteAlerts,
    ];

    if (allUnacknowledgedAlerts.length > 0) {
      const alertTitles = allUnacknowledgedAlerts.map((alert) => alert.title).join(', ');
      return res.status(400).json({
        error: `You must acknowledge all safety alerts before booking. Required alerts: ${alertTitles}`,
      });
    }

    // If a campsite is specified, fetch it and use its price
    let campsite = null;
    let pricePerNight = 0; // Default to 0 instead of using campground price

    // Calculate the minimum price from available campsites
    const Campsite = require('../../models/campsite');
    const campsites = await Campsite.find({ campground: id, availability: true });

    if (campsites.length > 0) {
      // Find the minimum price among available campsites
      pricePerNight = Math.min(...campsites.map((site) => site.price));
    }

    if (campsiteId) {
      campsite = await require('../../models/campsite').findById(campsiteId);
      if (!campsite) {
        return res.status(404).json({ error: 'Campsite not found' });
      }

      // Verify campsite belongs to this campground
      if (campsite.campground.toString() !== id) {
        return res.status(400).json({ error: 'Campsite does not belong to this campground' });
      }

      // Verify campsite is available
      if (!campsite.availability) {
        return res.status(400).json({ error: 'Campsite is not available for booking' });
      }

      // Use campsite price
      pricePerNight = campsite.price;

      // Verify guest count doesn't exceed capacity
      if (guests > campsite.capacity) {
        return res
          .status(400)
          .json({ error: `This campsite has a maximum capacity of ${campsite.capacity} guests` });
      }
    }

    // Calculate days and price
    const { daysCount, totalPrice } = calculateDaysAndPrice(startDate, endDate, pricePerNight);

    // Create booking object
    const bookingData = {
      user: req.user._id,
      campground: campground._id,
      campsite: campsiteId || null,
      startDate,
      endDate,
      totalDays: daysCount,
      totalPrice,
      guests: guests || 1,
      status: 'pending',
    };

    // Return booking data for client-side checkout
    const response = {
      booking: bookingData,
      campground: {
        id: campground._id,
        title: campground.title,
        location: campground.location,
        price: pricePerNight, // Use the calculated minimum price
      },
    };

    // Add campsite data if a campsite was selected
    if (campsite) {
      response.campsite = {
        id: campsite._id,
        name: campsite.name,
        description: campsite.description,
        features: campsite.features,
        price: campsite.price,
        capacity: campsite.capacity,
        images: campsite.images,
      };
    }

    res.json(response);
  } catch (error) {
    logError('Error creating booking', error, {
      endpoint: '/api/v1/campgrounds/:id/bookings',
      userId: req.user?._id,
      campgroundId: req.params.id,
      body: req.body,
    });
    res.status(400).json({ error: error.message || 'Failed to create booking' });
  }
};

module.exports.createCheckoutSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, totalDays, totalPrice, campsiteId, guests } = req.body;

    const campground = await Campground.findById(id);
    if (!campground) {
      return res.status(404).json({ error: 'Campground not found' });
    }

    // Check if user has acknowledged all required safety alerts for campground
    const campgroundAlerts = await SafetyAlert.getAlertsRequiringAcknowledgement(
      campground._id,
      req.user,
      'campground'
    );
    const unacknowledgedCampgroundAlerts = campgroundAlerts.filter((alert) => {
      if (!alert.requiresAcknowledgement) {
        return false;
      }
      const hasAcknowledged = alert.acknowledgedBy.some((ack) => {
        if (!ack || !ack.user) return false;

        // Handle both populated user object and user ID string
        const ackUserId = typeof ack.user === 'object' ? ack.user._id : ack.user;
        const currentUserId = req.user._id;

        return ackUserId.toString() === currentUserId.toString();
      });
      return !hasAcknowledged;
    });

    // Check if user has acknowledged all required safety alerts for campsite (if specified)
    let unacknowledgedCampsiteAlerts = [];
    if (campsiteId) {
      const campsiteAlerts = await SafetyAlert.getAlertsRequiringAcknowledgement(
        campsiteId,
        req.user,
        'campsite'
      );
      unacknowledgedCampsiteAlerts = campsiteAlerts.filter((alert) => {
        if (!alert.requiresAcknowledgement) {
          return false;
        }
        const hasAcknowledged = alert.acknowledgedBy.some((ack) => {
          if (!ack || !ack.user) return false;

          // Handle both populated user object and user ID string
          const ackUserId = typeof ack.user === 'object' ? ack.user._id : ack.user;
          const currentUserId = req.user._id;

          return ackUserId.toString() === currentUserId.toString();
        });
        return !hasAcknowledged;
      });
    }

    // Combine all unacknowledged alerts
    const allUnacknowledgedAlerts = [
      ...unacknowledgedCampgroundAlerts,
      ...unacknowledgedCampsiteAlerts,
    ];

    if (allUnacknowledgedAlerts.length > 0) {
      const alertTitles = allUnacknowledgedAlerts.map((alert) => alert.title).join(', ');
      return res.status(400).json({
        error: `You must acknowledge all safety alerts before booking. Required alerts: ${alertTitles}`,
      });
    }

    // If a campsite is specified, fetch it
    let campsite = null;
    if (campsiteId) {
      campsite = await require('../../models/campsite').findById(campsiteId);
      if (!campsite) {
        return res.status(404).json({ error: 'Campsite not found' });
      }

      // Verify campsite belongs to this campground
      if (campsite.campground.toString() !== id) {
        return res.status(400).json({ error: 'Campsite does not belong to this campground' });
      }

      // Verify campsite is available
      if (!campsite.availability) {
        return res.status(400).json({ error: 'Campsite is not available for booking' });
      }

      // Verify guest count doesn't exceed capacity
      if (guests > campsite.capacity) {
        return res
          .status(400)
          .json({ error: `This campsite has a maximum capacity of ${campsite.capacity} guests` });
      }
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: campsite
                ? `${campground.title} - ${campsite.name} - ${totalDays} days`
                : `${campground.title} - ${totalDays} days`,
              description: campsite
                ? `Booking for ${totalDays} days at ${campsite.name} in ${campground.title} by ${req.user.username} (${guests} guest${guests !== 1 ? 's' : ''})`
                : `Booking for ${totalDays} days at ${campground.title} by ${req.user.username}`,
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:5173/bookings/payment-success?session_id={CHECKOUT_SESSION_ID}&campground_id=${id}`,
      cancel_url: `http://localhost:5173/campgrounds/${id}`,
      metadata: {
        campgroundId: id,
        userId: req.user._id.toString(),
        campsiteId: campsiteId || '',
        startDate,
        endDate,
        totalDays,
        totalPrice,
        guests: guests || 1,
      },
    });

    res.json({
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (error) {
    logError('Error creating checkout session', error, {
      endpoint: '/api/v1/campgrounds/:id/checkout',
      userId: req.user?._id,
      campgroundId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

module.exports.handlePaymentSuccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { session_id } = req.query;
    const timestamp = new Date().toISOString();
    const requestIP = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const referer = req.get('Referer') || 'unknown';

    logInfo('Payment success endpoint called', {
      sessionId: session_id,
      timestamp,
      endpoint: '/api/v1/bookings/payment-success',
    });
    logDebug('Payment success request details', {
      sessionId: session_id,
      requestIP,
      userAgent,
      referer,
    });

    // Retrieve the session to verify payment
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      logWarn('Payment not completed for session', { sessionId: session_id, timestamp });
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Extract booking details from session metadata
    const { startDate, endDate, totalDays, totalPrice, userId, campsiteId, guests } =
      session.metadata;

    // Verify the user matches
    if (userId !== req.user._id.toString()) {
      logError('User mismatch for payment session', {
        sessionId: session_id,
        expectedUserId: userId,
        actualUserId: req.user._id.toString(),
        timestamp,
      });
      return res.status(403).json({ error: 'User mismatch' });
    }

    // Check if a booking with this session ID already exists
    let booking = await Booking.findOne({ sessionId: session_id })
      .populate({
        path: 'campground',
        select: 'title location images',
      })
      .populate({
        path: 'campsite',
        select: 'name description features price capacity images',
      });

    if (booking) {
      const bookingCreatedAt = booking.createdAt.toISOString();
      const timeSinceCreation = new Date() - booking.createdAt;

      logWarn('Duplicate booking detected', {
        sessionId: session_id,
        timestamp,
      });
      logDebug('Original booking details', {
        sessionId: session_id,
        bookingCreatedAt,
        timeSinceCreation,
      });
      logInfo('Booking with session ID already exists, returning existing booking', {
        sessionId: session_id,
      });

      // Return the existing booking
      // Prepare response for existing booking
      const existingBookingResponse = {
        success: true,
        message: `Payment already processed and booking confirmed. Original booking was created ${timeSinceCreation}ms ago.`,
        booking: {
          id: booking._id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalDays: booking.totalDays,
          totalPrice: booking.totalPrice,
          guests: booking.guests || 1,
          campground: {
            id: booking.campground._id,
            title: booking.campground.title,
            location: booking.campground.location,
            images: booking.campground.images,
          },
        },
      };

      // Add campsite data if the booking has a campsite
      if (booking.campsite) {
        existingBookingResponse.booking.campsite = {
          id: booking.campsite._id,
          name: booking.campsite.name,
          price: booking.campsite.price,
          description: booking.campsite.description,
          features: booking.campsite.features,
          capacity: booking.campsite.capacity,
          images: booking.campsite.images,
        };
      }

      return res.json(existingBookingResponse);
    }

    // Create the booking if it doesn't exist
    logInfo('Creating new booking', {
      sessionId: session_id,
      timestamp,
    });
    const startTime = Date.now();

    booking = new Booking({
      user: req.user._id,
      campground: id,
      campsite: campsiteId || null,
      startDate,
      endDate,
      totalDays,
      totalPrice,
      guests: parseInt(guests || 1, 10),
      sessionId: session_id,
      paid: true,
      status: 'confirmed',
    });

    await booking.save();
    logInfo('Booking saved to database', {
      sessionId: session_id,
      bookingId: booking._id,
      timestamp,
    });

    // Update campground with booking
    const campground = await Campground.findById(id);
    campground.bookings.push(booking._id);
    await campground.save();
    logInfo('Campground updated with booking reference', {
      sessionId: session_id,
      timestamp,
    });

    // If a specific campsite was booked, update its booked dates
    if (campsiteId) {
      const Campsite = require('../../models/campsite');
      const campsite = await Campsite.findById(campsiteId);

      if (campsite) {
        // Add the booked dates to the campsite
        campsite.bookedDates.push({
          startDate,
          endDate,
          booking: booking._id,
        });

        await campsite.save();
        logInfo('Campsite updated with booked dates', {
          sessionId: session_id,
          timestamp,
        });
      }
    }

    // Update user with booking
    req.user.bookings.push(booking._id);
    await req.user.save();
    logInfo('User updated with booking reference', {
      sessionId: session_id,
      timestamp,
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;
    logInfo('Booking creation process completed', {
      sessionId: session_id,
      processingTime,
      timestamp,
    });

    // Prepare response
    const responseData = {
      success: true,
      message: 'Payment successful and booking confirmed',
      booking: {
        id: booking._id,
        startDate,
        endDate,
        totalDays,
        totalPrice,
        guests: parseInt(guests || 1, 10),
        campground: {
          id: campground._id,
          title: campground.title,
        },
      },
    };

    // Add campsite data if a campsite was selected
    if (campsiteId) {
      try {
        const Campsite = require('../../models/campsite');
        const campsite = await Campsite.findById(campsiteId);
        if (campsite) {
          responseData.booking.campsite = {
            id: campsite._id,
            name: campsite.name,
            price: campsite.price,
            description: campsite.description,
            features: campsite.features,
            capacity: campsite.capacity,
            images: campsite.images,
          };
        }
      } catch (err) {
        logError('Error fetching campsite data for response', err, {
          sessionId: session_id,
          timestamp,
        });
        // Continue without campsite data if there's an error
      }
    }

    res.json(responseData);
  } catch (error) {
    logError('Error handling payment success', error, {
      sessionId: session_id,
      endpoint: '/api/v1/bookings/payment-success',
    });
    res.status(500).json({ error: 'Failed to process payment confirmation' });
  }
};
