import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export type SessionData = {
  userId?: number;
};

export const SESSION_COOKIE_NAME = "promosyon_session";

function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_PASSWORD;
  if (!password || password.length < 32) {
    throw new Error(
      "SESSION_PASSWORD tanımlı değil veya 32 karakterden kısa (.env.local dosyasını kontrol edin)."
    );
  }
  return {
    password,
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

export async function getSessionUserId(): Promise<number | null> {
  const session = await getSession();
  return session.userId ?? null;
}

export async function startSession(userId: number): Promise<void> {
  const session = await getSession();
  session.userId = userId;
  await session.save();
}

export async function endSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
