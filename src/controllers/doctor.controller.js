const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ================================
// إضافة دكتور
// ================================
exports.addDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, phone } = req.body;

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
    const { name, phone, specialization } = req.body;
    const doctor = await User.findById(req.user.id);

    if (name) doctor.name = name;
    if (phone) doctor.phone = phone;
    if (specialization) doctor.specialization = specialization;

    await doctor.save();
    res.json({ message: 'Profile updated successfully', doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};