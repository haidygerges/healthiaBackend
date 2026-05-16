const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/config/db');
const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/doctors', require('./src/routes/doctor.routes'));
app.use('/api/patients', require('./src/routes/patient.routes'));
app.use('/api/plans', require('./src/routes/plan.routes'));
app.use('/api/appointments', require('./src/routes/appointment.routes'));
app.use('/api/analytics', require('./src/routes/analytics.routes'));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;

