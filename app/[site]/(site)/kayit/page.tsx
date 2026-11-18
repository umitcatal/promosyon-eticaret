import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { cardClass } from "@/components/ui/styles";
import { getCurrentSiteId } from "@/lib/site-context";
import { getSiteIdentity } from "@/lib/site-settings";
import { getTurnstileSiteKey } from "@/lib/turnstile";
import { safeNextPath } from "@/lib/url";

export const instant = false;

export const metadata: Metadata = {
  title: "Üye Ol",
  description: "Yeni hesap oluşturun.",
  robots: { index: false, follow: true },
};

export default async function SignupPage({
  searchParams,
}: PageProps<"/[site]/kayit">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const turnstileSiteKey = getTurnstileSiteKey(await getCurrentSiteId());
  const siteName = getSiteIdentity(await getCurrentSiteId()).siteName;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link className="text-2xl font-bold text-zinc-900" href="/">
            {siteName}
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-zinc-900">
            Yeni hesap oluşturun
          </h1>
        </div>
        <div className={cardClass}>
          <SignupForm
            googleEnabled={googleEnabled}
            next={next}
            turnstileSiteKey={turnstileSiteKey}
          />
        </div>
      </div>
    </div>
  );
}
