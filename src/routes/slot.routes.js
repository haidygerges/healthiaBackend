const express = require('express');
const router  = express.Router();
const {
  addSlots, deleteSlot, getMySlots, getAvailableSlots, bookSlot,
} = require('../controllers/slot.controller');
const { protect, isDoctor, isPatient } = require('../middleware/auth.middleware');

// الدكتور
router.post('/',          protect, isDoctor,  addSlots);
router.get('/',           protect, isDoctor,  getMySlots);
router.delete('/:id',     protect, isDoctor,  deleteSlot);

// المريض
router.get('/available',  protect, isPatient, getAvailableSlots);
router.post('/book',      protect, isPatient, bookSlot);

module.exports = router;