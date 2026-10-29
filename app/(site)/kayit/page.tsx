import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { cardClass } from "@/components/ui/styles";
import { safeNextPath } from "@/lib/url";

export const instant = false;

export const metadata: Metadata = {
  title: "Üye Ol",
  description: "Yeni hesap oluşturun.",
};

export default async function SignupPage({
  searchParams,
}: PageProps<"/kayit">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link className="text-2xl font-bold text-zinc-900" href="/">
            Promosyon<span className="text-orange-600">Eticaret</span>
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-zinc-900">
            Yeni hesap oluşturun
          </h1>
        </div>
        <div className={cardClass}>
          <SignupForm googleEnabled={googleEnabled} next={next} />
        </div>
      </div>
    </div>
  );
}
