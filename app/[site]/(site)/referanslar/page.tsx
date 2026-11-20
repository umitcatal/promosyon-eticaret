import type { Metadata } from "next";
import Link from "next/link";
import {
  Breadcrumb,
  CatalogHeading,
} from "@/components/catalog/catalog-chrome";
import { ReferencesGrid } from "@/components/catalog/references";
import { Reveal } from "@/components/motion/reveal";
import { getClientReferences } from "@/lib/queries";
import { openGraphBase } from "@/lib/seo";
import { getCurrentSiteId } from "@/lib/site-context";
import { getSiteIdentity } from "@/lib/site-settings";
import { getSiteBaseUrl } from "@/lib/sites";

export async function generateMetadata(): Promise<Metadata> {
  const siteId = await getCurrentSiteId();
  const identity = getSiteIdentity(siteId);
  const baseUrl = getSiteBaseUrl(siteId);
  const title = "Referanslarımız";
  const description =
    "Birlikte çalıştığımız markalar ve kurumsal referanslarımız.";

  return {
    title,
    description,
    alternates: { canonical: "/referanslar" },
    openGraph: {
      ...openGraphBase(baseUrl, identity),
      url: "/referanslar",
      title,
      description,
    },
  };
}

export default async function ReferencesPage() {
  const references = await getClientReferences();

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:py-14">
      <Breadcrumb
        items={[
          { href: "/", label: "Anasayfa" },
          { label: "Referanslarımız" },
        ]}
      />

      <div className="pt-7">
        <CatalogHeading
          eyebrow="Referanslar"
          meta={`${references.length} referans`}
          title="Referanslarımız"
        />
      </div>

      {references.length > 0 ? (
        <Reveal>
          <ReferencesGrid references={references} />
        </Reveal>
      ) : (
        <div className="paper-sheet mt-2 text-center">
          <p className="eyebrow">Referanslar</p>
          <h2 className="mt-3 font-display text-2xl leading-none font-semibold tracking-tight text-ink sm:text-3xl">
            Referans logolarımız yolda
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink-muted">
            Birlikte çalıştığımız markaların logoları kısa süre içinde burada
            yayınlanacak.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 border-b border-line-strong pb-1 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase transition-colors hover:border-brand-600 hover:text-brand-700"
            href="/urunler"
          >
            Ürünleri keşfedin
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
    </div>
  );
}
