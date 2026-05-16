const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema({
  // بيانات اللوجن
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female'] },
  profileImage: { type: String },

  // من فورم Add New Patient
  patientId: { type: String, unique: true },       // VTA-2024-001
  clientType: { type: String, enum: ['online', 'offline'] },
  category: { type: String },                       // Nutrition & Wellness
  period: { type: String },                         // 3 Months Program
  startDate: { type: Date },
  paymentMethod: { type: String },                  // Credit/Debit Card
  initialPaymentAmount: { type: Number },

  // الدكتور اللي أضافه
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// توليد الـ patientId تلقائي + تشفير الباسورد
patientSchema.pre('save', async function () {
  if (!this.patientId) {
    const count = await mongoose.model('Patient').countDocuments();
    this.patientId = `VTA-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
  }
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('Patient', patientSchema);