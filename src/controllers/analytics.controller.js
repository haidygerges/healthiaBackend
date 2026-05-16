const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Plan = require('../models/Plan');

exports.getDoctorAnalytics = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const totalPatients = await Patient.countDocuments({ doctor: doctorId });
    const totalAppointments = await Appointment.countDocuments({ doctor: doctorId });
    const completedAppointments = await Appointment.countDocuments({ doctor: doctorId, status: 'completed' });
    const cancelledAppointments = await Appointment.countDocuments({ doctor: doctorId, status: 'cancelled' });
    const activePlans = await Plan.countDocuments({ doctor: doctorId, status: 'active' });

    // patients بالشهر
    const patientsByMonth = await Patient.aggregate([
      { $match: { doctor: require('mongoose').Types.ObjectId.createFromHexString(doctorId) } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // توزيع الـ clientType
    const clientTypeStats = await Patient.aggregate([
      { $match: { doctor: require('mongoose').Types.ObjectId.createFromHexString(doctorId) } },
      { $group: { _id: '$clientType', count: { $sum: 1 } } },
    ]);

    res.json({
      totalPatients,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      activePlans,
      patientsByMonth,
      clientTypeStats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};