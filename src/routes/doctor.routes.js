const express = require('express');
const router  = express.Router();
const {
  addDoctor, getAllDoctors, getDoctorById,
  updateDoctor, deleteDoctor,
  getMyProfile, updateMyProfile, changePassword,
  updateNotificationPreferences,
} = require('../controllers/doctor.controller');
const { protect, isSuperAdmin, isDoctor } = require('../middleware/auth.middleware');

// Doctor Profile
router.get('/me',                   protect, isDoctor, getMyProfile);
router.put('/me',                   protect, isDoctor, updateMyProfile);
router.put('/me/password',          protect, isDoctor, changePassword);
router.put('/me/notifications',     protect, isDoctor, updateNotificationPreferences); // ✅ جديد

// Super Admin فقط
router.use(protect, isSuperAdmin);
router.post('/',    addDoctor);
router.get('/',     getAllDoctors);
router.get('/:id',  getDoctorById);
router.put('/:id',  updateDoctor);
router.delete('/:id', deleteDoctor);

module.exports = router;