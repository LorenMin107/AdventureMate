const Trip = require('../../models/trip');
const TripDay = require('../../models/tripDay');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/catchAsync');
const Booking = require('../../models/booking');
const { sendTripInviteEmail } = require('../../utils/emailService');
const Invite = require('../../models/invite');
const crypto = require('crypto');

// Create a new trip
exports.createTrip = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, isPublic } = req.body;
  const newTrip = new Trip({
    user: req.user._id,
    title,
    description,
    startDate,
    endDate,
    isPublic: !!isPublic,
    days: [],
  });

  // Auto-generate TripDay documents for the date range
  const tripDays = [];
  if (startDate && endDate) {
    let currentDate = new Date(startDate);
    const stopDate = new Date(endDate);
    currentDate.setMinutes(currentDate.getMinutes() + currentDate.getTimezoneOffset());
    stopDate.setMinutes(stopDate.getMinutes() + stopDate.getTimezoneOffset());

    while (currentDate <= stopDate) {
      const tripDay = new TripDay({ trip: newTrip._id, date: new Date(currentDate) });
      await tripDay.save();
      tripDays.push(tripDay._id);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  newTrip.days = tripDays;
  await newTrip.save();

  // Add trip to user's trips
  req.user.trips.push(newTrip._id);
  await req.user.save();

  const populatedTrip = await Trip.findById(newTrip._id).populate('days');

  res.status(201).json({ trip: populatedTrip });
});

// Get all trips for the current user
exports.getTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({
    $or: [{ user: req.user._id }, { collaborators: req.user._id }],
  })
    .populate('days')
    .populate('user', 'username email');
  res.json({ trips });
});

// Get a single trip by ID
exports.getTripById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findById(id).populate('days').populate('user', 'username email');
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  // Only allow owner or collaborator
  if (!trip.user.equals(req.user._id) && !trip.collaborators.includes(req.user._id)) {
    return res.status(403).json({ error: 'Not authorized to view this trip' });
  }
  res.json({ trip });
});

// Update a trip
exports.updateTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findById(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!trip.user.equals(req.user._id)) {
    return res.status(403).json({ error: 'Not authorized to update this trip' });
  }
  const { title, description, startDate, endDate, isPublic } = req.body;
  if (title !== undefined) trip.title = title;
  if (description !== undefined) trip.description = description;
  if (startDate !== undefined) trip.startDate = startDate;
  if (endDate !== undefined) trip.endDate = endDate;
  if (isPublic !== undefined) trip.isPublic = isPublic;
  await trip.save();
  res.json({ trip });
});

// Delete a trip
exports.deleteTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findById(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!trip.user.equals(req.user._id)) {
    return res.status(403).json({ error: 'Not authorized to delete this trip' });
  }
  // Remove trip days
  await TripDay.deleteMany({ trip: trip._id });
  // Remove trip from user's trips
  req.user.trips = req.user.trips.filter((tid) => !tid.equals(trip._id));
  await req.user.save();
  await trip.deleteOne();
  res.json({ message: 'Trip deleted successfully' });
});

// Add a day to a trip
exports.addTripDay = asyncHandler(async (req, res) => {
  const { id } = req.params; // trip id
  const { date, activities, notes } = req.body;
  const trip = await Trip.findById(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!trip.user.equals(req.user._id) && !trip.collaborators.includes(req.user._id)) {
    return res.status(403).json({ error: 'Not authorized to add days to this trip' });
  }
  const tripDay = await TripDay.create({ trip: trip._id, date, activities, notes });
  trip.days.push(tripDay._id);
  await trip.save();
  res.json({ tripDay });
});

// Update a trip day
exports.updateTripDay = asyncHandler(async (req, res) => {
  const { dayId } = req.params;
  const tripDay = await TripDay.findById(dayId);
  if (!tripDay) return res.status(404).json({ error: 'Trip day not found' });
  const trip = await Trip.findById(tripDay.trip);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!trip.user.equals(req.user._id) && !trip.collaborators.includes(req.user._id)) {
    return res.status(403).json({ error: 'Not authorized to update this trip day' });
  }
  const { date, activities, notes } = req.body;
  if (date !== undefined) tripDay.date = date;
  if (activities !== undefined) tripDay.activities = activities;
  if (notes !== undefined) tripDay.notes = notes;
  await tripDay.save();
  res.json({ tripDay });
});

// Delete a trip day
exports.deleteTripDay = asyncHandler(async (req, res) => {
  const { dayId } = req.params;
  const tripDay = await TripDay.findById(dayId);
  if (!tripDay) return res.status(404).json({ error: 'Trip day not found' });
  const trip = await Trip.findById(tripDay.trip);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!trip.user.equals(req.user._id) && !trip.collaborators.includes(req.user._id)) {
    return res.status(403).json({ error: 'Not authorized to delete this trip day' });
  }
  // Remove from trip.days
  trip.days = trip.days.filter((did) => !did.equals(tripDay._id));
  await trip.save();
  await tripDay.deleteOne();
  res.json({ message: 'Trip day deleted successfully' });
});

