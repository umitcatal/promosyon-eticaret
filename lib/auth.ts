import { redirect } from "next/navigation";
import { getSessionUserId } from "./session";
import { findUserById } from "./users";

export type SessionUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "customer" | "admin";
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const row = findUserById(userId);
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
  };
}

export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      nextPath ? `/giris?next=${encodeURIComponent(nextPath)}` : "/giris"
    );
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=%2Fadmin");
  if (user.role !== "admin") redirect("/");
  return user;
}
