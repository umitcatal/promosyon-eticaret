import Image from "next/image";
import Link from "next/link";
import { getSiteLogoUrl } from "@/lib/queries";

type SiteLogoProps = {
  href?: string | null;
  tone?: "light" | "dark";
};

export async function SiteLogo({ href = "/", tone = "light" }: SiteLogoProps) {
  const logoUrl = await getSiteLogoUrl();

  const content = logoUrl ? (
    <Image
      alt="Site logosu"
      className="h-9 w-auto"
      height={64}
      src={logoUrl}
      width={300}
    />
  ) : (
    <span
      className={`font-display text-[20px] leading-none font-semibold tracking-tight ${
        tone === "dark" ? "text-paper" : "text-ink"
      }`}
    >
      Promosyon{" "}
      <span
        className={`italic ${
          tone === "dark" ? "text-brass-300" : "text-brand-600"
        }`}
      >
        Eticaret
      </span>
    </span>
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
