import Image from "next/image";
import Link from "next/link";
import { SiteLogoFallback } from "@/components/layout/site-logo-fallback";
import { getSiteLogoUrl } from "@/lib/queries";
import { getCurrentSiteId } from "@/lib/site-context";
import { getSiteIdentity } from "@/lib/site-settings";

type SiteLogoProps = {
  href?: string | null;
  tone?: "light" | "dark";
};

export async function SiteLogo({ href = "/", tone = "light" }: SiteLogoProps) {
  const [logoUrl, siteId] = await Promise.all([
    getSiteLogoUrl(),
    getCurrentSiteId(),
  ]);
  const siteName = getSiteIdentity(siteId).siteName;

  const content = logoUrl ? (
    <Image
      alt="Site logosu"
      className="h-10 w-auto p-1 bg-white rounded-sm"
      height={64}
      src={logoUrl}
      width={300}
    />
  ) : (
    <SiteLogoFallback siteName={siteName} tone={tone} />
  );

  if (!href) return content;

  return (
    <Link
      className="shrink-0 rounded-sm outline-offset-4 focus-visible:ring-1 focus-visible:ring-brand-500"
      href={href}
    >
      {content}
    </Link>
  );
}
