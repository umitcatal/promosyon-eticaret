import { getCurrentUser } from "@/lib/auth";
import { CATALOG_CHUNK_BYTES } from "@/lib/catalog";
import {
  appendCatalogChunk,
  CatalogUploadError,
  discardCatalogUpload,
  startCatalogUpload,
} from "@/lib/catalog-uploads";

async function readBody(request: Request, limit: number): Promise<Buffer> {
  const reader = request.body?.getReader();
  if (!reader) throw new CatalogUploadError("İstek gövdesi boş.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new CatalogUploadError("Yükleme parçası çok büyük.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

async function handle(request: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") {
    return Response.json({ error: "Yönetici girişi gerekli." }, { status: 403 });
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    if (!origin || new URL(origin).host !== host || request.headers.get("x-catalog-upload") !== "1") {
      return Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
    }
    if (request.method === "POST") {
      let data: unknown;
      try {
        data = JSON.parse((await readBody(request, 2048)).toString("utf8"));
      } catch (error) {
        if (error instanceof CatalogUploadError) throw error;
        throw new CatalogUploadError("Geçersiz yükleme bilgileri.");
      }
      if (!data || typeof data !== "object" || !("name" in data) || !("size" in data) || typeof data.name !== "string" || typeof data.size !== "number") {
        throw new CatalogUploadError("Geçersiz yükleme bilgileri.");
      }
      const uploadId = await startCatalogUpload(user.id, data.name, data.size);
      return Response.json({ uploadId });
    }
    const params = new URL(request.url).searchParams;
    const id = params.get("id") ?? "";
    if (request.method === "DELETE") {
      await discardCatalogUpload(id, user.id);
      return Response.json({ ok: true });
    }
    const rawOffset = params.get("offset");
    if (!rawOffset || !/^\d+$/.test(rawOffset)) throw new CatalogUploadError("Geçersiz parça konumu.");
    const chunk = await readBody(request, CATALOG_CHUNK_BYTES);
    const offset = await appendCatalogChunk(id, user.id, Number(rawOffset), chunk);
    return Response.json({ offset });
  } catch (error) {
    if (error instanceof CatalogUploadError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Katalog yükleme hatası", error);
    return Response.json({ error: "Katalog yüklenemedi. Lütfen tekrar deneyin." }, { status: 500 });
  }
}

export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
