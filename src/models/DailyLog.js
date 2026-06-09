const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  date: { type: Date, default: Date.now },
  water: { type: Number, default: 0 },      // glasses
  sleep: { type: Number, default: 0 },      // hours
  mood: {
    type: String,
    enum: ['great', 'good', 'ok', 'bad'],
    default: 'good'
  },
  exercise: { type: Boolean, default: false },
  weight: { type: Number },
  calories: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);