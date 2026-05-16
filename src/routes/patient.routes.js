const express = require('express');
const router = express.Router();
const {
  addPatient,
  getMyPatients,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getMyProfile,
} = require('../controllers/patient.controller');
const { 
  protect, 
  isSuperAdmin, 
  isDoctor, 
  isPatient 
} = require('../middleware/auth.middleware');

// السوبر ادمن - يشوف كل الـ patients
router.get('/all', protect, isSuperAdmin, getAllPatients);

// الـ Patient - يشوف بروفايله بس
router.get('/me', protect, isPatient, getMyProfile);

// الدكتور - يضيف ويشوف patients بتوعه
router.post('/', protect, isDoctor, addPatient);
router.get('/', protect, isDoctor, getMyPatients);
router.get('/:id', protect, isDoctor, getPatientById);
router.put('/:id', protect, isDoctor, updatePatient);
router.delete('/:id', protect, isDoctor, deletePatient);

module.exports = router;