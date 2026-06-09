const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  icon:    { type: String, default: '📅' },
  read:    { type: Boolean, default: false },
  data:    { type: mongoose.Schema.Types.Mixed, default: {} }, // extra info زي appointmentId
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);