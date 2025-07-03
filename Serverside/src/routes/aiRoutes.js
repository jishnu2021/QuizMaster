const express = require('express');
const { generateQuestions, chatbotAsk } = require('../controllers/aiController');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/generate', verifyToken, isAdmin, generateQuestions);
router.post('/ask', verifyToken, chatbotAsk);

module.exports = router;