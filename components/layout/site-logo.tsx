import Image from "next/image";
import Link from "next/link";
import { getSiteLogoUrl } from "@/lib/queries";

type SiteLogoProps = {
  href?: string | null;
  tone?: "light" | "dark";
  size?: "md" | "lg" | "xl" | "2xl";
};

const SIZES = {
  md: { image: "h-10", text: "text-[20px]" },
  lg: { image: "h-12", text: "text-[24px]" },
  xl: { image: "h-16", text: "text-[32px]" },
  '2xl': { image: "h-20", text: "text-[40px]" }
} as const;

export async function SiteLogo({
  href = "/",
  tone = "light",
  size = "md",
}: SiteLogoProps) {
  const logoUrl = await getSiteLogoUrl();
  const sizing = SIZES[size];

  const content = logoUrl ? (
    <Image
      alt="Site logosu"
      className={`${sizing.image} w-auto rounded-sm bg-white p-1`}
      height={64}
      src={logoUrl}
      width={300}
    />
  ) : (
    <span
      className={`font-display ${sizing.text} leading-none font-semibold tracking-tight ${
        tone === "dark" ? "text-paper" : "text-ink"
      }`}
    >
      Kurumsal{" "}
      <span
        className={`italic ${
          tone === "dark" ? "text-brass-300" : "text-brand-600"
        }`}
      >
        Promo
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
