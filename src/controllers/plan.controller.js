const Plan    = require('../models/Plan');
const Patient = require('../models/Patient');
const Food    = require('../models/Food');

// ─── goal label map ───
const GOAL_LABELS = {
  loss:     'Weight Loss',
  gain:     'Weight Gain',
  maintain: 'Maintain Weight',
};

// ─── helper: تعبئة ماكروز الوجبات الناقصة من جدول الأكل (auto-heal للخطط القديمة) ───
async function backfillMealMacros(days) {
  if (!Array.isArray(days)) return;
  for (const d of days) {
    if (!d || !Array.isArray(d.meals)) continue;
    for (const m of d.meals) {
      const hasMacros = (m.protein || 0) + (m.carbs || 0) + (m.fats || 0) > 0;
      if (hasMacros || !m.name) continue;
      const food = await Food.findOne({ name: m.name });
      if (food) {
        m.protein = food.protein || 0;
        m.carbs   = food.carbs   || 0;
        m.fats    = food.fat     || 0;
      }
    }
  }
}


// ─── helper: بداية الأسبوع الحالي (الأحد) ───
function getCurrentWeekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// ─── helper: reset الـ completed لو أسبوع جديد ───
function resetIfNewWeek(plan) {
  const currentWeekStart = getCurrentWeekStart();
  const planWeekStart    = plan.weekStartDate ? new Date(plan.weekStartDate) : null;

  // لو الـ plan من أسبوع قديم → reset الـ completed
  if (!planWeekStart || planWeekStart < currentWeekStart) {
    plan.days.forEach(d => {
      d.completed = false;
      d.meals.forEach(m => { m.completed = false; });
    });
    plan.weekStartDate = currentWeekStart;
    return true; // اتغير
  }
  return false;
}

// الدكتور يضيف plan للـ patient
exports.addPlan = async (req, res) => {
  try {
    const {
      patient, title, category, description,
      goals, duration, startDate, endDate, notes,
      days, meals, caloriesTarget, protein, carbs, fats,
    } = req.body;

    await backfillMealMacros(days); // ✅ املأ الماكروز الناقصة

    const plan = await Plan.create({
      patient,
      doctor:         req.user.id,
      title, category, description,
      goals, duration, startDate, endDate, notes,
      days, meals,
      caloriesTarget, protein, carbs, fats,
      calculatorData: req.body.calculatorData,
      weekStartDate:  getCurrentWeekStart(),
    });

    // ✅ لو فيه goal في الـ calculatorData → حدّث patient.goals
    const goalKey = req.body.calculatorData?.goal;
    if (goalKey && GOAL_LABELS[goalKey]) {
      await Patient.findByIdAndUpdate(patient, {
        goals: [GOAL_LABELS[goalKey]],
      });
    }

    res.status(201).json({ message: 'Plan added successfully', plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// جيب كل plans بتاعة patient معين (دكتور)
exports.getPatientPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ patient: req.params.patientId })
      .populate('doctor', 'name specialization')
      .sort({ updatedAt: -1 }); // ✅ الأحدث الأول
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// جيب plan بالـ ID
exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id)
      .populate('doctor', 'name specialization')
      .populate('patient', 'name email');

    if (!plan)
      return res.status(404).json({ message: 'Plan not found' });

    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// تعديل plan (الدكتور) — لما يعدّل نعمل reset للأسبوع الجديد
exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan)
      return res.status(404).json({ message: 'Plan not found' });

    const fields = [
      'title', 'category', 'description', 'goals',
      'duration', 'startDate', 'endDate', 'status', 'notes',
      'days', 'meals', 'caloriesTarget', 'protein', 'carbs', 'fats',
      'calculatorData',
    ];
    fields.forEach(f => { if (req.body[f] !== undefined) plan[f] = req.body[f]; });

    await backfillMealMacros(plan.days); // ✅ املأ الماكروز الناقصة

    // ✅ لما الدكتور يعدّل الخطة → نعمل reset للـ completed للأسبوع الجديد
    plan.weekStartDate = getCurrentWeekStart();
    plan.days.forEach(d => {
      d.completed = false;
      d.meals.forEach(m => { m.completed = false; });
    });

    await plan.save();

    // ✅ لو فيه goal في الـ calculatorData → حدّث patient.goals
    const goalKey = req.body.calculatorData?.goal;
    if (goalKey && GOAL_LABELS[goalKey]) {
      await Patient.findByIdAndUpdate(plan.patient, {
        goals: [GOAL_LABELS[goalKey]],
      });
    }

    res.json({ message: 'Plan updated successfully', plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// حذف plan
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan)
      return res.status(404).json({ message: 'Plan not found' });

    await plan.deleteOne();
    res.json({ message: 'Plan deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ المريض يشوف plans بتاعته — مع auto-reset لو أسبوع جديد
exports.getMyPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ patient: req.user.id })
      .populate('doctor', 'name specialization')
      .sort({ updatedAt: -1 }); // ✅ الأحدث (آخر تعديل/إضافة) الأول

    // نفحص كل plan لو محتاج reset
    const savePromises = [];
    plans.forEach(plan => {
      const changed = resetIfNewWeek(plan);
      if (changed) savePromises.push(plan.save());
    });

    // نحفظ اللي اتغير في الـ background
    if (savePromises.length > 0) {
      await Promise.all(savePromises);
    }

    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// المريض يعلّم اليوم كله كـ completed
exports.markDayCompleted = async (req, res) => {
  try {
    const { day, completed } = req.body;
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const dayEntry = plan.days.find(d => d.day === day);
    if (dayEntry) {
      dayEntry.completed = completed;
      dayEntry.meals.forEach(m => { m.completed = completed; });
    }
    await plan.save();
    res.json({ message: 'Updated successfully', plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// المريض يعلّم وجبة معينة
exports.updateMealStatus = async (req, res) => {
  try {
    const { mealId, completed } = req.body;
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    let found = false;
    for (const d of plan.days) {
      const meal = d.meals.id(mealId);
      if (meal) { meal.completed = completed; found = true; break; }
    }
    if (!found) {
      const meal = plan.meals.id(mealId);
      if (meal) meal.completed = completed;
    }

    // لو كل وجبات اليوم اتعلمت → اليوم completed تلقائي
    for (const d of plan.days) {
      if (d.meals.length > 0 && d.meals.every(m => m.completed)) {
        d.completed = true;
      }
    }

    await plan.save();
    res.json({ message: 'Updated successfully', plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRitualStatus = async (req, res) => {
  try {
    const { ritualId, completed } = req.body;
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const ritual = plan.rituals.id(ritualId);
    if (ritual) ritual.completed = completed;
    await plan.save();
    res.json({ message: 'Updated successfully', plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
