const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');

exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
      return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // دور في الـ Users الأول
    let user = await User.findById(decoded.id).select('-password');
    
    // لو مش لاقيه دور في الـ Patients
    if (!user) {
      user = await Patient.findById(decoded.id).select('-password');
      if (user) user.role = 'patient';
    }

    if (!user)
      return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
// السوبر ادمن بس
exports.isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ message: 'Super admins only' });
  next();
};

// الدكتور بس
exports.isDoctor = (req, res, next) => {
  if (req.user.role !== 'doctor')
    return res.status(403).json({ message: 'Doctors only' });
  next();
};

// الباشيينت بس
exports.isPatient = (req, res, next) => {
  if (req.user.role !== 'patient')
    return res.status(403).json({ message: 'Patients only' });
  next();
};

// الدكتور أو السوبر أدمن
exports.isDoctorOrSuperAdmin = (req, res, next) => {
  if (req.user.role === 'doctor' || req.user.role === 'superadmin') {
    return next();
  }
  return res.status(403).json({ message: 'Doctors and Super Admins only' });
};
