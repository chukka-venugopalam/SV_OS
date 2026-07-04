export type UserRole = 'learner' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
  full_name?: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  is_authenticated: boolean;
  is_loading: boolean;
}
