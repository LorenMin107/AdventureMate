const SafetyAlert = require('../../models/safetyAlert');
const Campsite = require('../../models/campsite');
const Campground = require('../../models/campground');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/catchAsync');
const { logInfo, logError } = require('../../utils/logger');

/**
 * Get all safety alerts for a campsite
 * GET /api/v1/campsites/:campsiteId/safety-alerts
 */
module.exports.getCampsiteSafetyAlerts = asyncHandler(async (req, res) => {
  const { campsiteId } = req.params;
  const { showActiveOnly = 'true' } = req.query;

  // Verify campsite exists
  const campsite = await Campsite.findById(campsiteId);
  if (!campsite) {
    return ApiResponse.error(
      'Campsite not found',
      'The requested campsite does not exist',
      404
    ).send(res);
  }

  let alerts;
  if (showActiveOnly === 'true') {
    alerts = await SafetyAlert.getActiveAlerts(campsiteId, req.user, 'campsite');
  } else {
    alerts = await SafetyAlert.find({ campsite: campsiteId })
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .populate('campground', 'title')
      .populate('campsite', 'name')
      .sort({ severity: -1, startDate: -1 });
  }

  // Set cache-busting headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });

  return ApiResponse.success({ alerts }, 'Safety alerts retrieved successfully').send(res);
});

/**
 * Get active safety alerts for a campsite
 * GET /api/v1/campsites/:campsiteId/safety-alerts/active
 */
module.exports.getCampsiteActiveSafetyAlerts = asyncHandler(async (req, res) => {
  const { campsiteId } = req.params;

  // Verify campsite exists
  const campsite = await Campsite.findById(campsiteId);
  if (!campsite) {
    return ApiResponse.error(
      'Campsite not found',
      'The requested campsite does not exist',
      404
    ).send(res);
  }

  const alerts = await SafetyAlert.getActiveAlerts(campsiteId, req.user, 'campsite');

  // Set cache-busting headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });

  return ApiResponse.success({ alerts }, 'Active safety alerts retrieved successfully').send(res);
});

/**
 * Create a new safety alert for a campsite
 * POST /api/v1/campsites/:campsiteId/safety-alerts
 */
module.exports.createCampsiteSafetyAlert = asyncHandler(async (req, res) => {
  const { campsiteId } = req.params;
  const {
    title,
    description,
    severity,
    type,
    startDate,
    endDate,
    isPublic,
    requiresAcknowledgement,
  } = req.body;

  // Verify campsite exists
  const campsite = await Campsite.findById(campsiteId);
  if (!campsite) {
    return ApiResponse.error(
      'Campsite not found',
      'The requested campsite does not exist',
      404
    ).send(res);
  }

  // Check permissions - only campsite owners, campground owners, and admins can create alerts
  const campground = await Campground.findById(campsite.campground);
  const isOwner = campground.owner && campground.owner.toString() === req.user._id.toString();
  const isAuthor = campground.author && campground.author.toString() === req.user._id.toString();

  if (!req.user.isAdmin && !isOwner && !isAuthor) {
    return ApiResponse.error(
      'Unauthorized',
      'You do not have permission to create safety alerts for this campsite',
      403
    ).send(res);
  }

  // Validation
  const errors = [];
  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push({ field: 'title', message: 'Title is required' });
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push({ field: 'description', message: 'Description is required' });
  }
  if (severity && !['low', 'medium', 'high', 'critical'].includes(severity)) {
    errors.push({ field: 'severity', message: 'Invalid severity level' });
  }
  if (
    type &&
    ![
      'weather',
      'wildlife',
      'fire',
      'flood',
      'medical',
      'security',
      'maintenance',
      'other',
    ].includes(type)
  ) {
    errors.push({ field: 'type', message: 'Invalid alert type' });
  }
  if (!startDate) {
    errors.push({ field: 'startDate', message: 'Start date is required' });
  }
  if (!endDate) {
    errors.push({ field: 'endDate', message: 'End date is required' });
  }

  if (errors.length > 0) {
    return ApiResponse.error({ errors }, 'Validation failed', 400).send(res);
  }

  // Create the safety alert
  const alert = new SafetyAlert({
    title: title.trim(),
    description: description.trim(),
    severity: severity || 'medium',
    type: type || 'other',
    status: 'active',
    startDate,
    endDate,
    campsite: campsiteId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
    isPublic: isPublic !== undefined ? isPublic : true,
    requiresAcknowledgement:
      requiresAcknowledgement !== undefined ? requiresAcknowledgement : false,
  });

  await alert.save();

  // Populate user information for response
  await alert.populate('createdBy', 'username');
  await alert.populate('updatedBy', 'username');
  await alert.populate('campground', 'title');
  await alert.populate('campsite', 'name');

  logInfo('Created campsite safety alert', {
    alertId: alert._id,
    campsiteId,
    userId: req.user._id,
  });

  return ApiResponse.success({ alert }, 'Safety alert created successfully', 201).send(res);
});

/**
 * Update a campsite safety alert
 * PUT /api/v1/campsites/:campsiteId/safety-alerts/:alertId
 */
