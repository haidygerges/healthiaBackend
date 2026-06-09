// تشغيل مرة واحدة لتعبئة جدول الأكل في الداتابيز:
//   من داخل فولدر Backend شغّلي:  node src/config/seedFoods.js
require('dotenv').config();
const mongoose = require('mongoose');
const Food = require('../models/Food');
const foods = require('../data/foods.data');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected ✅');

    // امسحي القديم عشان ما يتكررش لو شغّلتيه أكتر من مرة
    await Food.deleteMany({});
    const inserted = await Food.insertMany(foods);

    console.log(`تم إدخال ${inserted.length} صنف أكل بنجاح ✅`);
    process.exit(0);
  } catch (err) {
    console.error('فشل الإدخال ❌', err.message);
    process.exit(1);
  }
})();