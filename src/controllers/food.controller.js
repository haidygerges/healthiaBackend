const Food = require('../models/Food');

// GET /api/foods            → كل الأكل
// GET /api/foods?category=protein   → فلترة بالفئة
// GET /api/foods?search=أرز         → بحث بالاسم
exports.getFoods = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (search)   filter.name = { $regex: search, $options: 'i' };

    const foods = await Food.find(filter).sort({ category: 1, name: 1 });
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/foods/:id  → صنف واحد
exports.getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });
    res.json(food);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// (اختياري) POST /api/foods  → الدكتور يضيف صنف جديد
exports.addFood = async (req, res) => {
  try {
    const food = await Food.create(req.body);
    res.status(201).json({ message: 'Food added', food });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};