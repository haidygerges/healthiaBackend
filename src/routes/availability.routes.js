const express = require('express');
const router  = express.Router();
const {
  getMyAvailability,
  updateMyAvailability,
  getAvailableSlots,
  getBookedSlots,
} = require('../controllers/availability.controller');
const { protect, isDoctor, isPatient } = require('../middleware/auth.middleware');

// الدكتور
router.get('/',          protect, isDoctor,  getMyAvailability);
router.put('/',          protect, isDoctor,  updateMyAvailability);
router.get('/booked',    protect, isDoctor,  getBookedSlots);

// المريض
router.get('/slots',     protect, isPatient, getAvailableSlots);

module.exports = router;