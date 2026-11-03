import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_ROOT } from "@/lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  if (!segments.length || !segments.every((s) => SEGMENT_PATTERN.test(s))) {
    return new Response("Bulunamadı", { status: 404 });
  }

  const filePath = path.join(UPLOAD_ROOT, ...segments);
  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];

  if (!contentType) {
    return new Response("Bulunamadı", { status: 404 });
  }

  const file = await readFile(filePath).catch(() => null);

  if (!file) {
    return new Response("Bulunamadı", { status: 404 });
  }

  return new Response(new Uint8Array(file), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(file.byteLength),
      "Content-Type": contentType,
    },
  });
}
