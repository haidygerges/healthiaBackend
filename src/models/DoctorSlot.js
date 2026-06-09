const mongoose = require('mongoose');

const doctorSlotSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,   // YYYY-MM-DD — سهل المقارنة
    required: true,
  },
  time: {
    type: String,   // HH:mm
    required: true,
  },
  isBooked: {
    type: Boolean,
    default: false,
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null,
  },
}, { timestamps: true });

// منع نفس الدكتور يضيف نفس الـ slot مرتين
doctorSlotSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('DoctorSlot', doctorSlotSchema);