const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Conversion Log Schema
 * Stores logs of session to JWT conversion
 */
const ConversionLogSchema = new Schema({
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
    required: true,
    index: true
  },
  successful: {
    type: Boolean,
    default: true
  },
  error: {
    type: String
  }
}, { timestamps: true });

// Indexes for faster queries
ConversionLogSchema.index({ userId: 1, timestamp: -1 });
ConversionLogSchema.index({ successful: 1, timestamp: -1 });

/**
 * Get conversion statistics
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Conversion statistics
 */
ConversionLogSchema.statics.getConversionStats = async function(options = {}) {
  const query = {};
  
  // Add date range if provided
  if (options.startDate) {
    query.timestamp = { $gte: new Date(options.startDate) };
  }
  
  if (options.endDate) {
    query.timestamp = { ...query.timestamp, $lte: new Date(options.endDate) };
  }
  
  // Add user filter if provided
  if (options.userId) {
    query.userId = options.userId;
  }
  
  // Add success filter if provided
  if (options.successful !== undefined) {
    query.successful = options.successful;
  }
  
  // Get conversion statistics
  const stats = await this.aggregate([
    { $match: query },
    { $group: {
      _id: null,
      totalConversions: { $sum: 1 },
      successfulConversions: { $sum: { $cond: ['$successful', 1, 0] } },
      failedConversions: { $sum: { $cond: ['$successful', 0, 1] } },
      uniqueUsers: { $addToSet: '$userId' },
      firstConversion: { $min: '$timestamp' },
      lastConversion: { $max: '$timestamp' }
    }},
    { $project: {
      _id: 0,
      totalConversions: 1,
      successfulConversions: 1,
      failedConversions: 1,
      uniqueUsers: { $size: '$uniqueUsers' },
      firstConversion: 1,
      lastConversion: 1,
      successRate: { 
        $multiply: [
          { $divide: ['$successfulConversions', '$totalConversions'] },
          100
        ]
      }
    }}
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalConversions: 0,
    successfulConversions: 0,
    failedConversions: 0,
    uniqueUsers: 0,
    successRate: 0
  };
};

/**
 * Get users who have successfully converted to JWT
 * @returns {Promise<Array>} - Array of user IDs
 */
ConversionLogSchema.statics.getConvertedUsers = async function() {
  const result = await this.aggregate([
    { $match: { successful: true } },
    { $group: {
      _id: '$userId',
      lastConversion: { $max: '$timestamp' }
    }},
    { $project: {
      userId: '$_id',
      lastConversion: 1,
      _id: 0
    }}
  ]);
  
  return result.map(item => item.userId);
};

module.exports = mongoose.model('ConversionLog', ConversionLogSchema);