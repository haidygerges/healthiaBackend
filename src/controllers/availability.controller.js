const Availability = require('../models/Availability');

// الدكتور يجيب availability بتاعته
exports.getMyAvailability = async (req, res) => {
  try {
    let avail = await Availability.findOne({ doctor: req.user.id });
    if (!avail) {
      avail = {
        doctor: req.user.id,
        schedule: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => ({
          day,
          morning:   { enabled: true,  from: '09:00', to: '12:00' },
          afternoon: { enabled: true,  from: '13:00', to: '16:00' },
          evening:   { enabled: false, from: '18:00', to: '20:00' },
        })),
      };
    }
    res.json(avail);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// الدكتور يحدّث availability بتاعته
exports.updateMyAvailability = async (req, res) => {
  try {
    const { schedule } = req.body;
    if (!schedule || !Array.isArray(schedule)) {
      return res.status(400).json({ message: 'schedule array is required' });
    }

    const avail = await Availability.findOneAndUpdate(
      { doctor: req.user.id },
      { doctor: req.user.id, schedule },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ message: 'Availability updated successfully', availability: avail });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// المريض يشوف الـ slots المتاحة لدكتوره في يوم معين
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) return res.status(400).json({ message: 'date query param is required' });

    const Patient = require('../models/Patient');
    const patient = await Patient.findById(req.user.id);
    if (!patient || !patient.doctor)
      return res.status(400).json({ message: 'No doctor assigned' });

    const avail = await Availability.findOne({ doctor: patient.doctor });
    if (!avail) return res.json({ slots: [] });

    // حدد اليوم من التاريخ
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const [_y, _m, _d] = date.split('-').map(Number);
    const dayName  = dayNames[new Date(_y, _m - 1, _d).getDay()];
    const dayAvail = avail.schedule.find(d => d.day === dayName);
    if (!dayAvail) return res.json({ slots: [] });

    // جيب المواعيد المحجوزة في اليوم ده (أي مريض)
    const Appointment = require('../models/Appointment');
    const startOfDay = new Date(_y, _m - 1, _d, 0, 0, 0, 0);
    const endOfDay   = new Date(_y, _m - 1, _d, 23, 59, 59, 999);

    const booked = await Appointment.find({
      doctor: patient.doctor,
      date:   { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' },
    }).select('time');
    const bookedTimes = new Set(booked.map(a => a.time));

    // ولّد الـ slots كل 30 دقيقة من الـ sessions المتاحة
    const slots = [];
    const sessions = ['morning', 'afternoon', 'evening'];
    for (const s of sessions) {
      const session = dayAvail[s];
      if (!session || !session.enabled) continue;
      const [fh, fm] = session.from.split(':').map(Number);
      const [th, tm] = session.to.split(':').map(Number);
      let cur = fh * 60 + fm;
      const end = th * 60 + tm;
      while (cur + 60 <= end) {
        const hh = String(Math.floor(cur / 60)).padStart(2, '0');
        const mm = String(cur % 60).padStart(2, '0');
        const timeStr = `${hh}:${mm}`;
        slots.push({ time: timeStr, available: !bookedTimes.has(timeStr) });
        cur += 60;
      }
    }

    res.json({ date, slots });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// الدكتور يشوف المواعيد المحجوزة في يوم معين
exports.getBookedSlots = async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) return res.status(400).json({ message: 'date query param is required' });

    const Appointment = require('../models/Appointment');
    const [by, bm, bd] = date.split('-').map(Number);
    const startOfDay = new Date(by, bm - 1, bd, 0, 0, 0, 0);
    const endOfDay   = new Date(by, bm - 1, bd, 23, 59, 59, 999);

    const booked = await Appointment.find({
      doctor: req.user.id,
      date:   { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' },
    }).populate('patient', 'name').select('time patient status');

    res.json({ date, booked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};