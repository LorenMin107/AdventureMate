const SafetyAlert = require('../../models/safetyAlert');
const Campground = require('../../models/campground');
const { logError, logInfo, logWarn } = require('../../utils/logger');
const ApiResponse = require('../../utils/ApiResponse');
const { asyncHandler } = require('../../utils/errorHandler');

/**
 * Get all safety alerts for a campground
 * GET /api/v1/campgrounds/:campgroundId/safety-alerts
 */
module.exports.getSafetyAlerts = asyncHandler(async (req, res) => {
  const { campgroundId } = req.params;
  const { status, severity, type } = req.query;

  // Verify campground exists
  const campground = await Campground.findById(campgroundId);
  if (!campground) {
    return ApiResponse.error(
      'Campground not found',
      'The requested campground does not exist',
      404
    ).send(res);
  }

  // Build query
  const query = { campground: campgroundId };

  if (status) {
    query.status = status;
  }

  if (severity) {
    query.severity = severity;
  }

  if (type) {
    query.type = type;
  }

  // Filter by visibility for non-admin users
  if (!req.user?.isAdmin) {
    query.$or = [{ isPublic: true }, { createdBy: req.user?._id }];
  }

  const alerts = await SafetyAlert.find(query)
    .populate('createdBy', 'username')
    .populate('updatedBy', 'username')
    .sort({ severity: -1, startDate: -1 });

  logInfo('Retrieved safety alerts', {
    campgroundId,
    count: alerts.length,
    userId: req.user?._id,
  });

  return ApiResponse.success({ alerts }, 'Safety alerts retrieved successfully').send(res);
});

/**
 * Get active safety alerts for a campground
 * GET /api/v1/campgrounds/:campgroundId/safety-alerts/active
 */
module.exports.getActiveSafetyAlerts = asyncHandler(async (req, res) => {
  const { campgroundId } = req.params;

  logInfo('getActiveSafetyAlerts called', { campgroundId, userId: req.user?._id });

  // Verify campground exists
  const campground = await Campground.findById(campgroundId);
  if (!campground) {
    logWarn('Campground not found for safety alerts', { campgroundId });
    return ApiResponse.error(
      'Campground not found',
      'The requested campground does not exist',
      404
    ).send(res);
  }

  const alerts = await SafetyAlert.getActiveAlerts(campgroundId, req.user);

  logInfo('Retrieved active safety alerts', {
    campgroundId,
    count: alerts?.length || 0,
    userId: req.user?._id,
    alertIds: alerts?.map((a) => a._id) || [],
    alerts:
      alerts?.map((a) => ({
        id: a._id,
        title: a.title,
        status: a.status,
        startDate: a.startDate,
        endDate: a.endDate,
        isPublic: a.isPublic,
      })) || [],
  });

  // Set no-cache headers to prevent browser caching
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });

  return ApiResponse.success({ alerts }, 'Active safety alerts retrieved successfully').send(res);
});

/**
 * Get a specific safety alert
 * GET /api/v1/campgrounds/:campgroundId/safety-alerts/:alertId
 */
module.exports.getSafetyAlert = asyncHandler(async (req, res) => {
  const { campgroundId, alertId } = req.params;

  const alert = await SafetyAlert.findOne({
    _id: alertId,
    campground: campgroundId,
  })
    .populate('createdBy', 'username')
    .populate('updatedBy', 'username');

  if (!alert) {
    return ApiResponse.error(
      'Safety alert not found',
      'The requested safety alert does not exist',
      404
    ).send(res);
  }

  // Check visibility
  if (!alert.isVisibleTo(req.user)) {
    return ApiResponse.error(
      'Access denied',
      'You do not have permission to view this safety alert',
      403
    ).send(res);
  }

  return ApiResponse.success({ alert }, 'Safety alert retrieved successfully').send(res);
});

/**
 * Create a new safety alert
 * POST /api/v1/campgrounds/:campgroundId/safety-alerts
 */
