const Appointment = require('../models/Appointment');
const Patient     = require('../models/Patient');
const DoctorSlot  = require('../models/DoctorSlot');
const { createNotification } = require('./notification.controller');

exports.addAppointment = async (req, res) => {
  try {
    const { patient, date, time, type, notes } = req.body;

    // لو الـ slot موجود في الـ DoctorSlot — احجزه
    const DoctorSlot = require('../models/DoctorSlot');
    // normalize الـ time عشان يكون HH:mm دايماً
    const normalizeTime = (t) => {
      if (!t) return t;
      const [h, m] = t.split(':');
      return `${String(parseInt(h)).padStart(2,'0')}:${String(parseInt(m)).padStart(2,'0')}`;
    };
    // normalize الـ date عشان ياخد أول 10 حروف بس (YYYY-MM-DD)
    const normalizedDate = (date || '').substring(0, 10);
    const normalizedTime = normalizeTime(time);

    const slot = await DoctorSlot.findOne({
      doctor: req.user.id,
      date:   normalizedDate,
      time:   normalizedTime,
    });

    if (slot) {
      if (slot.isBooked) {
        return res.status(400).json({ message: 'This time slot is already booked.' });
      }
      slot.isBooked = true;
      slot.bookedBy = patient;
      await slot.save();
    }
    // لو مش موجود — عادي، الـ appointment بيتضاف من غير slot

    const appointment = await Appointment.create({
      patient, doctor: req.user.id, date, time, type, notes,
    });

    res.status(201).json({ message: 'Appointment added successfully', appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.bookByPatient = async (req, res) => {
  try {
    const { date, time, type, notes } = req.body;

    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time are required' });
    }

    const patient = await Patient.findById(req.user.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    if (!patient.doctor) return res.status(400).json({ message: 'No doctor assigned to this patient' });

    // ✅ منع المريض من حجز أكتر من ميعاد في نفس اليوم
    const [_ay, _am, _ad] = date.substring(0,10).split('-').map(Number);
    const startOfDay = new Date(_ay, _am - 1, _ad, 0, 0, 0, 0);
    const endOfDay   = new Date(_ay, _am - 1, _ad, 23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      patient: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' },
    });
    if (existingAppointment) {
      return res.status(400).json({
        message: 'You already have an appointment on this day. You can only book one appointment per day.',
      });
    }

    // ✅ التأكد إن الـ slot مش محجوز من مريض تاني
    const slotTaken = await Appointment.findOne({
      doctor: patient.doctor,
      date: { $gte: startOfDay, $lte: endOfDay },
      time,
      status: { $ne: 'cancelled' },
    });
    if (slotTaken) {
      return res.status(400).json({ message: 'This time slot is already booked. Please choose another time.' });
    }

    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: patient.doctor,
      date: new Date(date),
      time,
      type: type || 'Follow-up',
      notes: notes || '',
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('doctor', 'name specialization email');

    res.status(201).json({ message: 'Appointment booked successfully', appointment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('patient', 'name email phone')
      .sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.params.patientId })
      .populate('doctor', 'name specialization')
      .sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const wasScheduled = appointment.status === 'scheduled';
    const fields = ['date', 'time', 'type', 'status', 'notes'];
    fields.forEach(f => { if (req.body[f] !== undefined) appointment[f] = req.body[f]; });
    await appointment.save();

    // لو الدكتور لغى الـ appointment
    if (req.body.status === 'cancelled' && wasScheduled) {
      // افتح الـ slot تاني عشان حد تاني يحجزه
      const dateStr = appointment.date.toISOString().split('T')[0];
      await DoctorSlot.findOneAndUpdate(
        { doctor: appointment.doctor, date: dateStr, time: appointment.time },
        { isBooked: false, bookedBy: null }
      );

      // أرسل notification للمريض
      await createNotification({
        recipient: appointment.patient._id,
        title:     'Appointment Cancelled',
        message:   `Your appointment on ${dateStr} at ${appointment.time} has been cancelled by your doctor.`,
        icon:      '❌',
        data:      { appointmentId: appointment._id },
      });
    }

    res.json({ message: 'Appointment updated successfully', appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    await appointment.deleteOne();
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyAppointments_Patient = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name specialization')
      .sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};