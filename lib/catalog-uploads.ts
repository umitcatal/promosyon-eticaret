import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { CATALOG_CHUNK_BYTES, MAX_CATALOG_BYTES } from "./catalog";
import { UPLOAD_ROOT } from "./uploads";

const TEMP_ROOT = path.join(process.cwd(), /* turbopackIgnore: true */ "data", "catalog-uploads");
const CATALOG_ROOT = path.join(UPLOAD_ROOT, "catalogs");
const UPLOAD_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const UPLOAD_TTL = 24 * 60 * 60 * 1000;

type UploadMetadata = { userId: number; size: number; name: string; createdAt: number };

export class CatalogUploadError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function uploadPath(id: string, extension: string): string {
  if (!UPLOAD_ID.test(id)) throw new CatalogUploadError("Geçersiz yükleme.");
  return path.join(TEMP_ROOT, `${id}.${extension}`);
}

async function readUpload(id: string, userId: number): Promise<UploadMetadata> {
  const raw = await readFile(uploadPath(id, "json"), "utf8").catch(() => null);
  if (!raw) throw new CatalogUploadError("Yükleme bulunamadı. Dosyayı yeniden seçin.", 404);
  const metadata = JSON.parse(raw) as UploadMetadata;
  if (metadata.userId !== userId) throw new CatalogUploadError("Bu yüklemeye erişim izniniz yok.", 403);
  if (Date.now() - metadata.createdAt > UPLOAD_TTL) {
    throw new CatalogUploadError("Yükleme süresi doldu. Dosyayı yeniden seçin.", 410);
  }
  return metadata;
}

async function removeDraft(id: string) {
  await Promise.all(["json", "part"].map((extension) =>
    unlink(uploadPath(id, extension)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    })
  ));
}

async function withUploadLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
  const lock = await open(uploadPath(id, "lock"), "wx").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "EEXIST") throw new CatalogUploadError("Yükleme işleniyor. Lütfen tekrar deneyin.", 409);
    throw error;
  });
  try {
    return await operation();
  } finally {
    await lock.close();
    await unlink(uploadPath(id, "lock"));
  }
}

export async function startCatalogUpload(userId: number, name: string, size: number) {
  if (!name.toLowerCase().endsWith(".pdf")) throw new CatalogUploadError("Yalnızca PDF dosyaları yüklenebilir.");
  if (!Number.isSafeInteger(size) || size < 5 || size > MAX_CATALOG_BYTES) {
    throw new CatalogUploadError("PDF dosyası boş olamaz ve 150 MB'ı aşamaz.");
  }
  await mkdir(TEMP_ROOT, { recursive: true });
  const drafts = await readdir(TEMP_ROOT);
  for (const file of drafts) {
    const id = file.replace(/\.(json|part|lock)$/, "");
    if (!UPLOAD_ID.test(id)) continue;
    const info = await stat(path.join(TEMP_ROOT, file)).catch(() => null);
    if (info && Date.now() - info.mtimeMs > UPLOAD_TTL) {
      await unlink(path.join(TEMP_ROOT, file)).catch(() => undefined);
    }
  }
  const id = randomUUID();
  const metadata: UploadMetadata = {
    userId, size, name: path.basename(name).slice(0, 255), createdAt: Date.now(),
  };
  await writeFile(uploadPath(id, "part"), new Uint8Array(), { flag: "wx" });
  await writeFile(uploadPath(id, "json"), JSON.stringify(metadata), { flag: "wx" });
  return id;
}

export async function appendCatalogChunk(id: string, userId: number, offset: number, chunk: Buffer) {
  await readUpload(id, userId);
  return withUploadLock(id, async () => {
    const metadata = await readUpload(id, userId);
    const filePath = uploadPath(id, "part");
    const info = await stat(filePath);
    if (!Number.isSafeInteger(offset) || offset !== info.size) {
      throw new CatalogUploadError("Dosya parçalarının sırası hatalı. Yüklemeyi yeniden başlatın.", 409);
    }
    const expected = Math.min(CATALOG_CHUNK_BYTES, metadata.size - offset);
    if (expected <= 0 || chunk.length !== expected) throw new CatalogUploadError("Dosya parçasının boyutu geçersiz.");
    if (offset === 0 && chunk.subarray(0, 5).toString("ascii") !== "%PDF-") {
      throw new CatalogUploadError("Seçilen dosya geçerli bir PDF değil.");
    }
    await writeFile(filePath, chunk, { flag: "a" });
    return offset + chunk.length;
  });
}

export async function finishCatalogUpload(id: string, userId: number) {
  await readUpload(id, userId);
  return withUploadLock(id, async () => {
    const metadata = await readUpload(id, userId);
    const filePath = uploadPath(id, "part");
    if ((await stat(filePath)).size !== metadata.size) {
      throw new CatalogUploadError("PDF yüklemesi henüz tamamlanmadı.");
    }
    await mkdir(CATALOG_ROOT, { recursive: true });
    await rename(filePath, path.join(CATALOG_ROOT, `${id}.pdf`));
    await unlink(uploadPath(id, "json"));
    return { fileUrl: `/uploads/catalogs/${id}.pdf`, fileName: metadata.name };
  });
}

export async function discardCatalogUpload(id: string, userId: number) {
  await readUpload(id, userId);
  await withUploadLock(id, () => removeDraft(id));
}

export async function deleteCatalogFile(url: string) {
  const id = url.replace(/^\/uploads\/catalogs\//, "").replace(/\.pdf$/, "");
  if (url !== `/uploads/catalogs/${id}.pdf` || !UPLOAD_ID.test(id)) return;
  await unlink(path.join(CATALOG_ROOT, `${id}.pdf`)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") console.error("Eski katalog dosyası silinemedi.", error.code);
  });
}
