const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
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
  title: { type: String, required: true },
  category: { type: String },         // Nutrition & Wellness
  description: { type: String },
  goals: [{ type: String }],          // قائمة الأهداف
  duration: { type: String },         // 3 Months
  startDate: { type: Date },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);