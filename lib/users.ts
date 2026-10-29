import { db } from "./db";

export type UserRole = "customer" | "admin";

export type UserRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  password_hash: string | null;
  google_id: string | null;
  role: UserRole;
  created_at: string;
};

export function findUserById(id: number): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | UserRow
    | undefined;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | UserRow
    | undefined;
}

export function findUserByGoogleId(googleId: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE google_id = ?").get(googleId) as
    | UserRow
    | undefined;
}

export function createUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  passwordHash?: string | null;
  googleId?: string | null;
  role?: UserRole;
}): number {
  const info = db
    .prepare(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, google_id, role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.firstName,
      input.lastName,
      input.email,
      input.phone ?? null,
      input.passwordHash ?? null,
      input.googleId ?? null,
      input.role ?? "customer"
    );
  return Number(info.lastInsertRowid);
}

export function updateUserGoogleId(id: number, googleId: string): void {
  db.prepare("UPDATE users SET google_id = ? WHERE id = ?").run(googleId, id);
}

export function updateUserPassword(id: number, passwordHash: string): void {
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    passwordHash,
    id
  );
}
