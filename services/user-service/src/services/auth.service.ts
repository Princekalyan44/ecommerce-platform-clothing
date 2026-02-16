import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { config } from '../config';
import { RegisterInput, LoginInput, User, AuthResponse, OAuthUser } from '../types';
import { logger } from '../utils/logger';

const userRepository = new UserRepository();
const tokenService = new TokenService();

export class AuthService {
  /**
   * Register new user
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, config.bcryptRounds);

    // Create user
    const userId = uuidv4();
    const user = await userRepository.create({
      id: userId,
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
    const tokens = await tokenService.generateTokenPair(user);

    // Store refresh token
    await tokenService.storeRefreshToken(user.id, tokens.refresh_token);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_email_verified: user.is_email_verified,
      },
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    // Find user
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if OAuth user
    if (user.oauth_provider) {
      throw new Error(`Please login with ${user.oauth_provider}`);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password!);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await tokenService.generateTokenPair(user);

    // Store refresh token
    await tokenService.storeRefreshToken(user.id, tokens.refresh_token);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_email_verified: user.is_email_verified,
      },
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    // Verify refresh token
    const payload = await tokenService.verifyRefreshToken(refreshToken);

    // Check if token is revoked
    const isRevoked = await tokenService.isRefreshTokenRevoked(refreshToken);
    if (isRevoked) {
      throw new Error('Refresh token has been revoked');
    }

    // Get user
    const user = await userRepository.findById(payload.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = await tokenService.generateAccessToken(user);

    return {
      access_token: accessToken,
      expires_in: 900, // 15 minutes
    };
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await tokenService.revokeRefreshToken(refreshToken);
  }

  /**
   * Handle OAuth login (Google/Facebook)
   */
  async handleOAuthLogin(oauthUser: OAuthUser, provider: 'google' | 'facebook'): Promise<AuthResponse> {
    // Check if user exists
    let user = await userRepository.findByOAuthProvider(provider, oauthUser.id);

    if (!user) {
      // Check by email
      user = await userRepository.findByEmail(oauthUser.email);

      if (user) {
        // Link OAuth account to existing user
        user = await userRepository.linkOAuthProvider(user.id, provider, oauthUser.id);
      } else {
        // Create new user
        const userId = uuidv4();
        user = await userRepository.create({
          id: userId,
          email: oauthUser.email,
          password: null,
          first_name: oauthUser.first_name,
          last_name: oauthUser.last_name,
          role: 'customer',
          is_email_verified: true, // OAuth emails are verified
          oauth_provider: provider,
          oauth_provider_id: oauthUser.id,
        });
      }
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await tokenService.generateTokenPair(user);

    // Store refresh token
    await tokenService.storeRefreshToken(user.id, tokens.refresh_token);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_email_verified: user.is_email_verified,
      },
      tokens,
    };
  }
}
