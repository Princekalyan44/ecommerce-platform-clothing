import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { User, TokenPayload, RefreshTokenPayload } from '../types';
import { redisClient } from '../utils/redis';

export class TokenService {
  /**
   * Generate access token
   */
  async generateAccessToken(user: User): Promise<string> {
    const payload: TokenPayload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, config.jwt.accessTokenSecret, {
      expiresIn: config.jwt.accessTokenExpiry,
    });
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(user: User): Promise<string> {
    const tokenId = uuidv4();
    const tokenFamily = uuidv4(); // For token rotation

    const payload: RefreshTokenPayload = {
      user_id: user.id,
      token_id: tokenId,
      token_family: tokenFamily,
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, config.jwt.refreshTokenSecret, {
      expiresIn: config.jwt.refreshTokenExpiry,
    });
  }

  /**
   * Generate both tokens
   */
  async generateTokenPair(user: User): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes for access token
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.accessTokenSecret) as TokenPayload;
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.refreshTokenSecret) as RefreshTokenPayload;
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Store refresh token in Redis (for revocation)
   */
  async storeRefreshToken(userId: string, token: string): Promise<void> {
    const key = `refresh_token:${userId}:${token}`;
    const ttl = 7 * 24 * 60 * 60; // 7 days

    await redisClient.setEx(key, ttl, 'valid');
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    try {
      const payload = await this.verifyRefreshToken(token);
      const key = `refresh_token:${payload.user_id}:${token}`;
      await redisClient.del(key);
    } catch (error) {
      // Token is already invalid, ignore
    }
  }

  /**
   * Check if refresh token is revoked
   */
  async isRefreshTokenRevoked(token: string): Promise<boolean> {
    try {
      const payload = await this.verifyRefreshToken(token);
      const key = `refresh_token:${payload.user_id}:${token}`;
      const exists = await redisClient.exists(key);
      return exists === 0; // If not exists in Redis, it's revoked
    } catch (error) {
      return true; // Invalid token is considered revoked
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }
}
