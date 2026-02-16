import { pool } from '../database/connection';
import { User, CreateUserInput, UpdateProfileInput } from '../types';

export class UserRepository {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find user by OAuth provider
   */
  async findByOAuthProvider(
    provider: string,
    providerId: string
  ): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_provider_id = $2',
      [provider, providerId]
    );

    return result.rows[0] || null;
  }

  /**
   * Create user
   */
  async create(input: CreateUserInput): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (
        id, email, password, first_name, last_name, role,
        is_email_verified, oauth_provider, oauth_provider_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        input.id,
        input.email,
        input.password,
        input.first_name,
        input.last_name,
        input.role,
        input.is_email_verified,
        input.oauth_provider,
        input.oauth_provider_id,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update user
   */
  async update(id: string, updates: UpdateProfileInput): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.first_name !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(updates.first_name);
    }

    if (updates.last_name !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(updates.last_name);
    }

    if (updates.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(updates.phone);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Update password
   */
  async updatePassword(id: string, password: string): Promise<void> {
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [password, id]
    );
  }

  /**
   * Update last login
   */
  async updateLastLogin(id: string): Promise<void> {
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [id]
    );
  }

  /**
   * Link OAuth provider to user
   */
  async linkOAuthProvider(
    id: string,
    provider: string,
    providerId: string
  ): Promise<User> {
    const result = await pool.query(
      `UPDATE users
       SET oauth_provider = $1, oauth_provider_id = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [provider, providerId, id]
    );

    return result.rows[0];
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }

  /**
   * Find all users (admin)
   */
  async findAll(limit: number, offset: number): Promise<{ users: User[]; total: number }> {
    const [usersResult, countResult] = await Promise.all([
      pool.query(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM users'),
    ]);

    return {
      users: usersResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }
}
