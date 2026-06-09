const express = require('express');
const router  = express.Router();
const { getFoods, getFoodById, addFood } = require('../controllers/food.controller');
const { protect, isDoctor } = require('../middleware/auth.middleware');

// قراءة الأكل متاحة لأي حد (الدكتور والمريض) — خليناها مفتوحة عشان تشتغل وانتي بتطوري.
// لو حابة تأمنيها بعدين ضيفي protect:  router.get('/', protect, getFoods);
router.get('/',        getFoods);
router.get('/:id',     getFoodById);

// إضافة صنف جديد للدكتور بس (اختياري)
router.post('/',       protect, isDoctor, addFood);

module.exports = router;