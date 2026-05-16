const express = require('express');
const router = express.Router();
const {
  addDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getMyProfile,
  updateMyProfile,
} = require('../controllers/doctor.controller');
const { protect, isSuperAdmin, isDoctor } = require('../middleware/auth.middleware');

// Doctor Profile - قبل الـ isSuperAdmin
router.get('/me', protect, isDoctor, getMyProfile);
router.put('/me', protect, isDoctor, updateMyProfile);

// Super Admin فقط
router.use(protect, isSuperAdmin);
router.post('/', addDoctor);
router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);
router.put('/:id', updateDoctor);
router.delete('/:id', deleteDoctor);

module.exports = router;