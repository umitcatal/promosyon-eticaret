import { searchTypeahead } from "@/lib/queries";
import { normalizeSearchQuery } from "@/lib/search-fold";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = normalizeSearchQuery(url.searchParams.get("q"));

  if (query.length < 2) {
    return Response.json(
      { query, products: [], productTotal: 0, categories: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const result = await searchTypeahead(query);
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("search api", error);
    return Response.json(
      { error: "Arama şu anda yapılamıyor." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
