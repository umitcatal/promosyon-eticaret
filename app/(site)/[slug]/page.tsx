import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPageBySlug } from "@/lib/queries";
import { sanitizeRichText } from "@/lib/sanitize";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) return { title: "Sayfa bulunamadı" };

  return {
    title: page.meta_title || page.title,
    description: page.meta_description ?? undefined,
  };
}

export default async function ContentPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {page.title}
        </h1>
      </header>

      {page.content ? (
        <div
          className="rich-text mt-6"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.content) }}
        />
      ) : (
        <p className="mt-6 text-sm text-zinc-500">
          Bu sayfa için henüz içerik eklenmemiş.
        </p>
      )}
    </article>
  );
}
