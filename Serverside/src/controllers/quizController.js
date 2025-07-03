const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new quiz
const createQuiz = async (req, res) => {
  try {
    const { title, topic, questions } = req.body;
    
    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        title,
        topic,
        questions: {
          create: questions.map(question => ({
            text: question.text,
            answerIdx: question.answerIdx,
            options: {
              create: question.options.map(option => ({
                text: option
              }))
            }
          }))
        }
      },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });
    
    res.status(201).json({
      message: 'Quiz created successfully',
      quiz
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all quizzes
const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });
    
    res.status(200).json({ quizzes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single quiz by ID
const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.status(200).json({ quiz });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createQuiz, getAllQuizzes, getQuizById };