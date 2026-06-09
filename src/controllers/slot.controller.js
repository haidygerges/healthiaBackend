const DoctorSlot  = require('../models/DoctorSlot');
const Patient     = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { createNotification } = require('./notification.controller');

// ── الدكتور يضيف slots في يوم معين ──────────────────────────
exports.addSlots = async (req, res) => {
  try {
    const { date, times } = req.body;
    // date: "YYYY-MM-DD", times: ["09:00","10:00","11:00"]
    if (!date || !Array.isArray(times) || times.length === 0)
      return res.status(400).json({ message: 'date and times[] are required' });

    const results = [];
    for (const time of times) {
      try {
        const slot = await DoctorSlot.findOneAndUpdate(
          { doctor: req.user.id, date, time },
          { doctor: req.user.id, date, time, isBooked: false, bookedBy: null },
          { upsert: true, new: true }
        );
        results.push(slot);
      } catch (e) {
        // تجاهل duplicate
      }
    }
    res.status(201).json({ message: 'Slots added', slots: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── الدكتور يحذف slot ──────────────────────────────────────
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await DoctorSlot.findOne({ _id: req.params.id, doctor: req.user.id });
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    if (slot.isBooked) return res.status(400).json({ message: 'Cannot delete a booked slot' });
    await slot.deleteOne();
    res.json({ message: 'Slot deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── الدكتور يشوف slots بتاعته في يوم معين ────────────────────
exports.getMySlots = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { doctor: req.user.id };
    if (date) filter.date = date;
    const slots = await DoctorSlot.find(filter)
      .populate('bookedBy', 'name')
      .sort({ date: 1, time: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── المريض يشوف الـ slots المتاحة لدكتوره في يوم معين ────────
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'date is required' });

    const patient = await Patient.findById(req.user.id);
    if (!patient || !patient.doctor)
      return res.status(400).json({ message: 'No doctor assigned' });

    const slots = await DoctorSlot.find({
      doctor:   patient.doctor,
      date,
      isBooked: false,
    }).sort({ time: 1 });

    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── المريض يحجز slot ──────────────────────────────────────────
exports.bookSlot = async (req, res) => {
  try {
    const { slotId, type, notes } = req.body;
    if (!slotId) return res.status(400).json({ message: 'slotId is required' });

    const patient = await Patient.findById(req.user.id);
    if (!patient || !patient.doctor)
      return res.status(400).json({ message: 'No doctor assigned' });

    const slot = await DoctorSlot.findOne({ _id: slotId, doctor: patient.doctor });
    if (!slot)      return res.status(404).json({ message: 'Slot not found' });
    if (slot.isBooked) return res.status(400).json({ message: 'This slot is already booked' });

    // التأكد إن المريض مش عنده حجز في نفس اليوم ده
    const existing = await Appointment.findOne({
      patient: req.user.id,
      status:  { $ne: 'cancelled' },
    }).where('date').gte(new Date(slot.date + 'T00:00:00')).lte(new Date(slot.date + 'T23:59:59'));

    if (existing)
      return res.status(400).json({ message: 'You already have an appointment on this day' });

    // حجز الـ slot
    slot.isBooked = true;
    slot.bookedBy = req.user.id;
    await slot.save();

    // إنشاء appointment
    const [y, m, d] = slot.date.split('-').map(Number);
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor:  patient.doctor,
      date:    new Date(y, m - 1, d),
      time:    slot.time,
      type:    type || 'Follow-up',
      notes:   notes || '',
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('doctor', 'name specialization email');

    // أرسل notification للدكتور
    const patientDoc = await Patient.findById(req.user.id).select('name');
    await createNotification({
      recipient: patient.doctor,
      title:     'New Appointment Booked',
      message:   `${patientDoc?.name || 'A patient'} booked an appointment on ${slot.date} at ${slot.time}`,
      icon:      '📅',
      data:      { appointmentId: appointment._id, slotId: slot._id },
    });

    res.status(201).json({ message: 'Appointment booked successfully', appointment: populated, slot });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};