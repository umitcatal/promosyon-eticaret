import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { firstImage, parseSqliteDate } from "@/lib/format";
import { SITE_BASE, absoluteImages, cleanPath, isSafeSlug } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  // categories has no updated_at, so lastmod rolls up from the products the
  // page actually lists (own category plus direct children).
  const categories = db
    .prepare(
      `SELECT c.slug,
              (SELECT MAX(p.updated_at)
               FROM products p
               WHERE p.active = 1 AND p.is_hidden = 0
                 AND (p.category_id = c.id
                      OR p.category_id IN
                         (SELECT id FROM categories child WHERE child.parent_id = c.id)
              )) AS lastmod
       FROM categories c
       WHERE c.active = 1`
    )
    .all() as { slug: string; lastmod: string | null }[];

  const products = db
    .prepare(
      `SELECT p.slug, p.updated_at,
              (SELECT v.images FROM variants v
               WHERE v.product_id = p.id AND v.active = 1 AND v.is_hidden = 0
               ORDER BY v.id LIMIT 1) AS first_images
       FROM products p
       WHERE p.active = 1 AND p.is_hidden = 0`
    )
    .all() as {
      slug: string;
      updated_at: string;
      first_images: string | null;
    }[];

  const pages = db
    .prepare("SELECT slug, updated_at FROM pages WHERE active = 1")
    .all() as { slug: string; updated_at: string }[];

  const collections = db
    .prepare("SELECT slug, updated_at FROM collections WHERE active = 1")
    .all() as { slug: string; updated_at: string }[];

  return [
    {
      url: `${SITE_BASE}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_BASE}/urunler`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...categories
      .filter((category) => isSafeSlug(category.slug))
      .map((category) => ({
        url: `${SITE_BASE}/kategori/${category.slug}`,
        lastModified: category.lastmod
          ? parseSqliteDate(category.lastmod)
          : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...products
      .filter((product) => isSafeSlug(product.slug))
      .map((product) => ({
        url: `${SITE_BASE}/urun/${product.slug}`,
        lastModified: parseSqliteDate(product.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
        images: absoluteImages(firstImage(product.first_images)),
      })),
    ...collections
      .filter((collection) => isSafeSlug(collection.slug))
      .map((collection) => ({
        url: `${SITE_BASE}/koleksiyon/${collection.slug}`,
        lastModified: parseSqliteDate(collection.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ...pages
      .filter((page) => isSafeSlug(page.slug))
      .map((page) => ({
        url: `${SITE_BASE}${cleanPath(page.slug)}`,
        lastModified: parseSqliteDate(page.updated_at),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
  ];
}
