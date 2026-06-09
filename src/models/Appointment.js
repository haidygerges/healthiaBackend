const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  type: {
    type: String,
    enum: ['Initial Consultation', 'Follow-up', 'Nutrition Review', 'Emergency', 'online', 'offline'],
    default: 'Follow-up',
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);