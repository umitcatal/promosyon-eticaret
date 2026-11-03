type SiteverifyResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
};

export async function verifyTurnstile(
  token: string,
  expectedAction: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!secret || !siteUrl) return false;

  let expectedHostname: string;
  try {
    expectedHostname = new URL(siteUrl).hostname;
  } catch {
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({ secret, response: token }),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!response.ok) return false;

    const result = (await response.json()) as SiteverifyResponse;
    return (
      result.success === true &&
      result.action === expectedAction &&
      result.hostname === expectedHostname
    );
  } catch {
    return false;
  }
}
