const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'SUSPEND_USER', 
      'ACTIVATE_USER', 
      'CHANGE_ROLE', 
      'SUSPEND_RESTAURANT', 
      'RESTORE_RESTAURANT', 
      'APPROVE_PARTNERSHIP', 
      'REJECT_PARTNERSHIP', 
      'DISMISS_REEL_REPORTS', 
      'DELETE_REEL'
    ]
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for high performance logs sorting by timestamp
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
