const express = require('express');
const router  = express.Router();
const {
  createTicket,
  getAllTickets,
  updateTicketStatus,
} = require('../controllers/support.controller');
const { protect, isSuperAdmin } = require('../middleware/auth.middleware');

// Public — أي حد يقدر يبعت تذكرة
router.post('/', createTicket);

// Super Admin فقط
router.get('/',          protect, isSuperAdmin, getAllTickets);
router.put('/:id/status', protect, isSuperAdmin, updateTicketStatus);

module.exports = router;