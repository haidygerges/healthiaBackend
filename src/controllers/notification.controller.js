const Notification = require('../models/Notification');

// جيب كل notifications للـ user الحالي
exports.getMyNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// علّم كل notifications كـ read
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// احذف notification معينة (الـ X)
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// helper — بيتستخدم من controllers تانية لإنشاء notification
exports.createNotification = async ({ recipient, title, message, icon = '📅', data = {} }) => {
  try {
    await Notification.create({ recipient, title, message, icon, data });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};