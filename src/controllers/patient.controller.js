const Patient   = require('../models/Patient');
const DailyLog  = require('../models/DailyLog');
const Plan      = require('../models/Plan');

// ── حساب الـ compliance لمريض واحد ──────────────────────────────
async function calcCompliance(patientId) {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // جيب الخطة الـ active — لو مفيش خطة نحسب من آخر 30 يوم
    const plan = await Plan.findOne({ patient: patientId, status: 'active' });

    let start;
    let daysToCount;

    if (plan && plan.startDate) {
      start = new Date(plan.startDate);
      start.setHours(0, 0, 0, 0);
      const daysPassed = Math.max(1, Math.floor((today - start) / 86400000));
      daysToCount = Math.min(daysPassed, 30);
    } else {
      // مفيش خطة — احسب من آخر 30 يوم
      start = new Date(today);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      daysToCount = 30;
    }

    // جيب كل الـ logs في الفترة دي
    const logs = await DailyLog.find({
      patient: patientId,
      $or: [
        { date: { $gte: start, $lte: today } },
        { createdAt: { $gte: start, $lte: today } },
      ],
    }).select('date createdAt');

    // عدّ الأيام الفريدة — استخدم date أو createdAt
    const uniqueDays = new Set(
      logs.map(l => {
        const d = new Date(l.date || l.createdAt);
        // استخدم local date مش UTC
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );

    if (uniqueDays.size === 0) return 0;
    const compliance = Math.round((uniqueDays.size / daysToCount) * 100);
    return Math.min(compliance, 100);
  } catch (e) {
    console.error('calcCompliance error:', e.message);
    return 0;
  }
}

// ================================
// الدكتور يضيف patient
// ================================
exports.addPatient = async (req, res) => {
  try {
    const {
      name, email, password, phone, age, gender,
      clientType, category, period, startDate,
      paymentMethod, initialPaymentAmount, weight, height,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await Patient.findOne({ email });
    if (existing)
      return res.status(400).json({ message: 'Email already exists' });

    // احفظ الباسورد الـ plain قبل الـ hash
    const plainPassword = password;

    const patient = await Patient.create({
      name, email, password, phone, age, gender,
      clientType, category, period, startDate,
      paymentMethod,
      initialPaymentAmount: initialPaymentAmount ? Number(initialPaymentAmount) : 0,
      weight: weight ? Number(weight) : 0,
      height: height ? Number(height) : 0,
      doctor: req.user.id,
    });

    // رجّع الـ patient مع الـ plain password عشان الدكتور يعطيه للـ patient
    res.status(201).json({
      message: 'Patient added successfully',
      patient: {
        ...patient.toObject(),
        password: plainPassword,   // ← plain password للعرض فقط
      },
    });
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

    // احسب الـ compliance لكل مريض وحدّثه في الـ DB
    const withCompliance = await Promise.all(
      patients.map(async (p) => {
        const compliance = await calcCompliance(p._id);
        if (p.adherence !== compliance) {
          await Patient.findByIdAndUpdate(p._id, { adherence: compliance });
        }
        const obj = p.toObject();
        obj.compliance = compliance;
        obj.adherence  = compliance;
        return obj;
      })
    );

    res.json(withCompliance);
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

    const compliance = await calcCompliance(patient._id);
    if (patient.adherence !== compliance) {
      await Patient.findByIdAndUpdate(patient._id, { adherence: compliance });
    }
    const obj = patient.toObject();
    obj.compliance = compliance;
    obj.adherence  = compliance;

    res.json(obj);
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
// الـ Patient يعدل بياناته
exports.updateMyProfile = async (req, res) => {
  try {
    const { name, phone, address, age, weight, height, goals, allergies, chronicDiseases, activityLevel } = req.body;

    const patient = await Patient.findById(req.user.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (name) patient.name = name;
    if (phone) patient.phone = phone;
    if (address) patient.address = address;
    if (age) patient.age = age;
    if (weight) patient.weight = weight;
    if (height) patient.height = height;
    if (goals) patient.goals = goals;
    if (allergies) patient.allergies = allergies;
    if (chronicDiseases) patient.chronicDiseases = chronicDiseases;
    if (activityLevel) patient.activityLevel = activityLevel;

    await patient.save();
    res.json({ message: 'Profile updated successfully', patient });
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
// ================================
// الدكتور يضيف note على patient
// ================================
exports.addNote = async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim())
      return res.status(400).json({ message: 'Note text is required' })

    const patient = await Patient.findById(req.params.id)
    if (!patient)
      return res.status(404).json({ message: 'Patient not found' })

    // تأكد إن الدكتور ده بتاع الـ patient
    if (patient.doctor.toString() !== req.user.id.toString())
      return res.status(403).json({ message: 'Not authorized' })

    const note = {
      id:        `n${Date.now()}`,
      text:      text.trim(),
      createdAt: new Date().toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      author: `Dr. ${req.user.name}`,
    }

    patient.notes.unshift(note)
    await patient.save({ validateBeforeSave: false })

    res.status(201).json({ message: 'Note added', note, notes: patient.notes })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ================================
// الدكتور يحذف note
// ================================
exports.deleteNote = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
    if (!patient)
      return res.status(404).json({ message: 'Patient not found' })

    if (patient.doctor.toString() !== req.user.id.toString())
      return res.status(403).json({ message: 'Not authorized' })

    patient.notes = patient.notes.filter(
      (n) => n.id !== req.params.noteId
    )
    await patient.save({ validateBeforeSave: false })

    res.json({ message: 'Note deleted', notes: patient.notes })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ================================
// الدكتور يعدّل note
// ================================
exports.editNote = async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim())
      return res.status(400).json({ message: 'Note text is required' })

    const patient = await Patient.findById(req.params.id)
    if (!patient)
      return res.status(404).json({ message: 'Patient not found' })

    if (patient.doctor.toString() !== req.user.id.toString())
      return res.status(403).json({ message: 'Not authorized' })

    const note = patient.notes.find(n => n.id === req.params.noteId)
    if (!note)
      return res.status(404).json({ message: 'Note not found' })

    note.text = text.trim()
    await patient.save({ validateBeforeSave: false })

    res.json({ message: 'Note updated', notes: patient.notes })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}