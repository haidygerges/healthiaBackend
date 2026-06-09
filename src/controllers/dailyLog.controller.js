const DailyLog = require('../models/DailyLog');
const Patient  = require('../models/Patient');
const Plan     = require('../models/Plan');

async function updateCompliance(patientId) {
  try {
    const today = new Date(); today.setHours(23,59,59,999);
    const plan = await Plan.findOne({ patient: patientId, status: 'active' });
    let start, daysToCount;
    if (plan && plan.startDate) {
      start = new Date(plan.startDate); start.setHours(0,0,0,0);
      const daysPassed = Math.max(1, Math.floor((today - start) / 86400000));
      daysToCount = Math.min(daysPassed, 30);
    } else {
      start = new Date(today); start.setDate(start.getDate() - 29); start.setHours(0,0,0,0);
      daysToCount = 30;
    }
    const logs = await DailyLog.find({
      patient: patientId,
      $or: [{ date: { $gte: start, $lte: today } }, { createdAt: { $gte: start, $lte: today } }],
    }).select('date createdAt');
    const uniqueDays = new Set(logs.map(l => {
      const d = new Date(l.date || l.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));
    if (uniqueDays.size === 0) return;
    const compliance = Math.min(Math.round((uniqueDays.size / daysToCount) * 100), 100);
    await Patient.findByIdAndUpdate(patientId, { adherence: compliance });
  } catch(e) { console.error('updateCompliance error:', e.message); }
}

// الـ patient يضيف log يومي
exports.addLog = async (req, res) => {
  try {
    const { water, sleep, mood, exercise, weight, calories, notes } = req.body;
    const log = await DailyLog.create({
      patient: req.user.id,
      water, sleep, mood, exercise, weight, calories, notes,
    });
    // حدّث الـ compliance تلقائياً
    updateCompliance(req.user.id).catch(() => {})
    res.status(201).json({ message: 'Log added successfully', log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// جيب logs بتاعة الـ patient
exports.getMyLogs = async (req, res) => {
  try {
    const logs = await DailyLog.find({ patient: req.user.id })
      .sort({ date: -1 })
      .limit(30);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// الدكتور يضيف log نيابة عن patient معين
exports.addLogForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { water, sleep, mood, exercise, weight, calories, notes } = req.body;
    const log = await DailyLog.create({
      patient: patientId,
      water, sleep, mood, exercise, weight, calories, notes,
    });
    // حدّث الـ compliance تلقائياً
    updateCompliance(patientId).catch(() => {});
    res.status(201).json({ message: 'Log added successfully', log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// الدكتور يشوف logs بتاعة patient معين
exports.getPatientLogs = async (req, res) => {
  try {
    const logs = await DailyLog.find({ patient: req.params.patientId })
      .sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};