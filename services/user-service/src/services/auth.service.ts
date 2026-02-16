import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { config } from '../config';
import { RegisterInput, LoginInput, AuthResponse, OAuthUser } from '../types';

const userRepository = new UserRepository();
const tokenService = new TokenService();

export class AuthService {
  /**
   * Register new user
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, config.bcryptRounds);

    // Create user
    const user = await userRepository.create({
      id: uuidv4(),
      email: input.email,
      password: hashedPassword,
      first_name: input.first_name,
      last_name: input.last_name,
      role: 'customer',
      is_email_verified: false,
      oauth_provider: null,
      oauth_provider_id: null,
    });

    // Generate tokens
    const accessToken = await tokenService.generateAccessToken(user);
    const refreshToken = await tokenService.generateRefreshToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_email_verified: user.is_email_verified,
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 900, // 15 minutes
      },
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    // Find user
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate tokens
    const accessToken = await tokenService.generateAccessToken(user);
    const refreshToken = await tokenService.generateRefreshToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_email_verified: user.is_email_verified,
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 900,
      },
    };
  }

  /**
   * Refresh tokens
   */
  async refreshTokens(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    const tokens = await tokenService.refreshAccessToken(refreshToken);
    return {
      ...tokens,
      expires_in: 900,
    };
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    await tokenService.revokeRefreshToken(refreshToken);
  }

  /**
   * OAuth login
   */
  async oauthLogin(provider: 'google' | 'facebook', oauthUser: OAuthUser): Promise<AuthResponse> {
    // Check if user exists with OAuth provider
    let user = await userRepository.findByOAuthProvider(provider, oauthUser.id);

    if (!user) {
      // Check if user exists with email
      user = await userRepository.findByEmail(oauthUser.email);

      if (user) {
        // Link OAuth provider to existing account
        user = await userRepository.linkOAuthProvider(user.id, provider, oauthUser.id);
      } else {
        // Create new user
        user = await userRepository.create({
          id: uuidv4(),
          email: oauthUser.email,
          password: null,
          first_name: oauthUser.first_name,
          last_name: oauthUser.last_name,
          role: 'customer',
          is_email_verified: true, // OAuth emails are pre-verified
          oauth_provider: provider,
          oauth_provider_id: oauthUser.id,
        });
      }
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate tokens
    const accessToken = await tokenService.generateAccessToken(user);
    const refreshToken = await tokenService.generateRefreshToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_email_verified: user.is_email_verified,
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 900,
      },
    };
  }
}
