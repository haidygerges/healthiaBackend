const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  from:    { type: String, default: '09:00' }, // HH:mm
  to:      { type: String, default: '12:00' },
}, { _id: false });

const daySchema = new mongoose.Schema({
  day:       { type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], required: true },
  morning:   { type: sessionSchema, default: () => ({}) },
  afternoon: { type: sessionSchema, default: () => ({}) },
  evening:   { type: sessionSchema, default: () => ({}) },
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  schedule: { type: [daySchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Availability', availabilitySchema);