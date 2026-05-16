const Plan = require('../models/Plan');

// الدكتور يضيف plan للـ patient
exports.addPlan = async (req, res) => {
  try {
    const {
      patient, title, category, description,
      goals, duration, startDate, endDate, notes,
    } = req.body;

    const plan = await Plan.create({
      patient,
      doctor: req.user.id,
      title, category, description,
      goals, duration, startDate, endDate, notes,
    });

    res.status(201).json({ message: 'Plan added successfully', plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// جيب كل plans بتاعة patient معين
exports.getPatientPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ patient: req.params.patientId })
      .populate('doctor', 'name specialization');
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

// تعديل plan
exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan)
      return res.status(404).json({ message: 'Plan not found' });

    const fields = [
      'title', 'category', 'description', 'goals',
      'duration', 'startDate', 'endDate', 'status', 'notes',
    ];
    fields.forEach(f => { if (req.body[f] !== undefined) plan[f] = req.body[f]; });

    await plan.save();
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

// الـ patient يشوف plans بتاعته
exports.getMyPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ patient: req.user.id })
      .populate('doctor', 'name specialization');
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};