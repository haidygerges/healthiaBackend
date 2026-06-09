const express = require('express');
const router = express.Router();
const { addLog, getMyLogs, getPatientLogs, addLogForPatient } = require('../controllers/dailyLog.controller');
const { protect, isPatient, isDoctor } = require('../middleware/auth.middleware');

router.post('/', protect, isPatient, addLog);
router.get('/my', protect, isPatient, getMyLogs);
router.get('/patient/:patientId', protect, isDoctor, getPatientLogs);
router.post('/patient/:patientId', protect, isDoctor, addLogForPatient);

module.exports = router;