const express = require('express');
const router  = express.Router();
const { getDoctorAnalytics, getPublicStats } = require('../controllers/analytics.controller');
const { protect, isDoctor } = require('../middleware/auth.middleware');

// ✅ Public — للـ Landing Page بدون auth
router.get('/public-stats', getPublicStats);

// Doctor only
router.get('/', protect, isDoctor, getDoctorAnalytics);

module.exports = router;