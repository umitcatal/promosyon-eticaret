import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getRequestSiteId } from "@/lib/site-request";
import { getSiteBaseUrl } from "@/lib/sites";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const siteId = await getRequestSiteId();
  const baseUrl = getSiteBaseUrl(siteId);
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    return Response.redirect(new URL("/giris?error=google", baseUrl));
  }

  const state = randomBytes(16).toString("base64url");
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  };
  cookieStore.set("google_oauth_state", state, cookieOptions);
  cookieStore.set("google_oauth_verifier", codeVerifier, cookieOptions);
  cookieStore.set("google_oauth_site", String(siteId), cookieOptions);
  cookieStore.set(
    "google_oauth_next",
    requestUrl.searchParams.get("next") ?? "/",
    cookieOptions
  );

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("prompt", "select_account");

  return Response.redirect(authUrl.toString());
}
