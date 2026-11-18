import { getDefaultSiteId, getSiteBaseUrl, getSiteHosts, normalizeHost } from "./sites";

type SiteverifyResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
};

export function getTurnstileSiteKey(siteId: number): string {
  const scoped = process.env[`TURNSTILE_SITE_KEY_${siteId}`]?.trim();
  if (scoped) return scoped;

  if (siteId === getDefaultSiteId()) {
    return (
      process.env.TURNSTILE_SITE_KEY?.trim() ||
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
      ""
    );
  }
  return "";
}

function getTurnstileSecretKey(siteId: number): string {
  const scoped = process.env[`TURNSTILE_SECRET_KEY_${siteId}`]?.trim();
  if (scoped) return scoped;

  if (siteId === getDefaultSiteId()) {
    return process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
  }
  return "";
}

function allowedHostnames(siteId: number): Set<string> {
  const hosts = new Set(getSiteHosts(siteId));
  if (hosts.size === 0) {
    try {
      hosts.add(new URL(getSiteBaseUrl(siteId)).hostname);
    } catch {
      // no usable host; verification will fail below
    }
  }
  return hosts;
}

export async function verifyTurnstile(
  token: string,
  expectedAction: string,
  siteId: number
): Promise<boolean> {
  const secret = getTurnstileSecretKey(siteId);
  if (!secret) return false;

  const hosts = allowedHostnames(siteId);
  if (hosts.size === 0) return false;

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
      typeof result.hostname === "string" &&
      hosts.has(normalizeHost(result.hostname))
    );
  } catch {
    return false;
  }
}