// Invite a collaborator to a trip
exports.inviteCollaborator = asyncHandler(async (req, res) => {
  const { id } = req.params; // trip id
  const { email } = req.body; // email of user to invite
  const trip = await Trip.findById(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!trip.user.equals(req.user._id)) {
    return res.status(403).json({ error: 'Only the trip owner can invite collaborators' });
  }

  // Find user by email
  const User = require('../../models/user');
  const invitedUser = await User.findOne({ email });
  const inviterName = req.user.username || req.user.email;
  const tripName = trip.title;
  const tripDescription = trip.description || '';
  const tripStartDate = trip.startDate ? trip.startDate.toISOString().split('T')[0] : '';
  const tripEndDate = trip.endDate ? trip.endDate.toISOString().split('T')[0] : '';
  const inviterMessage = req.body.inviterMessage || '';

  if (invitedUser) {
    // Check if user is already a collaborator
    if (trip.collaborators.includes(invitedUser._id)) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }
    // Add to collaborators (pending acceptance)
    trip.collaborators.push(invitedUser._id);
    await trip.save();
    // Add to user's sharedTrips if not already present
    if (!invitedUser.sharedTrips.includes(trip._id)) {
      invitedUser.sharedTrips.push(trip._id);
      await invitedUser.save();
    }
    // Send invitation email
    try {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const inviteUrl = `${clientUrl}/invite/${trip._id}`;
      await sendTripInviteEmail({
        to: invitedUser.email,
        inviter: inviterName,
        tripName,
        inviteUrl,
        tripDescription,
        tripStartDate,
        tripEndDate,
        inviterMessage,
      });
    } catch (err) {
      console.error('Failed to send trip invite email:', err);
    }
    return res.json({ message: 'Collaborator invited successfully' });
  } else {
    // Non-registered user: create a pending invite
    // Check if invite already exists
    let invite = await Invite.findOne({ email, trip: trip._id, status: 'pending' });
    if (invite) {
      return res.status(400).json({ error: 'Invite already sent to this email for this trip' });
    }
    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    invite = await Invite.create({
      email,
      trip: trip._id,
      inviter: req.user._id,
      token,
      status: 'pending',
    });
    // Send invite email with signup link
    try {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const inviteUrl = `${clientUrl}/register?invite=${token}`;
      await sendTripInviteEmail({
        to: email,
        inviter: inviterName,
        tripName,
        inviteUrl,
        tripDescription,
        tripStartDate,
        tripEndDate,
        inviterMessage,
      });
    } catch (err) {
      console.error('Failed to send trip invite email to non-registered user:', err);
    }
    return res.json({ message: 'Invite sent to non-registered user' });
  }
});

// Remove a collaborator from a trip
exports.removeCollaborator = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const trip = await Trip.findById(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!trip.user.equals(req.user._id)) {
    return res.status(403).json({ error: 'Only the trip owner can remove collaborators' });
  }
  trip.collaborators = trip.collaborators.filter((uid) => uid.toString() !== userId);
  await trip.save();
  // Remove from user's sharedTrips
  const User = require('../../models/user');
  const removedUser = await User.findById(userId);
  if (removedUser) {
    removedUser.sharedTrips = removedUser.sharedTrips.filter((tid) => tid.toString() !== id);
    await removedUser.save();
  }
  res.json({ message: 'Collaborator removed successfully' });
});

// Accept a trip invite (for invited user)
exports.acceptInvite = asyncHandler(async (req, res) => {
  const { id } = req.params; // trip id
  const trip = await Trip.findById(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  const Invite = require('../../models/invite');
  // If user is not already a collaborator, check for a pending invite for their email
  if (!trip.collaborators.includes(req.user._id)) {
    const invite = await Invite.findOne({
      trip: trip._id,
      email: req.user.email,
      status: 'pending',
    });
    if (!invite) {
      return res.status(403).json({ error: 'You are not invited to this trip' });
    }
    // Add user to collaborators
    trip.collaborators.push(req.user._id);
    await trip.save();
    // Mark invite as accepted (do not delete)
    invite.status = 'accepted';
    await invite.save();
  }
  // Optionally, add to user's sharedTrips if not already present
  if (!req.user.sharedTrips.includes(trip._id)) {
    req.user.sharedTrips.push(trip._id);
    await req.user.save();
  }
  res.json({ message: 'Trip invite accepted' });
});

// List collaborators for a trip
exports.listCollaborators = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findById(id).populate('collaborators', 'username email');
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  // Only owner, collaborator, or pending invitee can view
  const Invite = require('../../models/invite');
  let isPendingInvitee = false;
  if (req.user && req.user.email) {
    const invite = await Invite.findOne({ trip: id, email: req.user.email, status: 'pending' });
    if (invite) isPendingInvitee = true;
  }
  if (
    !trip.user.equals(req.user._id) &&
    !trip.collaborators.some((id) => id.equals(req.user._id)) &&
    !isPendingInvitee
  ) {
    return res.status(403).json({ error: 'Not authorized to view collaborators' });
  }
  res.json({ collaborators: trip.collaborators });
});

