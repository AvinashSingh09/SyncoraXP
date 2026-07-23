import {
  DuplicateEmailError,
  type AuthRepository,
  type NewSessionRecord,
  type NewUserRecord,
  type StoredUser,
} from "../../src/auth/auth-repository";

export class TestAuthRepository implements AuthRepository {
  private readonly users = new Map<string, StoredUser>();
  private readonly sessions = new Map<string, NewSessionRecord>();

  async createUser(record: NewUserRecord): Promise<StoredUser> {
    const email = record.email.toLowerCase();
    if ([...this.users.values()].some((user) => user.email.toLowerCase() === email)) {
      throw new DuplicateEmailError();
    }
    const user = { ...record, email, createdAt: new Date() };
    this.users.set(user.id, user);
    return user;
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    return [...this.users.values()].find((user) => user.email === email.toLowerCase()) ?? null;
  }

  async createSession(record: NewSessionRecord): Promise<void> {
    this.sessions.set(record.tokenHash, record);
  }

  async findUserBySessionTokenHash(tokenHash: string): Promise<StoredUser | null> {
    const session = this.sessions.get(tokenHash);
    if (!session || session.expiresAt <= new Date()) return null;
    return this.users.get(session.userId) ?? null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    this.sessions.delete(tokenHash);
  }
}
