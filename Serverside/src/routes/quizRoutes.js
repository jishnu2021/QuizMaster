const express = require('express');
const { createQuiz, getAllQuizzes, getQuizById } = require('../controllers/quizController');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/create', verifyToken, isAdmin, createQuiz);
router.get('/all', getAllQuizzes);
router.get('/:id', getQuizById);

module.exports = router;