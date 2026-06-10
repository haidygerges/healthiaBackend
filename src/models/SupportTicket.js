const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['account', 'appointment', 'billing', 'technical', 'other'],
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved'],
    default: 'open',
  },
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);