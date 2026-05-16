const Patient = require('../models/Patient');

// ================================
// الدكتور يضيف patient
// ================================
exports.addPatient = async (req, res) => {
  try {
    const {
      name, email, password, phone, age, gender,
      clientType, category, period, startDate,
      paymentMethod, initialPaymentAmount,
    } = req.body;

    const existing = await Patient.findOne({ email });
    if (existing)
      return res.status(400).json({ message: 'Email already exists' });

    const patient = await Patient.create({
      name, email, password, phone, age, gender,
      clientType, category, period, startDate,
      paymentMethod, initialPaymentAmount,
      doctor: req.user.id,
    });

    res.status(201).json({ message: 'Patient added successfully', patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// الدكتور يشوف الـ patients بتوعه
// ================================
exports.getMyPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ doctor: req.user.id })
      .select('-password');
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// السوبر ادمن يشوف كل الـ patients
// ================================
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .select('-password')
      .populate('doctor', 'name email specialization');
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// جيب patient بالـ ID
// ================================
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .select('-password')
      .populate('doctor', 'name email specialization');

    if (!patient)
      return res.status(404).json({ message: 'Patient not found' });

    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// تعديل patient
// ================================
exports.updatePatient = async (req, res) => {
  try {
    const {
      name, phone, age, gender,
      clientType, category, period, startDate,
      paymentMethod, initialPaymentAmount,
    } = req.body;

    const patient = await Patient.findById(req.params.id);
    if (!patient)
      return res.status(404).json({ message: 'Patient not found' });

    if (name) patient.name = name;
    if (phone) patient.phone = phone;
    if (age) patient.age = age;
    if (gender) patient.gender = gender;
    if (clientType) patient.clientType = clientType;
    if (category) patient.category = category;
    if (period) patient.period = period;
    if (startDate) patient.startDate = startDate;
    if (paymentMethod) patient.paymentMethod = paymentMethod;
    if (initialPaymentAmount) patient.initialPaymentAmount = initialPaymentAmount;

    await patient.save();
    res.json({ message: 'Patient updated successfully', patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// حذف patient
// ================================
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient)
      return res.status(404).json({ message: 'Patient not found' });

    await patient.deleteOne();
    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// الـ Patient يشوف بروفايله
// ================================
exports.getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id)
      .select('-password')
      .populate('doctor', 'name email specialization');

    if (!patient)
      return res.status(404).json({ message: 'Patient not found' });

    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};