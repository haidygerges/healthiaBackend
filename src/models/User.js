const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  role:           { type: String, enum: ['superadmin', 'doctor', 'patient'], default: 'doctor' },
  specialization: { type: String },
  phone:          { type: String },
  profileImage:   { type: String },
  // ✅ حقول جديدة
  bio:            { type: String },
  location:       { type: String },
  languages:      { type: String },
  // ✅ Professional Details
  licenseId:      { type: String },
  licenseExpiry:  { type: String },
  specialties:    [{ type: String }],
  education: [{
    school: { type: String },
    degree: { type: String },
    years:  { type: String },
  }],
  // ✅ Notification Preferences
  notificationPreferences: {
    newAppointments: { type: Boolean, default: true  },
    patientMessages: { type: Boolean, default: true  },
    systemUpdates:   { type: Boolean, default: false },
  },
  resetPasswordOTP:     { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);
