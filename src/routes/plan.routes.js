const express = require('express');
const router = express.Router();
const {
  addPlan, getPatientPlans, getPlanById,
  updatePlan, deletePlan, getMyPlans,
} = require('../controllers/plan.controller');
const { protect, isDoctor, isPatient } = require('../middleware/auth.middleware');

router.post('/', protect, isDoctor, addPlan);
router.get('/my', protect, isPatient, getMyPlans);
router.get('/patient/:patientId', protect, isDoctor, getPatientPlans);
router.get('/:id', protect, getPlanById);
router.put('/:id', protect, isDoctor, updatePlan);
router.delete('/:id', protect, isDoctor, deletePlan);

module.exports = router;