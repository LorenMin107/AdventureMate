const Campground = require('../../models/campground');
const Booking = require('../../models/booking');
const User = require('../../models/user');
const config = require('../../config');
const stripe = require('stripe')(config.stripe.secretKey);

function calculateDaysAndPrice(startDate, endDate, pricePerNight) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const totalPrice = daysCount * pricePerNight;
  return { daysCount, totalPrice };
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
    console.error('Error fetching bookings:', error);
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
    console.error('Error fetching booking:', error);
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
    console.error('Error creating booking:', error);
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
    console.error('Error creating checkout session:', error);
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

    console.log(`[${timestamp}] Payment success endpoint called for session_id: ${session_id}`);
    console.log(
      `Request details - IP: ${requestIP}, User-Agent: ${userAgent}, Referer: ${referer}`
    );

    // Retrieve the session to verify payment
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      console.log(`[${timestamp}] Payment not completed for session_id: ${session_id}`);
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Extract booking details from session metadata
    const { startDate, endDate, totalDays, totalPrice, userId, campsiteId, guests } =
      session.metadata;

    // Verify the user matches
    if (userId !== req.user._id.toString()) {
      console.log(
        `[${timestamp}] User mismatch for session_id: ${session_id}. Expected: ${userId}, Got: ${req.user._id.toString()}`
      );
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

      console.log(`[${timestamp}] Duplicate booking detected for session_id: ${session_id}`);
      console.log(`Original booking created at: ${bookingCreatedAt} (${timeSinceCreation}ms ago)`);
      console.log(
        `Booking with session ID ${session_id} already exists. Returning existing booking.`
      );

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
    console.log(`[${timestamp}] Creating new booking for session_id: ${session_id}`);
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
    console.log(`[${timestamp}] Booking saved to database with _id: ${booking._id}`);

    // Update campground with booking
    const campground = await Campground.findById(id);
    campground.bookings.push(booking._id);
    await campground.save();
    console.log(`[${timestamp}] Campground updated with booking reference`);

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
        console.log(`[${timestamp}] Campsite updated with booked dates`);
      }
    }

    // Update user with booking
    req.user.bookings.push(booking._id);
    await req.user.save();
    console.log(`[${timestamp}] User updated with booking reference`);

    const endTime = Date.now();
    const processingTime = endTime - startTime;
    console.log(`[${timestamp}] Booking creation process completed in ${processingTime}ms`);

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
        console.error(`[${timestamp}] Error fetching campsite data for response:`, err);
        // Continue without campsite data if there's an error
      }
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).json({ error: 'Failed to process payment confirmation' });
  }
};
