const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/config/db');
const app = express();

connectDB();

// ✅ CORS — لازم يسمح بـ PATCH (أزرار Mark as Done بتستخدمها) وبدومينات Vercel
const allowedOrigins = [
  'http://localhost:5173',
  'https://healthia.vercel.app',
  'https://healthia777.vercel.app',
  'https://healthia-ecru.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // اسمح للطلبات من غير origin (زي Postman) ولأي دومين vercel.app بتاع المشروع
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // ✅ ضفنا PATCH
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use('/api/auth',          require('./src/routes/auth.routes'));
app.use('/api/doctors',       require('./src/routes/doctor.routes'));
app.use('/api/patients',      require('./src/routes/patient.routes'));
app.use('/api/plans',         require('./src/routes/plan.routes'));
app.use('/api/appointments',  require('./src/routes/appointment.routes'));
app.use('/api/availability',  require('./src/routes/availability.routes'));
app.use('/api/slots',         require('./src/routes/slot.routes'));
app.use('/api/notifications', require('./src/routes/notification.routes'));
app.use('/api/analytics',     require('./src/routes/analytics.routes'));
app.use('/api/daily-logs',    require('./src/routes/dailyLog.routes'));
app.use('/api/foods',         require('./src/routes/food.routes'));
app.use('/api/support',       require('./src/routes/support.routes'));

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
