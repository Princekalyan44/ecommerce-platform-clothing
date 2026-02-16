export interface User {
  id: string;
  email: string;
  password: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'customer' | 'admin';
  is_email_verified: boolean;
  oauth_provider: 'google' | 'facebook' | null;
  oauth_provider_id: string | null;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

export interface CreateUserInput {
  id: string;
  email: string;
  password: string | null;
  first_name: string;
  last_name: string;
  role: 'customer' | 'admin';
  is_email_verified: boolean;
  oauth_provider: 'google' | 'facebook' | null;
  oauth_provider_id: string | null;
}

export interface RegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface TokenPayload {
  user_id: string;
  email: string;
  role: string;
  iat: number;
}

export interface RefreshTokenPayload {
  user_id: string;
  token_id: string;
  token_family: string;
  iat: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_email_verified: boolean;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

export interface OAuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}