module.exports.createSafetyAlert = asyncHandler(async (req, res) => {
  const { campgroundId } = req.params;
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

  // Verify campground exists
  const campground = await Campground.findById(campgroundId);
  if (!campground) {
    return ApiResponse.error(
      'Campground not found',
      'The requested campground does not exist',
      404
    ).send(res);
  }

  // Check permissions - only campground owners and admins can create alerts
  const isOwner = campground.owner && campground.owner.toString() === req.user._id.toString();
  const isAuthor = campground.author && campground.author.toString() === req.user._id.toString();

  if (!req.user.isAdmin && !isOwner && !isAuthor) {
    return ApiResponse.error(
      'Unauthorized',
      'You do not have permission to create safety alerts for this campground',
      403
    ).send(res);
  }

  // Field-level validation
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
    !type ||
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
    errors.push({ field: 'type', message: 'Alert type is required and must be valid' });
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
    type: type,
    startDate: startDate || new Date(),
    endDate: endDate,
    campground: campgroundId,
    createdBy: req.user._id,
    isPublic: isPublic !== undefined ? isPublic : true,
    requiresAcknowledgement: requiresAcknowledgement || false,
  });

  await alert.save();

  // Populate user information for response
  await alert.populate('createdBy', 'username');

  logInfo('Created safety alert', {
    alertId: alert._id,
    campgroundId,
    severity: alert.severity,
    type: alert.type,
    userId: req.user._id,
  });

  return ApiResponse.success({ alert }, 'Safety alert created successfully', 201).send(res);
});

/**
 * Update a safety alert
 * PUT /api/v1/campgrounds/:campgroundId/safety-alerts/:alertId
 */
module.exports.updateSafetyAlert = asyncHandler(async (req, res) => {
  const { campgroundId, alertId } = req.params;
  const updateData = req.body;

  const alert = await SafetyAlert.findOne({
    _id: alertId,
    campground: campgroundId,
  });

  if (!alert) {
    return ApiResponse.error(
      'Safety alert not found',
      'The requested safety alert does not exist',
      404
    ).send(res);
  }

  // Check permissions - only creator, campground owners, and admins can update
  const isCreator = alert.createdBy.toString() === req.user._id.toString();
  const campground = await Campground.findById(campgroundId);
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

  logInfo('Updated safety alert', {
    alertId: alert._id,
    campgroundId,
    userId: req.user._id,
  });

  return ApiResponse.success({ alert }, 'Safety alert updated successfully').send(res);
});

/**
 * Delete a safety alert
 * DELETE /api/v1/campgrounds/:campgroundId/safety-alerts/:alertId
 */
module.exports.deleteSafetyAlert = asyncHandler(async (req, res) => {
  const { campgroundId, alertId } = req.params;

  const alert = await SafetyAlert.findOne({
    _id: alertId,
    campground: campgroundId,
  });

  if (!alert) {
    return ApiResponse.error(
      'Safety alert not found',
      'The requested safety alert does not exist',
      404
    ).send(res);
  }

  // Check permissions - only creator, campground owners, and admins can delete
  const isCreator = alert.createdBy.toString() === req.user._id.toString();
  const campground = await Campground.findById(campgroundId);
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

  logInfo('Deleted safety alert', {
    alertId,
    campgroundId,
    userId: req.user._id,
  });

  return ApiResponse.success(null, 'Safety alert deleted successfully').send(res);
});

/**
 * Acknowledge a safety alert
 * POST /api/v1/campgrounds/:campgroundId/safety-alerts/:alertId/acknowledge
 */
module.exports.acknowledgeSafetyAlert = asyncHandler(async (req, res) => {
  const { campgroundId, alertId } = req.params;

  const alert = await SafetyAlert.findOne({
    _id: alertId,
    campground: campgroundId,
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
  await alert.populate('acknowledgedBy.user', 'username');

  logInfo('Acknowledged safety alert', {
    alertId: alert._id,
    campgroundId,
    userId: req.user._id,
  });

  return ApiResponse.success({ alert }, 'Safety alert acknowledged successfully').send(res);
});
