const Patient     = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Plan        = require('../models/Plan');
const DailyLog    = require('../models/DailyLog');
const mongoose    = require('mongoose');

// ── Public stats for Landing Page (no auth) ──────────
exports.getPublicStats = async (req, res) => {
  try {
    const Patient     = require("../models/Patient");
    const User        = require("../models/User");
    const Plan        = require("../models/Plan");
    const Appointment = require("../models/Appointment");

    const [totalPatients, totalDoctors, totalPlans, totalAppointments] = await Promise.all([
      Patient.countDocuments(),
      User.countDocuments({ role: "doctor" }),
      Plan.countDocuments(),
      Appointment.countDocuments(),
    ]);

    res.json({ totalPatients, totalDoctors, totalPlans, totalAppointments, satisfactionRate: 98 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDoctorAnalytics = async (req, res) => {
  try {
    const doctorId    = req.user.id;
    const doctorObjId = mongoose.Types.ObjectId.createFromHexString(doctorId);

    // ── أرقام أساسية ─────────────────────────────
    const totalPatients         = await Patient.countDocuments({ doctor: doctorId });
    const totalAppointments     = await Appointment.countDocuments({ doctor: doctorId });
    const completedAppointments = await Appointment.countDocuments({ doctor: doctorId, status: 'completed' });
    const cancelledAppointments = await Appointment.countDocuments({ doctor: doctorId, status: 'cancelled' });
    const scheduledAppointments = await Appointment.countDocuments({ doctor: doctorId, status: 'scheduled' });
    const activePlans           = await Plan.countDocuments({ doctor: doctorId, status: 'active' });

    // ── Patients بالشهر (آخر 6 شهور) ─────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const patientsByMonth = await Patient.aggregate([
      { $match: { doctor: doctorObjId, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // ── توزيع الـ clientType ─────────────────────
    const clientTypeStats = await Patient.aggregate([
      { $match: { doctor: doctorObjId } },
      { $group: { _id: '$clientType', count: { $sum: 1 } } },
    ]);

    // ── توزيع الـ category ───────────────────────
    const categoryStats = await Patient.aggregate([
      { $match: { doctor: doctorObjId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    // ── Appointments بالشهر ─────────────────────
    const appointmentsByMonth = await Appointment.aggregate([
      { $match: { doctor: doctorObjId, date: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // ── Patients محتاجين attention ─────────────
    const patientsAtRisk = await Patient.find({
      doctor: doctorId,
      $or: [
        { weight: { $eq: 0 } }, { weight: { $exists: false } },
        { height: { $eq: 0 } }, { height: { $exists: false } },
      ],
    }).select('name patientId weight height').limit(5);

    // ── ✅ كل المرضى للحسابات ─────────────────────
    const allPatients = await Patient.find({ doctor: doctorId }).select('weight height goals period');

    // ── ✅ متوسط BMI + توزيع الـ BMI ──────────────
    const patientsWithBMI = allPatients.filter(p => p.weight > 0 && p.height > 0);
    const avgBMI = patientsWithBMI.length > 0
      ? +(patientsWithBMI.reduce((sum, p) => {
          return sum + (p.weight / Math.pow(p.height / 100, 2));
        }, 0) / patientsWithBMI.length).toFixed(1)
      : 0;

    const bmiDistribution = { underweight: 0, normal: 0, overweight: 0, obese: 0 };
    patientsWithBMI.forEach(p => {
      const bmi = p.weight / Math.pow(p.height / 100, 2);
      if      (bmi < 18.5) bmiDistribution.underweight++;
      else if (bmi < 25)   bmiDistribution.normal++;
      else if (bmi < 30)   bmiDistribution.overweight++;
      else                 bmiDistribution.obese++;
    });

    // ── ✅ توزيع الـ Goals ────────────────────────
    // من patient.goals + من calculatorData في الـ Plans
    const goalsMap = {};
    allPatients.forEach(p => {
      (p.goals || []).forEach(g => {
        goalsMap[g] = (goalsMap[g] || 0) + 1;
      });
    });

    // لو patient.goals فاضية، نجيب من الـ Plan calculatorData
    const GOAL_LABELS = { loss: 'Weight Loss', gain: 'Weight Gain', maintain: 'Maintain Weight' };
    const allPlans = await Plan.find({ doctor: doctorId }).select('patient calculatorData');
    const patientGoalFromPlan = {};
    allPlans.forEach(plan => {
      const goalKey = plan.calculatorData?.goal;
      if (goalKey && GOAL_LABELS[goalKey]) {
        patientGoalFromPlan[plan.patient?.toString()] = GOAL_LABELS[goalKey];
      }
    });
    // نضيف بس للمرضى اللي ملهومش goals مسجلة
    Object.values(patientGoalFromPlan).forEach(goalLabel => {
      goalsMap[goalLabel] = (goalsMap[goalLabel] || 0) + 1;
    });

    const goalsStats = Object.entries(goalsMap)
      .map(([goal, count]) => ({ goal, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── ✅ نسبة المرضى اللي عندهم خطة ────────────
    const patientsWithPlan      = await Plan.distinct('patient', { doctor: doctorId });
    const patientsWithPlanCount = patientsWithPlan.length;
    const patientsWithoutPlan   = Math.max(0, totalPatients - patientsWithPlanCount);

    // ── ✅ توزيع البرامج (Period) ─────────────────
    const periodStats = await Patient.aggregate([
      { $match: { doctor: doctorObjId, period: { $exists: true, $ne: null } } },
      { $group: { _id: '$period', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── ✅ مرضى جدد هذا الشهر ─────────────────────
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const newPatientsThisMonth = await Patient.countDocuments({
      doctor: doctorId, createdAt: { $gte: monthStart },
    });

    res.json({
      totalPatients,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      scheduledAppointments,
      activePlans,
      patientsByMonth,
      appointmentsByMonth,
      clientTypeStats,
      categoryStats,
      patientsAtRisk,
      avgBMI,
      bmiDistribution,
      goalsStats,
      patientsWithPlanCount,
      patientsWithoutPlan,
      periodStats,
      newPatientsThisMonth,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};