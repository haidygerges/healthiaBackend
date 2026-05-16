const express = require('express');
const router = express.Router();
const {
  addAppointment, getMyAppointments, getPatientAppointments,
  updateAppointment, deleteAppointment, getMyAppointments_Patient,
} = require('../controllers/appointment.controller');
const { protect, isDoctor, isPatient } = require('../middleware/auth.middleware');

router.post('/', protect, isDoctor, addAppointment);
router.get('/', protect, isDoctor, getMyAppointments);
router.get('/my', protect, isPatient, getMyAppointments_Patient);
router.get('/patient/:patientId', protect, isDoctor, getPatientAppointments);
router.put('/:id', protect, isDoctor, updateAppointment);
router.delete('/:id', protect, isDoctor, deleteAppointment);

module.exports = router;