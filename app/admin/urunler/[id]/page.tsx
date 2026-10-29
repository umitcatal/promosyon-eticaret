import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductEditForm } from "@/components/admin/product-edit-form";
import { db } from "@/lib/db";

export const metadata = {
  title: "Ürün Düzenle",
};

type ProductRow = {
  id: number;
  code: string;
  name: string;
  is_featured: number;
  is_hidden: number;
  active: number;
  category_id: number | null;
};

type VariantRow = {
  id: number;
  attr_name: string | null;
  price: number | null;
  net_price: number | null;
  discount: number | null;
  stock: number | null;
  is_hidden: number;
  active: number;
};

export default async function AdminProductEditPage({
  params,
}: PageProps<"/admin/urunler/[id]">) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();

  const product = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(productId) as ProductRow | undefined;
  if (!product) notFound();

  const variants = db
    .prepare(
      `SELECT id, attr_name, price, net_price, discount, stock, is_hidden, active
       FROM variants WHERE product_id = ? ORDER BY id`
    )
    .all(productId) as VariantRow[];

  const category = product.category_id
    ? (db
        .prepare("SELECT id, name, slug FROM categories WHERE id = ?")
        .get(product.category_id) as
        | { id: number; name: string; slug: string }
        | undefined)
    : undefined;

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
        <Link
          className="transition hover:text-orange-600"
          href="/admin/urunler"
        >
          Ürünler
        </Link>
        <span>/</span>
        <span className="font-medium text-zinc-800">{product.name}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-zinc-900">{product.name}</h2>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
          Kod: {product.code}
        </span>
        {category ? (
          <Link
            className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
            href={`/kategori/${category.slug}`}
            target="_blank"
          >
            {category.name} ↗
          </Link>
        ) : null}
      </div>

      <ProductEditForm
        product={{
          id: product.id,
          name: product.name,
          code: product.code,
          is_featured: product.is_featured,
          is_hidden: product.is_hidden,
        }}
        variants={variants.map((variant) => ({
          id: variant.id,
          name: variant.attr_name || product.name,
          price: variant.price,
          netPrice: variant.net_price,
          discount: variant.discount,
          stock: variant.stock,
          is_hidden: variant.is_hidden,
          active: variant.active,
        }))}
      />
    </div>
  );
}
