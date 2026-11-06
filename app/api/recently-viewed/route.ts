import { getProductListItemById } from "@/lib/queries";
import type { ProductListItem } from "@/lib/types";

const MAX_IDS = 24;
const NO_STORE = { "Cache-Control": "no-store" };

function parseIds(raw: string | null): number[] {
  if (!raw) return [];

  const ids = new Set<number>();
  for (const part of raw.split(",")) {
    const id = Number(part.trim());
    if (!Number.isInteger(id) || id <= 0 || ids.has(id)) continue;
    ids.add(id);
    if (ids.size >= MAX_IDS) break;
  }

  return [...ids];
}

export async function GET(request: Request) {
  const ids = parseIds(new URL(request.url).searchParams.get("ids"));

  if (ids.length === 0) {
    return Response.json({ products: [] }, { headers: NO_STORE });
  }

  try {
    const resolved = await Promise.all(
      ids.map((id) => getProductListItemById(id))
    );
    const products = resolved.filter(
      (product): product is ProductListItem => product !== null
    );

    return Response.json({ products }, { headers: NO_STORE });
  } catch (error) {
    console.error("recently viewed api", error);
    return Response.json(
      { error: "Ürünler şu anda yüklenemiyor." },
      { status: 500, headers: NO_STORE }
    );
  }
}
