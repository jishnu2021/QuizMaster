import { API_BASE_URL, TOKEN_STORAGE_KEY } from '../config';

export interface AttemptData {
  quizId: string;
  answers: { [questionId: string]: number };
}

export interface Attempt {
  id: string;
  userId: string;
  quizId: string;
  answers: { [questionId: string]: number };
  score: number;
  createdAt: string;
  quiz?: any;
}

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const attemptService = {
  async submitAttempt(attemptData: AttemptData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/attempt/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(attemptData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit attempt');
    }

    return await response.json();
  },

  async getUserAttempts(): Promise<Attempt[]> {
    const response = await fetch(`${API_BASE_URL}/attempt/all`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch attempts');
    }

    const data = await response.json();
    return data.attempts;
  },
};