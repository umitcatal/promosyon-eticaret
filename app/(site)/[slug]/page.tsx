import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/catalog/catalog-chrome";
import { SiteLogo } from "@/components/layout/site-logo";
import { Reveal } from "@/components/motion/reveal";
import { formatDate } from "@/lib/format";
import { getPublishedPageBySlug } from "@/lib/queries";
import { sanitizeRichText } from "@/lib/sanitize";
import { cleanPath, isSafeSlug, openGraphBase } from "@/lib/seo";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  // Partial Prerender static shell'i 200 ile gönderdiği için notFound() durum
  // kodunu değiştiremiyor; soft-404'ün indekslenmesini meta ile engelliyoruz.
  if (!page) {
    return {
      title: "Sayfa bulunamadı",
      robots: { index: false, follow: true },
    };
  }

  const title = page.meta_title || page.title;
  const description = page.meta_description ?? undefined;
  const canonical = isSafeSlug(slug) ? cleanPath(slug) : undefined;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      ...openGraphBase,
      title,
      description,
      url: canonical,
    },
  };
}

export default async function ContentPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:py-14">
      <div className="mb-8 sm:mb-10">
        <Breadcrumb
          items={[{ href: "/", label: "Anasayfa" }, { label: page.title }]}
        />
      </div>

      <Reveal className="mx-auto w-full max-w-[880px]">
        <article className="paper-sheet">
          <header>
            <p className="eyebrow">Kurumsal</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink text-balance break-words sm:text-4xl lg:text-[2.6rem]">
              {page.title}
            </h1>
            <div className="relative mt-6 border-t border-line">
              <span className="absolute -top-px left-0 h-px w-16 bg-brass-400" />
            </div>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              Son güncelleme · {formatDate(page.updated_at)}
            </p>
          </header>

          {page.content ? (
            <div
              className="rich-text mt-8"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.content) }}
            />
          ) : (
            <div className="py-16 text-center">
              <p className="eyebrow">İçerik hazırlanıyor</p>
              <p className="mt-4 font-display text-2xl font-semibold text-ink">
                Bu sayfanın içeriği çok yakında eklenecek.
              </p>
              <p className="mt-3 text-sm text-ink-muted">
                İçerik eklendiğinde burada görüntülenecektir.
              </p>
            </div>
          )}

          <footer className="mt-12 flex justify-center border-t border-line pt-5">
            <div className="[&>img]:h-6 [&>img]:w-auto">
              <SiteLogo href={null} />
            </div>
          </footer>
        </article>
      </Reveal>
    </div>
  );
}
