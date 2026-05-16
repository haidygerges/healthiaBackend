// امسحي كل اللي موجود واستبدليه بده
require('dotenv').config({ path: 'C:\\Users\\Admin\\Desktop\\Backend\\.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ role: 'superadmin' });
  if (existing) {
    console.log('Super admin already exists ');
    process.exit();
  }

  await User.create({
    name: 'Super Admin',
    email: 'admin@healthia.com',
    password: 'Admin@1234',
    role: 'superadmin',
  });

  console.log('Super admin created successfully ');
  process.exit();
};

seed();