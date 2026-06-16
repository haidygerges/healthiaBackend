const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ================================
// إضافة دكتور
// ================================
exports.addDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, phone } = req.body;

    // ✅ التحقق من الباسورد
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const strongPassword = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!strongPassword.test(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters with letters, numbers and symbols' 
      });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: 'Email already exists' });

    const doctor = await User.create({
      name,
      email,
      password,
      specialization,
      phone,
      role: 'doctor',
    });

    res.status(201).json({ message: 'Doctor added successfully', doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// جيب كل الدكاترة
// ================================
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// جيب دكتور بالـ ID
// ================================
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id).select('-password');
    if (!doctor)
      return res.status(404).json({ message: 'Doctor not found' });

    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// تعديل دكتور
// ================================
exports.updateDoctor = async (req, res) => {
  try {
    const { name, email, specialization, phone, password } = req.body;

    const doctor = await User.findById(req.params.id);
    if (!doctor)
      return res.status(404).json({ message: 'Doctor not found' });

    // تحديث البيانات
    if (name) doctor.name = name;
    if (email) doctor.email = email;
    if (specialization) doctor.specialization = specialization;
    if (phone) doctor.phone = phone;
    if (password) doctor.password = password; // الـ pre save هيعمل hash تلقائي

    await doctor.save();

    res.json({ message: 'Doctor updated successfully', doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// حذف دكتور
// ================================
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor)
      return res.status(404).json({ message: 'Doctor not found' });

    await doctor.deleteOne();
    res.json({ message: 'Doctor deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// الدكتور يشوف بروفايله
exports.getMyProfile = async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id).select('-password');
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// الدكتور يعدل بروفايله
exports.updateMyProfile = async (req, res) => {
  try {
    const { name, phone, specialization, bio, location, languages, email, licenseId, licenseExpiry, specialties, education } = req.body;
    const doctor = await User.findById(req.user.id);

    if (name)           doctor.name           = name;
    if (phone)          doctor.phone          = phone;
    if (specialization) doctor.specialization = specialization;
    if (bio  !== undefined) doctor.bio        = bio;
    if (location !== undefined) doctor.location  = location;
    if (languages !== undefined) doctor.languages = languages;
    if (email)          doctor.email          = email;
    if (licenseId  !== undefined) doctor.licenseId     = licenseId;
    if (licenseExpiry !== undefined) doctor.licenseExpiry = licenseExpiry;
    if (specialties !== undefined) doctor.specialties  = specialties;
    if (education   !== undefined) doctor.education    = education;

    await doctor.save({ validateBeforeSave: false });
    const updated = await User.findById(req.user.id).select('-password');
    res.json({ message: 'Profile updated successfully', doctor: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ الدكتور يغير الباسورد
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both passwords are required' });

    const strongPassword = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!strongPassword.test(newPassword))
      return res.status(400).json({ message: 'Password must be at least 8 characters with letters, numbers and symbols' });

    const bcrypt = require('bcryptjs');
    const doctor = await User.findById(req.user.id);
    const match  = await bcrypt.compare(currentPassword, doctor.password);
    if (!match)
      return res.status(400).json({ message: 'Current password is incorrect' });

    doctor.password = newPassword; // pre-save هيعمل hash
    await doctor.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ✅ Update Notification Preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { newAppointments, patientMessages, systemUpdates } = req.body;
    const doctor = await User.findById(req.user.id);

    doctor.notificationPreferences = {
      newAppointments: newAppointments ?? doctor.notificationPreferences?.newAppointments ?? true,
      patientMessages: patientMessages ?? doctor.notificationPreferences?.patientMessages ?? true,
      systemUpdates:   systemUpdates   ?? doctor.notificationPreferences?.systemUpdates   ?? false,
    };

    await doctor.save({ validateBeforeSave: false });
    res.json({ message: 'Preferences updated', notificationPreferences: doctor.notificationPreferences });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
