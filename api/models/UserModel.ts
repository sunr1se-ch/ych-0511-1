import { queryOne } from './dbUtils';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User, LoginRequest, LoginResponse } from '../../shared/types';

interface UserRow {
  id: number;
  username: string;
  passwordHash: string;
  name: string;
  role: string;
  createdAt: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'subei-cooperative-secret-key-2024';

export const UserModel = {
  getById(id: number): User | undefined {
    const row = queryOne<UserRow>('SELECT id, username, name, role FROM users WHERE id = ?', [id]);
    return row ? { id: row.id, username: row.username, name: row.name, role: row.role as 'admin' | 'operator' } : undefined;
  },

  getByUsername(username: string): UserRow | undefined {
    return queryOne<UserRow>('SELECT * FROM users WHERE username = ?', [username]);
  },

  login(data: LoginRequest): LoginResponse | null {
    const userRow = this.getByUsername(data.username);
    if (!userRow) return null;

    const isValid = bcrypt.compareSync(data.password, userRow.passwordHash);
    if (!isValid) return null;

    const token = jwt.sign(
      { userId: userRow.id, username: userRow.username, role: userRow.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: userRow.id,
        username: userRow.username,
        name: userRow.name,
        role: userRow.role as 'admin' | 'operator',
      },
    };
  },

  verifyToken(token: string): User | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      return this.getById(decoded.userId) || null;
    } catch {
      return null;
    }
  },
};
