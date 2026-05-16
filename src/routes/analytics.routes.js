const express = require('express');
const router = express.Router();
const { getDoctorAnalytics } = require('../controllers/analytics.controller');
const { protect, isDoctor } = require('../middleware/auth.middleware');

router.get('/', protect, isDoctor, getDoctorAnalytics);

module.exports = router;