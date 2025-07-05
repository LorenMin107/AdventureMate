const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Audit Log Schema
 * Stores audit logs for sensitive operations
 */
const AuditLogSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  resource: {
    type: String,
    required: true,
    index: true
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  details: {
    type: Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success'
  },
  message: {
    type: String
  }
}, { timestamps: true });

// Indexes for faster queries
AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, resource: 1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });

/**
 * Create a new audit log entry
 * @param {Object} logData - Audit log data
 * @returns {Promise<Object>} - The created audit log document
 */
AuditLogSchema.statics.createLog = async function(logData) {
  return await this.create(logData);
};

/**
 * Get audit logs for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of audit log documents
 */
AuditLogSchema.statics.getLogsForUser = async function(userId, options = {}) {
  const query = { user: userId };
  
  // Add date range if provided
  if (options.startDate) {
    query.timestamp = { $gte: new Date(options.startDate) };
  }
  
  if (options.endDate) {
    query.timestamp = { ...query.timestamp, $lte: new Date(options.endDate) };
  }
  
  // Add action filter if provided
  if (options.action) {
    query.action = options.action;
  }
  
  // Add resource filter if provided
  if (options.resource) {
    query.resource = options.resource;
  }
  
  // Add status filter if provided
  if (options.status) {
    query.status = options.status;
  }
  
  // Set up pagination
  const page = options.page || 1;
  const limit = options.limit || 50;
  const skip = (page - 1) * limit;
  
  // Execute query with pagination
  return await this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username email');
};

/**
 * Get audit logs for a resource
 * @param {string} resource - Resource type
 * @param {string} resourceId - Resource ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of audit log documents
 */
AuditLogSchema.statics.getLogsForResource = async function(resource, resourceId, options = {}) {
  const query = { 
    resource,
    resourceId
  };
  
  // Add date range if provided
  if (options.startDate) {
    query.timestamp = { $gte: new Date(options.startDate) };
  }
  
  if (options.endDate) {
    query.timestamp = { ...query.timestamp, $lte: new Date(options.endDate) };
  }
  
  // Add action filter if provided
  if (options.action) {
    query.action = options.action;
  }
  
  // Add status filter if provided
  if (options.status) {
    query.status = options.status;
  }
  
  // Set up pagination
  const page = options.page || 1;
  const limit = options.limit || 50;
  const skip = (page - 1) * limit;
  
  // Execute query with pagination
  return await this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username email');
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);