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
      className="h-8 w-auto"
      height={64}
      src={logoUrl}
      width={300}
    />
  ) : (
    <span
      className={`text-xl font-bold tracking-tight ${
        tone === "dark" ? "text-white" : "text-zinc-900"
      }`}
    >
      Promosyon
      <span className={tone === "dark" ? "text-orange-500" : "text-orange-600"}>
        Eticaret
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link className="shrink-0" href={href}>
      {content}
    </Link>
  );
}
