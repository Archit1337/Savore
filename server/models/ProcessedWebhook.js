const mongoose = require('mongoose');

const processedWebhookSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-expire documents after 7 days to prevent database bloating
processedWebhookSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('ProcessedWebhook', processedWebhookSchema);
