const User = require('../models/User');
const Patient = require('../models/Patient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // دور في الـ Users الأول (superadmin + doctor)
    let user = await User.findOne({ email });
    let isPatient = false;

    // لو مش لاقيه دور في الـ Patients
    if (!user) {
      user = await Patient.findOne({ email });
      isPatient = true;
    }

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: isPatient ? 'patient' : user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: isPatient ? 'patient' : user.role,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// Forgot Password - بيبعت OTP
// ================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) 
      return res.status(404).json({ message: 'Email not found' });

    // توليد OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 دقايق
    await user.save();

    // إرسال الإيميل
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Healthia" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Healthia - Reset Password OTP',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto">
          <h2 style="color:#1a7a4a">Reset Your Password</h2>
          <p>Your OTP code is:</p>
          <h1 style="letter-spacing:8px;color:#1a7a4a">${otp}</h1>
          <p style="color:#888">This code expires in <strong>10 minutes</strong>.</p>
        </div>
      `,
    });

    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// Verify OTP
// ================================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) 
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// Reset Password
// ================================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) 
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// Get current user (من الـ token)
// ================================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};