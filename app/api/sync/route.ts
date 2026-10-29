import { revalidateTag } from "next/cache";
import { syncCatalog } from "@/lib/sync";

export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET;
  if (!secret) {
    return Response.json(
      { ok: false, error: "SYNC_SECRET tanımlı değil" },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const header = request.headers.get("authorization");
  const token =
    header?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("secret");

  if (token !== secret) {
    return Response.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const result = await syncCatalog();
    revalidateTag("catalog", "max");
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
