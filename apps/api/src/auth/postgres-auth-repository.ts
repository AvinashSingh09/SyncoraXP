import type { Pool } from "pg";
import {
  DuplicateEmailError,
  type AuthRepository,
  type NewSessionRecord,
  type NewUserRecord,
  type StoredUser,
} from "./auth-repository";

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

function mapUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

export class PostgresAuthRepository implements AuthRepository {
  constructor(private readonly pool: Pool) {}

  async createUser(record: NewUserRecord): Promise<StoredUser> {
    try {
      const result = await this.pool.query<UserRow>(
        `INSERT INTO users (id, name, email, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [record.id, record.name, record.email, record.passwordHash],
      );
      const row = result.rows[0];
      if (!row) throw new Error("User insert did not return a row");
      return mapUser(row);
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "23505") {
        throw new DuplicateEmailError();
      }
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const result = await this.pool.query<UserRow>(
      "SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1",
      [email],
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async createSession(record: NewSessionRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO auth_sessions (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [record.id, record.userId, record.tokenHash, record.expiresAt],
    );
  }

  async findUserBySessionTokenHash(tokenHash: string): Promise<StoredUser | null> {
    const result = await this.pool.query<UserRow>(
      `SELECT users.*
       FROM auth_sessions
       JOIN users ON users.id = auth_sessions.user_id
       WHERE auth_sessions.token_hash = $1 AND auth_sessions.expires_at > now()
       LIMIT 1`,
      [tokenHash],
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.pool.query("DELETE FROM auth_sessions WHERE token_hash = $1", [tokenHash]);
  }
}
