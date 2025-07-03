const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Submit a quiz attempt
const submitAttempt = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const userId = req.user.id;
    
    // Check if user has already attempted this quiz
    const existingAttempt = await prisma.attempt.findFirst({
      where: {
        userId,
        quizId
      }
    });
    
    if (existingAttempt) {
      return res.status(400).json({ message: 'You have already attempted this quiz' });
    }
    
    // Get quiz with questions and correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true
      }
    });
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Calculate score
    let score = 0;
    const questionsMap = {};
    
    quiz.questions.forEach(question => {
      questionsMap[question.id] = question;
    });
    
    Object.keys(answers).forEach(questionId => {
      if (questionsMap[questionId] && answers[questionId] === questionsMap[questionId].answerIdx) {
        score++;
      }
    });
    
    // Create attempt record
    const attempt = await prisma.attempt.create({
      data: {
        userId,
        quizId,
        answers: answers,
        score
      },
      include: {
        quiz: true
      }
    });
    
    res.status(201).json({
      message: 'Quiz submitted successfully',
      attempt,
      score,
      totalQuestions: quiz.questions.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all attempts for a user
const getUserAttempts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const attempts = await prisma.attempt.findMany({
      where: { userId },
      include: {
        quiz: true
      }
    });
    
    res.status(200).json({ attempts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { submitAttempt, getUserAttempts };