import { API_BASE_URL, TOKEN_STORAGE_KEY } from '../config';
import { QuizQuestion } from './quizService';

export interface GenerateQuestionsParams {
  topic: string;
  numQuestions: number;
}

export interface ChatbotAskParams {
  prompt: string;
  attemptId: string;
}

// Fix: Explicitly type the return value as Record<string, string> to match HeadersInit
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const aiService = {
  async generateQuestions(params: GenerateQuestionsParams): Promise<QuizQuestion[]> {
    const response = await fetch(`${API_BASE_URL}/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate questions');
    }

    const data = await response.json();
    return data.questions;
  },

  async chatbotAsk(params: ChatbotAskParams): Promise<string> {
    // Fixed: Use the correct backend route '/ai/ask' instead of '/api/chat'
    const response = await fetch(`${API_BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get chatbot response');
    }

    const data = await response.json();
    return data.response;
  },
};