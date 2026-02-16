import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { config } from '../config';
import { UpdateProfileInput } from '../types';

const userRepository = new UserRepository();
const tokenService = new TokenService();

export class UserService {
  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.role,
      is_email_verified: user.is_email_verified,
      oauth_provider: user.oauth_provider,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: UpdateProfileInput) {
    const user = await userRepository.update(userId, updates);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.role,
    };
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    // Revoke all tokens
    await tokenService.revokeAllUserTokens(userId);

    // Delete user
    await userRepository.delete(userId);
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    if (!user.password) {
      throw new Error('Cannot change password for OAuth users');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid current password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);

    // Update password
    await userRepository.updatePassword(userId, hashedPassword);

    // Revoke all refresh tokens (force re-login)
    await tokenService.revokeAllUserTokens(userId);
  }

  /**
   * List users (admin)
   */
  async listUsers(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { users, total } = await userRepository.findAll(limit, offset);

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_email_verified: user.is_email_verified,
        created_at: user.created_at,
      })),
      total,
    };
  }
}
