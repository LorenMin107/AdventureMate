const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Deprecation Log Schema
 * Stores logs of deprecated endpoint usage
 */
const DeprecationLogSchema = new Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  method: {
    type: String,
    required: true
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  deprecationVersion: {
    type: String
  },
  alternativeUrl: {
    type: String
  }
}, { timestamps: true });

// Indexes for faster queries
DeprecationLogSchema.index({ endpoint: 1, timestamp: -1 });
DeprecationLogSchema.index({ userId: 1, timestamp: -1 });

/**
 * Get usage statistics for deprecated endpoints
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Usage statistics
 */
DeprecationLogSchema.statics.getUsageStats = async function(options = {}) {
  const query = {};
  
  // Add date range if provided
  if (options.startDate) {
    query.timestamp = { $gte: new Date(options.startDate) };
  }
  
  if (options.endDate) {
    query.timestamp = { ...query.timestamp, $lte: new Date(options.endDate) };
  }
  
  // Add endpoint filter if provided
  if (options.endpoint) {
    query.endpoint = options.endpoint;
  }
  
  // Add user filter if provided
  if (options.userId) {
    query.userId = options.userId;
  }
  
  // Get usage statistics
  const stats = await this.aggregate([
    { $match: query },
    { $group: {
      _id: '$endpoint',
      count: { $sum: 1 },
      uniqueUsers: { $addToSet: '$userId' },
      firstUsage: { $min: '$timestamp' },
      lastUsage: { $max: '$timestamp' }
    }},
    { $project: {
      endpoint: '$_id',
      count: 1,
      uniqueUsers: { $size: '$uniqueUsers' },
      firstUsage: 1,
      lastUsage: 1
    }},
    { $sort: { count: -1 } }
  ]);
  
  return stats;
};

module.exports = mongoose.model('DeprecationLog', DeprecationLogSchema);