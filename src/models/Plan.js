const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  type:      { type: String, enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'] },
  name:      { type: String },
  calories:  { type: Number, default: 0 },
  protein:   { type: Number, default: 0 },
  carbs:     { type: Number, default: 0 },
  fats:      { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
});

const daySchema = new mongoose.Schema({
  day:       { type: String, enum: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], required: true },
  meals:     [mealItemSchema],
  completed: { type: Boolean, default: false },
});

const planSchema = new mongoose.Schema({
  patient:  { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, required: true },
  category: { type: String },
  description: { type: String },
  goals:    [{ type: String }],
  duration: { type: String },
  startDate: { type: Date },
  endDate:   { type: Date },
  status:   { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  notes:    { type: String },

  // الأيام + وجباتها
  days: [daySchema],

  // ✅ تاريخ بداية الأسبوع الحالي — بيتحدث كل ما الدكتور يعمل update للخطة
  weekStartDate: { type: Date, default: () => {
    // نبدأ من أول الأسبوع الحالي (الأحد)
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // الأحد
    return d;
  }},

  // الـ macros الهدف (يومي)
  caloriesTarget: { type: Number, default: 2000 },
  protein: { type: Number, default: 0 },
  carbs:   { type: Number, default: 0 },
  fats:    { type: Number, default: 0 },

  // بيانات الـ Diet Calculator — بتتخزن عشان ترجع لما نعمل edit
  calculatorData: {
    equation:      { type: String, default: 'katch' },
    firstName:     { type: String },
    lastName:      { type: String },
    gender:        { type: String },
    goal:          { type: String },
    weight:        { type: Number },
    height:        { type: Number },
    age:           { type: Number },
    activityLevel: { type: String },
    calorieDef:    { type: Number },
    bodyFat:       { type: Number },
    neck:          { type: Number },
    waist:         { type: Number },
  },

  // backward compat
  meals: [{
    type:      { type: String, enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'] },
    name:      { type: String },
    calories:  { type: Number },
    completed: { type: Boolean, default: false },
  }],
  rituals: [{
    label:     { type: String },
    completed: { type: Boolean, default: false },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);