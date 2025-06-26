const Campground = require("../models/campground");
const Booking = require("../models/booking");
const User = require("../models/user");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

function calculateDaysAndPrice(startDate, endDate, pricePerNight) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const totalPrice = daysCount * pricePerNight;
  return { daysCount, totalPrice };
}
module.exports.bookCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  const { daysCount, totalPrice } = calculateDaysAndPrice(req.body.startDate, req.body.endDate, campground.price);
  // Pass booking details to checkout page via query parameters
  res.redirect(
    `/bookings/${campground._id}/checkout?startDate=${req.body.startDate}&endDate=${req.body.endDate}&totalDays=${daysCount}&totalPrice=${totalPrice}`
  );
};

module.exports.renderCheckoutPage = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) {
    req.flash("error", "Cannot find that campground!");
    return res.redirect("/campgrounds");
  }
  const { startDate, endDate, totalDays, totalPrice } = req.query;
  res.render("campgrounds/checkout", {
    campground,
    startDate,
    endDate,
    daysCount: totalDays,
    totalPrice: parseFloat(totalPrice),
  });
};

// Proceed with the booking
module.exports.proceedBooking = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  const booking = new Booking({
    user: req.user._id,
    campground: campground._id,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    totalDays: req.body.totalDays,
    totalPrice: req.body.totalPrice,
  });
  await booking.save();
  campground.bookings.push(booking._id);
  await campground.save();
  req.user.bookings.push(booking); // Associate booking with user
  await req.user.save(); // Save user with new booking
  req.flash("success", "Successfully booked campground!");
  res.redirect(
    `/bookings/${campground._id}/checkout?startDate=${req.body.startDate}&endDate=${req.body.endDate}&totalDays=${req.body.totalDays}&totalPrice=${req.body.totalPrice}`
  );
};

module.exports.processPayment = async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, totalDays, totalPrice } = req.query;
  const campground = await Campground.findById(id);
  const user = await User.findById(req.user._id);

  // Create a checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${campground.title} - ${totalDays} days`,
            description: `Booking for ${totalDays} days at ${campground.title} by ${user.username}`,
          },
          unit_amount: Math.round(totalPrice * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `http://localhost:5173/bookings/payment-success?session_id={CHECKOUT_SESSION_ID}&campground_id=${id}`,
    cancel_url: `http://localhost:5173/campgrounds/${id}`,
    metadata: {
      campgroundId: id,
      userId: req.user._id.toString(),
      username: user.username,
      startDate: startDate,
      endDate: endDate,
      totalDays: totalDays,
      totalPrice: totalPrice
    },
  });

  res.redirect(303, session.url);
};

module.exports.paymentSuccess = async (req, res) => {
  const { id } = req.params;
  const session_id = req.query.session_id;
  const timestamp = new Date().toISOString();
  const requestIP = req.ip || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const referer = req.get('Referer') || 'unknown';

  console.log(`[${timestamp}] Traditional payment success endpoint called for session_id: ${session_id}`);
  console.log(`Request details - IP: ${requestIP}, User-Agent: ${userAgent}, Referer: ${referer}`);

  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (session.payment_status === "paid") {
    console.log(`[${timestamp}] Payment verified as paid for session_id: ${session_id}`);

    // Extract booking details from session metadata
    const { startDate, endDate, totalDays, totalPrice, userId } = session.metadata;

    // Verify the user matches
    if (userId !== req.user._id.toString()) {
      console.log(`[${timestamp}] User mismatch for session_id: ${session_id}. Expected: ${userId}, Got: ${req.user._id.toString()}`);
      req.flash("error", "User mismatch. Please try again.");
      return res.redirect(`/bookings/${id}/checkout`);
    }

    // Check if a booking with this session ID already exists
    let booking = await Booking.findOne({ sessionId: session_id });

    if (booking) {
      const bookingCreatedAt = booking.createdAt.toISOString();
      const timeSinceCreation = new Date() - booking.createdAt;

      console.log(`[${timestamp}] Duplicate booking detected for session_id: ${session_id}`);
      console.log(`Original booking created at: ${bookingCreatedAt} (${timeSinceCreation}ms ago)`);
      console.log(`Booking with session ID ${session_id} already exists. Redirecting to bookings view.`);

      req.flash("success", "Your booking was already confirmed!");
      return res.redirect(`/bookings/view`);
    }

    // Create the booking if it doesn't exist
    console.log(`[${timestamp}] Creating new booking for session_id: ${session_id}`);
    const startTime = Date.now();

    booking = new Booking({
      user: req.user._id,
      campground: id,
      startDate: startDate,
      endDate: endDate,
      totalDays: totalDays,
      totalPrice: totalPrice,
      sessionId: session_id, // Store sessionId
      paid: true
    });
    await booking.save();
    console.log(`[${timestamp}] Booking saved to database with _id: ${booking._id}`);

    const campground = await Campground.findById(id).populate("images");
    campground.bookings.push(booking._id);
    await campground.save();
    console.log(`[${timestamp}] Campground updated with booking reference`);

    req.user.bookings.push(booking._id); // Associate booking with user
    await req.user.save(); // Save user with new booking
    console.log(`[${timestamp}] User updated with booking reference`);

    const endTime = Date.now();
    const processingTime = endTime - startTime;
    console.log(`[${timestamp}] Booking creation process completed in ${processingTime}ms`);

    req.flash("success", "Successfully booked campground!");

    // Redirect to booking view page
    res.redirect(`/bookings/view`);
  } else {
    req.flash("error", "Payment failed. Please try again.");
    res.redirect(`/bookings/${id}/checkout`);
  }
};

module.exports.viewBooking = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate("campground");
  res.render("bookings/view", { bookings, user: req.user, currentPage: "bookings" });
};

module.exports.viewTransaction = async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id).populate("campground").populate("user");
  if (!booking) {
    req.flash("error", "Cannot find that booking!");
    return res.redirect("/bookings/view");
  }
  const campground = booking.campground;
  const session = await stripe.checkout.sessions.retrieve(booking.sessionId); // Use sessionId from booking
  res.render("bookings/transaction", { booking, session, campground, user: req.user, username: booking.user.username });
};
