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
  address: { type: String },

  // من فورم Add New Patient
  patientId: { type: String, unique: true },
  clientType: { type: String, enum: ['online', 'offline'] },
  category: { type: String },
  period: { type: String },
  startDate: { type: Date },
  paymentMethod: { type: String },
  initialPaymentAmount: { type: Number },

  // بيانات طبية
  weight: { type: Number, default: 0 },
  targetWeight: { type: Number, default: 0 },  // ✅ جديد — الهدف من الوزن
  height: { type: Number, default: 0 },
  bmi: { type: Number, default: 0 },
  goals: [{ type: String }],
  allergies: [{ type: String }],
  chronicDiseases: [{ type: String }],
  activityLevel: { type: String },

  // الدكتور بتاعه
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Clinical Notes من الدكتور
  notes: [{
    id:        { type: String },
    text:      { type: String },
    createdAt: { type: String },
    author:    { type: String },
  }],

  // نسبة الالتزام
  adherence: { type: Number, default: 0 },

  // OTP لإعادة تعيين كلمة المرور ← ده كان ناقص
  resetPasswordOTP:     { type: String },
  resetPasswordExpires: { type: Date },

}, { timestamps: true });

patientSchema.pre('save', async function () {
  // حساب الـ BMI تلقائي
  if (this.weight && this.height) {
    const heightInMeters = this.height / 100;
    this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
  // توليد الـ patientId — unique دايماً حتى لو في مرضى اتحذفوا
  if (!this.patientId) {
    let unique = false;
    let attempt = 0;
    while (!unique) {
      // جيب أعلى رقم موجود وزوّد عليه
      const last = await mongoose.model('Patient')
        .findOne({}, { patientId: 1 })
        .sort({ patientId: -1 });
      let nextNum = 1;
      if (last && last.patientId) {
        const parts = last.patientId.split('-');
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1 + attempt;
      }
      const candidate = `VTA-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
      const exists = await mongoose.model('Patient').findOne({ patientId: candidate });
      if (!exists) {
        this.patientId = candidate;
        unique = true;
      }
      attempt++;
    }
  }
  // تشفير الباسورد
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('Patient', patientSchema);