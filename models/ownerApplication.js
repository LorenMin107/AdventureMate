const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OwnerApplicationSchema = new Schema({
  // Reference to the user applying to be an owner
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  
  // Business Information
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  
  businessType: {
    type: String,
    enum: ['individual', 'company', 'organization'],
    required: true
  },
  
  businessRegistrationNumber: {
    type: String,
    trim: true
  },
  
  taxId: {
    type: String,
    trim: true
  },
  
  // Contact Information
  businessAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'Myanmar' }
  },
  
  businessPhone: {
    type: String,
    required: true
  },
  
  businessEmail: {
    type: String,
    required: true
  },
  
  // Application Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Application Documents
  documents: [{
    type: {
      type: String,
      enum: ['business_license', 'tax_certificate', 'identity_document', 'property_ownership', 'other'],
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Admin Review Information
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  
  reviewedAt: {
    type: Date
  },
  
  reviewNotes: [{
    note: {
      type: String,
      required: true
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['admin_note', 'system_note', 'applicant_note'],
      default: 'admin_note'
    }
  }],
  
  rejectionReason: {
    type: String
  },
  
  // Banking Information (for payments) - optional during application
  bankingInfo: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    routingNumber: String,
    swiftCode: String
  },
  
  // Application motivation/description
  applicationReason: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Experience and qualifications
  experience: {
    type: String,
    maxlength: 1000
  },
  
  // Expected number of properties to list
  expectedProperties: {
    type: Number,
    min: 1,
    max: 100
  }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
OwnerApplicationSchema.index({ user: 1 });
OwnerApplicationSchema.index({ status: 1 });
OwnerApplicationSchema.index({ businessName: 'text' });
OwnerApplicationSchema.index({ createdAt: -1 });

// Virtual for full business address
OwnerApplicationSchema.virtual('fullBusinessAddress').get(function() {
  if (!this.businessAddress) return '';
  const addr = this.businessAddress;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for status display
OwnerApplicationSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending': 'Pending Review',
    'under_review': 'Under Review',
    'approved': 'Approved',
    'rejected': 'Rejected'
  };
  return statusMap[this.status] || this.status;
});

// Method to check if application can be modified
OwnerApplicationSchema.methods.canBeModified = function() {
  return this.status === 'pending';
};

// Method to approve application
OwnerApplicationSchema.methods.approve = async function(adminUser, notes) {
  this.status = 'approved';
  this.reviewedBy = adminUser._id;
  this.reviewedAt = new Date();
  
  if (notes) {
    this.reviewNotes.push({
      note: notes,
      addedBy: adminUser._id,
      type: 'admin_note'
    });
  }
  
  await this.save();
  return this;
};

// Method to reject application
OwnerApplicationSchema.methods.reject = async function(adminUser, reason, notes) {
  this.status = 'rejected';
  this.reviewedBy = adminUser._id;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  
  if (notes) {
    this.reviewNotes.push({
      note: notes,
      addedBy: adminUser._id,
      type: 'admin_note'
    });
  }
  
  await this.save();
  return this;
};

module.exports = mongoose.model("OwnerApplication", OwnerApplicationSchema);