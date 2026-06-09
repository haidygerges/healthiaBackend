const express = require('express');
const router  = express.Router();
const { getMyNotifications, markAllRead, deleteNotification } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/',           protect, getMyNotifications);
router.put('/read-all',   protect, markAllRead);
router.delete('/:id',     protect, deleteNotification);

module.exports = router;