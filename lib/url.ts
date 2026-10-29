export function safeNextPath(next: unknown, fallback = "/"): string {
  if (
    typeof next !== "string" ||
    !next.startsWith("/") ||
    next.startsWith("//")
  ) {
    return fallback;
  }
  return next;
}
