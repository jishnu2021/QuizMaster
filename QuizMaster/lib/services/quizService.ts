import { API_BASE_URL, TOKEN_STORAGE_KEY } from '../config';

export interface QuizQuestion {
  text: string;
  options: string[];
  answerIdx: number;
}

export interface QuizData {
  title: string;
  topic: string;
  questions: QuizQuestion[];
}

export interface Quiz extends QuizData {
  id: string;
  createdAt: string;
}

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const quizService = {
  async createQuiz(quizData: QuizData): Promise<Quiz> {
    const response = await fetch(`${API_BASE_URL}/quiz/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(quizData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create quiz');
    }

    const data = await response.json();
    return data.quiz;
  },

  async getAllQuizzes(): Promise<Quiz[]> {
    const response = await fetch(`${API_BASE_URL}/quiz/all`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch quizzes');
    }

    const data = await response.json();
    return data.quizzes;
  },

  async getQuizById(id: string): Promise<Quiz> {
    const response = await fetch(`${API_BASE_URL}/quiz/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch quiz');
    }

    const data = await response.json();
    return data.quiz;
  },
};