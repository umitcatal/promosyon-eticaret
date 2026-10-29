import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { parseSqliteDate } from "@/lib/format";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const categories = db
    .prepare("SELECT slug FROM categories WHERE active = 1")
    .all() as { slug: string }[];
  const products = db
    .prepare(
      "SELECT slug, updated_at FROM products WHERE active = 1 AND is_hidden = 0"
    )
    .all() as { slug: string; updated_at: string }[];
  const pages = db
    .prepare("SELECT slug, updated_at FROM pages WHERE active = 1")
    .all() as { slug: string; updated_at: string }[];

  return [
    {
      url: `${base}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/urunler`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...categories.map((category) => ({
      url: `${base}/kategori/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${base}/urun/${product.slug}`,
      lastModified: parseSqliteDate(product.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...pages.map((page) => ({
      url: `${base}/${page.slug}`,
      lastModified: parseSqliteDate(page.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
