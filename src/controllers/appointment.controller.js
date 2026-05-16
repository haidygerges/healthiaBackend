const Appointment = require('../models/Appointment');

// الدكتور يضيف appointment
exports.addAppointment = async (req, res) => {
  try {
    const { patient, date, time, type, notes } = req.body;

    const appointment = await Appointment.create({
      patient,
      doctor: req.user.id,
      date, time, type, notes,
    });

    res.status(201).json({ message: 'Appointment added successfully', appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// الدكتور يشوف appointments بتوعه
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

// جيب appointments بتاعة patient معين
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

// تعديل appointment (تغيير status مثلاً)
exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ message: 'Appointment not found' });

    const fields = ['date', 'time', 'type', 'status', 'notes'];
    fields.forEach(f => { if (req.body[f] !== undefined) appointment[f] = req.body[f]; });

    await appointment.save();
    res.json({ message: 'Appointment updated successfully', appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// حذف appointment
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ message: 'Appointment not found' });

    await appointment.deleteOne();
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// الـ patient يشوف appointments بتاعته
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