// Book all activities in a trip that reference a campground/campsite
exports.bookTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findById(id).populate({
    path: 'days',
    populate: { path: 'activities.campground activities.campsite' },
  });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!trip.user.equals(req.user._id) && !trip.collaborators.includes(req.user._id)) {
    return res.status(403).json({ error: 'Not authorized to book this trip' });
  }
  const bookings = [];
  for (const day of trip.days) {
    for (const activity of day.activities) {
      if (activity.campground || activity.campsite) {
        // Check if already booked for this user, campground/campsite, and date
        const existing = await Booking.findOne({
          user: req.user._id,
          campground: activity.campground,
          campsite: activity.campsite,
          startDate: day.date,
        });
        if (!existing) {
          const booking = await Booking.create({
            user: req.user._id,
            campground: activity.campground,
            campsite: activity.campsite,
            startDate: day.date,
            endDate: day.date,
            // Add other booking fields as needed
          });
          bookings.push(booking);
        }
      }
    }
  }
  res.json({ bookings });
});

// Book all activities in a single trip day
exports.bookTripDay = asyncHandler(async (req, res) => {
  const { id, dayId } = req.params;
  const trip = await Trip.findById(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!trip.user.equals(req.user._id) && !trip.collaborators.includes(req.user._id)) {
    return res.status(403).json({ error: 'Not authorized to book this trip' });
  }
  const day = await TripDay.findById(dayId);
  if (!day) return res.status(404).json({ error: 'Trip day not found' });
  const bookings = [];
  for (const activity of day.activities) {
    if (activity.campground || activity.campsite) {
      const existing = await Booking.findOne({
        user: req.user._id,
        campground: activity.campground,
        campsite: activity.campsite,
        startDate: day.date,
      });
      if (!existing) {
        const booking = await Booking.create({
          user: req.user._id,
          campground: activity.campground,
          campsite: activity.campsite,
          startDate: day.date,
          endDate: day.date,
        });
        bookings.push(booking);
      }
    }
  }
  res.json({ bookings });
});

// List pending invites for a trip
exports.listInvites = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findById(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!trip.user.equals(req.user._id)) {
    return res.status(403).json({ error: 'Only the trip owner can view invites' });
  }
  const invites = await Invite.find({ trip: id, status: 'pending' }).select(
    'email status createdAt'
  );
  res.json({ invites });
});

// Cancel a pending invite for a trip
exports.cancelInvite = asyncHandler(async (req, res) => {
  const { id, email } = req.params;
  const trip = await Trip.findById(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!trip.user.equals(req.user._id)) {
    return res.status(403).json({ error: 'Only the trip owner can cancel invites' });
  }
  const result = await Invite.deleteOne({
    trip: id,
    email: decodeURIComponent(email),
    status: 'pending',
  });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Invite not found or already accepted' });
  }
  res.json({ message: 'Invite cancelled' });
});

// Get tripId by invite token (for frontend redirect)
exports.getInviteByToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const invite = await Invite.findOne({ token, status: 'pending' });
  if (!invite) return res.status(404).json({ error: 'Invite not found or expired' });
  res.json({ tripId: invite.trip });
});

// Allow a collaborator to remove themselves from a trip
exports.removeSelfAsCollaborator = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findById(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  // Owner cannot remove themselves as a collaborator
  if (trip.user.equals(req.user._id)) {
    return res.status(403).json({ error: 'Owner cannot remove themselves from their own trip' });
  }
  // Only allow if user is a collaborator
  const idx = trip.collaborators.findIndex(
    (uid) => uid && req.user._id && uid.toString() === req.user._id.toString()
  );
  if (idx === -1) {
    return res.status(403).json({ error: 'You are not a collaborator on this trip' });
  }
  trip.collaborators.splice(idx, 1);
  await trip.save();
  // Remove from user's sharedTrips
  req.user.sharedTrips = req.user.sharedTrips.filter((tid) => !tid.equals(trip._id));
  await req.user.save();
  res.json({ message: 'You have been removed from this trip' });
  console.log(
    '[removeSelfAsCollaborator] req.user._id:',
    req.user._id,
    '| trip.collaborators:',
    trip.collaborators.map((x) => x && x.toString())
  );
});
