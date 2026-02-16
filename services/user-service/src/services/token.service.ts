import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { redisClient } from '../utils/redis';
import { User, TokenPayload, RefreshTokenPayload } from '../types';

export class TokenService {
  /**
   * Generate access token
   */
  async generateAccessToken(user: User): Promise<string> {
    const payload: Omit<TokenPayload, 'iat'> = {
      user_id: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwt.accessTokenSecret, {
      expiresIn: config.jwt.accessTokenExpiry,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(user: User): Promise<string> {
    const tokenId = uuidv4();
    const tokenFamily = uuidv4();

    const payload: Omit<RefreshTokenPayload, 'iat'> = {
      user_id: user.id,
      token_id: tokenId,
      token_family: tokenFamily,
    };

    const token = jwt.sign(payload, config.jwt.refreshTokenSecret, {
      expiresIn: config.jwt.refreshTokenExpiry,
    } as jwt.SignOptions);

    // Store token metadata in Redis
    await redisClient.setEx(
      `refresh_token:${tokenId}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify({
        user_id: user.id,
        token_family: tokenFamily,
        created_at: new Date().toISOString(),
      })
    );

    return token;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      config.jwt.refreshTokenSecret
    ) as RefreshTokenPayload;

    // Check if token is revoked
    const tokenData = await redisClient.get(`refresh_token:${decoded.token_id}`);
    if (!tokenData) {
      throw new Error('Invalid refresh token');
    }

    // Get user (simplified - in production, fetch from database)
    const user = {
      id: decoded.user_id,
      email: '',
      role: 'customer',
    } as User;

    // Generate new tokens
    const accessToken = await this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user);

    // Revoke old refresh token
    await redisClient.del(`refresh_token:${decoded.token_id}`);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        config.jwt.refreshTokenSecret
      ) as RefreshTokenPayload;

      await redisClient.del(`refresh_token:${decoded.token_id}`);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const keys = await redisClient.keys(`refresh_token:*`);
    
    for (const key of keys) {
      const data = await redisClient.get(key);
      if (data) {
        const tokenData = JSON.parse(data);
        if (tokenData.user_id === userId) {
          await redisClient.del(key);
        }
      }
    }
  }
}
