const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (global.mongoose && global.mongoose.connection.readyState >= 1) {
    return global.mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected ✅');
    global.mongoose = conn;
    return conn;
  } catch (err) {
    console.error('Connection failed ', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;