import { open, stat } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_ROOT } from "@/lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

const SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const CATALOG_FILE = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.pdf$/;

type Context = { params: Promise<{ path: string[] }> };

async function serve(request: Request, { params }: Context) {
  const { path: segments } = await params;
  if (!segments.length || !segments.every((s) => SEGMENT_PATTERN.test(s))) {
    return new Response("Bulunamadı", { status: 404 });
  }
  const filePath = path.join(UPLOAD_ROOT, ...segments);
  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  const isPdf = contentType === "application/pdf";
  if (!contentType || (isPdf && (segments.length !== 2 || segments[0] !== "catalogs" || !CATALOG_FILE.test(segments[1])))) {
    return new Response("Bulunamadı", { status: 404 });
  }
  const file = await open(filePath, "r").catch(() => null);
  if (!file) return new Response("Bulunamadı", { status: 404 });
  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) {
    await file.close();
    return new Response("Bulunamadı", { status: 404 });
  }
  const headers = new Headers({
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  });
  if (isPdf) {
    headers.set("Accept-Ranges", "bytes");
    headers.set("Content-Disposition", 'inline; filename="catalog.pdf"');
    headers.set("Content-Security-Policy", "sandbox");
  }
  let start = 0;
  let end = info.size - 1;
  let status = 200;
  const range = request.method === "GET" && isPdf && !request.headers.has("if-range") ? request.headers.get("range") : null;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match && (match[1] || match[2])) {
      if (!match[1]) {
        const suffix = Number(match[2]);
        start = suffix > 0 ? Math.max(0, info.size - suffix) : info.size;
      } else {
        start = Number(match[1]);
        if (match[2]) end = Math.min(Number(match[2]), end);
      }
    }
    if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= info.size || start > end) {
      await file.close();
      headers.set("Content-Range", `bytes */${info.size}`);
      return new Response(null, { status: 416, headers });
    }
    status = 206;
    headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
  }
  headers.set("Content-Length", String(end - start + 1));
  if (request.method === "HEAD") {
    await file.close();
    return new Response(null, { status, headers });
  }
  let position = start;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (position > end) {
        await file.close();
        controller.close();
        return;
      }
      try {
        const buffer = new Uint8Array(Math.min(64 * 1024, end - position + 1));
        const { bytesRead } = await file.read(buffer, 0, buffer.length, position);
        if (!bytesRead) throw new Error("Dosya beklenenden önce bitti.");
        position += bytesRead;
        controller.enqueue(buffer.subarray(0, bytesRead));
      } catch (error) {
        await file.close();
        controller.error(error);
      }
    },
    async cancel() {
      await file.close();
    },
  });
  return new Response(stream, { status, headers });
}

export const GET = serve;
export const HEAD = serve;
