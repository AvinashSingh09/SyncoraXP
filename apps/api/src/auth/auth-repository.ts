export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface NewUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface NewSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export class DuplicateEmailError extends Error {
  constructor() {
    super("An account already exists for this email address");
    this.name = "DuplicateEmailError";
  }
}

export interface AuthRepository {
  createUser(record: NewUserRecord): Promise<StoredUser>;
  findUserByEmail(email: string): Promise<StoredUser | null>;
  createSession(record: NewSessionRecord): Promise<void>;
  findUserBySessionTokenHash(tokenHash: string): Promise<StoredUser | null>;
  deleteSession(tokenHash: string): Promise<void>;
}
