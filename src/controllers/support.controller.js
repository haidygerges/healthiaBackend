const SupportTicket = require('../models/SupportTicket');

// ================================
// إرسال تذكرة دعم (public)
// ================================
exports.createTicket = async (req, res) => {
  try {
    const { name, email, type, message } = req.body;

    if (!name || !email || !type || !message)
      return res.status(400).json({ message: 'All fields are required' });

    const ticket = await SupportTicket.create({ name, email, type, message });

    res.status(201).json({ message: 'Ticket submitted successfully', ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// جلب كل التذاكر (super admin فقط)
// ================================
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// تحديث status التذكرة (super admin فقط)
// ================================
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!ticket)
      return res.status(404).json({ message: 'Ticket not found' });

    res.json({ message: 'Status updated', ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};