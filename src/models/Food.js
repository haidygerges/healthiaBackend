const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  category: {
    type: String,
    enum: ['carbs', 'protein', 'fats', 'vegetables', 'fruits', 'snacks', 'egyptian_arabic', 'drinks'],
    required: true,
  },
  quantity: { type: String },            // مثال: "كوب مطبوخ" / "100 جرام"
  calories: { type: Number, required: true },
  protein:  { type: Number, default: 0 },
  carbs:    { type: Number, default: 0 },
  fat:      { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Food', foodSchema);