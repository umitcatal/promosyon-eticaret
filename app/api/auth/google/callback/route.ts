import { cookies } from "next/headers";
import { startSession } from "@/lib/session";
import { safeNextPath } from "@/lib/url";
import {
  createUser,
  findUserByEmail,
  findUserByGoogleId,
  updateUserGoogleId,
} from "@/lib/users";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
};

function fail(request: Request, reason: string) {
  return Response.redirect(new URL(`/giris?error=${reason}`, request.url));
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return fail(request, "google");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_oauth_state")?.value;
  const codeVerifier = cookieStore.get("google_oauth_verifier")?.value;
  const next = cookieStore.get("google_oauth_next")?.value;

  cookieStore.delete("google_oauth_state");
  cookieStore.delete("google_oauth_verifier");
  cookieStore.delete("google_oauth_next");

  if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
    return fail(request, "durum");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });
  const token = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenResponse.ok || !token.access_token) {
    return fail(request, "token");
  }

  const infoResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { authorization: `Bearer ${token.access_token}` } }
  );
  const info = (await infoResponse.json()) as GoogleUserInfo;
  if (!infoResponse.ok || !info.sub || !info.email) {
    return fail(request, "profil");
  }

  let user = findUserByGoogleId(info.sub) ?? findUserByEmail(info.email);
  if (user) {
    if (!user.google_id) updateUserGoogleId(user.id, info.sub);
  } else {
    const nameParts = (info.name ?? "").trim().split(/\s+/);
    const firstName = info.given_name?.trim() || nameParts[0] || "Google";
    const lastName =
      info.family_name?.trim() || nameParts.slice(1).join(" ") || "Kullanıcı";
    createUser({
      firstName,
      lastName,
      email: info.email.toLowerCase(),
      googleId: info.sub,
    });
    user = findUserByGoogleId(info.sub) ?? findUserByEmail(info.email);
    if (!user) return fail(request, "kayit");
  }

  await startSession(user.id);
  return Response.redirect(new URL(safeNextPath(next), request.url));
}
