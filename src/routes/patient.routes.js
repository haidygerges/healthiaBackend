const express = require('express');
const router  = express.Router();
const {
  addPatient, getMyPatients, getAllPatients,
  getPatientById, updatePatient, deletePatient,
  getMyProfile, updateMyProfile,
  addNote, deleteNote, editNote,
} = require('../controllers/patient.controller');
const { protect, isSuperAdmin, isDoctor, isPatient, isDoctorOrSuperAdmin } = require('../middleware/auth.middleware');

// ─── Super Admin ──────────────────────────────
router.get('/all', protect, isSuperAdmin, getAllPatients);

// ─── Patient (بروفايل نفسه) ──────────────────
router.get('/me',        protect, isPatient, getMyProfile);
router.put('/me/update', protect, isPatient, updateMyProfile);

// ─── Doctor ──────────────────────────────────
router.post('/',                        protect, isDoctor, addPatient);
router.get('/',                         protect, isDoctor, getMyPatients);
router.get('/:id',                      protect, isDoctor, getPatientById);
router.put('/:id',                      protect, isDoctor, updatePatient);
router.delete('/:id',                   protect, isDoctorOrSuperAdmin, deletePatient);
router.post('/:id/notes',               protect, isDoctor, addNote);
router.delete('/:id/notes/:noteId',     protect, isDoctor, deleteNote);
router.put('/:id/notes/:noteId',        protect, isDoctor, editNote);

module.exports = router;
