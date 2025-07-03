const OpenAI = require('openai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate quiz questions using OpenAI
const generateQuestions = async (req, res) => {
  try {
    const { topic, numQuestions } = req.body;
    
    // Your existing implementation here
    // ...
    
    res.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ message: 'Failed to generate questions' });
  }
};

// NEW: Chatbot ask function
const chatbotAsk = async (req, res) => {
  try {
    const { prompt, attemptId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Optional: Verify attempt exists in database
    // You can skip this if you're handling attempts differently
    let attempt = null;
    if (attemptId) {
      try {
        // Uncomment if you have an Attempt model
        // attempt = await Attempt.findById(attemptId);
        // if (!attempt) {
        //   return res.status(404).json({ message: 'Attempt not found' });
        // }
      } catch (error) {
        console.log('Attempt lookup skipped or failed:', error.message);
      }
    }

    // Generate AI response
    const response = await generateChatResponse(prompt);
    
    res.json({ response });
  } catch (error) {
    console.error('Error in chatbotAsk:', error);
    res.status(500).json({ message: 'Failed to generate chatbot response' });
  }
};

// AI response generation function
const generateChatResponse = async (prompt) => {
  // Method 1: Use OpenAI (if you have API key)
  if (process.env.OPENAI_API_KEY) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI tutor assistant. Help students understand their quiz results and provide educational guidance. 
            
            Guidelines:
            - Be encouraging and supportive
            - Explain concepts clearly
            - Provide specific feedback when possible
            - Suggest improvement strategies
            - Keep responses concise but helpful`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fall back to simple responses if OpenAI fails
      return generateSimpleResponse(prompt);
    }
  }
  
  // Method 2: Simple rule-based responses (fallback)
  return generateSimpleResponse(prompt);
};

// Simple response generator (fallback when no AI service is available)
const generateSimpleResponse = (prompt) => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Extract quiz context from prompt if available
  const scoreMatch = prompt.match(/User Score: (\d+)\/(\d+)/);
  let scoreContext = '';
  if (scoreMatch) {
    const score = parseInt(scoreMatch[1]);
    const total = parseInt(scoreMatch[2]);
    const percentage = Math.round((score / total) * 100);
    scoreContext = `Based on your ${percentage}% score (${score}/${total}), `;
  }
  
  // Score-related questions
  if (lowerPrompt.includes('score') || lowerPrompt.includes('result') || lowerPrompt.includes('performance')) {
    return `${scoreContext}here's what I can tell you about your performance: Your quiz results show both your strengths and areas for improvement. Focus on understanding the concepts behind the questions you missed.`;
  }
  
  // Question-specific inquiries
  if (lowerPrompt.includes('question')) {
    const questionMatch = prompt.match(/question (\d+)/i);
    if (questionMatch) {
      return `For question ${questionMatch[1]}, let me help you understand: The correct answer addresses the core concept being tested. Look at why each option is right or wrong, and try to understand the underlying principle.`;
    }
    return "When reviewing specific questions, focus on understanding why the correct answer is right and why the incorrect options don't work. This will help you recognize similar patterns in future questions.";
  }
  
  // Wrong/incorrect answers
  if (lowerPrompt.includes('wrong') || lowerPrompt.includes('incorrect') || lowerPrompt.includes('missed')) {
    return "For questions you got wrong, here's my advice: 1) Read the question carefully again, 2) Identify what concept is being tested, 3) Understand why the correct answer is right, 4) Learn from the mistake to avoid similar errors.";
  }
  
  // Improvement advice
  if (lowerPrompt.includes('improve') || lowerPrompt.includes('better') || lowerPrompt.includes('study')) {
    return `${scoreContext}here are some study tips: 1) Review the topics you struggled with, 2) Practice similar questions, 3) Take your time reading each question, 4) Eliminate obviously wrong answers first, 5) Focus on understanding concepts rather than memorizing.`;
  }
  
  // Time-related questions
  if (lowerPrompt.includes('time') || lowerPrompt.includes('fast') || lowerPrompt.includes('slow')) {
    return "Regarding timing: Take enough time to read questions carefully, but don't overthink. If you're unsure, make your best guess and move on. You can always review flagged questions if time permits.";
  }
  
  // Explanation requests
  if (lowerPrompt.includes('explain') || lowerPrompt.includes('why')) {
    return "I'd be happy to explain! Understanding the 'why' behind answers is crucial for learning. Look at the context of each question and think about what concept or principle it's testing.";
  }
  
  // Encouragement requests
  if (lowerPrompt.includes('discouraged') || lowerPrompt.includes('bad') || lowerPrompt.includes('failed')) {
    return "Don't be discouraged! Every quiz is a learning opportunity. What matters most is understanding the material and improving over time. Focus on your progress, not perfection.";
  }
  
  // Default response
  return `I'm here to help you understand your quiz results better! ${scoreContext}Feel free to ask me about:
  
  • Specific questions you got wrong
  • Ways to improve your performance  
  • Study strategies for this topic
  • Explanations of concepts you're unsure about
  
  What would you like to explore?`;
};

module.exports = {
  generateQuestions,
  chatbotAsk
};