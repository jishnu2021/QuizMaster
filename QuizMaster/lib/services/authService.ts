import { API_BASE_URL, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name?: string;
  role?: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
  message: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Store token and user data
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      role: data.user.role.toLowerCase(), // Convert to lowercase to match frontend expectations
      name: data.user.name || data.user.email.split('@')[0], // Use email as name if not provided
    }));
    
    return data;
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    
    // Store token and user data
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      role: data.user.role.toLowerCase(), // Convert to lowercase to match frontend expectations
      name: userData.name || data.user.email.split('@')[0], // Use email as name if not provided
    }));
    
    return data;
  },

  logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  },

  getCurrentUser() {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  getToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};