module.exports.updateCampsiteSafetyAlert = asyncHandler(async (req, res) => {
  const { campsiteId, alertId } = req.params;
  const updateData = req.body;

  const alert = await SafetyAlert.findOne({
    _id: alertId,
    campsite: campsiteId,
  });

  if (!alert) {
    return ApiResponse.error(
      'Safety alert not found',
      'The requested safety alert does not exist',
      404
    ).send(res);
  }

  // Check permissions - only creator, campsite owners, and admins can update
  const isCreator = alert.createdBy.toString() === req.user._id.toString();
  const campground = await Campground.findById(alert.campground);
  const isOwner = campground.owner && campground.owner.toString() === req.user._id.toString();
  const isAuthor = campground.author && campground.author.toString() === req.user._id.toString();

  if (!req.user.isAdmin && !isCreator && !isOwner && !isAuthor) {
    return ApiResponse.error(
      'Unauthorized',
      'You do not have permission to update this safety alert',
      403
    ).send(res);
  }

  // Field-level validation
  const errors = [];
  if (
    updateData.title !== undefined &&
    (!updateData.title || typeof updateData.title !== 'string' || !updateData.title.trim())
  ) {
    errors.push({ field: 'title', message: 'Title is required' });
  }
  if (
    updateData.description !== undefined &&
    (!updateData.description ||
      typeof updateData.description !== 'string' ||
      !updateData.description.trim())
  ) {
    errors.push({ field: 'description', message: 'Description is required' });
  }
  if (updateData.severity && !['low', 'medium', 'high', 'critical'].includes(updateData.severity)) {
    errors.push({ field: 'severity', message: 'Invalid severity level' });
  }
  if (
    updateData.type &&
    ![
      'weather',
      'wildlife',
      'fire',
      'flood',
      'medical',
      'security',
      'maintenance',
      'other',
    ].includes(updateData.type)
  ) {
    errors.push({ field: 'type', message: 'Invalid alert type' });
  }
  if (updateData.status && !['active', 'resolved', 'expired'].includes(updateData.status)) {
    errors.push({ field: 'status', message: 'Invalid status' });
  }

  if (errors.length > 0) {
    return ApiResponse.error({ errors }, 'Validation failed', 400).send(res);
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
  if (updateData.requiresAcknowledgement !== undefined)
    alert.requiresAcknowledgement = updateData.requiresAcknowledgement;

  alert.updatedBy = req.user._id;

  await alert.save();

  // Populate user information for response
  await alert.populate('createdBy', 'username');
  await alert.populate('updatedBy', 'username');
  await alert.populate('campground', 'title');
  await alert.populate('campsite', 'name');

  logInfo('Updated campsite safety alert', {
    alertId: alert._id,
    campsiteId,
    userId: req.user._id,
  });

  return ApiResponse.success({ alert }, 'Safety alert updated successfully').send(res);
});

/**
 * Delete a campsite safety alert
 * DELETE /api/v1/campsites/:campsiteId/safety-alerts/:alertId
 */
module.exports.deleteCampsiteSafetyAlert = asyncHandler(async (req, res) => {
  const { campsiteId, alertId } = req.params;

  const alert = await SafetyAlert.findOne({
    _id: alertId,
    campsite: campsiteId,
  });

  if (!alert) {
    return ApiResponse.error(
      'Safety alert not found',
      'The requested safety alert does not exist',
      404
    ).send(res);
  }

  // Check permissions - only creator, campsite owners, and admins can delete
  const isCreator = alert.createdBy.toString() === req.user._id.toString();
  const campground = await Campground.findById(alert.campground);
  const isOwner = campground.owner && campground.owner.toString() === req.user._id.toString();
  const isAuthor = campground.author && campground.author.toString() === req.user._id.toString();

  if (!req.user.isAdmin && !isCreator && !isOwner && !isAuthor) {
    return ApiResponse.error(
      'Unauthorized',
      'You do not have permission to delete this safety alert',
      403
    ).send(res);
  }

  await SafetyAlert.findByIdAndDelete(alertId);

  logInfo('Deleted campsite safety alert', {
    alertId,
    campsiteId,
    userId: req.user._id,
  });

  return ApiResponse.success(null, 'Safety alert deleted successfully').send(res);
});

/**
 * Acknowledge a campsite safety alert
 * POST /api/v1/campsites/:campsiteId/safety-alerts/:alertId/acknowledge
 */
module.exports.acknowledgeCampsiteSafetyAlert = asyncHandler(async (req, res) => {
  const { campsiteId, alertId } = req.params;

  const alert = await SafetyAlert.findOne({
    _id: alertId,
    campsite: campsiteId,
  });

  if (!alert) {
    return ApiResponse.error(
      'Safety alert not found',
      'The requested safety alert does not exist',
      404
    ).send(res);
  }

  if (!alert.requiresAcknowledgement) {
    return ApiResponse.error(
      'Acknowledgement not required',
      'This safety alert does not require acknowledgement',
      400
    ).send(res);
  }

  const acknowledged = alert.acknowledge(req.user._id);

  if (!acknowledged) {
    return ApiResponse.error(
      'Already acknowledged',
      'You have already acknowledged this safety alert',
      400
    ).send(res);
  }

  await alert.save();

  // Populate the alert with user information for response
  await alert.populate('createdBy', 'username');
  await alert.populate('updatedBy', 'username');
  await alert.populate('campground', 'title');
  await alert.populate('campsite', 'name');
  await alert.populate('acknowledgedBy.user', 'username');

  logInfo('Acknowledged campsite safety alert', {
    alertId: alert._id,
    campsiteId,
    userId: req.user._id,
  });

  return ApiResponse.success({ alert }, 'Safety alert acknowledged successfully').send(res);
});
