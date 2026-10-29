import fs from "node:fs";
import path from "node:path";

const DEFAULT_XML_FILE = path.join("data", "xml", "urunler.xml");

export function getXmlPath(): string {
  const fromEnv = process.env.PRODUCT_XML_PATH?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(process.cwd(), DEFAULT_XML_FILE);
}

export function getXmlPathRelative(): string {
  const absolute = getXmlPath();
  const relative = path.relative(process.cwd(), absolute);
  return relative.startsWith("..") ? absolute : relative;
}

export function saveXmlFile(xml: string): string {
  const target = getXmlPath();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = `${target}.tmp`;
  fs.writeFileSync(temp, xml, "utf8");
  fs.renameSync(temp, target);
  return target;
}

export function readXmlFile(): string | null {
  const target = getXmlPath();
  if (!fs.existsSync(/* turbopackIgnore: true */ target)) return null;
  return fs.readFileSync(/* turbopackIgnore: true */ target, "utf8");
}
