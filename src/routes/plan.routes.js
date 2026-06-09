const express = require('express');
const router  = express.Router();
const {
  addPlan, getPatientPlans, getPlanById,
  updatePlan, deletePlan, getMyPlans,
  updateMealStatus, updateRitualStatus, markDayCompleted,
} = require('../controllers/plan.controller');
const { protect, isDoctor, isPatient } = require('../middleware/auth.middleware');

router.post('/',                    protect, isDoctor,  addPlan);
router.get('/my',                   protect, isPatient, getMyPlans);
router.get('/patient/:patientId',   protect, isDoctor,  getPatientPlans);
router.get('/:id',                  protect,            getPlanById);
router.put('/:id',                  protect, isDoctor,  updatePlan);
router.delete('/:id',               protect, isDoctor,  deletePlan);
router.patch('/:id/meal-status',    protect, isPatient, updateMealStatus);
router.patch('/:id/ritual-status',  protect, isPatient, updateRitualStatus);
router.patch('/:id/day-completed',  protect, isPatient, markDayCompleted); // ✅ جديد

module.exports = router;