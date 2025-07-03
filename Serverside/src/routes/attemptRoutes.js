const express = require('express');
const { submitAttempt, getUserAttempts } = require('../controllers/attemptController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/submit', verifyToken, submitAttempt);
router.get('/all', verifyToken, getUserAttempts);

module.exports = router;